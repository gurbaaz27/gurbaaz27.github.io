---

layout: post
title: "Dynamic arguments in argparse subparser"
subtitle: "A basic guide to manipulating python's ArgumentParser object at your will"
thumbnail-img: /assets/img/blogs/python-argparse.png
share-img: /assets/img/blogs/python-argparse.png
tags: [python, scripting, tech]
minutes_to_read: 4
---

Past month, while working on some command-line tool written in `python` based on `argparse`, I was faced with task of adding some new arguments to extend some functionality. The only problem was the number and name of arguments were dynamic, i.e., they depended on the value supplied to some other argument. A bit of googling, and I was able to see some links explaining hacks to do this. But to add on to the challenge, this dynamic argument feature was to be added in a subparser command of the main parser, and I only had access to main parser variable. Easy? No. <span class="mark">The thing is, there is no direct obvious and clean access to obtain subparser from parser.</span> But thanks to some of the underrated answers in some of the underrated stack overflow questions, I was able to create a working solution for myself, which I thought would be fun to share with you all today.

## Overview

The code presented below is a dummy version of the actual program. Consider the parser
```python
# main.py
import argparse

parser = argparse.ArgumentParser()
subparsers = parser.add_subparsers(metavar='COMMAND', dest='command')

subparser = subparsers.add_parser('foo')
subparser.add_argument("-n", type=int, help="Number of entries", required=True)

subparser = subparsers.add_parser('bar')
subparser.add_argument("-q", type=str, help="Query string")

args = parser.parse_args()

## function mapping based on subparser command
fn_mapping = {
    "foo": foo,
    "bar": bar
}

## business logic carried out here
fn_mapping[args.command](parser, args) 
```

The end goal is to be able to parse `--entry#i` arguments when using the subparser `foo`, where `i` iterates from 1 till `n`. Basically, accomplish something like

```
python3 main.py foo -n 3 --entry1 abc --entry2 def --entry3 ghi
```

## I. Partial parsing of arguments [known before runtime]

