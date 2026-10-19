import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Delete your Mind Grid account",
  description: "Permanently delete your Mind Grid account and game data.",
  alternates: { canonical: "/mindgrid/delete-account" },
  robots: { index: false, follow: true },
};

export default function MindgridDeleteAccountLayout({ children }: { children: React.ReactNode }) {
  return children;
}
