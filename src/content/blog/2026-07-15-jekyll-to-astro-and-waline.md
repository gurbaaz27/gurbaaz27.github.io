---
layout: post
title: "Porting my personal website from Jekyll to Astro"
subtitle: "Moving a Beautiful Jekyll site to Astro, then swapping Utterances for Waline"
thumbnail-img: /assets/img/blogs/jekyll-to-astro.jpg
share-img: /assets/img/blogs/jekyll-to-astro.jpg
tags: [astro, jekyll, waline, bun, codex, tech]
minutes_to_read: 11
draft: false
---

This website had been running on Jekyll and the Beautiful Jekyll theme for years. It worked. That made replacing it slightly awkward, because "the old thing is broken" would have been a much easier reason to explain.

My problem was maintenance. The repository had Liquid templates, Ruby dependencies, Bootstrap-era CSS, jQuery, generated `_site` files, and quite a lot of theme machinery for what is ultimately a small personal website. I wanted faster local builds and a codebase I would still enjoy touching a few years from now. Astro, Bun, TypeScript, and Tailwind CSS looked like a better fit.

There was one strict condition: <span class="mark">the migration was not a redesign.</span> I wanted the same layout, URLs, content, dark mode, comments, view counters, upvotes, RSS feed, tags, pagination, and slightly old-fashioned personality. If a regular visitor noticed the framework migration, I had probably changed too much.

I did the work through a series of Codex coding sessions. This post is partly about the site migration, but it is also about how those sessions went in practice. It was not a single prompt followed by a perfect pull request. There was a plan, a large first pass, screenshots, review comments, tiny CSS fixes, a deployment that was green but not live, and then another migration for the comment system.

## Planning around the public surface

The first session started with a repository audit. Before generating Astro components, I asked Codex to identify what the Jekyll site was already doing and what could quietly break.

The list was longer than "render some Markdown":

- eleven Markdown posts, of which eight were public and three were effectively drafts
- dated URLs such as `/2020-06-03-5-Ks-of-kakar/`
- two pages of home pagination
- blog, tag, about, projects, feed, sitemap, robots, and 404 routes
- Firebase-backed view counts and upvotes
- Utterances comments
- canonical, Open Graph, and Twitter metadata
- a custom domain on GitHub Pages

That audit became the migration contract. I also kept the old Jekyll source under `legacy-jekyll/` instead of deleting it. The generated `_site` directory did not survive, but the layouts, includes, configuration, scripts, posts, and Gem files did. This turned out to be useful almost immediately. Whenever the Astro version looked wrong, the answer was usually sitting in the old selector or JavaScript behavior.

The new root became a small Astro 7 project with Bun, strict TypeScript, and Tailwind CSS 4. Posts moved into an Astro content collection, shared pieces became `.astro` components, and browser behavior moved into one TypeScript module without jQuery.

The important part of `astro.config.ts` was boring on purpose:

```typescript
export default defineConfig({
  site: "https://gurbaaz.xyz",
  trailingSlash: "always",
  vite: { plugins: [tailwindcss()] },
  markdown: { syntaxHighlight: "shiki" },
})
```

`site` kept canonical URLs predictable, and `trailingSlash` preserved the directory-style links that already existed. The production build generated all 15 expected pages in well under a second. Fast builds were one of the reasons for moving, so seeing that number felt good.

## The first bug was in a capital letter

The first Astro build succeeded, but one established URL had changed. Astro normalized the post ID for `2020-06-03-5-Ks-of-kakar`, turning the uppercase `K` into lowercase. That would have broken an old public link for no useful reason.

I ended up deriving the date and slug from the original filename and generating the route myself. A regression test now checks the exact casing:

```typescript
expect(parsePostId("2020-06-03-5-Ks-of-kakar")).toMatchObject({
  dateKey: "2020-06-03",
  slug: "5-Ks-of-kakar",
  url: "/2020-06-03-5-Ks-of-kakar/",
})
```

This was a good early reminder that framework defaults are not compatibility guarantees. A new static generator can produce valid pages while still breaking the small details that matter to an old site.

## "Same design" was most of the work

The data and route migration was fairly mechanical. Matching the old design was where the time went.

The first Astro pull request looked close until I placed it beside the deployed Jekyll site. The navbar was too short and cut through the profile picture. Headings looked much heavier. The content column was too wide, even though the CSS value appeared correct. Navigation had drifted inward. The footer had somehow acquired "Powered by Beautiful Jekyll," which was especially funny after spending a day removing Jekyll.

None of these needed a redesign. They needed better archaeology.

