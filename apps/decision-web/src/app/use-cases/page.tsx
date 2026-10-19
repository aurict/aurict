"use client";

import { useLocale } from "next-intl";
import { Link } from "@/i18n/navigation";
import { Footer } from "@/components/Footer";
import { USE_CASES } from "@/content/use-cases";

export default function UseCasesPage() {
  const locale = useLocale();
  const tr = locale === "tr";

  return (
    <>
      <main>
        <div className="inner-main-wide">
          {/* Header */}
          <div className="page-intro">
            <div className="page-intro-eyebrow">
              {tr ? "kullanım senaryoları" : "use cases"}
            </div>
            <div>
              <h1 className="page-h1">
                {tr ? "Karar Motorunun parladığı senaryolar." : "Where the Decision Engine shines."}
              </h1>
              <p className="page-lead">
                {tr
                  ? "Cihaz üstü kararların ve 10ms altı çıkarımın doğrudan dönüşüm artışı sağladığı gerçek dünya e-ticaret senaryoları."
                  : "Real-world production scenarios where sub-10ms on-device decisioning directly drives conversion uplift."}
              </p>
            </div>
          </div>

          {/* Grid */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(340px, 1fr))",
              gap: 1,
              background: "var(--border)",
              border: "1px solid var(--border)",
              marginBottom: 96,
            }}
          >
            {USE_CASES.map((uc) => {
              const IconComponent = uc.icon;
              return (
                <div key={uc.slug} className="content-card" style={{ display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
                  <div>
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
                      <span style={{ color: uc.color, font: "600 11px var(--font-mono)", letterSpacing: "0.06em" }}>
                        {uc.eyebrow}
                      </span>
                      <span
                        style={{
                          background: `color-mix(in oklch, ${uc.color} 12%, transparent)`,
                          border: `1px solid color-mix(in oklch, ${uc.color} 30%, transparent)`,
                          color: uc.color,
                          font: "600 10px var(--font-mono)",
                          padding: "3px 8px",
                          borderRadius: 3,
                        }}
                      >
                        {tr ? uc.metric_tr : uc.metric_en}
                      </span>
                    </div>

                    <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 12 }}>
                      <div
                        style={{
                          width: 34,
                          height: 34,
                          borderRadius: 6,
                          background: `color-mix(in oklch, ${uc.color} 14%, transparent)`,
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          color: uc.color,
                        }}
                      >
                        <IconComponent size={18} />
                      </div>
                      <div className="content-card-title" style={{ marginBottom: 0 }}>
                        {tr ? uc.title_tr : uc.title_en}
                      </div>
                    </div>

                    <p className="content-card-body" style={{ marginTop: 8 }}>
                      {tr ? uc.desc_tr : uc.desc_en}
                    </p>
                  </div>

                  <div style={{ marginTop: 24, paddingTop: 16, borderTop: "1px solid var(--border)" }}>
                    <Link
                      href={`/use-cases/${uc.slug}`}
                      style={{
                        color: uc.color,
                        font: "600 11px var(--font-mono)",
                        textDecoration: "none",
                        letterSpacing: "0.05em",
                        textTransform: "uppercase",
                        display: "inline-flex",
                        alignItems: "center",
                        gap: 6,
                      }}
                    >
                      {tr ? "Senaryoyu İncele →" : "Explore Use Case →"}
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Quick Implementation Example */}
          <div
            style={{
              background: "color-mix(in oklch, var(--bg-card) 85%, var(--bg))",
              border: "1px solid var(--border)",
              padding: "40px 32px",
              marginBottom: 80,
            }}
          >
            <div style={{ color: "var(--accent)", font: "600 11px var(--font-mono)", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 8 }}>
              {tr ? "KOD ÖRNEĞİ" : "CODE EXAMPLE"}
            </div>
            <h3 style={{ color: "var(--text)", font: "600 24px var(--font-serif)", marginBottom: 12 }}>
              {tr ? "Tüm senaryolar tek bir SDK fonksiyonuyla tetiklenir." : "Every use case is triggered with one uniform SDK function."}
            </h3>
            <p style={{ color: "var(--text-dim)", font: "15px var(--font-serif)", maxWidth: 720, marginBottom: 20 }}>
              {tr
                ? "Aurict Decision SDK'sı oturum içi sinyalleri yerel olarak toplar ve tek bir evaluation çağrısında en uygun kararı döndürür."
                : "The Aurict Decision SDK computes local signal vectors and resolves the optimal decision in a single async evaluation."}
            </p>
            <pre
              style={{
                background: "var(--bg-deep)",
                border: "1px solid var(--border)",
                padding: "16px 20px",
                borderRadius: 4,
                color: "var(--text)",
                font: "12px / 1.6 var(--font-mono)",
                overflowX: "auto",
              }}
            >
              {`// One evaluation call handles scoring, decisioning, and handoff
const decision = await microtarget.evaluate({
  useCase: 'cart-abandonment',
  userIntentThreshold: 0.75
});`}
            </pre>
          </div>
        </div>

        {/* Final CTA */}
        <section className="section-final">
          <p>{tr ? "karar zekası" : "decision intelligence"}</p>
          <h2>{tr ? "Kendi kullanım senaryonuzu inşa edin." : "Build your own custom use case."}</h2>
          <div>
            <a href="https://console.aurict.com" className="aur-button aur-button-primary">
              {tr ? "Ücretsiz Başla" : "Get Started Free"}
            </a>
            <a href="/docs" className="aur-button aur-button-secondary">
              {tr ? "Dokümantasyon" : "Documentation"}
            </a>
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
