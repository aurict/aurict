# Explorer Agent Findings — apps/web

## Web App Overview

### package.json
- **Name:** `web` (private)
- **Version:** `0.1.0`
- **Scripts:** `dev` (next dev), `build` (next build), `start` (next start), `lint` (eslint)
- **Dependencies:**
  - `next` — `16.2.7` (bleeding edge)
  - `react` / `react-dom` — `19.2.4`
  - `framer-motion` — `^12.40.0`
  - `lucide-react` — `^1.17.0`
  - `resend` — `^6.12.4`
- **DevDependencies:**
  - `@tailwindcss/postcss` — `^4`
  - `tailwindcss` — `^4`
  - `eslint` — `^9`, `eslint-config-next` — `16.2.7`
  - `@types/node` — `^25.9.2`, `@types/react` — `^19`, `@types/react-dom` — `^19`
  - `typescript` — `^5`
- **Note:** `trustedDependencies` includes `sharp` and `unrs-resolver`

### next.config.ts
- Minimal: `output: process.env.DOCKER_BUILD ? "standalone" : undefined`

### TypeScript Config
- `target: ES2017`, `module: esnext`, `moduleResolution: bundler`
- `strict: true`, `jsx: react-jsx`
- Path alias `@/*` → `./src/*`

### PostCSS / Tailwind
- Single plugin: `@tailwindcss/postcss` (Tailwind v4)

### ESLint
- Flat config format, extends `eslint-config-next/core-web-vitals` + `typescript`

### Dockerfile
- 3-stage build with `oven/bun:1`:
  1. deps — `bun install --frozen-lockfile`
  2. builder — `bun run build`
  3. runner — standalone output, port 3376
- Runs `bun server.js` in production

### Ecosystem Config (PM2)
- Process: `aurict-web`, port 3376, 1 instance, 512MB max

### Environment Variables
- `RESEND_API_KEY=your_resend_api_key_here`
- `NOTIFY_EMAIL=fakesmileux@gmail.com`

### AGENTS.md
- Warns that this Next.js version has breaking changes from training data.
- Instructs AI to read `node_modules/next/dist/docs/` before coding.

### CLAUDE.md
- Simply `@AGENTS.md`

### README.md
- Default `create-next-app` boilerplate, not customized.

---

## Source Structure (17 files)

```
apps/web/src/
├── app/
│   ├── api/waitlist/route.ts
│   ├── changelog/page.tsx
│   ├── docs/page.tsx
│   ├── favicon.ico
│   ├── globals.css
│   ├── layout.tsx
│   └── page.tsx
├── components/
│   ├── Nav.tsx
│   ├── sections/
│   │   ├── Features.tsx
│   │   ├── Footer.tsx
│   │   ├── Hero.tsx
│   │   ├── Install.tsx
│   │   └── Waitlist.tsx
│   └── terminal/
│       └── TerminalWindow.tsx
├── hooks/
│   └── useTypewriter.ts
└── lib/
    └── constants.ts
```

---

## Key Source Files

### `src/app/layout.tsx` — Root Layout
- Geist Sans + Geist Mono fonts
- Metadata: "Aurict — Terminal AI Coding Assistant"
- Dark background (`#0a0a0a`), film grain overlay
- Site URL: `https://aurict.com`

### `src/app/page.tsx` — Home Page
- Composes: Nav → Hero → Features → Install → Waitlist → Footer
- Fully static marketing page, no data fetching

### `src/app/globals.css` — Global Styles
- Tailwind v4 import + custom dark theme CSS variables
- Animations: blink, gradient-x, glow-pulse, scan
- Custom scrollbar, selection colors

### `src/app/docs/page.tsx` — Docs Page
- 5 documentation sections: Installation, Configuration, Custom Tools, Custom Skills, MCP Integration
- Sticky sidebar TOC + content layout
- All content hardcoded, no MDX or CMS

### `src/app/changelog/page.tsx` — Changelog Page
- v1.0.0 (2026-06-07) — Initial release
- 11 "New" type changes listed
- Colored badge system for change types

### `src/app/api/waitlist/route.ts` — API Route
- POST handler: validates email, sends via Resend to NOTIFY_EMAIL
- Dark-themed HTML email template

### `src/lib/constants.ts`
- `TERMINAL_SCENARIOS`: 3 animated terminal demos (Refactor, Bug Fix, New Feature)
- `FEATURES`: 6 feature cards (Multi-Agent, 218+ Skills, Bash Classifier, Sandbox, MCP, Design Wizard)
- `PRO_FEATURES`: 4 upcoming paid features

### `src/hooks/useTypewriter.ts`
- Typewriter animation hook: `useTypewriter(text, speed=28, active)`
- Returns `{ displayed, done }`

### `src/components/Nav.tsx`
- Fixed nav bar, transparent → blurred on scroll
- Logo + v1.0 badge, links to Docs/Changelog/GitHub, Join Waitlist CTA

### `src/components/terminal/TerminalWindow.tsx`
- Animated terminal emulator with macOS traffic lights
- 3 clickable scenario tabs cycling automatically
- Color-coded line types

### `src/components/sections/Hero.tsx`
- Full-viewport hero with radial glow, animated badge
- "The terminal AI that actually thinks." headline
- Terminal demo embedded

### `src/components/sections/Features.tsx`
- 2-column responsive grid, 6 feature cards
- Each card: icon, title, tag badge, description, colored accent

### `src/components/sections/Install.tsx`
- 3 install steps with copy-to-clipboard code blocks

### `src/components/sections/Waitlist.tsx`
- Email signup form → `/api/waitlist`
- Success confirmation with waitlist count (#847 base)
- Pro preview card with blur overlay
- localStorage for count persistence

### `src/components/sections/Footer.tsx`
- MIT License, © 2026, links to GitHub/npm/Docs/Changelog

---

## Public Assets (5 SVGs)
- `file.svg`, `globe.svg`, `next.svg`, `vercel.svg`, `window.svg`
- Boilerplate from create-next-app, not actively used in components

---

## Architecture Summary

1. **Next.js 16 marketing site** — 3 routes, 1 API route. No auth, DB, or CMS.
2. **Tailwind v4** with CSS-first config (`@tailwindcss/postcss`).
3. **All components are `"use client"`** — no Server Components used.
4. **Dark theme only** — hardcoded CSS variables, no theme toggle.
5. **Framer Motion** for scroll animations throughout.
6. **Inline styles** mixed with Tailwind (predominantly inline objects).
7. **Resend API** for waitlist email collection (no database).
8. **Docker-ready** multi-stage build with PM2 process management.
9. **Bun-native** toolchain consistent with monorepo.
10. **Zero tests** in this package.
