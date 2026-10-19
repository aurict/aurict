import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "CCPA Privacy Policy",
  description: "California Consumer Privacy Act notice for Aurict Mobile apps.",
  alternates: { canonical: "/ccpa-policy" },
};

export default function CcpaPolicyLayout({ children }: { children: React.ReactNode }) {
  return children;
}
