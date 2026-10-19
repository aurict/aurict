import type { MetadataRoute } from "next";

const BASE_URL = "https://mobile.aurict.com";

export default function sitemap(): MetadataRoute.Sitemap {
  const routes: { path: string; priority: number }[] = [
    { path: "", priority: 1 },
    { path: "/about-us", priority: 0.8 },
    { path: "/capabilities", priority: 0.7 },
    { path: "/security", priority: 0.7 },
    { path: "/install", priority: 0.7 },
    { path: "/faq", priority: 0.7 },
    { path: "/privacy-policy", priority: 0.5 },
    { path: "/duckley/privacy-policy", priority: 0.5 },
    { path: "/terms-of-service", priority: 0.5 },
    { path: "/ccpa-policy", priority: 0.5 },
  ];

  return routes.map((route) => ({
    url: `${BASE_URL}${route.path}`,
    lastModified: new Date(),
    changeFrequency: "monthly",
    priority: route.priority,
  }));
}
