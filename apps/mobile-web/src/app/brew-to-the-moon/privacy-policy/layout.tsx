import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Brew to the Moon Privacy Policy",
  description:
    "Privacy policy for the Brew to the Moon game (com.aurict.brewtothemoon) on Google Play, published by developer Aurict.",
  alternates: { canonical: "/brew-to-the-moon/privacy-policy" },
};

export default function BrewToTheMoonPrivacyPolicyLayout({ children }: { children: React.ReactNode }) {
  return children;
}