The width bug was my favourite. The old content column was `760px`. The Astro port expressed it in `rem`, but the site increases the root font size to 120 percent on desktop. The apparently equivalent value expanded to roughly `912px`. Restoring the pixel width fixed the whole page at once.

The font weight had a similar cause. The new page loaded a real 800-weight Garamond, while the old browser had synthesized the heavier heading from the available font. Both were "800" in CSS and looked noticeably different.

Then came the smaller parity bugs:

- The profile picture used to fade out smoothly when the navbar collapsed. The Astro CSS hid it immediately, so opacity never got time to animate. Restoring the old delayed `visibility` transition brought back the half-second fade.
- Tailwind's reset applied `height: auto` to post media. That overrode the authored heights in my Japan post and made every image enormous on desktop. I restored those legacy height values for desktop and kept full-width media on mobile.
- A selector changed from `.blog-post :first-child` to `.blog-post > :first-child`. That one extra `>` stopped the first paragraph inside a blockquote from losing its top margin, which looked like a mysterious blank line.
- Another narrowed selector made nested post-preview links blue all the time instead of only on hover.
- Tailwind's preflight removed list markers from Markdown. The StarShare article still contained an `<ol>`, but the numbers had vanished. The fix was a small set of list styles scoped to `.blog-post`, including different markers for nested lists.

These were caught through screenshots and side-by-side comparisons with the live site, not through TypeScript. The old checked-in output and archived theme were much more useful here than trying to describe the mismatch from memory.

## Tests for the things I did not want to rediscover

I added a small Bun test file instead of a large testing setup. It checks the established routes, public post count, draft exclusions, canonical domain, same-date ordering, integrations, and the case-sensitive permalink.

The tests did not prove visual parity, but they covered the quiet failures that are easy to ship during a rewrite. After a build, the suite reads the generated files in `dist` and checks the result a visitor or crawler will receive.

Greptile reviewed the first pull request as well. Some comments were useful: sitemap pagination needed to use the shared page size, optional reading-time fields needed guards, and I had accidentally generated two sitemaps. Other suggestions did not fit the job. Moving the Firebase web config into secrets would add ceremony without hiding anything, because that configuration is intentionally public in a browser app. Changing the Utterances theme would also have violated the visual-parity requirement.

I like review tools more when "no" remains a valid answer.

## A green deployment that nobody could see

