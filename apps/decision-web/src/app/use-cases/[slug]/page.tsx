"use client";

import { use } from "react";
import { useLocale } from "next-intl";
import { Link } from "@/i18n/navigation";
import { Footer } from "@/components/Footer";
import { ArrowLeft, Zap } from "lucide-react";
import { USE_CASES } from "@/content/use-cases";

export default function UseCaseDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = use(params);
  const locale = useLocale();
  const tr = locale === "tr";

  const uc = USE_CASES.find((item) => item.slug === slug) || {
    slug,
    eyebrow: "01",
    icon: Zap,
    title_en: slug.split("-").map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(" "),
    title_tr: slug.split("-").map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(" "),
    desc_en: "On-device decision evaluation for targeted e-commerce optimization in real time.",
    desc_tr: "Gerçek zamanlı e-ticaret optimizasyonu için cihaz üstünde karar değerlendirmesi.",
    metric_en: "+20% Conversion Uplift",
    metric_tr: "+%20 Dönüşüm Artışı",
    color: "var(--accent)",
  };

  return (
    <>
      <main>
        <div className="inner-main-narrow">
          {/* Back link */}
          <Link
            href="/use-cases"
            style={{
              fontFamily: "var(--font-mono)",
              fontSize: 12,
              color: uc.color,
              textDecoration: "none",
              display: "inline-flex",
              alignItems: "center",
              gap: 6,
              marginBottom: 32,
            }}
          >
            <ArrowLeft size={14} />
            {tr ? "Tüm Senaryolara Dön" : "Back to All Use Cases"}
          </Link>

          {/* Header */}
          <div style={{ marginBottom: 36 }}>
            <div style={{ display: "flex", gap: 10, alignItems: "center", marginBottom: 16 }}>
              <span className="tag" style={{ background: `color-mix(in oklch, ${uc.color} 15%, transparent)`, color: uc.color }}>
                {tr ? "Kullanım Senaryosu" : "Use Case Detail"}
              </span>
              <span style={{ color: "var(--text-muted)", font: "11px var(--font-mono)" }}>
                {uc.eyebrow}
              </span>
            </div>

            <h1
              style={{
                fontFamily: "var(--font-serif), 'Source Serif 4', Georgia, serif",
                fontSize: "clamp(32px, 5vw, 52px)",
                fontWeight: 600,
                color: "var(--text)",
                lineHeight: 1.08,
                marginBottom: 20,
                letterSpacing: "-0.03em",
              }}
            >
              {tr ? uc.title_tr : uc.title_en}
            </h1>

            <p
              style={{
                fontFamily: "var(--font-serif), 'Source Serif 4', Georgia, serif",
                fontSize: 19,
                lineHeight: 1.6,
                color: "var(--text-dim)",
                borderLeft: `2px solid ${uc.color}`,
                paddingLeft: 20,
              }}
            >
              {tr ? uc.desc_tr : uc.desc_en}
            </p>
          </div>

          {/* Solution Breakdown */}
          <div
            className="inner-copy"
            style={{
              borderTop: "1px solid var(--border)",
              paddingTop: 36,
              display: "grid",
              gap: 28,
            }}
          >
            <h2>{tr ? "1. Problem ve Çıkmaz" : "1. The Challenge"}</h2>
            <p>
              {tr
                ? "Geleneksel pazarlama platformları, kullanıcının niyet sinyallerini sunucuya gönderip yanıt beklerken değerli saniyeler kaybeder. Kullanıcı sekmeden ayrıldığında veya sekmeden çıkış niyetinde bulunduğunda sunucu kararları çok geç ulaşır."
                : "Traditional marketing solutions depend on central server API latency. By the time a user triggers an intent signal and a server computes a rule response, the user has already left or navigated away."}
            </p>

            <h2>{tr ? "2. Cihaz Üstü ML Çözümü" : "2. The On-Device Solution"}</h2>
            <p>
              {tr
                ? "Aurict Decision SDK'sı, tarayıcıda veya mobil uygulamada çalışan hafif makine öğrenmesi modellerini kullanır. Fare hareketi, kaydırma ivmesi ve oturum süresi anlık olarak puanlanır. Gecikme 10ms altındadır."
                : "The Aurict Decision Engine runs lightweight ML scoring locally on the user device. Mouse vectors, scroll speed, and time-on-page are evaluated continuously in under 10ms."}
            </p>

            {/* Implementation Code Box */}
            <div style={{ marginTop: 12, marginBottom: 12 }}>
              <div style={{ color: "var(--accent)", font: "600 11px var(--font-mono)", marginBottom: 8, textTransform: "uppercase" }}>
                {tr ? "ENTEGRASYON KODU:" : "IMPLEMENTATION SNIPPET:"}
              </div>
              <pre
                style={{
                  background: "var(--bg-deep)",
                  border: "1px solid var(--border)",
                  padding: "20px 24px",
                  borderRadius: 4,
                  color: "var(--text)",
                  font: "12px / 1.65 var(--font-mono)",
                  overflowX: "auto",
                }}
              >
                {`import { MicroTarget } from '@aurict/sdk';

const mt = new MicroTarget({ projectId: 'YOUR_PROJECT_ID' });

// Listen for intent threshold & trigger decision locally
mt.onIntentDetected({
  scenario: '${uc.slug}',
  threshold: 0.82,
  onMatch: (decision) => {
    // Deliver action in <10ms without network call
    console.log('Executing action:', decision.action);
  }
});`}
              </pre>
            </div>

            <h2>{tr ? "3. Beklenen Etki ve Metrikler" : "3. Expected Impact"}</h2>
            <p>
              {tr
                ? "Sunucu gecikmesi ortadan kalktığı için müdahale anında gerçekleşir. Dönüşüm oranlarında %12 ile %32 arasında net artış sağlanır. Ayrıca veri cihaz dışına çıkmadığı için KVKK ve GDPR uyumu %100 otomatik korunur."
                : "Eliminating network latency enables instant action delivery. E-commerce partners experience a 12% to 32% conversion uplift alongside automated zero-data-leakage compliance."}
            </p>
          </div>

          {/* Action Bar */}
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
              href="/use-cases"
              className="aur-button aur-button-secondary"
              style={{ fontSize: 12 }}
            >
              ← {tr ? "Tüm Senaryolar" : "All Use Cases"}
            </Link>
            <a
              href="https://console.aurict.com"
              className="aur-button aur-button-primary"
              style={{ fontSize: 12 }}
            >
              {tr ? "Bu Senaryoyu Kur" : "Deploy This Use Case"}
            </a>
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
