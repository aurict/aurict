import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Capabilities",
  description: "What the Aurict Mobile AI app can do: AI chat, desktop CLI remote control, documents, bring-your-own-key and more.",
  alternates: { canonical: "/capabilities" },
};

export default function CapabilitiesLayout({ children }: { children: React.ReactNode }) {
  return children;
}