The Astro deployment used [`withastro/action`](https://github.com/withastro/action) to build the site and GitHub's Pages action to publish it. The workflow passed after the first pull request was merged. The website was still serving the old version.

GitHub Pages was configured to deploy from the repository branch, not from Actions. I changed the Pages source and ran the workflow again. Green. Still old.

This time the problem was DNS. `gurbaaz.xyz` still resolved to Hostinger, complete with an A record and an IPv6 record, while the new site was waiting on GitHub Pages. GitHub had deployed Astro correctly; visitors simply never reached it. I changed the DNS records using [GitHub's custom-domain instructions](https://docs.github.com/en/pages/configuring-a-custom-domain-for-your-github-pages-site/managing-a-custom-domain-for-your-github-pages-site), waited for HTTPS, and finally saw the `/_astro/` assets on the public site.

That was probably the least glamorous part of the migration and the most important production check. A successful workflow only proves that the workflow succeeded.

## Why I moved away from Utterances

I added [Utterances](https://utteranc.es/) to this blog in 2023. It is a clever system: each post maps to a GitHub issue, and the comment UI is an embedded GitHub-backed widget. It was almost effortless to host and had no database for me to maintain.

The trade-off is that a reader needs a GitHub account to comment. That is reasonable for a documentation site or a blog read entirely by developers. My posts are not all technical, though, and making somebody sign into GitHub to leave a note on a Japan travel post felt unnecessary.

There were no existing comments to preserve, which made this the best possible time to change the system. I chose [Waline](https://waline.js.org/) because it allows anonymous comments, has its own admin dashboard, and gives me room to add moderation or notifications later.

The [Astro comment-system comparison by Easton](https://eastondev.com/blog/en/posts/dev/20251204-astro-comment-systems-guide/) was a useful introduction. Its Waline example used Vercel with LeanCloud. Before copying that setup, the coding session checked Waline's current documentation and found that the official quick start now uses [Vercel with Neon Postgres](https://waline.js.org/en/guide/get-started/). I followed the newer route.

## Deploying Waline through another coding session

I kept the Waline server separate from the blog repository. The public [`waline-comments`](https://github.com/gurbaaz27/waline-comments) repository contains the small official Vercel example, pinned to `@waline/vercel` 1.41.3. Vercel hosts it at `comments.gurbaaz.xyz`, and a Neon database stores comments and users.

The setup was done through the Vercel CLI where possible. Codex created the repository, deployed the server, provisioned Neon in the Singapore region, applied Waline's official PostgreSQL schema, configured the domain, and set the server environment. I only had to do the account-owner steps: accept the Neon Marketplace terms, add the DNS record, grant the Vercel GitHub App access to the new repository, and register the first Waline administrator.

Even this small deployment found ways to be interesting.

The local `bun install` tried to compile `better-sqlite3` and failed under Node 26 with my Python 3.14 setup. The production server was going to use Postgres, not SQLite, so I generated the lockfile with install scripts disabled and let the real Vercel build validate the package.

The guide suggested a CNAME for the custom subdomain, while Vercel's live configuration asked for an A record pointing to `76.76.21.21`. I trusted the deployment that was actually serving the project and verified DNS and TLS after the change.

The best bug arrived after the database was healthy. The Waline API returned `403 Forbidden` for both the blog and the Waline domain. I had configured `SECURE_DOMAINS` with complete URLs:

```text
https://gurbaaz.xyz,https://www.gurbaaz.xyz,https://comments.gurbaaz.xyz
```

The documentation called them domains, which I read as origins. Looking at the deployed Waline source showed that the server extracts the hostname from the request and compares it directly with each configured string. The values needed to be bare hostnames:

```text
gurbaaz.xyz,www.gurbaaz.xyz,comments.gurbaaz.xyz
```

After that redeploy, the approved blog origin received `200` and an empty comment list from Neon. A request from `example.com` received `403`. Much better.

## The Astro side stayed small

The frontend migration replaced the Utterances script with `@waline/client`. The component reads the server URL from site config and mounts Waline with the current path as the comment-thread identifier:

```typescript
init({
  el,
  serverURL: "https://comments.gurbaaz.xyz",
  path: window.location.pathname.replace(/\/$/, "") || "/",
  lang: "en",
  dark: "html.dark-mode",
  meta: ["nick", "mail"],
  requiredMeta: ["nick"],
  pageSize: 10,
})
```

The Easton article includes extra handling for Astro view transitions. This site does not use them, so I left that code out. A normal page navigation creates a fresh component and there is no old Waline instance to destroy.

For now, comments publish immediately with Waline's default rate limiting and anti-spam behaviour. User-agent and region labels are hidden. I skipped SMTP notifications and Turnstile until the blog has enough comment traffic to justify either one.

Before merging, I checked the generated blog page for the Waline mount and server URL, searched it for any leftover `utteranc.es` request, called the API from the `www` site origin, and repeated the call from an unapproved origin. The first returned an empty comment list. The second returned `403`. I also queried Neon to confirm that my administrator account existed.

## What the coding sessions were good at

Most of the Astro component code was straightforward. The sessions earned their keep elsewhere: maintaining a running compatibility contract, comparing output, inspecting old behavior, and refusing to call a deployment complete until the public domain showed the new site.

The sessions were also better when I gave concrete feedback. "The avatar animation feels abrupt" led to the delayed-visibility bug. A screenshot of a blockquote led to one wrong combinator. "The list numbers are missing" led to Tailwind's reset. These are not grand architectural problems. They are the sort of details that decide whether a rewrite feels like the same website.

After the last merge, I opened the Japan post, scrolled past the images that had finally returned to their old size, and reached a Waline form instead of a GitHub login. The page did not feel newly designed. It just felt like the same website had become less annoying for me to maintain and less annoying for somebody else to comment on.

I am keeping the `legacy-jekyll` folder for now. Partly as a reference, and partly because deleting it immediately after all that CSS archaeology would feel ungrateful.

### References

1. [Astro documentation](https://docs.astro.build/)
2. [Astro GitHub Action](https://github.com/withastro/action)
3. [GitHub Pages custom-domain documentation](https://docs.github.com/en/pages/configuring-a-custom-domain-for-your-github-pages-site/managing-a-custom-domain-for-your-github-pages-site)
4. [Utterances](https://utteranc.es/)
5. [Integrating comment systems in Astro blogs](https://eastondev.com/blog/en/posts/dev/20251204-astro-comment-systems-guide/)
6. [Waline get started guide](https://waline.js.org/en/guide/get-started/)
7. [Waline client options](https://waline.js.org/en/reference/client/props.html)
8. [Waline server environment variables](https://waline.js.org/en/reference/server/env.html)
