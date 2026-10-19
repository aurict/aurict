import type { MetadataRoute } from "next";
import { POSTS } from "@/content/blog-posts";
import { COMPARISONS } from "@/content/comparisons";
import { SITE_URL } from "@/content/site";
import { USE_CASES } from "@/content/use-cases";

const LAST_UPDATED = new Date("2026-07-31T00:00:00.000Z");

export default function sitemap(): MetadataRoute.Sitemap {
  const staticRoutes = [
    "",
    "/about",
    "/blog",
    "/changelog",
    "/compare",
    "/contact",
    "/docs",
    "/pricing",
    "/privacy",
    "/roadmap",
    "/security",
    "/terms",
    "/use-cases",
  ];

  return [
    ...staticRoutes.map((path) => ({
      url: `${SITE_URL}${path}`,
      lastModified: LAST_UPDATED,
      changeFrequency: path === "" ? ("weekly" as const) : ("monthly" as const),
      priority: path === "" ? 1 : 0.7,
    })),
    ...POSTS.map((post) => ({
      url: `${SITE_URL}/blog/${post.slug}`,
      lastModified: new Date(`${post.date}T00:00:00.000Z`),
      changeFrequency: "monthly" as const,
      priority: 0.7,
    })),
    ...COMPARISONS.map((comparison) => ({
      url: `${SITE_URL}/compare/${comparison.slug}`,
      lastModified: LAST_UPDATED,
      changeFrequency: "monthly" as const,
      priority: 0.6,
    })),
    ...USE_CASES.map((useCase) => ({
      url: `${SITE_URL}/use-cases/${useCase.slug}`,
      lastModified: LAST_UPDATED,
      changeFrequency: "monthly" as const,
      priority: 0.6,
    })),
  ];
}
