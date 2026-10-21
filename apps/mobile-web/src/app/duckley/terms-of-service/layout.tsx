import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Duckley Terms of Use",
  description:
    "Terms of use and subscription terms for the Duckley app (com.aurict.duckley) on the App Store and Google Play, published by developer benLothe.",
  alternates: { canonical: "/duckley/terms-of-service" },
};

export default function DuckleyTermsLayout({ children }: { children: React.ReactNode }) {
  return children;
}
