import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Security",
  description: "How Aurict Mobile protects your account, session tokens, API keys and remote sessions.",
  alternates: { canonical: "/security" },
};

export default function SecurityLayout({ children }: { children: React.ReactNode }) {
  return children;
}
