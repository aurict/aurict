import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Duckley Privacy Policy",
  description:
    "Privacy policy for the Duckley app (com.aurict.duckley) on Google Play, published by developer benLothe.",
  alternates: { canonical: "/duckley/privacy-policy" },
};

export default function DuckleyPrivacyPolicyLayout({ children }: { children: React.ReactNode }) {
  return children;
}
