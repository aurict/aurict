import type { Metadata } from "next"
import type { ReactNode } from "react"
import { getLocale } from "next-intl/server"
import { Link } from "@/i18n/navigation"
import { Nav } from "@/components/Nav"
import { Footer } from "@/components/sections/Footer"
import { Breadcrumb } from "@/components/ui/Breadcrumb"
import { localizedMetadata, localizedUrl } from "@/i18n/metadata"
import type { AppLocale } from "@/i18n/routing"
import { localizeEnglish, localizeEnglishContent } from "@/i18n/content"
import styles from "./AboutPage.module.css"

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getLocale() as AppLocale
  return localizedMetadata(locale, "/about", locale === "tr" ? "Aurict Hakkında — Manifesto" : localizeEnglish(locale, "About Aurict — Manifesto"), locale === "tr" ? "Aurict manifestosu: BYOK yapay zekâ orkestrasyonu, nesnel yaklaşım, yalın mimari ve uzun vadeli ekosistem vizyonu." : localizeEnglish(locale, "Aurict manifesto: BYOK AI orchestration, radical objectivity, lean architecture, TDD discipline, and the long-term ecosystem vision."))
}

const englishPrinciples = [
  {
    label: "01",
    title: "Architecture As Lean As Possible",
    body:  "Aurict focuses on reducing context bloat, unnecessary token spend, and distracting interface layers. The goal is an orchestration layer that moves the user toward the right result through the shortest defensible path.",
  },
  {
    label: "02",
    title: "TDD Discipline",
    body:  "Aurict puts testability and controlled change at the center. Whether writing code, managing security workflows, or producing technical decisions, it follows an engineering approach with its feet on the ground.",
  },
  {
    label: "03",
    title: "Radical Objectivity",
    body:  "Aurict is designed to say what is useful, not what is flattering. Instead of artificial praise and vague guidance, it aims for cold, clear, rational output.",
  },
]

const englishEcosystem = [
  {
    title: "MicroTarget.one Integration",
    body:  "MicroTarget.one is an independent project that uses on-device ML to reduce server load and make customer engagement workflows more efficient. On the Aurict side, the goal is to connect it over time to dashboarding, process management, optimization, and decision support.",
  },
  {
    title: "Visual and interface layer",
    body:  "Inside the ecosystem, Aurict aims to support a dedicated production layer where AI can generate interfaces, code components, and design systems in a live and functional way.",
  },
  {
    title: "Cybersecurity vertical",
    body:  "An independent vertical for cyber analysis, defense, penetration testing, and security workflows is positioned as a core part of the Aurict vision.",
  },
]

