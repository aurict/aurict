"use client";

import { TightPeriods } from "@/components/ui/TightPeriods";
import { useLocale } from "next-intl";
import { Link } from "@/i18n/navigation";
import { Footer } from "@/components/Footer";
import { Server, Cpu } from "lucide-react";
import { COMPARISONS } from "@/content/comparisons";

const MATRIX = [
  { feature_en: "Inference Location", feature_tr: "Çıkarım Konumu", mt: "On-Device", others: "Cloud Server" },
  { feature_en: "Decision Latency", feature_tr: "Karar Gecikmesi", mt: "<10ms", others: "150–500ms" },
  { feature_en: "Raw Data Export", feature_tr: "Ham Veri Aktarımı", mt: "Zero (0 KB)", others: "Full Telemetry" },
  { feature_en: "KVKK & GDPR Liability", feature_tr: "KVKK & GDPR Sorumluluğu", mt: "Auto-Compliant", others: "High Risk" },
  { feature_en: "Federated Learning", feature_tr: "Federe Öğrenme", mt: "Native Support", others: "Not Available" },
  { feature_en: "SHAP Explainability", feature_tr: "SHAP Açıklanabilirlik", mt: "Full Vector Log", others: "Black Box Rules" },
  { feature_en: "Offline Execution", feature_tr: "Çevrimdışı Çalışma", mt: "Full Support", others: "Fails Without Network" },
] as const;

