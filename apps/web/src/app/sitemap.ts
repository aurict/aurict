import type { MetadataRoute } from "next"

const BASE = "https://aurict.com"

export default function sitemap(): MetadataRoute.Sitemap {
  return [
    // Main pages
    {
      url:             BASE,
      lastModified:    new Date(),
      changeFrequency: "weekly",
      priority:        1.0,
    },
    {
      url:             `${BASE}/docs`,
      lastModified:    new Date(),
      changeFrequency: "weekly",
      priority:        0.9,
    },
    {
      url:             `${BASE}/changelog`,
      lastModified:    new Date(),
      changeFrequency: "weekly",
      priority:        0.7,
    },

    // Blog
    {
      url:             `${BASE}/blog`,
      lastModified:    new Date(),
      changeFrequency: "weekly",
      priority:        0.8,
    },
    {
      url:             `${BASE}/blog/how-to-use-ai-coding-assistant`,
      lastModified:    new Date("2026-06-15"),
      changeFrequency: "monthly",
      priority:        0.7,
    },
    {
      url:             `${BASE}/blog/claude-code-vs-aurict`,
      lastModified:    new Date("2026-06-12"),
      changeFrequency: "monthly",
      priority:        0.7,
    },
    {
      url:             `${BASE}/blog/terminal-ai-tools-2026`,
      lastModified:    new Date("2026-06-10"),
      changeFrequency: "monthly",
      priority:        0.7,
    },
    {
      url:             `${BASE}/blog/multi-agent-ai-coding`,
      lastModified:    new Date("2026-06-08"),
      changeFrequency: "monthly",
      priority:        0.7,
    },
    {
      url:             `${BASE}/blog/mcp-model-context-protocol`,
      lastModified:    new Date("2026-06-05"),
      changeFrequency: "monthly",
      priority:        0.7,
    },

    // Use Cases
    {
      url:             `${BASE}/use-cases`,
      lastModified:    new Date(),
      changeFrequency: "monthly",
      priority:        0.8,
    },
    {
      url:             `${BASE}/use-cases/refactoring`,
      lastModified:    new Date(),
      changeFrequency: "monthly",
      priority:        0.7,
    },
    {
      url:             `${BASE}/use-cases/code-review`,
      lastModified:    new Date(),
      changeFrequency: "monthly",
      priority:        0.7,
    },
    {
      url:             `${BASE}/use-cases/testing`,
      lastModified:    new Date(),
      changeFrequency: "monthly",
      priority:        0.7,
    },
    {
      url:             `${BASE}/use-cases/documentation`,
      lastModified:    new Date(),
      changeFrequency: "monthly",
      priority:        0.7,
    },

    // Comparisons
    {
      url:             `${BASE}/compare/claude-code`,
      lastModified:    new Date(),
      changeFrequency: "monthly",
      priority:        0.7,
    },
    {
      url:             `${BASE}/compare/cursor`,
      lastModified:    new Date(),
      changeFrequency: "monthly",
      priority:        0.7,
    },
    {
      url:             `${BASE}/compare/aider`,
      lastModified:    new Date(),
      changeFrequency: "monthly",
      priority:        0.7,
    },
    {
      url:             `${BASE}/compare/github-copilot`,
      lastModified:    new Date(),
      changeFrequency: "monthly",
      priority:        0.7,
    },
    {
      url:             `${BASE}/compare/opencode`,
      lastModified:    new Date(),
      changeFrequency: "monthly",
      priority:        0.7,
    },
  ]
}
