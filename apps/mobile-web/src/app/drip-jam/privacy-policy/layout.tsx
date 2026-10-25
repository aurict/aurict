import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Drip Jam Privacy Policy",
  description:
    "Privacy policy for the Drip Jam game (com.aurict.dripjam) on Google Play, published by developer Aurict.",
  alternates: { canonical: "/drip-jam/privacy-policy" },
};

export default function DripJamPrivacyPolicyLayout({ children }: { children: React.ReactNode }) {
  return children;
}
