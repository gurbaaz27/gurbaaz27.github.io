# Personal Homepage

Source for [gurbaaz.xyz](https://gurbaaz.xyz), built as a static Astro site with Bun, TypeScript, and Tailwind CSS.

## Development

Install [Bun](https://bun.sh), then run:

```bash
bun install
bun dev
```

The local site is served at `http://localhost:4321`.

## Verification

```bash
bun run check
bun run test
bun run build
bun preview
```

`bun run test` creates the production output and checks the established routes, feeds, metadata, integrations, draft filtering, and case-sensitive post permalinks.

## Content

Posts live in `src/content/blog`. Their existing `YYYY-MM-DD-title.md` filenames define their dates and public URLs. Set `draft: true` in frontmatter to keep a post out of production.

Static media and documents live in `public/assets`. The original Jekyll implementation is preserved in [`legacy-jekyll`](legacy-jekyll/README.md) for reference.

## Deployment

Pull requests run the CI workflow. Merges to `main` deploy `dist` through GitHub Pages Actions while retaining the `gurbaaz.xyz` custom domain.
