import type { Metadata } from "next"
import { getLocale } from "next-intl/server"
import { Link } from "@/i18n/navigation"
import { Nav } from "@/components/Nav"
import { Footer } from "@/components/sections/Footer"
import { Breadcrumb } from "@/components/ui/Breadcrumb"
import { localizedMetadata, localizedUrl } from "@/i18n/metadata"
import type { AppLocale } from "@/i18n/routing"
import { localizeEnglish, localizeEnglishContent } from "@/i18n/content"
import styles from "./RoadmapPage.module.css"

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getLocale() as AppLocale
  return localizedMetadata(locale, "/roadmap", locale === "tr" ? "Aurict Yol Haritası — Ürün Yönü" : localizeEnglish(locale, "Aurict Roadmap — Product Direction"), locale === "tr" ? "Terminal ajanı, mobil BYOK asistanı, web platformu ve uzun vadeli yapay zekâ araştırmaları için Aurict yol haritası." : localizeEnglish(locale, "Aurict roadmap across the terminal agent, mobile BYOK assistant, web platform, MicroTarget.one integration, security vertical, and long-term AI research."))
}

type RoadmapStatus = "live" | "active" | "planned" | "research"

const statusStyle: Record<RoadmapStatus, { color: string; background: string; border: string }> = {
  live: {
    color:      "var(--success)",
    background: "color-mix(in oklch, var(--success) 12%, transparent)",
    border:     "color-mix(in oklch, var(--success) 30%, transparent)",
  },
  active: {
    color:      "var(--accent)",
    background: "color-mix(in oklch, var(--accent) 13%, transparent)",
    border:     "color-mix(in oklch, var(--accent) 32%, transparent)",
  },
  planned: {
    color:      "var(--warning)",
    background: "color-mix(in oklch, var(--warning) 12%, transparent)",
    border:     "color-mix(in oklch, var(--warning) 28%, transparent)",
  },
  research: {
    color:      "oklch(0.76 0.12 290)",
    background: "oklch(0.76 0.12 290 / 0.12)",
    border:     "oklch(0.76 0.12 290 / 0.28)",
  },
}

const englishPhases = [
  {
    label: "Phase 01",
    title: "Working Core",
    status: "live" as const,
    items: [
      "Terminal-native Aurict CLI",
      "BYOK provider model",
      "Firebase-backed web auth",
      "Browser-based login for CLI sessions",
      "Mobile BYOK chat, research, and PDF generation",
      "GitHub Releases powered automatic changelog",
    ],
  },
  {
    label: "Phase 02",
    title: "Product Hardening",
    status: "active" as const,
    items: [
      "Full alignment between mobile and web brand language",
      "Real-device auth and provider key flows",
      "CLI remote approval and session management",
      "Production environment variable checks",
      "Release, changelog, and roadmap publishing discipline",
    ],
  },
  {
    label: "Phase 03",
    title: "Ecosystem Expansion",
    status: "planned" as const,
    items: [
      "MicroTarget.one dashboard and process management integration",
      "AI-assisted optimization and decision support layer",
      "Design and interface generation layer",
      "Independent platform foundation for the cybersecurity vertical",
    ],
  },
  {
    label: "Phase 04",
    title: "Research Track",
    status: "research" as const,
    items: [
      "Alternative architectural approaches for model orchestration",
      "Lower-cost inference and context strategies",
      "More accessible and more accurate LLM experiments",
      "Long-term model research fed by the Aurict ecosystem",
    ],
  },
]

const englishSignals = [
  ["Now", "Web, CLI, and mobile are converging under one brand system."],
  ["Next", "Mobile auth, key management, and browser login flows are being hardened."],
  ["Later", "MicroTarget.one and new verticals connect into the Aurict operations brain."],
]

