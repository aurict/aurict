import type { Metadata } from "next";
import { AurictLanding } from "@/components/landing/AurictLanding";

export const metadata: Metadata = {
  alternates: { canonical: "/" },
};

export default function HomePage() {
  return <AurictLanding />;
}
