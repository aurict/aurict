import type { MetadataRoute } from "next";
import { LAST_UPDATED, SITE_URL } from "@/content/site";

const ROUTES: { path: string; priority: number }[] = [
  { path: "", priority: 1 },
  { path: "/how-it-works", priority: 0.8 },
  { path: "/benchmarks", priority: 0.8 },
  { path: "/install", priority: 0.8 },
  { path: "/compare", priority: 0.7 },
];

export default function sitemap(): MetadataRoute.Sitemap {
  return ROUTES.map(({ path, priority }) => ({
    url: `${SITE_URL}${path}`,
    lastModified: new Date(`${LAST_UPDATED}T00:00:00.000Z`),
    changeFrequency: path === "" || path === "/benchmarks" ? "weekly" : "monthly",
    priority,
  }));
}