We obviously cannot add `--entry#i` arguments in `add_argument` function directly because we don't know the number `n` beforehand. But `parse_args()` throws error on encountering arguments it doesn't know. And also, we do want to parse these entry args once we know the value of `n` in our program.  <span class="mark">As John Hazen explains [here](https://stackoverflow.com/questions/25317795/dynamic-arguments-for-pythons-argparse#25320537), we can very well achieve this with partial parsing using `parse_known_args`, which only parses the arguments added via `add_argument` method, and ignore the rest.</span>

```python
# parse_known_args returns a tuple of valid arguments namespace and remaining args
# we can ignore the second part for now
args, _ = parser.parse_known_args()
```

Now all is left is to somehow get hold of our subparser, add arguments to it, and reparse the command, as follows

```python
def foo(parser, args):
    subparser = obtain_subparser(parser)

    for i in range(1, args.n+1):
        subparser.add_argument("--entry{}".format(i), dest="entry{}".format(i))

    args = parser.parse_args()
```

## II. Extract subparser object from the main parser

For this, let us look at parser object. `print(parser)` returns

```bash
ArgumentParser(prog='main.py', usage=None, description=None, formatter_class=<class 'argparse.HelpFormatter'>, conflict_handler='error', add_help=True)
```

Not much help. Let's do `print(parser.__dict__)` instead.

```bash
{
    'description': None,
    'argument_default': None,
    'prefix_chars': '-',
    'conflict_handler': 'error',
    '_registries': {'action': {None: <class 'argparse._StoreAction'>, 'store': <class 'argparse._StoreAction'>, 'store_const': <class 'argparse._StoreConstAction'>, 'store_true': <class 'argparse._StoreTrueAction'>, 'store_false': <class 'argparse._StoreFalseAction'>, 'append': <class 'argparse._AppendAction'>, 'append_const': <class 'argparse._AppendConstAction'>, 'count': <class 'argparse._CountAction'>, 'help': <class 'argparse._HelpAction'>, 'version': <class 'argparse._VersionAction'>, 'parsers': <class 'argparse._SubParsersAction'>, 'extend': <class 'argparse._ExtendAction'>}, 'type': {None: <function ArgumentParser.__init__.<locals>.identity at 0x100cb01f0>}}, 
    '_actions': [
        _HelpAction(option_strings=['-h', '--help'], dest='help', nargs=0, const=None, default='==SUPPRESS==', type=None, choices=None, help='show this help message and exit', metavar=None),
        _SubParsersAction(option_strings=[], dest='command', nargs='A...', const=None, default=None, type=None, choices={
            'foo': ArgumentParser(prog='main.py foo', usage=None, description=None, formatter_class=<class 'argparse.HelpFormatter'>, conflict_handler='error', add_help=True), 
            'bar': ArgumentParser(prog='main.py bar', usage=None, description=None, formatter_class=<class 'argparse.HelpFormatter'>, conflict_handler='error', add_help=True)
        }, help=None, metavar='COMMAND')
    ], 
    '_option_string_actions': {'-h': _HelpAction(option_strings=['-h', '--help'], dest='help', nargs=0, const=None, default='==SUPPRESS==', type=None, choices=None, help='show this help message and exit', metavar=None), '--help': _HelpAction(option_strings=['-h', '--help'], dest='help', nargs=0, const=None, default='==SUPPRESS==', type=None, choices=None, help='show this help message and exit', metavar=None)}, '_action_groups': [<argparse._ArgumentGroup object at 0x100d588e0>, <argparse._ArgumentGroup object at 0x100d580d0>], '_mutually_exclusive_groups': [], '_defaults': {}, '_negative_number_matcher': re.compile('^-\\d+$|^-\\d*\\.\\d+$'), '_has_negative_number_optionals': [], 'prog': 'main.py', 'usage': None, 'epilog': None, 'formatter_class': <class 'argparse.HelpFormatter'>, 'fromfile_prefix_chars': None, 'add_help': True, 'allow_abbrev': True, 'exit_on_error': True, '_positionals': <argparse._ArgumentGroup object at 0x100d588e0>, '_optionals': <argparse._ArgumentGroup object at 0x100d580d0>, '_subparsers': <argparse._ArgumentGroup object at 0x100d588e0>
}
```

<span class="mark">We can see that our `foo` and `bar` subparsers reside inside `_actions`.</span> More formally, `parser._actions` basically list all the registered actions. We are now in a position to write our `obtain_subparser`.

```python
def obtain_subparser(parser):
    for action in parser._actions:
        if action.dest == "command":
            subparser = action.choices.get("foo", None)

    return subparser
```

We can make it more generic on subparser command, which can handle both foo and bar.

```python
def obtain_subparser(parser, command):
    for action in parser._actions:
        if action.dest == "command":
            subparser = action.choices.get(command, None)

    return subparser
```

## Complete Code
Here is the complete working code implementation.

```python
import argparse

parser = argparse.ArgumentParser()
subparsers = parser.add_subparsers(metavar='COMMAND', dest='command')

subparser = subparsers.add_parser('foo')
subparser.add_argument("-n", type=int, help="Number of entries", required=True)

subparser = subparsers.add_parser('bar')
subparser.add_argument("-q", type=str, help="Query string")

args, _ = parser.parse_known_args()

def obtain_subparser(parser, command):
    for action in parser._actions:
        if action.dest == "command":
            subparser = action.choices.get(command, None)

    return subparser

def foo(parser, args):
    subparser = obtain_subparser(parser, "foo")
    n = args.n

    for i in range(1, n+1):
        subparser.add_argument("--entry{}".format(i), dest="entry{}".format(i))

    args = parser.parse_args()
    print(args)

def bar(parse, args):
    pass

## function mapping based on subparser command
fn_mapping = {
    "foo": foo,
    "bar": bar
}

## business logic carried out here
fn_mapping[args.command](parser, args) 
```

which outputs

```bash
❯ python3 main.py foo -n 3 --entry1 abc --entry2 def --entry3 ghi
Namespace(command='foo', n=3, entry1='abc', entry2='def', entry3='ghi')
```

I encourage you to play and tweak with parser, adjust it according to your need. Though the final solution is elegant, it took me a while to get at it since I could not find anything very specific to my use case on the internet (in the actual tool, I had to add dynamic arguments inside subparser inside another subparser, so I got perplexed in that for quite some time 🫠). Accessing these undocumented attributes like `_actions` is ofcourse a bit risky, since the internal workings can change any day. But the goal is to present you an idea on how to tackle with these stuff. But I hope this helps someone out, stuck in a similar situation.

Regards