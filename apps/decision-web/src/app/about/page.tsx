"use client";

import { TightPeriods } from "@/components/ui/TightPeriods";
import { useLocale } from "next-intl";
import { Footer } from "@/components/Footer";
import {
  ShieldCheck,
  Zap,
  Eye,
  Lock,
  Code2,
  Activity,
} from "lucide-react";

const STATS_EN = [
  { value: "<10ms", label: "Median Decision Latency", sub: "Commodity Mobile & Web" },
  { value: "100%", label: "On-Device Inference", sub: "Zero Raw Data Export" },
  { value: "Enterprise", label: "Commercial License", sub: "Auditable Decisions" },
  { value: "1/Session", label: "Targeting Philosophy", sub: "Signal Over Noise" },
] as const;

const STATS_TR = [
  { value: "<10ms", label: "Ortanca Karar Gecikmesi", sub: "Standart Mobil ve Web" },
  { value: "%100", label: "Cihaz Üstü Çıkarım", sub: "Sıfır Ham Veri Aktarımı" },
  { value: "Kurumsal", label: "Ticari Lisans", sub: "Denetlenebilir Kararlar" },
  { value: "1/Oturum", label: "Hedefleme Felsefesi", sub: "Gürültü Değil Sinyal" },
] as const;

const MANIFESTO_EN = [
  {
    icon: ShieldCheck,
    title: "Data Stays on Device",
    desc: "Session signals, feature extraction, and model scoring all happen locally. No raw behavioral data ever leaves the user's browser or app.",
  },
  {
    icon: Zap,
    title: "One Decision Per Session",
    desc: "Every session deserves a single, highly purposeful intervention. More is noise; one is signal. We optimize for precision over volume.",
  },
  {
    icon: Eye,
    title: "Explicit Over Implicit",
    desc: "Every decision is fully auditable. SHAP-based feature attribution, confidence scores, and fallback logs for every prediction.",
  },
  {
    icon: Lock,
    title: "Privacy as Architecture",
    desc: "Differential privacy, federated learning, and on-device inference are not features—they are the foundational building blocks.",
  },
  {
    icon: Code2,
    title: "No Lock-in",
    desc: "Your data, your models, your integrations—all portable and free from lock-in.",
  },
  {
    icon: Activity,
    title: "Performance Over Hype",
    desc: "Sub-10ms inference on commodity hardware. Privacy-first does not mean slow; it means smarter execution.",
  },
] as const;

const MANIFESTO_TR = [
  {
    icon: ShieldCheck,
    title: "Veri Cihazda Kalır",
    desc: "Oturum sinyalleri, özellik çıkarma ve model puanlamasının tümü yerel olarak gerçekleşir. Ham davranışsal veriler asla cihazı terk etmez.",
  },
  {
    icon: Zap,
    title: "Oturum Başına Tek Karar",
    desc: "Her oturum tek ve yüksek amaçlı bir müdahaleyi hak eder. Fazlası gürültüdür; bir tanesi sinyaldir. Hacim yerine hassasiyet sunarız.",
  },
  {
    icon: Eye,
    title: "Açık, Örtük Değil",
    desc: "Her karar tam denetlenebilirdir. Her tahmin için SHAP tabanlı özellik attribution, güven skorları ve fallback logları.",
  },
  {
    icon: Lock,
    title: "Mimari Olarak Gizlilik",
    desc: "Diferansiyel gizlilik, federe öğrenme ve cihaz üstü çıkarım birer özellik değil, mimarimizin temel taşlarıdır.",
  },
  {
    icon: Code2,
    title: "Bağımlılık Yok",
    desc: "Verileriniz, modelleriniz, entegrasyonlarınız—hepsi taşınabilir ve bağımsızdır.",
  },
  {
    icon: Activity,
    title: "Abartı Değil Performans",
    desc: "Standart donanımda 10ms altında çıkarım. Gizlilik önce demek yavaş demek değildir; daha zeki çalışma demektir.",
  },
] as const;

