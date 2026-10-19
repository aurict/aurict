import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Install",
  description: "How to bring the Aurict Mobile AI app to your Android or iOS phone.",
  alternates: { canonical: "/install" },
};

export default function InstallLayout({ children }: { children: React.ReactNode }) {
  return children;
}
