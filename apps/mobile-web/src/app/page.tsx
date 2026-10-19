import AmbientBackground from "@/components/AmbientBackground";
import Hero from "@/components/Hero";
import Apps from "@/components/Apps";
import Marquee from "@/components/Marquee";
import Spotlights from "@/components/Spotlights";
import Studio from "@/components/Studio";
import SupportHub from "@/components/SupportHub";
import HomeFaq from "@/components/HomeFaq";
import Contact from "@/components/Contact";
import { en } from "@/i18n/dicts/en";

const BASE_URL = "https://mobile.aurict.com";

// Structured data mirrors the visible English copy; search engines read it
// independently of the locale a visitor is served.
const structuredData = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "Organization",
      "@id": "https://aurict.com/#organization",
      name: "Aurict",
      url: "https://aurict.com",
      logo: `${BASE_URL}/aurict-logo.svg`,
      email: "contact@aurict.com",
      sameAs: ["https://x.com/aurict", "https://github.com/aurict"],
    },
    {
      "@type": "WebSite",
      "@id": `${BASE_URL}/#website`,
      name: "Aurict Mobile",
      url: BASE_URL,
      publisher: { "@id": "https://aurict.com/#organization" },
      inLanguage: ["en", "tr", "de", "fr", "zh"],
    },
    {
      "@type": "ItemList",
      name: "Aurict Mobile apps",
      itemListElement: [
        {
          "@type": "MobileApplication",
          name: "Duckley",
          description: en.spotlight.duckley.body,
          applicationCategory: "EducationalApplication",
          operatingSystem: "Android",
          url: "https://play.google.com/store/apps/details?id=com.aurict.duckley",
          publisher: { "@id": "https://aurict.com/#organization" },
        },
        {
          "@type": "MobileApplication",
          name: "Mind Grid: Brain Memory Game",
          description: en.spotlight.mindgrid.body,
          applicationCategory: "GameApplication",
          operatingSystem: "Android",
          url: "https://play.google.com/store/apps/details?id=com.mindgrid.mind_grid",
          publisher: { "@id": "https://aurict.com/#organization" },
        },
        {
          "@type": "MobileApplication",
          name: "Jelly Paradox",
          description: en.spotlight.jelly.body,
          applicationCategory: "GameApplication",
          operatingSystem: "Android, iOS",
          publisher: { "@id": "https://aurict.com/#organization" },
        },
      ].map((item, index) => ({ "@type": "ListItem", position: index + 1, item })),
    },
    {
      "@type": "FAQPage",
      mainEntity: Object.values(en.homeFaq)
        .filter((entry): entry is { q: string; a: string } => typeof entry === "object")
        .map((entry) => ({
          "@type": "Question",
          name: entry.q,
          acceptedAnswer: { "@type": "Answer", text: entry.a },
        })),
    },
  ],
};

export default function HomePage() {
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }} />
      <AmbientBackground />
      <main>
        <Hero />
        <Apps />
        <Marquee />
        <Spotlights />
        <Studio />
        <SupportHub />
        <HomeFaq />
        <Contact />
      </main>
    </>
  );
}
