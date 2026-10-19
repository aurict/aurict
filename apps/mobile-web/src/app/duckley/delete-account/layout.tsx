import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Delete your Duckley account",
  description: "Permanently delete your Duckley account and learning data.",
  alternates: { canonical: "/duckley/delete-account" },
};

export default function DuckleyDeleteAccountLayout({ children }: { children: React.ReactNode }) {
  return children;
}
