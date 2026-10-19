"use client";

import { use } from "react";
import { useLocale } from "next-intl";
import { Link } from "@/i18n/navigation";
import { Footer } from "@/components/Footer";
import { ArrowLeft, Check, X } from "lucide-react";
import { COMPARISONS } from "@/content/comparisons";

export default function CompareDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = use(params);
  const locale = useLocale();
  const tr = locale === "tr";

  const match = COMPARISONS.find((c) => c.slug === slug) || {
    slug,
    title: slug.split("-").map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(" "),
    desc_en: "Comprehensive comparison of on-device ML execution versus server-side decisioning.",
    desc_tr: "Cihaz üstü ML çalıştırılması ile sunucu taraflı karar mekanizmasının detaylı karşılaştırılması.",
  };

  return (
    <>
      <main>
        <div className="inner-main-narrow">
          {/* Back link */}
          <Link
            href="/compare"
            style={{
              fontFamily: "var(--font-mono)",
              fontSize: 12,
              color: "var(--accent)",
              textDecoration: "none",
              display: "inline-flex",
              alignItems: "center",
              gap: 6,
              marginBottom: 32,
            }}
          >
            <ArrowLeft size={14} />
            {tr ? "Tüm Karşılaştırmalara Dön" : "Back to All Comparisons"}
          </Link>

          {/* Header */}
          <div style={{ marginBottom: 36 }}>
            <span className="tag" style={{ marginBottom: 16 }}>
              {tr ? "Karşılaştırma Analizi" : "Comparison Deep Dive"}
            </span>

            <h1
              style={{
                fontFamily: "var(--font-serif), 'Source Serif 4', Georgia, serif",
                fontSize: "clamp(30px, 5vw, 48px)",
                fontWeight: 600,
                color: "var(--text)",
                lineHeight: 1.1,
                marginBottom: 16,
                letterSpacing: "-0.03em",
              }}
            >
              {match.title}
            </h1>

            <p style={{ color: "var(--text-dim)", font: "18px / 1.6 var(--font-serif)" }}>
              {tr ? match.desc_tr : match.desc_en}
            </p>
          </div>

          {/* Side by Side Box */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr",
              gap: 16,
              marginBottom: 40,
            }}
          >
            <div
              className="content-card"
              style={{
                borderColor: "var(--accent)",
                background: "color-mix(in oklch, var(--accent) 6%, var(--bg-card))",
              }}
            >
              <div style={{ color: "var(--accent)", font: "600 14px var(--font-mono)", marginBottom: 12 }}>
                Aurict Decision Engine
              </div>
              <ul style={{ listStyle: "none", padding: 0, margin: 0, display: "grid", gap: 8, font: "12px var(--font-mono)", color: "var(--text)" }}>
                <li style={{ display: "flex", gap: 6, alignItems: "center" }}><Check size={14} style={{ color: "var(--success)" }} /> On-device ML inference</li>
                <li style={{ display: "flex", gap: 6, alignItems: "center" }}><Check size={14} style={{ color: "var(--success)" }} /> Sub-10ms decision latency</li>
                <li style={{ display: "flex", gap: 6, alignItems: "center" }}><Check size={14} style={{ color: "var(--success)" }} /> Zero raw data leaves device</li>
                <li style={{ display: "flex", gap: 6, alignItems: "center" }}><Check size={14} style={{ color: "var(--success)" }} /> Explainable, Auditable Decisions</li>
                <li style={{ display: "flex", gap: 6, alignItems: "center" }}><Check size={14} style={{ color: "var(--success)" }} /> Federated learning support</li>
              </ul>
            </div>

            <div className="content-card">
              <div style={{ color: "var(--text-muted)", font: "600 14px var(--font-mono)", marginBottom: 12 }}>
                Traditional Alternative
              </div>
              <ul style={{ listStyle: "none", padding: 0, margin: 0, display: "grid", gap: 8, font: "12px var(--font-mono)", color: "var(--text-dim)" }}>
                <li style={{ display: "flex", gap: 6, alignItems: "center" }}><X size={14} style={{ color: "var(--error)" }} /> Server-side API rules</li>
                <li style={{ display: "flex", gap: 6, alignItems: "center" }}><X size={14} style={{ color: "var(--error)" }} /> 150-500ms network lag</li>
                <li style={{ display: "flex", gap: 6, alignItems: "center" }}><X size={14} style={{ color: "var(--error)" }} /> Centralized data export</li>
                <li style={{ display: "flex", gap: 6, alignItems: "center" }}><X size={14} style={{ color: "var(--error)" }} /> Proprietary lock-in</li>
                <li style={{ display: "flex", gap: 6, alignItems: "center" }}><X size={14} style={{ color: "var(--error)" }} /> No federated learning</li>
              </ul>
            </div>
          </div>

          {/* Deep Analysis Text */}
          <div
            className="inner-copy"
            style={{
              borderTop: "1px solid var(--border)",
              paddingTop: 36,
              display: "grid",
              gap: 24,
            }}
          >
            <h2>{tr ? "1. Mimari Farklılık" : "1. Architectural Difference"}</h2>
            <p>
              {tr
                ? "En temel fark mimari yaklaşımdır: Aurict Decision kararlarını kullanıcının cihazında alırken, geleneksel platformlar sunucu tur-dönüşü gerektirir. Bu durum ağ gecikmesini ortadan kaldırır, veri güvenliğini sağlar ve bir sonraki kare çizilmeden önce kararların yürütülmesine olanak tanır."
                : "The core difference is architectural: Aurict Decision resolves evaluations on-device, whereas alternative platforms require network requests to remote servers. This eliminates roundtrip latency and avoids privacy liability."}
            </p>

            <h2>{tr ? "2. Performans ve Gecikme" : "2. Performance & Latency"}</h2>
            <p>
              {tr
                ? "Geleneksel bulut servislerinde ortalama yanıt süresi 150ms-500ms arasındadır. Aurict Decision SDK'sı ise 10ms altında bağımsız çıkarım sunar. Kullanıcı sepeti terk etme niyetinde bulunduğunda milisaniyeler hayati önem taşır."
                : "Cloud SaaS alternatives exhibit average latencies between 150ms and 500ms. Aurict Decision evaluates predictions in under 10ms directly inside client RAM."}
            </p>

            <h2>{tr ? "3. Yasal Uyum ve KVKK / GDPR" : "3. Compliance & Legal Exposure"}</h2>
            <p>
              {tr
                ? "Geleneksel servisler ham tıklama ve oturum verilerini kendi veri ambarlarına toplar. Aurict Decision'da ham veri cihazdan çıkmadığı için KVKK, GDPR ve CCPA veri aktarım riskleri tamamen sıfırlanır."
                : "By processing telemetry strictly on-device, Aurict Decision eliminates cross-border data transfer liabilities under GDPR and KVKK automatically."}
            </p>
          </div>

          {/* Action Footer */}
          <div
            style={{
              marginTop: 48,
              paddingTop: 24,
              borderTop: "1px solid var(--border)",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
            }}
          >
            <Link
              href="/compare"
              className="aur-button aur-button-secondary"
              style={{ fontSize: 12 }}
            >
              ← {tr ? "Tüm Karşılaştırmalar" : "All Comparisons"}
            </Link>
            <a
              href="https://console.aurict.com"
              className="aur-button aur-button-primary"
              style={{ fontSize: 12 }}
            >
              {tr ? "Aurict Decision'a Geç" : "Switch to Aurict Decision"}
            </a>
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
