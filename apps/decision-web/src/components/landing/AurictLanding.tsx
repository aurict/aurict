import { Footer } from "@/components/Footer";
import { LandingHero } from "@/components/landing/LandingHero";
import { LandingSections } from "@/components/landing/LandingSections";

export function AurictLanding() {
  return (
    <>
      <main>
        <LandingHero />
        <LandingSections />
      </main>
      <Footer />
    </>
  );
}
