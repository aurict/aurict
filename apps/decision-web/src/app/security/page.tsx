"use client";

import { TightPeriods } from "@/components/ui/TightPeriods";
import { useLocale } from "next-intl";
import { Footer } from "@/components/Footer";
import {
  Shield,
  Lock,
  Cpu,
  FileCheck,
  Globe,
  Fingerprint,
  CheckCircle2,
  Key,
  Server,
  Terminal,
  ShieldAlert,
} from "lucide-react";

const PRINCIPLES_EN = [
  {
    num: "01",
    icon: Cpu,
    title: "100% On-Device Inference",
    desc: "Session signals, feature extraction, and ML scoring happen exclusively inside the user's browser or device runtime. Raw telemetry never leaves the client.",
  },
  {
    num: "02",
    icon: Fingerprint,
    title: "Zero PII Collection",
    desc: "Aurict Decision does not collect or persist names, email addresses, IP addresses, or device serial numbers. Decision models operate on non-identifiable behavioural signals.",
  },
  {
    num: "03",
    icon: Lock,
    title: "AES-256-GCM State Encryption",
    desc: "Local feature caches and model parameters stored on device are encrypted at rest using AES-256-GCM with hardware-backed key storage (Keystore / Keychain / WebCrypto).",
  },
  {
    num: "04",
    icon: FileCheck,
    title: "Auditable Decision Engine",
    desc: "Every decision is logged with its reasons, policy and model versions. Enterprise customers and compliance teams can review the Decision Engine source code under a commercial agreement.",
  },
  {
    num: "05",
    icon: Globe,
    title: "Differential Privacy & Federated Learning",
    desc: "Global model updates use secure aggregation and differential privacy noise. Individual user parameters remain strictly local while contributing to fleet intelligence.",
  },
  {
    num: "06",
    icon: Shield,
    title: "Zero Third-Party Tracking",
    desc: "No third-party cookies, tracking pixels, or external beacon scripts. Aurict Decision is completely self-contained and operates entirely first-party.",
  },
] as const;

const PRINCIPLES_TR = [
  {
    num: "01",
    icon: Cpu,
    title: "%100 Cihaz Üstü Çıkarım",
    desc: "Oturum sinyalleri, özellik çıkarma ve ML puanlama yalnızca kullanıcının tarayıcısında veya cihazında gerçekleşir. Ham telemetri asla istemciden ayrılmaz.",
  },
  {
    num: "02",
    icon: Fingerprint,
    title: "Sıfır PII (Kişisel Veri) Toplama",
    desc: "Aurict Decision isim, e-posta, IP adresi veya cihaz seri numarası toplamaz ve saklamaz. Karar modelleri tanımlanamayan davranışsal sinyaller üzerinde çalışır.",
  },
  {
    num: "03",
    icon: Lock,
    title: "AES-256-GCM Durum Şifreleme",
    desc: "Cihazda saklanan yerel özellik önbellekleri ve model parametreleri, donanım destekli anahtar deposu ile AES-256-GCM kullanılarak durağan halde şifrelenir.",
  },
  {
    num: "04",
    icon: FileCheck,
    title: "Denetlenebilir Karar Motoru",
    desc: "Her karar gerekçeleri, politika ve model sürümleriyle kaydedilir. Kurumsal müşteriler ve uyumluluk ekipleri Karar Motoru kaynak kodunu ticari bir sözleşme kapsamında inceleyebilir.",
  },
  {
    num: "05",
    icon: Globe,
    title: "Diferansiyel Gizlilik ve Federe Öğrenme",
    desc: "Global model güncellemeleri güvenli toplama ve diferansiyel gizlilik gürültüsü kullanır. Bireysel kullanıcı parametreleri filo zekasına katkıda bulunurken kesinlikle yerel kalır.",
  },
  {
    num: "06",
    icon: Shield,
    title: "Üçüncü Taraf Takipçi Yoktur",
    desc: "Üçüncü taraf çerezleri, izleme pikselleri veya harici işaretçi betikleri yoktur. Aurict Decision tamamen bağımsızdır ve tek taraf (first-party) çalışır.",
  },
] as const;

