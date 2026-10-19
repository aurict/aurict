"use client";

import { useLocale } from "next-intl";
import { Footer } from "@/components/Footer";
import { Lightbulb } from "lucide-react";

const PHASES_EN = [
  {
    status: "released",
    quarter: "Q1 2026",
    title: "Phase 1 — Core Decision Engine",
    desc: "On-device scoring runtime, decision evaluation, first-party signal capture, and core integrations for Web, Android, iOS, and React Native.",
    progress: "100%",
    items: [
      { name: "Scoring Engine SDK", done: true },
      { name: "Segmentation Pipeline", done: true },
      { name: "Sub-10ms Runtime", done: true },
      { name: "Braze Provider Handoff", done: true },
      { name: "Insider Provider Handoff", done: true },
      { name: "Android TFLite Runtime", done: true },
      { name: "iOS CoreML Runtime", done: true },
      { name: "WebAssembly Scoring", done: true },
      { name: "React Native SDK", done: true },
    ],
  },
  {
    status: "beta",
    quarter: "Q2 2026",
    title: "Phase 2 — Intelligence & Explainability",
    title_tr: "Aşama 2 — Zeka ve Açıklanabilirlik",
    desc: "Federated learning pipeline, SHAP-based decision attribution, and custom model ensemble evaluation.",
    progress: "85%",
    items: [
      { name: "Federated Learning Beta", done: true },
      { name: "SHAP Explainability Vectors", done: true },
      { name: "Decision Logs API", done: true },
      { name: "Bayesian A/B Testing Framework", done: true },
      { name: "Custom Model Fine-tuning", done: false },
      { name: "Multi-Model Ensembles", done: false },
    ],
  },
  {
    status: "in-progress",
    quarter: "Q3 2026",
    title: "Phase 3 — Ecosystem & Enterprise Scale",
    desc: "Provider marketplace, multi-region cloud dashboard, SOC 2 Type II certification, and on-premise enterprise deployments.",
    progress: "45%",
    items: [
      { name: "Provider Integration Marketplace", done: false },
      { name: "SOC 2 Type II Certification", done: true },
      { name: "On-Premise Helm Charts", done: false },
      { name: "Audit Trail & Compliance Export", done: false },
      { name: "Custom Handoff Webhooks", done: true },
      { name: "Multi-Region Cloud Aggregation", done: false },
    ],
  },
  {
    status: "planned",
    quarter: "Q4 2026",
    title: "Phase 4 — Autonomous Edge Optimization",
    desc: "Self-tuning on-device models, predictive budget allocation, and automated cross-campaign attribution.",
    progress: "15%",
    items: [
      { name: "Autonomous Model Auto-Tuning", done: false },
      { name: "Predictive Budget Allocation", done: false },
      { name: "Cross-Campaign Attribution", done: false },
      { name: "Real-Time Anomaly Detection", done: false },
      { name: "Offline Edge Cache Sync", done: false },
    ],
  },
] as const;

const PHASES_TR = [
  {
    status: "released",
    quarter: "Q1 2026",
    title: "Aşama 1 — Temel Karar Motoru",
    desc: "Cihaz üstü puanlama çalışma zamanı, karar değerlendirmesi, 1. taraf sinyal yakalama ve Web, Android, iOS, React Native entegrasyonları.",
    progress: "%100",
    items: [
      { name: "Puanlama Motoru SDK'sı", done: true },
      { name: "Segmentasyon Hattı", done: true },
      { name: "10ms Altı Çalışma Zamanı", done: true },
      { name: "Braze Sağlayıcı Devri", done: true },
      { name: "Insider Sağlayıcı Devri", done: true },
      { name: "Android TFLite Çalışma Zamanı", done: true },
      { name: "iOS CoreML Çalışma Zamanı", done: true },
      { name: "WebAssembly Puanlama", done: true },
      { name: "React Native SDK'sı", done: true },
    ],
  },
  {
    status: "beta",
    quarter: "Q2 2026",
    title: "Aşama 2 — Zeka ve Açıklanabilirlik",
    desc: "Federe öğrenme boru hattı, SHAP tabanlı karar attribution logları ve özel model topluluk kararları.",
    progress: "%85",
    items: [
      { name: "Federe Öğrenme Beta", done: true },
      { name: "SHAP Açıklanabilirlik Vektörleri", done: true },
      { name: "Karar Logları API'si", done: true },
      { name: "Bayes A/B Test Çerçevesi", done: true },
      { name: "Özel Model İnce Ayarı", done: false },
      { name: "Çoklu Model Toplulukları", done: false },
    ],
  },
  {
    status: "in-progress",
    quarter: "Q3 2026",
    title: "Aşama 3 — Ekosistem ve Kurumsal Ölçek",
    desc: "Sağlayıcı pazaryeri, çok bölgeli bulut panosu, SOC 2 Type II sertifikasyonu ve on-premise kurumsal kurulum seçeneği.",
    progress: "%45",
    items: [
      { name: "Sağlayıcı Entegrasyon Pazaryeri", done: false },
      { name: "SOC 2 Type II Sertifikasyonu", done: true },
      { name: "On-Premise Helm Paketleri", done: false },
      { name: "Denetim İzi ve Uyumluluk Dışa Aktarımı", done: false },
      { name: "Özel Devir Webhook'ları", done: true },
      { name: "Çok Bölgeli Bulut Toplaması", done: false },
    ],
  },
  {
    status: "planned",
    quarter: "Q4 2026",
    title: "Aşama 4 — Otonom Uç Optimizasyonu",
    desc: "Kendi kendini ayarlayan cihaz üstü modeller, tahminsel bütçe tahsisi ve otomatik kampanyalar arası attribution.",
    progress: "%15",
    items: [
      { name: "Otonom Model Otomatik Ayarı", done: false },
      { name: "Tahminsel Bütçe Tahsisi", done: false },
      { name: "Kampanyalar Arası Attribution", done: false },
      { name: "Gerçek Zamanlı Anomali Tespiti", done: false },
      { name: "Çevrimdışı Uç Önbellek Eşitleme", done: false },
    ],
  },
] as const;

