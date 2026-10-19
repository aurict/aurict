"use client";

import { TightPeriods } from "@/components/ui/TightPeriods";
import { useLocale } from "next-intl";
import { Link } from "@/i18n/navigation";
import { Footer } from "@/components/Footer";
import { DOC_PAGES } from "./v1/docs-content";

export default function DocsPage() {
  const tr = useLocale() === "tr";
  return (
    <>
      <main className="inner-main-wide">
        <div className="page-intro">
          <div className="page-intro-eyebrow">docs · v1</div>
          <h1 className="page-h1"><TightPeriods text={tr ? "Ürünü gerçekten çalıştıran dokümantasyon." : "Documentation that matches the shipped product."} /></h1>
          <p className="page-lead">{tr ? "SaaS quickstart, tüm SDK’lar, API, connector ve self-host operasyonları sürümlü olarak burada." : "Versioned SaaS quickstarts, SDKs, APIs, connectors and self-host operations."}</p>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(260px,1fr))", gap: 14, marginBottom: 64 }}>
          {DOC_PAGES.map((page, index) => (
            <Link key={page.slug} href={`/docs/v1/${page.slug}`} style={{ textDecoration: "none", border: "1px solid var(--border)", background: "var(--bg-card)", padding: 24, borderRadius: 22, boxShadow: "var(--shadow-soft)" }}>
              <span style={{ color: "var(--accent)", fontSize: 12.5, fontWeight: 700, letterSpacing: "0.06em", textTransform: "uppercase" }}>{String(index + 1).padStart(2, "0")} · {page.group}</span>
              <h2 style={{ color: "var(--text)", margin: "10px 0 6px", fontSize: 21, fontWeight: 800, letterSpacing: "-0.02em" }}>{page.title}</h2>
              <p style={{ color: "var(--text-dim)", fontSize: 14 }}>{page.summary}</p>
            </Link>
          ))}
        </div>
      </main>
      <Footer />
    </>
  );
}