const COMPLIANCE = [
  {
    code: "KVKK / VERBIS",
    name_en: "Turkish Personal Data Protection Law",
    name_tr: "Kişisel Verilerin Korunması Kanunu",
    status_en: "100% Compliant by Architecture",
    status_tr: "%100 Mimari Olarak Uyumlu",
    desc_en: "Because no personal data is transmitted or stored externally, Aurict Decision naturally bypasses KVKK data transfer liabilities and VERBIS registration obligations.",
    desc_tr: "Kişisel veri dışarıya aktarılmadığı ve saklanmadığı için Aurict Decision, KVKK veri aktarımı yükümlülüklerini ve VERBIS kayıt zorunluluklarını mimari olarak karşılar.",
  },
  {
    code: "GDPR",
    name_en: "EU General Data Protection Regulation",
    name_tr: "AB Genel Veri Koruma Tüzüğü",
    status_en: "Privacy by Design & Default",
    status_tr: "Tasarım Gereği ve Varsayılan Gizlilik",
    desc_en: "Full compliance with Article 25 (Privacy by Design) and Article 32 (Security of Processing). Zero cross-border data transfer concerns.",
    desc_tr: "Madde 25 (Tasarım Gereği Gizlilik) ve Madde 32 (İşleme Güvenliği) ile tam uyum. Sınır ötesi veri aktarımı riski yoktur.",
  },
  {
    code: "CCPA / CPRA",
    name_en: "California Consumer Privacy Act",
    name_tr: "Kaliforniya Tüketici Gizliliği Yasası",
    status_en: "No Sale of Personal Info",
    status_tr: "Kişisel Bilgi Satışı Yapılmaz",
    desc_en: "Aurict Decision does not track users across sites or sell consumer data. Opt-out requirements are satisfied automatically.",
    desc_tr: "Aurict Decision kullanıcıları siteler arasında takip etmez veya tüketici verilerini satmaz. Çıkış (opt-out) gereksinimleri otomatik karşılanır.",
  },
  {
    code: "SOC 2 Type II",
    name_en: "Security, Availability & Confidentiality",
    name_tr: "Güvenlik, Kullanılabilirlik ve Gizlilik",
    status_en: "Annual Audit Certified",
    status_tr: "Yıllık Denetim Sertifikalı",
    desc_en: "Our cloud dashboard, model distribution infrastructure, and federated learning pipelines are audited annually by independent SOC 2 auditors.",
    desc_tr: "Bulut panomuz, model dağıtım altyapımız ve federe öğrenme hattımız bağımsız SOC 2 denetçileri tarafından yıllık olarak denetlenmektedir.",
  },
] as const;

