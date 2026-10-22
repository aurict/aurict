import type { Metadata } from "next";
import { JsonLd } from "@/components/JsonLd";
import { CtaPanel } from "@/components/CtaPanel";
import { faqJsonLd } from "@/components/Faq";
import { Hero } from "@/components/home/Hero";
import { Commands, ComparePreview, Evidence, FaqSection, Gates, Numbers, Pipeline } from "@/components/home/Sections";
import { DESCRIPTION, REPO_URL, SITE_URL } from "@/content/site";

const software = {
  "@context": "https://schema.org",
  "@type": "SoftwareApplication",
  name: "QuaeraLabs",
  alternateName: "Quaera",
  url: SITE_URL,
  description: DESCRIPTION,
  applicationCategory: "DeveloperApplication",
  applicationSubCategory: "AI research agent",
  operatingSystem: "Linux, Windows (WSL2), macOS (containers)",
  license: "https://www.apache.org/licenses/LICENSE-2.0",
  isAccessibleForFree: true,
  offers: { "@type": "Offer", price: "0", priceCurrency: "USD" },
  codeRepository: REPO_URL,
  programmingLanguage: ["Python", "Lean 4"],
  publisher: { "@id": `${SITE_URL}/#org` },
};

export const metadata: Metadata = {
  alternates: { canonical: "/" },
};

export default function HomePage() {
  return (
    <>
      <JsonLd data={software} />
      <JsonLd data={faqJsonLd()} />
      <Hero />
      <Gates />
      <Commands />
      <Pipeline />
      <Evidence />
      <Numbers />
      <ComparePreview />
      <FaqSection />
      <CtaPanel />
    </>
  );
}
