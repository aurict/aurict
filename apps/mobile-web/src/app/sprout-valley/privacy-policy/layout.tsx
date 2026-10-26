import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Sprout Valley: Merge Farm Privacy Policy",
  description:
    "Privacy policy for the Sprout Valley: Merge Farm game (com.aurict.sprout) on Google Play, published by developer Aurict.",
  alternates: { canonical: "/sprout-valley/privacy-policy" },
};

export default function SproutValleyPrivacyPolicyLayout({ children }: { children: React.ReactNode }) {
  return children;
}
