import type { NextConfig } from "next"
import { dirname, resolve } from "node:path"
import { fileURLToPath } from "node:url"
import createNextIntlPlugin from "next-intl/plugin"

const withNextIntl = createNextIntlPlugin("./src/i18n/request.ts")
const appRoot = dirname(fileURLToPath(import.meta.url))
const workspaceRoot = resolve(appRoot, "../..")

// Content Security Policy. Next.js inlines its bootstrap scripts in statically rendered
// pages, which cannot carry a per-request nonce, so script-src keeps 'unsafe-inline'; every
// external source is still listed explicitly, and framing, plugins and <base> are blocked.
const contentSecurityPolicy = [
  "default-src 'self'",
  `script-src 'self' 'unsafe-inline' https://www.gstatic.com https://apis.google.com https://www.googletagmanager.com${process.env.NODE_ENV === "production" ? "" : " 'unsafe-eval'"}`,
  "connect-src 'self' https://identitytoolkit.googleapis.com https://securetoken.googleapis.com https://www.googleapis.com https://*.google-analytics.com https://*.analytics.google.com https://www.googletagmanager.com",
  "frame-src https://*.firebaseapp.com https://accounts.google.com https://apis.google.com",
  "img-src 'self' data: blob: https:",
  "style-src 'self' 'unsafe-inline'",
  "font-src 'self' data:",
  "object-src 'none'",
  "base-uri 'self'",
  "form-action 'self'",
  "frame-ancestors 'none'",
  "upgrade-insecure-requests",
].join("; ")

const nextConfig: NextConfig = {
  poweredByHeader: false,
  output: process.env.DOCKER_BUILD ? "standalone" : undefined,
  turbopack: {
    root: workspaceRoot,
  },

  // aurict.dev → aurict.com kalıcı yönlendirme
  async redirects() {
    return [
      {
        source:      "/:path*",
        has:         [{ type: "host", value: "www.aurict.com" }],
        destination: "https://aurict.com/:path*",
        permanent:   true,
      },
      {
        source:      "/:path*",
        has:         [{ type: "host", value: "aurict.dev" }],
        destination: "https://aurict.com/:path*",
        permanent:   true,
      },
      {
        source:      "/:path*",
        has:         [{ type: "host", value: "www.aurict.dev" }],
        destination: "https://aurict.com/:path*",
        permanent:   true,
      },
      {
        source: "/claude-code-alternative",
        destination: "/compare/claude-code",
        permanent: true,
      },
      {
        source: "/terminal-ai",
        destination: "/terminal-agent",
        permanent: true,
      },
      {
        source: "/coding-agent",
        destination: "/ai-coding-agent",
        permanent: true,
      },
      {
        source: "/ai-agent",
        destination: "/ai-coding-agent",
        permanent: true,
      },
    ]
  },

  // Güvenlik header'ları (SEO trust signals için)
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          { key: "Content-Security-Policy", value: contentSecurityPolicy },
          { key: "Strict-Transport-Security", value: "max-age=31536000" },
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "X-Frame-Options",        value: "DENY" },
          // The legacy XSS auditor is gone from browsers and could be abused; CSP replaces it.
          { key: "X-XSS-Protection",       value: "0" },
          { key: "Referrer-Policy",        value: "strict-origin-when-cross-origin" },
          { key: "Permissions-Policy",     value: "camera=(), microphone=(), geolocation=()" },
        ],
      },
    ]
  },
}

export default withNextIntl(nextConfig)
