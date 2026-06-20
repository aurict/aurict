import type { MetadataRoute } from "next"

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow:     "/",
        disallow:  ["/api/"],
      },
    ],
    sitemap: "https://aurict.dev/sitemap.xml",
    host:    "https://aurict.dev",
  }
}