export default async function AboutPage() {
  const locale = await getLocale() as AppLocale
  const tr = locale === "tr"
  const t = (source: string) => localizeEnglish(locale, source)
  const principles = tr ? [
    { label: "01", title: "Mümkün Olduğunca Yalın Mimari", body: "Aurict; bağlam şişmesini, gereksiz token harcamasını ve dikkat dağıtan arayüz katmanlarını azaltmaya odaklanır. Amaç, kullanıcıyı savunulabilir en kısa yoldan doğru sonuca taşıyan bir orkestrasyon katmanı kurmaktır." },
    { label: "02", title: "TDD Disiplini", body: "Aurict test edilebilirliği ve kontrollü değişimi merkeze alır. Kod yazarken, güvenlik iş akışlarını yönetirken veya teknik karar üretirken ayakları yere basan bir mühendislik yaklaşımını izler." },
    { label: "03", title: "Radikal Nesnellik", body: "Aurict, pohpohlayan olanı değil yararlı olanı söylemek için tasarlanmıştır. Yapay övgü ve belirsiz yönlendirmeler yerine soğuk, net ve rasyonel çıktıyı hedefler." },
  ] : localizeEnglishContent(locale, englishPrinciples)
  const ecosystem = tr ? [
    { title: "MicroTarget.one entegrasyonu", body: "MicroTarget.one, sunucu yükünü azaltmak ve müşteri etkileşimi iş akışlarını verimli kılmak için cihaz üzerinde ML kullanan bağımsız bir projedir. Aurict tarafındaki hedef; zamanla bunu dashboard, süreç yönetimi, optimizasyon ve karar desteğine bağlamaktır." },
    { title: "Görsel ve arayüz katmanı", body: "Ekosistem içinde Aurict; yapay zekânın arayüz, kod bileşeni ve tasarım sistemi üretebildiği canlı ve işlevsel bir üretim katmanını desteklemeyi hedefler." },
    { title: "Siber güvenlik dikeyi", body: "Siber analiz, savunma, sızma testi ve güvenlik iş akışları için bağımsız bir dikey, Aurict vizyonunun temel parçalarından biri olarak konumlanır." },
  ] : localizeEnglishContent(locale, englishEcosystem)
  const breadcrumbJsonLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    "itemListElement": [
      { "@type": "ListItem", "position": 1, "name": tr ? "Ana sayfa" : t("Home"), "item": localizedUrl("/", locale) },
      { "@type": "ListItem", "position": 2, "name": tr ? "Hakkında" : t("About"), "item": localizedUrl("/about", locale) },
    ],
  }
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }} />
      <Nav />
      <main className={`marketing-main ${styles.about}`}>
        <Breadcrumb items={[{ label: tr ? "Ana sayfa" : t("Home"), href: "/" }, { label: tr ? "Hakkında" : t("About"), href: "/about" }]} />

        <section className="marketing-hero" style={{ marginTop: 24 }}>
          <p className="marketing-eyebrow">{tr ? "Manifesto" : "Manifesto"}</p>
          <h1 className="marketing-title">{tr ? "Aurict hakkında" : t("About Aurict")}</h1>
          <p className="marketing-lede">
            {tr ? "Yapay zekâ dünyası; yüksek maliyetler, şişirilmiş bağlam, verimsiz token kullanımı ve kullanıcıları rasyonel çözümlerden uzaklaştıran yapay bir övgü illüzyonuyla çevrili." : t("The AI world is surrounded by high costs, inflated context, inefficient token usage, and an illusion of artificial praise that often pulls users away from rational solutions.")}
          </p>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 12, marginTop: 30 }}>
            <Link className="aur-button aur-button-primary" href="/roadmap">{tr ? "yol haritasını gör" : t("view roadmap")}</Link>
            <Link className="aur-button aur-button-secondary" href="/docs">{tr ? "teknik dokümanlar" : t("technical docs")}</Link>
          </div>
        </section>

        <section className={`resp-grid-2 ${styles.opening}`} style={{ display: "grid", gridTemplateColumns: "minmax(0, 1fr) 280px", gap: 34, alignItems: "start", marginBottom: 64 }}>
          <article className={`${styles.statement} marketing-card`} style={{ padding: 30 }}>
            <p className="marketing-copy" style={{ fontSize: 18, color: "var(--text)" }}>
              {tr ? "Aurict, bu verimsizliğe mühendislik temelli bir yanıt ve radikal bir optimizasyon hareketi olarak doğdu." : t("Aurict was born as an engineering answer to this inefficiency and as a radical optimization movement.")}
            </p>
            <p className="marketing-copy" style={{ marginTop: 18 }}>
              {tr ? "Büyük modelleri sıfırdan eğitmenin donanım ve sermaye engellerini çıkmaz olarak değil, bir tasarım kısıtı olarak görüyoruz. Amaç, mevcut en güçlü modelleri daha akıllı, verimli ve kontrollü yöneten bir orkestrasyon beyni kurmak." : t("We treat the hardware and capital barriers of training large models from scratch not as a dead end, but as a design constraint. The aim is to build an orchestration brain that manages the strongest existing models in a smarter, more efficient, and more controlled way.")}
            </p>
            <p className="marketing-copy" style={{ marginTop: 18 }}>
              {tr ? "Kendi imkânlarıyla başlayan hobi projesi, artık daha net tanımlanmış bir teknoloji ekosistemine doğru ilerliyor." : t("What started as a bootstrapped hobby project is now moving toward a more clearly defined technology ecosystem.")}
            </p>
          </article>

          <aside className={`${styles.signal} marketing-card`} style={{ padding: 22, position: "sticky", top: 92 }}>
            <p className="mono" style={{ color: "var(--accent)", fontSize: 11, letterSpacing: ".08em", textTransform: "uppercase", marginBottom: 14 }}>{tr ? "mevcut sinyal" : t("current signal")}</p>
            <div className="mono" style={{ color: "var(--text)", fontSize: 22, fontWeight: 600, marginBottom: 8 }}>aurict<span className="aur-cursor">█</span></div>
            <p style={{ color: "var(--text-dim)", fontSize: 14, lineHeight: 1.65 }}>
              {tr ? "Süreç aktif. İmleç hazır. Ürün terminalden mobile, oradan daha geniş bir yapay zekâ ekosistemine ilerliyor." : t("The process is active. The cursor is ready. The product is moving from terminal to mobile, and from there toward a wider AI ecosystem.")}
            </p>
          </aside>
        </section>

        <ManifestoSection title={tr ? "Aurict nedir?" : t("What Is Aurict?")}>
          <p className="marketing-copy">
            {tr ? "Aurict, BYOK (Kendi Anahtarını Getir) modeli etrafında kurulan fütüristik bir terminal ve mobil yapay zekâ ajanıdır. Kullanıcıların mevcut model sağlayıcılarını kodlama, siber güvenlik, araştırma, belge üretimi ve teknik problem çözmede daha fazla kontrolle yönetmesine yardım eder." : t("Aurict is a futuristic terminal and mobile AI agent built around the BYOK model: bring your own key. It helps users manage their existing model providers with more control across coding, cybersecurity, research, document generation, and technical problem solving.")}
          </p>
          <p className="marketing-copy">
            {tr ? "Kullanıcı API anahtarını getirir. Aurict, bu dağınık enerjiyi daha odaklı, gözlemlenebilir ve disiplinli bir iş akışına dönüştürür." : t("The user brings the API key. Aurict turns that scattered energy into a more focused, observable, and disciplined workflow.")}
          </p>
        </ManifestoSection>

        <section style={{ marginBottom: 72 }}>
          <h2 className="marketing-section-title">{tr ? "Üç temel ilke" : t("Three Core Principles")}</h2>
          <div className={`resp-grid-3 ${styles.principles}`} style={{ display: "grid", gridTemplateColumns: "repeat(3, minmax(0, 1fr))", gap: 16 }}>
            {principles.map((item) => (
              <article key={item.label} className={`${styles.principle} marketing-card`} style={{ padding: 22 }}>
                <span className="marketing-tag">{item.label}</span>
                <h3 style={{ color: "var(--text)", fontSize: 22, fontWeight: 600, lineHeight: 1.2, margin: "18px 0 12px" }}>{item.title}</h3>
                <p style={{ color: "var(--text-dim)", fontSize: 15, lineHeight: 1.68 }}>{item.body}</p>
              </article>
            ))}
          </div>
        </section>

        <ManifestoSection title={tr ? "Amacımız: Çok katmanlı bir yapay zekâ ekosistemi kurmak" : t("Our Aim: Building A Multi-Layer AI Ecosystem")}>
          <p className="marketing-copy">
            {tr ? "Aurict henüz erken aşamada. Ancak yön net: tek bir araç değil, birbirini güçlendiren dikey ürünlerden ve platformlardan oluşan bir yapay zekâ ekosistemi." : t("Aurict is still early. But the direction is clear: not a single tool, but an AI ecosystem made of vertical products and platforms that strengthen each other.")}
          </p>
        </ManifestoSection>

        <section className={`resp-grid-3 ${styles.ecosystem}`} style={{ display: "grid", gridTemplateColumns: "repeat(3, minmax(0, 1fr))", gap: 16, marginBottom: 72 }}>
          {ecosystem.map((item) => (
            <article key={item.title} className={`${styles.ecosystemItem} marketing-card`} style={{ padding: 22 }}>
              <h3 style={{ color: "var(--text)", fontSize: 20, fontWeight: 600, lineHeight: 1.25, marginBottom: 12 }}>{item.title}</h3>
              <p style={{ color: "var(--text-dim)", fontSize: 15, lineHeight: 1.68 }}>{item.body}</p>
            </article>
          ))}
        </section>

        <ManifestoSection title={tr ? "Uzun vadeli hedef: Alternatif yaklaşımlar ve erişilebilir LLM'ler" : t("The Long-Term Target: Alternative Approaches And Accessible LLMs")}>
          <p className="marketing-copy">
            {tr ? "Aurict ekosistemi büyüyüp kendi finansal özgürlüğünü kazandıkça, yapay zekânın en büyük sorunlarından ikisine odaklanmak istiyoruz: maliyet ve doğruluk." : t("As the Aurict ecosystem grows and earns its own financial freedom, we want to focus on one of the largest problems in AI: cost and accuracy.")}
          </p>
          <p className="marketing-copy">
            {tr ? "Uzun vadeli hedef, sektörün varsayılan kabullerinin ötesine geçerek daha doğru, daha düşük maliyetli ve daha erişilebilir yapay zekâ modelleri için farklı mimari yaklaşımları denemektir." : t("The long-term goal is to move beyond default industry assumptions and experiment with different architectural approaches, aiming for AI models that are more accurate, lower cost, and more accessible.")}
          </p>
          <p className="marketing-copy">
            {tr ? "Mitte İkarus, kırılgan balmumu kanatlarla güneşe uçtuğu için düştü. Aurict; TDD disiplini, siber güvenlik zırhı, verimli büyüme mühendisliği ve bağımsız ekosistem mimarisiyle güçlendirilmiş kanatlarla güneşe yükselmeyi hedefler." : t("In the myth, Icarus fell because he flew toward the sun with fragile wax wings. Aurict aims to rise toward the sun with wings reinforced by TDD discipline, cybersecurity armor, efficient growth engineering, and an independent ecosystem architecture.")}
          </p>
        </ManifestoSection>

        <section className={`${styles.direction} marketing-card`} style={{ padding: 28, display: "flex", alignItems: "center", justifyContent: "space-between", gap: 22 }}>
          <div>
            <p className="marketing-eyebrow" style={{ marginBottom: 10 }}>{tr ? "Yön" : t("Direction")}</p>
            <h2 style={{ color: "var(--text)", fontSize: 30, fontWeight: 600, lineHeight: 1.18 }}>{tr ? "Manifesto burada. Rota yol haritasında." : t("The manifesto lives here. The route lives in the roadmap.")}</h2>
          </div>
          <Link className="aur-button aur-button-primary" href="/roadmap">{tr ? "yol haritasını aç" : t("open roadmap")}</Link>
        </section>
      </main>
      <Footer />
    </>
  )
}

function ManifestoSection({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section style={{ marginBottom: 58 }}>
      <h2 className="marketing-section-title">{title}</h2>
      <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
        {children}
      </div>
    </section>
  )
}
