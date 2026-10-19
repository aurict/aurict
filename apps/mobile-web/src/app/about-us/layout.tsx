import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "About Us",
  description: "Meet the team behind Aurict Mobile, the mobile app studio of Aurict.",
  alternates: { canonical: "/about-us" },
};

export default function AboutUsLayout({ children }: { children: React.ReactNode }) {
  return children;
}
