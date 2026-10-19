import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Terms of Service",
  description: "The terms for using Aurict Mobile apps and mobile.aurict.com.",
  alternates: { canonical: "/terms-of-service" },
};

export default function TermsOfServiceLayout({ children }: { children: React.ReactNode }) {
  return children;
}
