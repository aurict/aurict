import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Jelly Paradox Privacy Policy",
  description:
    "Privacy policy for the Jelly Paradox game (com.aurict.jelly) on Google Play and the App Store, published by developer benLothe.",
  alternates: { canonical: "/jelly-paradox/privacy-policy" },
};

export default function JellyParadoxPrivacyPolicyLayout({ children }: { children: React.ReactNode }) {
  return children;
}