export default function SecurityPage() {
  const locale = useLocale();
  const tr = locale === "tr";
  const principles = tr ? PRINCIPLES_TR : PRINCIPLES_EN;

  return (
    <>
      <main>
        <div className="inner-main-wide">
          {/* Header */}
          <div className="page-intro">
            <div className="page-intro-eyebrow">
              {tr ? "güvenlik ve gizlilik" : "security & privacy"}
            </div>
            <div>
              <h1 className="page-h1">
                <TightPeriods text={tr
                  ? "Mimari olarak güvenli. Varsayılan olarak gizli."
                  : "Secure by architecture. Private by default."} />
              </h1>
              <p className="page-lead">
                {tr
                  ? "Aurict Decision, hassas verilerin cihazı asla terk etmeyeceği ilkesi üzerine inşa edilmiştir. Güvenlik bir sonradan düşünce değil, karar motorunun temel harcıdır."
                  : "Aurict Decision is engineered on the principle that sensitive data must never leave the device. Security is not an afterthought—it is the foundation of our decision engine."}
              </p>
            </div>
          </div>

          {/* Principles Grid */}
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
              {tr ? "01 / temel güvenlik ilkeleri" : "01 / core security principles"}
            </p>
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(340px, 1fr))",
                gap: 1,
                background: "var(--border)",
                border: "1px solid var(--border)",
              }}
            >
              {principles.map((p) => {
                const IconComponent = p.icon;
                return (
                  <div
                    key={p.num}
                    className="content-card"
                    style={{
                      display: "flex",
                      flexDirection: "column",
                      justifyContent: "space-between",
                      gap: 20,
                    }}
                  >
                    <div>
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "space-between",
                          marginBottom: 20,
                        }}
                      >
                        <span
                          style={{
                            color: "var(--accent)",
                            font: "700 12.5px var(--font-sans)",
                            letterSpacing: "0.06em",
                          }}
                        >
                          {p.num}
                        </span>
                        <div
                          style={{
                            width: 36,
                            height: 36,
                            borderRadius: 6,
                            background:
                              "color-mix(in srgb, var(--accent) 12%, transparent)",
                            border:
                              "1px solid color-mix(in srgb, var(--accent) 25%, transparent)",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            color: "var(--accent)",
                          }}
                        >
                          <IconComponent size={18} />
                        </div>
                      </div>
                      <div className="content-card-title">{p.title}</div>
                      <p className="content-card-body" style={{ marginTop: 8 }}>
                        {p.desc}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Technical Deep Dive / Encryption */}
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
              {tr ? "02 / teknik koruma katmanları" : "02 / technical defense layers"}
            </p>
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))",
                gap: 20,
              }}
            >
              <div className="content-card">
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 10,
                    marginBottom: 12,
                  }}
                >
                  <Key size={18} style={{ color: "var(--accent)" }} />
                  <div className="content-card-title" style={{ marginBottom: 0 }}>
                    {tr ? "Anahtar Yönetimi" : "Key Management"}
                  </div>
                </div>
                <p className="content-card-body">
                  {tr
                    ? "İstemci tarafında türetilen tüm önbellek anahtarları web ortamında SubtleCrypto, mobile'da Secure Enclave / Keystore kullanılarak donanım seviyesinde izole edilir."
                    : "All client-derived cache keys are isolated at hardware level using SubtleCrypto on web and Secure Enclave / Keystore on mobile."}
                </p>
              </div>

              <div className="content-card">
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 10,
                    marginBottom: 12,
                  }}
                >
                  <Server size={18} style={{ color: "var(--accent)" }} />
                  <div className="content-card-title" style={{ marginBottom: 0 }}>
                    {tr ? "TLS 1.3 ve Pinning" : "TLS 1.3 & Certificate Pinning"}
                  </div>
                </div>
                <p className="content-card-body">
                  {tr
                    ? "Model güncellemeleri ve anonim metriklerin sunucu ile iletişiminde TLS 1.3 ve sertifika sabitleme (pinning) uygulanır. Man-in-the-middle saldırıları engellenir."
                    : "Model update downloads and anonymous telemetry use TLS 1.3 with certificate pinning to prevent man-in-the-middle inspection."}
                </p>
              </div>

              <div className="content-card">
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 10,
                    marginBottom: 12,
                  }}
                >
                  <Terminal size={18} style={{ color: "var(--accent)" }} />
                  <div className="content-card-title" style={{ marginBottom: 0 }}>
                    {tr ? "Geçici Oturum Belleği" : "Ephemeral Memory"}
                  </div>
                </div>
                <p className="content-card-body">
                  {tr
                    ? "Oturum içi sinyaller yalnızca RAM belleğinde tutulur. Oturum kapandığında veya sayfa yenilendiğinde hassas değişkenler anında bellekten silinir."
                    : "In-session signals exist strictly in RAM. Sensitive variables are instantly garbage-collected when a session ends or tab is closed."}
                </p>
              </div>
            </div>
          </div>

          {/* Compliance Grid */}
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
              {tr ? "03 / yasal uyumluluk standartları" : "03 / compliance standards"}
            </p>
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
                gap: 1,
                background: "var(--border)",
                border: "1px solid var(--border)",
              }}
            >
              {COMPLIANCE.map((c) => (
                <div key={c.code} className="content-card">
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      marginBottom: 12,
                    }}
                  >
                    <span
                      style={{
                        color: "var(--accent)",
                        font: "600 13px var(--font-mono)",
                        letterSpacing: "0.04em",
                      }}
                    >
                      {c.code}
                    </span>
                    <CheckCircle2 size={16} style={{ color: "var(--success)" }} />
                  </div>
                  <div
                    style={{
                      color: "var(--text)",
                      font: "800 16px var(--font-sans)",
                      marginBottom: 6,
                    }}
                  >
                    {tr ? c.name_tr : c.name_en}
                  </div>
                  <div
                    style={{
                      color: "var(--success)",
                      font: "700 12.5px var(--font-sans)",
                      marginBottom: 12,
                      textTransform: "uppercase",
                      letterSpacing: "0.04em",
                    }}
                  >
                    {tr ? c.status_tr : c.status_en}
                  </div>
                  <p className="content-card-body">{tr ? c.desc_tr : c.desc_en}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Reports & Audits */}
          <div
            className="cta-box"
          >
            <div>
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 10,
                  marginBottom: 12,
                }}
              >
                <ShieldAlert size={20} style={{ color: "var(--accent)" }} />
                <h3
                  style={{
                    color: "var(--text)",
                    font: "800 24px var(--font-sans)",
                  }}
                >
                  {tr
                    ? "Güvenlik Raporları ve Sızma Testleri"
                    : "Security Audits & Penetration Tests"}
                </h3>
              </div>
              <p style={{ color: "var(--text-dim)", font: "15px / 1.6 var(--font-sans)", maxWidth: 680 }}>
                {tr
                  ? "Sistemlerimiz bağımsız siber güvenlik firmaları tarafından düzenli olarak sızma testine tabi tutulur. Kurumsal müşterilerimiz güncel pentest ve SOC 2 raporlarını talep edebilir."
                  : "Our infrastructure undergoes regular third-party penetration testing. Enterprise customers can request our latest SOC 2 Type II and penetration test reports under NDA."}
              </p>
            </div>
            <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
              <a
                href="mailto:security@aurict.com?subject=Security%20Report%20Request"
                className="aur-button aur-button-primary"
              >
                {tr ? "Rapor Talep Et" : "Request Audit Report"}
              </a>
            </div>
          </div>
        </div>

        {/* Final CTA */}
        <section className="section-final">
          <p>{tr ? "sıfır veri sızıntısı" : "zero data leakage"}</p>
          <h2>
            {tr
              ? "Güvenli kararlarla hemen başlayın."
              : "Start with security by design."}
          </h2>
          <div>
            <a
              href="https://console.aurict.com"
              className="aur-button aur-button-primary"
            >
              {tr ? "Ücretsiz Başla" : "Get Started Free"}
            </a>
            <a
              href="mailto:security@aurict.com"
              className="aur-button aur-button-secondary"
            >
              {tr ? "Güvenlik Ekibiyle İletişim" : "Contact Security Team"}
            </a>
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