const STATUS_MAP: Record<string, { label_en: string; label_tr: string; cls: string }> = {
  released:    { label_en: "Released",    label_tr: "Yayınlandı",  cls: "status-pill status-pill-success" },
  beta:        { label_en: "Beta",        label_tr: "Beta",        cls: "status-pill status-pill-info" },
  "in-progress": { label_en: "In Progress", label_tr: "Devam Ediyor", cls: "status-pill status-pill-warning" },
  planned:     { label_en: "Planned",    label_tr: "Planlandı",   cls: "status-pill status-pill-error" },
};

export default function RoadmapPage() {
  const locale = useLocale();
  const tr = locale === "tr";
  const phases = tr ? PHASES_TR : PHASES_EN;

  return (
    <>
      <main>
        <div className="inner-main-wide">
          {/* Header */}
          <div className="page-intro">
            <div className="page-intro-eyebrow">
              {tr ? "yol haritası" : "product roadmap"}
            </div>
            <div>
              <h1 className="page-h1">
                {tr ? "Ürün Yol Haritası" : "Product Roadmap"}
              </h1>
              <p className="page-lead">
                {tr
                  ? "Aurict Decision Karar Motorunun gelişim adımlarını ve gelecekteki hedeflerimizi takip edin."
                  : "Track where the Aurict Decision Engine is headed across runtime, intelligence, and ecosystem scale."}
              </p>
            </div>
          </div>

          {/* Phases */}
          <div style={{ marginBottom: 96 }}>
            {phases.map((phase, i) => {
              const statusInfo = STATUS_MAP[phase.status];
              return (
                <div key={i} className="roadmap-phase">
                  <div className="roadmap-phase-header" style={{ flexWrap: "wrap" }}>
                    <span className={statusInfo.cls}>
                      {tr ? statusInfo.label_tr : statusInfo.label_en}
                    </span>
                    <span style={{ color: "var(--accent)", font: "600 11px var(--font-mono)" }}>
                      {phase.quarter}
                    </span>
                    <div className="roadmap-phase-title" style={{ width: "100%", marginTop: 4 }}>
                      {phase.title}
                    </div>
                  </div>

                  <p className="roadmap-phase-desc">{phase.desc}</p>

                  {/* Progress Bar */}
                  <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 20 }}>
                    <div className="roadmap-progress-bar-wrap" style={{ flex: 1, marginBottom: 0 }}>
                      <div
                        className="roadmap-progress-bar"
                        style={{ width: phase.progress }}
                      />
                    </div>
                    <span style={{ color: "var(--accent)", font: "600 11px var(--font-mono)", minWidth: 40 }}>
                      {phase.progress}
                    </span>
                  </div>

                  {/* Items Grid */}
                  <div className="roadmap-items">
                    {phase.items.map((item, idx) => (
                      <div
                        key={idx}
                        className="roadmap-item"
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: 8,
                          color: item.done ? "var(--text)" : "var(--text-dim)",
                        }}
                      >
                        <span style={{ color: item.done ? "var(--success)" : "var(--text-muted)" }}>
                          {item.done ? "✓" : "◦"}
                        </span>
                        <span>{item.name}</span>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Feedback Box */}
          <div
            style={{
              background: "color-mix(in oklch, var(--bg-card) 85%, var(--bg))",
              border: "1px solid var(--border)",
              padding: "36px 32px",
              display: "grid",
              gridTemplateColumns: "1fr auto",
              gap: 24,
              alignItems: "center",
              marginBottom: 80,
            }}
          >
            <div>
              <div style={{ display: "flex", alignItems: "center", gap: 8, color: "var(--accent)", marginBottom: 8 }}>
                <Lightbulb size={18} />
                <span style={{ font: "600 11px var(--font-mono)", textTransform: "uppercase", letterSpacing: "0.06em" }}>
                  {tr ? "Özellik İsteği" : "Feature Request"}
                </span>
              </div>
              <h3 style={{ color: "var(--text)", font: "600 22px var(--font-serif)", marginBottom: 4 }}>
                {tr ? "Görmek istediğiniz bir özellik mi var?" : "Have a feature request or integration idea?"}
              </h3>
              <p style={{ color: "var(--text-dim)", font: "14px var(--font-serif)" }}>
                {tr ? "Yol haritamızı topluluğumuzun ve müşterilerimizin geri bildirimleriyle şekillendiriyoruz." : "We prioritize our engineering backlog based on direct feedback from our customers and partners."}
              </p>
            </div>
            <a href="mailto:roadmap@aurict.com?subject=Feature%20Request" className="aur-button aur-button-primary">
              {tr ? "Öneri Gönder" : "Submit Suggestion"}
            </a>
          </div>
        </div>

        {/* Final CTA */}
        <section className="section-final">
          <p>{tr ? "sürekli gelişim" : "continuous shipping"}</p>
          <h2>{tr ? "Mevcut sürümü hemen test edin." : "Test our latest release today."}</h2>
          <div>
            <a href="https://console.aurict.com" className="aur-button aur-button-primary">
              {tr ? "Ücretsiz Başla" : "Get Started Free"}
            </a>
            <a href="/changelog" className="aur-button aur-button-secondary">
              {tr ? "Değişiklik Günlüğü" : "View Changelog"}
            </a>
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