export default async function RoadmapPage() {
  const locale = await getLocale() as AppLocale
  const tr = locale === "tr"
  const t = (source: string) => localizeEnglish(locale, source)
  const phases = tr ? [
    { label: "Faz 01", title: "Çalışan çekirdek", status: "live" as const, items: ["Terminal odaklı Aurict CLI", "BYOK sağlayıcı modeli", "Firebase tabanlı web kimlik doğrulaması", "CLI oturumları için tarayıcı tabanlı giriş", "Mobil BYOK sohbeti, araştırma ve PDF üretimi", "GitHub Releases ile otomatik değişiklik günlüğü"] },
    { label: "Faz 02", title: "Ürün sağlamlaştırma", status: "active" as const, items: ["Mobil ve web marka dilinin tam hizalanması", "Gerçek cihaz kimlik doğrulama ve sağlayıcı anahtarı akışları", "CLI uzaktan onay ve oturum yönetimi", "Üretim ortam değişkeni kontrolleri", "Sürüm, değişiklik günlüğü ve yol haritası yayınlama disiplini"] },
    { label: "Faz 03", title: "Ekosistem genişlemesi", status: "planned" as const, items: ["MicroTarget.one dashboard ve süreç yönetimi entegrasyonu", "Yapay zekâ destekli optimizasyon ve karar desteği katmanı", "Tasarım ve arayüz üretim katmanı", "Siber güvenlik dikeyi için bağımsız platform temeli"] },
    { label: "Faz 04", title: "Araştırma hattı", status: "research" as const, items: ["Model orkestrasyonu için alternatif mimari yaklaşımlar", "Daha düşük maliyetli çıkarım ve bağlam stratejileri", "Daha erişilebilir ve daha doğru LLM deneyleri", "Aurict ekosisteminden beslenen uzun vadeli model araştırması"] },
  ] : localizeEnglishContent(locale, englishPhases)
  const signals = tr ? [["Şimdi", "Web, CLI ve mobil tek bir marka sistemi altında yakınsıyor."], ["Sırada", "Mobil kimlik doğrulama, anahtar yönetimi ve tarayıcı giriş akışları sağlamlaştırılıyor."], ["Sonrasında", "MicroTarget.one ve yeni dikeyler Aurict operasyon beynine bağlanıyor."]] : localizeEnglishContent(locale, englishSignals)
  const breadcrumbJsonLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    "itemListElement": [
      { "@type": "ListItem", "position": 1, "name": tr ? "Ana sayfa" : t("Home"), "item": localizedUrl("/", locale) },
      { "@type": "ListItem", "position": 2, "name": tr ? "Yol haritası" : t("Roadmap"), "item": localizedUrl("/roadmap", locale) },
    ],
  }
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }} />
      <Nav />
      <main className={`marketing-main ${styles.roadmap}`}>
        <Breadcrumb items={[{ label: tr ? "Ana sayfa" : t("Home"), href: "/" }, { label: tr ? "Yol haritası" : t("Roadmap"), href: "/roadmap" }]} />

        <section className="marketing-hero" style={{ marginTop: 24 }}>
          <p className="marketing-eyebrow">{tr ? "Herkese açık yol haritası" : t("Public roadmap")}</p>
          <h1 className="marketing-title">{tr ? "Ürün rotası, net fazlara ayrılmış halde." : t("The product route, organized into clear phases.")}</h1>
          <p className="marketing-lede">
            {tr ? "Aurict yol haritası yalnızca bir özellik listesi değildir. Terminal ajanından mobil BYOK asistana, web platformundan MicroTarget.one entegrasyonuna ve oradan uzun vadeli model araştırmasına uzanan kontrollü bir ilerlemedir." : t("The Aurict roadmap is not just a feature list. It is a controlled progression from terminal agent to mobile BYOK assistant, from web platform to MicroTarget.one integration, and from there into long-term model research.")}
          </p>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 12, marginTop: 30 }}>
            <Link className="aur-button aur-button-primary" href="/changelog">{tr ? "son değişiklikler" : t("latest changes")}</Link>
            <Link className="aur-button aur-button-secondary" href="/about">{tr ? "manifestoyu oku" : t("read manifesto")}</Link>
          </div>
        </section>

        <section className={`resp-grid-3 ${styles.signals}`} style={{ display: "grid", gridTemplateColumns: "repeat(3, minmax(0, 1fr))", gap: 14, marginBottom: 42 }}>
          {signals.map(([label, body]) => (
            <article key={label} className={`${styles.signal} marketing-card`} style={{ padding: 20 }}>
              <p className="mono" style={{ color: "var(--accent)", fontSize: 11, letterSpacing: ".08em", textTransform: "uppercase", marginBottom: 12 }}>{label}</p>
              <p style={{ color: "var(--text)", fontSize: 18, lineHeight: 1.45 }}>{body}</p>
            </article>
          ))}
        </section>

        <section className={styles.phaseTrack} style={{ border: "1px solid var(--border)", borderRadius: 12, overflow: "hidden", background: "color-mix(in oklch, var(--bg-card) 72%, transparent)", marginBottom: 64 }}>
          <div className="resp-grid-4" style={{ display: "grid", gridTemplateColumns: "repeat(4, minmax(240px, 1fr))" }}>
            {phases.map((phase, index) => (
              <article
                key={phase.label}
                className={styles.phase}
                style={{
                  borderRight: index < phases.length - 1 ? "1px solid var(--border)" : "none",
                  minHeight:   520,
                  padding:     24,
                  position:    "relative",
                }}
              >
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, marginBottom: 26 }}>
                  <span className="mono" style={{ color: "var(--text-muted)", fontSize: 12 }}>{phase.label}</span>
                  <Status locale={locale} status={phase.status} />
                </div>
                <h2 style={{ color: "var(--text)", fontSize: 28, fontWeight: 600, letterSpacing: "-.01em", lineHeight: 1.12, marginBottom: 22 }}>{phase.title}</h2>
                <div style={{ background: "linear-gradient(180deg, var(--accent), transparent)", height: 76, left: 24, opacity: 0.45, position: "absolute", top: 96, width: 1 }} />
                <ul style={{ display: "flex", flexDirection: "column", gap: 16, listStyle: "none", marginTop: 34 }}>
                  {phase.items.map((item) => (
                    <li key={item} style={{ display: "grid", gridTemplateColumns: "12px 1fr", gap: 12, alignItems: "start" }}>
                      <span style={{ background: "var(--accent)", borderRadius: 999, boxShadow: "0 0 0 5px color-mix(in oklch, var(--accent) 10%, transparent)", height: 6, marginTop: 8, width: 6 }} />
                      <span style={{ color: "var(--text-dim)", fontSize: 15, lineHeight: 1.55 }}>{item}</span>
                    </li>
                  ))}
                </ul>
              </article>
            ))}
          </div>
        </section>

        <section className={`resp-grid-2 ${styles.policyGrid}`} style={{ display: "grid", gridTemplateColumns: "minmax(0, 1fr) 320px", gap: 18, alignItems: "stretch" }}>
          <article className={`${styles.policy} marketing-card`} style={{ padding: 28 }}>
            <p className="marketing-eyebrow" style={{ marginBottom: 12 }}>{tr ? "Yol haritası ilkesi" : t("Roadmap policy")}</p>
            <h2 style={{ color: "var(--text)", fontSize: 30, fontWeight: 600, lineHeight: 1.18, marginBottom: 14 }}>{tr ? "Bu sayfa bir yön haritasıdır, vaat listesi değil." : t("This page is a direction map, not a promise list.")}</h2>
            <p className="marketing-copy">
              {tr ? "Yol haritası ürünün nereye gittiğini, hangi fazların etkin olduğunu ve sırada hangi stratejik katmanların bulunduğunu gösterir. Tamamlanan işler değişiklik günlüğünde ayrıntılı olarak izlenir." : t("The roadmap shows where the product is going, which phases are active, and which strategic layers are waiting next. Completed work is tracked in detail through the changelog.")}
            </p>
          </article>
          <article className={`${styles.policy} marketing-card`} style={{ padding: 28, background: "linear-gradient(180deg, color-mix(in oklch, var(--accent) 10%, var(--bg-card)), var(--bg-card))" }}>
            <p className="mono" style={{ color: "var(--text-muted)", fontSize: 12, marginBottom: 20 }}>{tr ? "sürüm doğruluk kaynağı" : t("release truth source")}</p>
            <Link className="aur-button aur-button-secondary" href="/changelog" style={{ width: "100%" }}>{tr ? "değişiklik günlüğü" : t("changelog")}</Link>
            <Link className="aur-button aur-button-primary" href="/docs" style={{ width: "100%" }}>{tr ? "dokümanlar" : t("docs")}</Link>
          </article>
        </section>
      </main>
      <Footer />
    </>
  )
}

function Status({ locale, status }: { locale: AppLocale; status: RoadmapStatus }) {
  const style = statusStyle[status]
  const labels: Record<AppLocale, Record<RoadmapStatus, string>> = {
    en: { live: "Live", active: "Active", planned: "Planned", research: "Research" },
    tr: { live: "Canlı", active: "Aktif", planned: "Planlandı", research: "Araştırma" },
    de: { live: "Live", active: "Aktiv", planned: "Geplant", research: "Forschung" },
    fr: { live: "En ligne", active: "Actif", planned: "Planifié", research: "Recherche" },
    es: { live: "Disponible", active: "Activo", planned: "Planificado", research: "Investigación" },
  }
  const label = labels[locale][status]

  return (
    <span
      className="mono"
      style={{
        background:    style.background,
        border:        `1px solid ${style.border}`,
        borderRadius:  4,
        color:         style.color,
        fontSize:      10.5,
        letterSpacing: ".05em",
        padding:       "4px 8px",
        textTransform: "uppercase",
      }}
    >
      {label}
    </span>
  )
}
