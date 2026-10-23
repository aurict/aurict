import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Drift Street Privacy Policy",
  description:
    "Privacy policy for the Drift Street game (com.aurict.driftstreet) on Google Play, published by developer Aurict.",
  alternates: { canonical: "/drift-street/privacy-policy" },
};

export default function DriftStreetPrivacyPolicyLayout({ children }: { children: React.ReactNode }) {
  return children;
}