export default function AboutPage() {
  const locale = useLocale();
  const tr = locale === "tr";
  const stats = tr ? STATS_TR : STATS_EN;
  const manifesto = tr ? MANIFESTO_TR : MANIFESTO_EN;

  return (
    <>
      <main>
        <div className="inner-main-wide">
          {/* Header */}
          <div className="page-intro">
            <div className="page-intro-eyebrow">
              {tr ? "hakkında" : "about aurict decision"}
            </div>
            <div>
              <h1 className="page-h1">
                <TightPeriods text={tr
                  ? "Karar Motoru neden var?"
                  : "Why the Decision Engine exists."} />
              </h1>
              <p className="page-lead">
                {tr
                  ? "E-ticarette gizlilik korumalı kişiselleştirmeyi herkes için erişilebilir kılmak üzere Aurict alt ürünü olarak inşa edildi."
                  : "Built as an Aurict sub-product to make privacy-safe personalization accessible to every e-commerce and app development team."}
              </p>
            </div>
          </div>

          {/* Stats Bar */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
              gap: 1,
              background: "var(--border)",
              border: "1px solid var(--border)",
              marginBottom: 96,
            }}
          >
            {stats.map((s, i) => (
              <div
                key={i}
                style={{
                  background: "color-mix(in srgb, var(--bg-card) 85%, var(--bg))",
                  padding: "32px 24px",
                }}
              >
                <div
                  style={{
                    color: "var(--accent)",
                    font: "800 clamp(36px, 4vw, 48px) / 1 var(--font-sans)",
                    marginBottom: 8,
                  }}
                >
                  {s.value}
                </div>
                <div
                  style={{
                    color: "var(--text)",
                    font: "600 13px var(--font-mono)",
                    marginBottom: 4,
                  }}
                >
                  {s.label}
                </div>
                <div
                  style={{
                    color: "var(--text-muted)",
                    font: "700 12.5px var(--font-sans)",
                  }}
                >
                  {s.sub}
                </div>
              </div>
            ))}
          </div>

          {/* Manifesto Section */}
          <div style={{ marginBottom: 96 }}>
            <p
              style={{
                color: "var(--accent)",
                font: "700 12.5px var(--font-sans)",
                letterSpacing: "0.1em",
                textTransform: "uppercase",
                marginBottom: 24,
              }}
            >
              {tr ? "manifesto · karar motoru ilkeleri" : "manifesto · decision engine principles"}
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
              {manifesto.map((item, i) => {
                const IconComponent = item.icon;
                return (
                  <div key={i} className="manifesto-cell">
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        marginBottom: 12,
                      }}
                    >
                      <span className="manifesto-idx">
                        {String(i + 1).padStart(2, "0")}
                      </span>
                      <IconComponent size={20} style={{ color: "var(--accent)" }} />
                    </div>
                    <div className="manifesto-title">{item.title}</div>
                    <div className="manifesto-desc">{item.desc}</div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Aurict Origin Story */}
          <div style={{ marginBottom: 80 }}>
            <p
              style={{
                color: "var(--accent)",
                font: "700 12.5px var(--font-sans)",
                letterSpacing: "0.1em",
                textTransform: "uppercase",
                marginBottom: 24,
              }}
            >
              {tr ? "aurict kökeni & ekibimiz" : "aurict origin & team"}
            </p>

            <div className="about-principle">
              <span className="about-principle-num">01</span>
              <div>
                <div className="about-principle-title">
                  {tr ? "Aurict Ekibi Tarafından Geliştirildi" : "Built by the Aurict Team"}
                </div>
                <div className="about-principle-body">
                  {tr
                    ? "Aurict Decision, e-ticaret kişiselleştirmesi için cihaz üstü ML platformu Aurict'in çekirdek mühendislik ekibi tarafından geliştirilmektedir. Gizlilik, gecikme ve karar doğruluğu konusunda takıntılıyız."
                    : "Aurict Decision is developed by the core engineering team at Aurict, building on-device ML infrastructure. We obsess over latency, differential privacy, and deterministic decision evaluation."}
                </div>
              </div>
            </div>

            <div className="about-principle" style={{ borderBottom: 0 }}>
              <span className="about-principle-num">02</span>
              <div>
                <div className="about-principle-title">
                  {tr ? "Özerk Kimlik & Aurict Alt Ürünü" : "Autonomous Identity & Aurict Sub-Product"}
                </div>
                <div className="about-principle-body">
                  {tr
                    ? "Aurict Decision, Aurict markası altında faaliyet gösterir. Aurict platformunun gücüyle beslenen, ancak kendi özel renk paleti, SDK'ları ve bağımsız karar motoru mimarisi ile ayrıştırılan odaklanmış bir üründür."
                    : "Aurict Decision operates under the Aurict product ecosystem. Powered by Aurict infrastructure, it remains a dedicated SDK product with its own teal design language and independent decision engine architecture."}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Final CTA */}
        <section className="section-final">
          <p>{tr ? "aurict alt ürünü" : "aurict sub-product"}</p>
          <h2>{tr ? "Ekibimize ve topluluğa katılın." : "Join our team & community."}</h2>
          <div>
            <a href="https://console.aurict.com" className="aur-button aur-button-primary">
              {tr ? "Ücretsiz Başla" : "Get Started Free"}
            </a>
            <a href="mailto:careers@aurict.com" className="aur-button aur-button-secondary">
              {tr ? "Kariyer & Açık Pozisyonlar" : "Open Positions"}
            </a>
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