export default function ComparePage() {
  const locale = useLocale();
  const tr = locale === "tr";

  return (
    <>
      <main>
        <div className="inner-main-wide">
          {/* Header */}
          <div className="page-intro">
            <div className="page-intro-eyebrow">
              {tr ? "karşılaştır" : "compare alternatives"}
            </div>
            <div>
              <h1 className="page-h1">
                <TightPeriods text={tr ? "Aurict Decision ve alternatifler." : "Aurict Decision vs the alternatives."} />
              </h1>
              <p className="page-lead">
                {tr
                  ? "Cihaz üstü Karar Motorunun geleneksel sunucu taraflı pazarlama otomasyon platformlarıyla mimari karşılaştırması."
                  : "How our on-device Decision Engine compares to traditional server-side marketing automation platforms."}
              </p>
            </div>
          </div>

          {/* Matrix Table */}
          <div style={{ marginBottom: 80 }}>
            <p
              style={{
                color: "var(--accent)",
                font: "700 12.5px var(--font-sans)",
                letterSpacing: "0.1em",
                textTransform: "uppercase",
                marginBottom: 20,
              }}
            >
              {tr ? "01 / mimari karşılaştırma matrisi" : "01 / architectural matrix"}
            </p>
            <div style={{ overflowX: "auto", border: "1px solid var(--border)" }}>
              <table style={{ width: "100%", borderCollapse: "collapse" }}>
                <thead>
                  <tr>
                    <th
                      style={{
                        padding: "16px 20px",
                        textAlign: "left",
                        background: "var(--bg-card)",
                        borderBottom: "1px solid var(--border)",
                        color: "var(--text-muted)",
                        font: "700 12.5px var(--font-sans)",
                        textTransform: "uppercase",
                        letterSpacing: "0.06em",
                        width: "40%",
                      }}
                    >
                      {tr ? "Özellik / Parametre" : "Feature / Criterion"}
                    </th>
                    <th
                      style={{
                        padding: "16px 20px",
                        textAlign: "left",
                        background: "color-mix(in srgb, var(--accent) 10%, var(--bg-card))",
                        borderBottom: "1px solid var(--border)",
                        borderLeft: "1px solid var(--border)",
                        color: "var(--accent)",
                        font: "700 12.5px var(--font-sans)",
                        textTransform: "uppercase",
                        letterSpacing: "0.06em",
                        width: "30%",
                      }}
                    >
                      Aurict Decision
                    </th>
                    <th
                      style={{
                        padding: "16px 20px",
                        textAlign: "left",
                        background: "var(--bg-card)",
                        borderBottom: "1px solid var(--border)",
                        borderLeft: "1px solid var(--border)",
                        color: "var(--text-muted)",
                        font: "700 12.5px var(--font-sans)",
                        textTransform: "uppercase",
                        letterSpacing: "0.06em",
                        width: "30%",
                      }}
                    >
                      {tr ? "Geleneksel Platformlar" : "Traditional Cloud SaaS"}
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {MATRIX.map((row, idx) => (
                    <tr
                      key={idx}
                      style={{
                        background:
                          idx % 2 === 0
                            ? "color-mix(in srgb, var(--bg-card) 60%, var(--bg))"
                            : "var(--bg)",
                      }}
                    >
                      <td
                        style={{
                          padding: "14px 20px",
                          borderBottom: "1px solid var(--border)",
                          color: "var(--text)",
                          font: "500 13px var(--font-mono)",
                        }}
                      >
                        {tr ? row.feature_tr : row.feature_en}
                      </td>
                      <td
                        style={{
                          padding: "14px 20px",
                          borderBottom: "1px solid var(--border)",
                          borderLeft: "1px solid var(--border)",
                          color: "var(--accent)",
                          font: "600 13px var(--font-mono)",
                          background: "color-mix(in srgb, var(--accent) 4%, transparent)",
                        }}
                      >
                        {row.mt}
                      </td>
                      <td
                        style={{
                          padding: "14px 20px",
                          borderBottom: "1px solid var(--border)",
                          borderLeft: "1px solid var(--border)",
                          color: "var(--text-muted)",
                          font: "13px var(--font-mono)",
                        }}
                      >
                        {row.others}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Deep Dives Cards */}
          <div style={{ marginBottom: 96 }}>
            <p
              style={{
                color: "var(--accent)",
                font: "700 12.5px var(--font-sans)",
                letterSpacing: "0.1em",
                textTransform: "uppercase",
                marginBottom: 20,
              }}
            >
              {tr ? "02 / detaylı karşılaştırma raporları" : "02 / detailed comparison guides"}
            </p>
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))",
                gap: 1,
                background: "var(--border)",
                border: "1px solid var(--border)",
              }}
            >
              {COMPARISONS.map((c) => (
                <div key={c.slug} className="content-card" style={{ display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
                  <div>
                    <div className="content-card-title">{c.title}</div>
                    <p className="content-card-body" style={{ marginTop: 8 }}>
                      {tr ? c.desc_tr : c.desc_en}
                    </p>
                  </div>
                  <div style={{ marginTop: 24, paddingTop: 16, borderTop: "1px solid var(--border)" }}>
                    <Link
                      href={`/compare/${c.slug}`}
                      style={{
                        color: "var(--accent)",
                        font: "700 12.5px var(--font-sans)",
                        textDecoration: "none",
                        letterSpacing: "0.05em",
                        textTransform: "uppercase",
                      }}
                    >
                      {tr ? "Karşılaştırmayı Oku →" : "Read Comparison →"}
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Architecture Comparison Banner */}
          <div
            style={{
              background: "color-mix(in srgb, var(--bg-card) 85%, var(--bg))",
              border: "1px solid var(--border)",
              padding: "40px 36px",
              display: "grid",
              gridTemplateColumns: "1fr 1fr",
              gap: 32,
              marginBottom: 80,
            }}
          >
            <div>
              <div style={{ display: "flex", alignItems: "center", gap: 8, color: "var(--accent)", marginBottom: 12 }}>
                <Cpu size={20} />
                <span style={{ font: "700 12.5px var(--font-sans)", textTransform: "uppercase", letterSpacing: "0.06em" }}>
                  Aurict Decision (On-Device)
                </span>
              </div>
              <p style={{ color: "var(--text)", font: "15px / 1.6 var(--font-sans)" }}>
                {tr
                  ? "Kullanıcı cihazında 10ms altında bağımsız çıkarım. Ağ gecikmesi yok, sunucu bağımlılığı yok, veri sızıntısı yok."
                  : "Standalone inference computed on-device in under 10ms. No network lag, no server dependency, no privacy leaks."}
              </p>
            </div>

            <div style={{ borderLeft: "1px solid var(--border)", paddingLeft: 32 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8, color: "var(--text-muted)", marginBottom: 12 }}>
                <Server size={20} />
                <span style={{ font: "700 12.5px var(--font-sans)", textTransform: "uppercase", letterSpacing: "0.06em" }}>
                  Geleneksel Cloud SaaS
                </span>
              </div>
              <p style={{ color: "var(--text-muted)", font: "15px / 1.6 var(--font-sans)" }}>
                {tr
                  ? "Bulut sunucularına 150-500ms ağ çağrıları. Yüksek gecikme, KVKK/GDPR riskleri ve kilitli kapalı kod yapısı."
                  : "Requires 150-500ms network roundtrips to central cloud. Higher latency, compliance risk, and closed proprietary lock-in."}
              </p>
            </div>
          </div>
        </div>

        {/* Final CTA */}
        <section className="section-final">
          <p>{tr ? "mimari üstünlük" : "architectural superiority"}</p>
          <h2>{tr ? "Daha hızlı ve daha güvenli kararlara geçin." : "Switch to faster, safer on-device decisions."}</h2>
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
