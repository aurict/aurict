# Aurict web

The public Aurict website is a Next.js 16 application. It contains the product landing page, AI-coding-agent and terminal-agent search hubs, documentation, comparisons, use cases, release notes, downloads, legal pages, and account flows.

The root layout loads Source Serif 4 and IBM Plex Mono through `next/font` so the production build serves the fonts from the same origin. Keep those font declarations in the root layout rather than adding runtime Google Fonts stylesheets to individual pages.

## Development

```bash
bun install
bun run dev
```

Before shipping a change, run:

```bash
bun run lint
bunx tsc --noEmit
bun run build
```

## Internationalization

The site uses `next-intl` and supports English (`en`), Turkish (`tr`), German (`de`), French (`fr`), and Spanish (`es`). English uses unprefixed URLs; the other locales use `/tr`, `/de`, `/fr`, and `/es`.

Locale configuration lives in `src/i18n/config.ts`. Navigation messages live in `src/messages/`. The homepage and `/terminal-agent` are fully localized in all five languages. Long-form editorial, documentation, comparison, use-case, and legal content currently remains English/Turkish; German, French, and Spanish requests receive the English article with an English canonical until an reviewed translation is available. Do not add those fallback pages to localized sitemap entries.

When adding a fully translated public page:

1. Provide visible content and metadata for every advertised locale.
2. Pass the translated locale list to `localizedMetadata`.
3. Add reciprocal localized entries through `src/app/sitemap.ts`.
4. Verify the rendered `lang`, canonical, `hreflang`, and structured data for each locale.

## SEO surfaces

- `src/i18n/metadata.ts` builds canonical URLs, reciprocal `hreflang`, Open Graph, Twitter, and crawler directives.
- `src/app/sitemap.ts` lists only locale variants with real translated content.
- `src/components/seo/JsonLd.tsx` safely serializes structured data.
- `src/content/home-seo.ts` defines homepage metadata and structured data.
- `src/content/ai-coding-agent.ts` defines the English/Turkish AI-coding-agent topic hub.
- `src/content/terminal-agent.ts` defines the five-language terminal-agent topic hub.
- `public/llms.txt` provides a concise map for AI crawlers and research tools.

High-intent aliases such as `/claude-code-alternative`, `/terminal-ai`, and `/coding-agent` permanently redirect to their canonical topic or comparison page. Keep aliases out of the sitemap and never render duplicate indexable content at those paths.

Validate structured data with Google Rich Results Test or Schema.org Validator after deployment, then submit `https://aurict.com/sitemap.xml` in the production search consoles.
