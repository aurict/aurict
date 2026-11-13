import type { NextConfig } from "next"

// Content Security Policy. Next.js inlines its bootstrap scripts in statically rendered
// pages, which cannot carry a per-request nonce, so script-src keeps 'unsafe-inline'; every
// external source is still listed explicitly, and framing, plugins and <base> are blocked.
const contentSecurityPolicy = [
  "default-src 'self'",
  `script-src 'self' 'unsafe-inline' https://accounts.google.com${process.env.NODE_ENV === "production" ? "" : " 'unsafe-eval'"}`,
  "connect-src 'self' https://accounts.google.com https://jelly.aurict.com https://dungeon.aurict.com https://duckley.aurict.com https://mind.fexiolabs.com",
  "frame-src https://accounts.google.com",
  "img-src 'self' data: blob: https:",
  "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com https://accounts.google.com",
  "font-src 'self' data: https://fonts.gstatic.com",
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
    root: process.cwd(),
  },

  async headers() {
    return [
      {
        source: "/mindgrid/:path*",
        headers: [{ key: "X-Robots-Tag", value: "noindex, nofollow" }],
      },
      {
        source: "/(.*)",
        headers: [
          { key: "Content-Security-Policy", value: contentSecurityPolicy },
          { key: "Strict-Transport-Security", value: "max-age=31536000" },
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "X-Frame-Options", value: "DENY" },
          { key: "X-XSS-Protection", value: "0" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
        ],
      },
    ]
  },
}

export default nextConfig
