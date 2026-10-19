import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Delete your Jelly Paradox account",
  description: "Permanently delete your Jelly Paradox account and game data.",
  alternates: { canonical: "/jelly-paradox/delete-account" },
};

export default function JellyParadoxDeleteAccountLayout({ children }: { children: React.ReactNode }) {
  return children;
}
