# Personal Homepage

Visit [gurbaaz27.github.io](https://gurbaaz27.github.io) for the hosted homepage.

## Installation

This is a Jekyll-based website. To install dependencies:

### Prerequisites

- Ruby (version 2.5 or higher recommended)
- RubyGems (usually comes with Ruby)

### Steps

1. **Install Bundler** (if not already installed):

   If you encounter permission errors (common on macOS with system Ruby), install Bundler to your user directory:

   ```bash
   gem install bundler --user-install
   ```

   For older Ruby versions (< 3.2), you may need to install a compatible Bundler version:

   ```bash
   gem install bundler -v 2.4.22 --user-install
   ```

   Then add Bundler to your PATH (add this to your `~/.zshrc` or `~/.bash_profile`):

   ```bash
   export PATH="$HOME/.gem/ruby/2.6.0/bin:$PATH"
   ```

2. **Configure Bundler** (to avoid permission issues):

   ```bash
   bundle config set --local path 'vendor/bundle'
   ```

3. **Install project dependencies**:
   ```bash
   bundle install
   ```

This will install all required gems including:

- Jekyll (~> 3.8)
- jekyll-paginate
- jekyll-sitemap
- kramdown and kramdown-parser-gfm
- webrick (for local server)

### Running the site locally

After installing dependencies, you can run the site locally with:

```bash
bundle exec jekyll serve
```

Then visit `http://localhost:4000` in your browser.

# Credits

[Beautiful Jekyll](https://beautifuljekyll.com/) theme created by [Dean Attali](https://deanattali.com).
