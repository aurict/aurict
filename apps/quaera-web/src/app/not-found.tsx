import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Page not found",
  robots: { index: false, follow: true },
};

export default function NotFound() {
  return (
    <section className="wrap" style={{ padding: "180px 0 80px", textAlign: "center" }}>
      <p className="eyebrow">404</p>
      <h1 style={{ marginTop: 16, fontSize: "clamp(40px, 7vw, 80px)" }}>This page did not verify.</h1>
      <p className="section-lead" style={{ marginInline: "auto" }}>The address does not exist, or it moved.</p>
      <Link href="/" className="btn btn-violet" style={{ marginTop: 32 }}>Back to the start</Link>
    </section>
  );
}
