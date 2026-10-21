import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Delete your Dungeon Lord: Rise of the Boss account",
  description: "Permanently delete your Dungeon Lord: Rise of the Boss account and game data.",
  alternates: { canonical: "/dungeon-lord/delete-account" },
};

export default function DungeonLordDeleteAccountLayout({ children }: { children: React.ReactNode }) {
  return children;
}
