import type { NextConfig } from "next"

const nextConfig: NextConfig = {
  output: process.env.DOCKER_BUILD ? "standalone" : undefined,

  // aurict.com → aurict.dev kalıcı yönlendirme
  async redirects() {
    return [
      {
        source:      "/:path*",
        has:         [{ type: "host", value: "aurict.com" }],
        destination: "https://aurict.dev/:path*",
        permanent:   true,
      },
      {
        source:      "/:path*",
        has:         [{ type: "host", value: "www.aurict.com" }],
        destination: "https://aurict.dev/:path*",
        permanent:   true,
      },
    ]
  },

  // Güvenlik header'ları (SEO trust signals için)
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "X-Frame-Options",        value: "DENY" },
          { key: "X-XSS-Protection",       value: "1; mode=block" },
          { key: "Referrer-Policy",        value: "strict-origin-when-cross-origin" },
          { key: "Permissions-Policy",     value: "camera=(), microphone=(), geolocation=()" },
        ],
      },
    ]
  },
}

export default nextConfig
