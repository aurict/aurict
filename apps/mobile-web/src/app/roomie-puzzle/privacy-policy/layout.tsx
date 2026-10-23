import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Roomie Puzzle Privacy Policy",
  description:
    "Privacy policy for the Roomie Puzzle game (com.aurict.roomiepuzzle) on Google Play, published by developer Aurict.",
  alternates: { canonical: "/roomie-puzzle/privacy-policy" },
};

export default function RoomiePuzzlePrivacyPolicyLayout({ children }: { children: React.ReactNode }) {
  return children;
}
