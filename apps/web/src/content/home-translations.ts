import type { AppLocale } from "@/i18n/routing"
import { providerCount, providerNames } from "@/content/product-facts"

const providerSummary = providerNames.join(", ")

const faqJsonLdEn = {
  "@context":  "https://schema.org",
  "@type":     "FAQPage",
  "mainEntity": [
    {
      "@type":          "Question",
      "name":           "Is Aurict free?",
      "acceptedAnswer": { "@type": "Answer", "text": "Yes — Aurict is open source under the GNU Affero General Public License v3. You bring your own API key for whichever AI provider you choose. There are no subscription fees for the core tool." },
    },
    {
      "@type":          "Question",
      "name":           "How is Aurict different from Claude Code?",
      "acceptedAnswer": { "@type": "Answer", "text": `Claude Code is Anthropic-first. Aurict supports ${providerCount} built-in providers, 218+ auto-injected skills, a bash command classifier, and runs as a native binary — no Node.js runtime required.` },
    },
    {
      "@type":          "Question",
      "name":           "Does Hoprel work on Windows?",
      "acceptedAnswer": { "@type": "Answer", "text": "Yes. Hoprel by Aurict ships a native Windows x64 desktop workspace. It also has a Debian package; the Aurict terminal runtime remains available separately through npm." },
    },
    {
      "@type":          "Question",
      "name":           "Which AI providers does Aurict support?",
      "acceptedAnswer": { "@type": "Answer", "text": `${providerSummary} — switchable at any time with /providers.` },
    },
    {
      "@type":          "Question",
      "name":           "What does the Aurict mobile app do?",
      "acceptedAnswer": { "@type": "Answer", "text": "Aurict mobile is a bring-your-own-key AI assistant and CLI companion. Users can chat with providers like OpenAI, Anthropic, Google, and OpenRouter, run research tasks, generate PDFs and reports, and approve terminal actions from their phone." },
    },
    {
      "@type":          "Question",
      "name":           "Do I need Node.js installed to run Aurict?",
      "acceptedAnswer": { "@type": "Answer", "text": "No. Aurict installs via npm install -g aurict but runs as a self-contained native binary. Node.js is only needed for the install step itself." },
    },
    {
      "@type":          "Question",
      "name":           "Can I use my existing MCP servers with Aurict?",
      "acceptedAnswer": { "@type": "Answer", "text": "Aurict can import compatible servers from claude_desktop_config.json. Use /mcp to confirm that each configured server connected and to inspect its available tools." },
    },
  ],
}

const faqJsonLdTr = {
  "@context":  "https://schema.org",
  "@type":     "FAQPage",
  "mainEntity": [
    {
      "@type":          "Question",
      "name":           "Aurict ücretsiz mi?",
      "acceptedAnswer": { "@type": "Answer", "text": "Evet — Aurict, GNU Affero Genel Kamu Lisansı v3 kapsamında açık kaynaklıdır. Seçtiğiniz yapay zeka sağlayıcısı için kendi API anahtarınızı getirirsiniz. Çekirdek araç için abonelik ücreti yoktur." },
    },
    {
      "@type":          "Question",
      "name":           "Aurict, Claude Code'tan nasıl farklı?",
      "acceptedAnswer": { "@type": "Answer", "text": `Claude Code Anthropic odaklıdır. Aurict ${providerCount} yerleşik sağlayıcıyı, 218+ otomatik enjekte edilen beceriyi ve bir bash komut sınıflandırıcısını destekler; Node.js çalışma zamanı gerektirmeyen yerel bir ikili dosya olarak çalışır.` },
    },
    {
      "@type":          "Question",
      "name":           "Hoprel Windows'ta çalışır mı?",
      "acceptedAnswer": { "@type": "Answer", "text": "Evet. Aurict by Hoprel, yerel bir Windows x64 masaüstü çalışma alanı sunar. Ayrıca bir Debian paketi de içerir; Aurict terminal çalışma zamanı npm üzerinden ayrı olarak kullanılabilir durumdadır." },
    },
    {
      "@type":          "Question",
      "name":           "Aurict hangi yapay zeka sağlayıcılarını destekliyor?",
      "acceptedAnswer": { "@type": "Answer", "text": `${providerSummary} — /providers ile istediğiniz zaman değiştirilebilir.` },
    },
    {
      "@type":          "Question",
      "name":           "Aurict mobil uygulaması ne yapar?",
      "acceptedAnswer": { "@type": "Answer", "text": "Aurict mobil, kendi anahtarını-getir (BYOK) yapay zeka asistanı ve CLI yoldaşıdır. Kullanıcılar OpenAI, Anthropic, Google ve OpenRouter gibi sağlayıcılarla sohbet edebilir, araştırma görevleri çalıştırabilir, PDF ve raporlar üretebilir ve terminal eylemlerini telefonlarından onaylayabilir." },
    },
    {
      "@type":          "Question",
      "name":           "Aurict'i çalıştırmak için Node.js kurulu olmalı mı?",
      "acceptedAnswer": { "@type": "Answer", "text": "Hayır. Aurict, npm install -g aurict ile kurulur ancak kendi kendine yeten yerel bir ikili dosya olarak çalışır. Node.js yalnızca kurulum adımı için gereklidir." },
    },
    {
      "@type":          "Question",
      "name":           "Mevcut MCP sunucularımı Aurict ile kullanabilir miyim?",
      "acceptedAnswer": { "@type": "Answer", "text": "Aurict, claude_desktop_config.json içindeki uyumlu sunucuları içe aktarabilir. Her yapılandırılmış sunucunun bağlandığını ve araçlarını /mcp ile doğrulayın." },
    },
  ],
}

const howToJsonLdEn = {
  "@context": "https://schema.org",
  "@type":    "HowTo",
  "name":     "How to install and run Aurict",
  "description": "Install and run the open-source Aurict terminal runtime in three steps.",
  "totalTime": "PT1M",
  "step": [
    {
      "@type":    "HowToStep",
      "position": 1,
      "name":     "Install",
      "text":     "Run npm install -g aurict in your terminal. Works on macOS, Linux, and Windows.",
      "url":      "https://aurict.com/#install",
    },
    {
      "@type":    "HowToStep",
      "position": 2,
      "name":     "Run",
      "text":     "Navigate to your project directory and run aurict to launch the terminal UI.",
      "url":      "https://aurict.com/#install",
    },
    {
      "@type":    "HowToStep",
      "position": 3,
      "name":     "Configure",
      "text":     "On first launch, choose a provider, enter your API key, select a model, then choose whether Project Auto may approve bounded file changes in this project for this session.",
      "url":      "https://aurict.com/docs",
    },
  ],
}

const howToJsonLdTr = {
  "@context": "https://schema.org",
  "@type":    "HowTo",
  "name":     "Aurict'i kurma ve çalıştırma",
  "description": "Açık kaynaklı Aurict terminal çalışma zamanını üç adımda kurun ve çalıştırın.",
  "totalTime": "PT1M",
  "step": [
    {
      "@type":    "HowToStep",
      "position": 1,
      "name":     "Kurulum",
      "text":     "Terminalinizde npm install -g aurict komutunu çalıştırın. macOS, Linux ve Windows üzerinde çalışır.",
      "url":      "https://aurict.com/#install",
    },
    {
      "@type":    "HowToStep",
      "position": 2,
      "name":     "Çalıştır",
      "text":     "Proje dizininize gidin ve terminal arayüzünü başlatmak için aurict komutunu çalıştırın.",
      "url":      "https://aurict.com/#install",
    },
    {
      "@type":    "HowToStep",
      "position": 3,
      "name":     "Yapılandır",
      "text":     "İlk başlatmada bir sağlayıcı seçin, API anahtarınızı girin, modeli belirleyin; ardından Project Auto'nun bu projedeki sınırlı dosya değişikliklerini yalnızca bu oturum için onaylamasını isteyip istemediğinizi seçin.",
      "url":      "https://aurict.com/docs",
    },
  ],
}

const jsonLdEn = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type":               "SoftwareApplication",
      "name":                "Aurict",
      "applicationCategory": "DeveloperApplication",
      "operatingSystem":     "macOS, Linux, Windows",
      "description":         "Open-source terminal runtime for multi-agent coding, MCP, local context, and explicit command approvals. Aurict also ships Hoprel, its local-first desktop workspace, and Aurict Mobile.",
      "url":                 "https://aurict.com",
      "downloadUrl":         "https://www.npmjs.com/package/aurict",
      "installUrl":          "https://www.npmjs.com/package/aurict",
      "releaseNotes":        "https://aurict.com/changelog",
      "license":             "https://www.gnu.org/licenses/agpl-3.0.html",
      "author": {
        "@type": "Organization",
        "name":  "aurict",
        "url":   "https://github.com/aurict",
      },
      "offers": {
        "@type":         "Offer",
        "price":         "0",
        "priceCurrency": "USD",
      },
      "screenshot":  "https://aurict.com/opengraph-image",
      "featureList": [
        "9 specialist AI agents (Explore, Code, Review, Test, Docs, Security, Debug, Performance, Analytics)",
        "218+ auto-injected contextual skills",
        "Bash command classifier — dangerous commands require confirmation",
        "MCP client — reads claude_desktop_config.json",
        `Multi-provider: ${providerSummary}`,
        "Project Auto for bounded project file changes; exceptions still require direct approval",
        "Durable completion proof with verification evidence and open work",
        "Mobile BYOK AI assistant for chat, research, PDF generation, and reports",
        "Mobile CLI companion for browser login, permission approvals, and live session control",
        "Design agent wizard with 150+ design systems",
        "Persistent memory across sessions",
        "Custom tool and skill loader",
        "Session checkpoint and branching",
      ],
    },
    {
      "@type":               "SoftwareApplication",
      "name":                "Hoprel by Aurict",
      "applicationCategory": "ProductivityApplication",
      "operatingSystem":     "Windows, Debian / Ubuntu",
      "description":         "A local-first desktop AI workspace for conversations, files, artifacts, design, finance research, deterministic calculations, and mobile remote control.",
      "url":                 "https://aurict.com/downloads",
      "downloadUrl":         "https://aurict.com/downloads",
      "author": { "@type": "Organization", "name": "Aurict", "url": "https://aurict.com" },
      "offers": { "@type": "Offer", "price": "0", "priceCurrency": "USD" },
    },
    {
      "@type":       "WebSite",
      "url":         "https://aurict.com",
      "name":        "Aurict",
      "description": "Agentic workspaces across Hoprel desktop, Aurict Mobile, and the terminal runtime",
    },
    {
      "@type":  "Organization",
      "name":   "aurict",
      "url":    "https://aurict.com",
      "sameAs": [
        "https://github.com/aurict/aurict",
        "https://www.npmjs.com/package/aurict",
      ],
    },
  ],
}

const jsonLdTr = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type":               "SoftwareApplication",
      "name":                "Aurict",
      "applicationCategory": "DeveloperApplication",
      "operatingSystem":     "macOS, Linux, Windows",
      "description":         "Çoklu ajan kodlama, MCP, yerel bağlam ve açık komut onayları için açık kaynaklı terminal çalışma zamanı. Aurict ayrıca yerel öncelikli masaüstü çalışma alanı olan Hoprel'i ve Aurict Mobile'ı sunar.",
      "url":                 "https://aurict.com",
      "downloadUrl":         "https://www.npmjs.com/package/aurict",
      "installUrl":          "https://www.npmjs.com/package/aurict",
      "releaseNotes":        "https://aurict.com/changelog",
      "license":             "https://www.gnu.org/licenses/agpl-3.0.html",
      "author": {
        "@type": "Organization",
        "name":  "aurict",
        "url":   "https://github.com/aurict",
      },
      "offers": {
        "@type":         "Offer",
        "price":         "0",
        "priceCurrency": "USD",
      },
      "screenshot":  "https://aurict.com/opengraph-image",
      "featureList": [
        "9 uzman yapay zeka ajanı (Explore, Code, Review, Test, Docs, Security, Debug, Performance, Analytics)",
        "218+ otomatik enjekte edilen bağlamsal beceri",
        "Bash komut sınıflandırıcı — tehlikeli komutlar onay gerektirir",
        "MCP istemcisi — claude_desktop_config.json dosyasını okur",
        `Çoklu sağlayıcı: ${providerSummary}`,
        "Proje içindeki sınırlı dosya değişiklikleri için Project Auto; istisnalar doğrudan onay gerektirir",
        "Doğrulama kanıtı ve açık işleri içeren kalıcı tamamlanma kaydı",
        "Sohbet, araştırma, PDF oluşturma ve raporlar için mobil BYOK yapay zeka asistanı",
        "Tarayıcı girişi, izin onayları ve canlı oturum kontrolü için mobil CLI yoldaşı",
        "150+ tasarım sistemine sahip tasarım ajanı sihirbazı",
        "Oturumlar arası kalıcı bellek",
        "Özel araç ve beceri yükleyici",
        "Oturum kontrol noktası ve dallanma",
      ],
    },
    {
      "@type":               "SoftwareApplication",
      "name":                "Hoprel by Aurict",
      "applicationCategory": "ProductivityApplication",
      "operatingSystem":     "Windows, Debian / Ubuntu",
      "description":         "Sohbetler, dosyalar, yapıtlar, tasarım, finans araştırması, deterministik hesaplamalar ve mobil uzaktan kontrol için yerel öncelikli bir masaüstü yapay zeka çalışma alanı.",
      "url":                 "https://aurict.com/downloads",
      "downloadUrl":         "https://aurict.com/downloads",
      "author": { "@type": "Organization", "name": "Aurict", "url": "https://aurict.com" },
      "offers": { "@type": "Offer", "price": "0", "priceCurrency": "USD" },
    },
    {
      "@type":       "WebSite",
      "url":         "https://aurict.com",
      "name":        "Aurict",
      "description": "Hoprel masaüstü, Aurict Mobile ve terminal çalışma zamanı arasında ajan tabanlı çalışma alanları",
    },
    {
      "@type":  "Organization",
      "name":   "aurict",
      "url":    "https://aurict.com",
      "sameAs": [
        "https://github.com/aurict/aurict",
        "https://www.npmjs.com/package/aurict",
      ],
    },
  ],
}

export function localizeFaqJsonLd(locale: AppLocale) {
  return locale === "tr" ? faqJsonLdTr : faqJsonLdEn
}

export function localizeHowToJsonLd(locale: AppLocale) {
  return locale === "tr" ? howToJsonLdTr : howToJsonLdEn
}

export function localizeHomeJsonLd(locale: AppLocale) {
  return locale === "tr" ? jsonLdTr : jsonLdEn
}

// ─── UI section copy (Hero, Features, FAQ, Why, Install, Social, Waitlist) ──────

export interface FeatureItem {
  icon: string
  title: string
  description: string
  tag: string
  color: string
}

export interface ProFeatureItem {
  title: string
  description: string
}

export interface FaqItem {
  q: string
  a: string
}

export interface WhyStatItem {
  value: string
  label: string
  detail: string
}

export interface DifferentiatorItem {
  index: string
  title: string
  body: string
}

export interface InstallStep {
  step: string
  title: string
  code: string
  note: string
}

export interface SocialProofItem {
  label: string
  cta: string
}

export interface HeroCopy {
  eyebrow: string
  title: string
  subcopy: string
  githubCta: string
  systemLines: { label: string; value: string }[]
  stats: { value: string; label: string }[]
}

export interface StrongPart {
  text: string
  strong: boolean
}

export interface HomeCopy {
  features: { eyebrow: string; title1: string; title2: string }
  faq: { eyebrow: string; title: string }
  why: { eyebrow: string; title: string; subcopy: string }
  install: {
    eyebrow: string
    title1: string
    title2: string
    securityHeader: string
    securityParts: StrongPart[]
    copy: string
    copied: string
  }
  waitlist: {
    eyebrow: string
    title1: string
    title2: string
    subcopy: string
    errorEmail: string
    errorGeneric: string
    joining: string
    join: string
    successTitle: string
    successBody: string
    countJoined: string
    proComingSoon: string
    proFounding: string
    unlockCta: string
  }
  socialProof: { heading: string }
}

const FEATURES_EN: FeatureItem[] = [
  {
    icon: "agents",
    title: "Multi-Agent Orchestration",
    description:
      "9 specialist agents running in isolated worker threads. Explore, code, review, test, docs, security, debug, performance, analytics — each a domain expert.",
    tag: "Architecture",
    color: "#818cf8",
  },
  {
    icon: "skills",
    title: "218+ Contextual Skills",
    description:
      "Aurict scans your project before you say a word — framework, language, config, conventions. The right context is injected automatically.",
    tag: "Intelligence",
    color: "#a78bfa",
  },
  {
    icon: "classifier",
    title: "Bash Classifier",
    description:
      "Every shell command is analyzed before execution. Safe commands run instantly. Dangerous ones (rm -rf, format) trigger strict confirmation with red warnings.",
    tag: "Security",
    color: "#f59e0b",
  },
  {
    icon: "sandbox",
    title: "Sandbox Execution",
    description:
      "Risky executables run through a low-overhead policy sandbox: command classification, approvals, protected paths, scrubbed env, timeouts, output limits, and audit trails. Docker remains optional for heavier isolation.",
    tag: "Security",
    color: "#ff6b6b",
  },
  {
    icon: "mcp",
    title: "MCP Client",
    description:
      "Import compatible claude_desktop_config.json entries, then inspect each connected MCP server and its tools before relying on it.",
    tag: "Integration",
    color: "#4eba65",
  },
  {
    icon: "design",
    title: "Design Agent Wizard",
    description:
      "150+ design systems, 111 skill templates. Describe your UI idea, pick a system and skill, and a complete implementation prompt is built for you.",
    tag: "Design",
    color: "#06b6d4",
  },
  {
    icon: "windows",
    title: "Windows Native",
    description:
      "A real compiled binary for Windows x64 — no WSL, no extra runtime, no PowerShell gymnastics. Shell detection auto-picks Git Bash, MSYS2, or PowerShell as fallback.",
    tag: "Platform",
    color: "#38bdf8",
  },
  {
    icon: "memory",
    title: "Persistent Memory",
    description:
      "Project decisions, coding preferences, and team conventions stored in a local DB and recalled per-session. The AI remembers what you told it — across every restart.",
    tag: "Intelligence",
    color: "#fb7185",
  },
]

const FEATURES_TR: FeatureItem[] = [
  {
    icon: "agents",
    title: "Çoklu Ajan Orkestrasyonu",
    description:
      "Yalıtılmış worker thread'lerinde çalışan 9 uzman ajan. Keşfet, kodla, incele, test et, dokümanla, güvenliği sağla, hataları ayıkla, performansı ölç ve analiz et — her biri bir uzmanlık alanı.",
    tag: "Mimari",
    color: "#818cf8",
  },
  {
    icon: "skills",
    title: "218+ Bağlamsal Beceri",
    description:
      "Aurict, tek kelime etmeden önce projeni tarar — framework, dil, yapılandırma, kurallar. Doğru bağlam otomatik olarak enjekte edilir.",
    tag: "Zeka",
    color: "#a78bfa",
  },
  {
    icon: "classifier",
    title: "Bash Sınıflandırıcı",
    description:
      "Her kabuk komutu çalıştırılmadan önce analiz edilir. Güvenli komutlar anında çalışır. Tehlikeli olanlar (rm -rf, format) kırmızı uyarılarla sıkı onay gerektirir.",
    tag: "Güvenlik",
    color: "#f59e0b",
  },
  {
    icon: "sandbox",
    title: "Sandbox Yürütme",
    description:
      "Riskli çalıştırılabilirler düşük yük maliyetli bir politika sandbox'ından geçer: komut sınıflandırma, onaylar, korunan yollar, temizlenmiş ortam, zaman aşımı, çıktı sınırları ve denetim izleri. Docker, daha ağır izolasyon için isteğe bağlı kalır.",
    tag: "Güvenlik",
    color: "#ff6b6b",
  },
  {
    icon: "mcp",
    title: "MCP İstemcisi",
    description:
      "Uyumlu claude_desktop_config.json girdilerini içe aktarın; ardından güvenmeden önce bağlı her MCP sunucusunu ve araçlarını inceleyin.",
    tag: "Entegrasyon",
    color: "#4eba65",
  },
  {
    icon: "design",
    title: "Tasarım Ajanı Sihirbazı",
    description:
      "150+ tasarım sistemi, 111 beceri şablonu. UI fikrini anlat, bir sistem ve beceri seç; senin için eksiksiz bir uygulama prompt'u oluşturulsun.",
    tag: "Tasarım",
    color: "#06b6d4",
  },
  {
    icon: "windows",
    title: "Windows Yerel",
    description:
      "Windows x64 için gerçek bir derlenmiş ikili — WSL yok, ek runtime yok, PowerShell cambazlığı yok. Kabuk tespiti yedek olarak Git Bash, MSYS2 veya PowerShell'i otomatik seçer.",
    tag: "Platform",
    color: "#38bdf8",
  },
  {
    icon: "memory",
    title: "Kalıcı Hafıza",
    description:
      "Proje kararları, kodlama tercihleri ve ekip kuralları yerel bir veritabanında saklanır ve oturum bazında hatırlanır. Yapay zeka, söylediklerini her yeniden başlatmada hatırlar.",
    tag: "Zeka",
    color: "#fb7185",
  },
]

export function localizeFeatures(locale: AppLocale): FeatureItem[] {
  return locale === "tr" ? FEATURES_TR : FEATURES_EN
}

const PRO_FEATURES_EN: ProFeatureItem[] = [
  { title: "Cloud sync", description: "Sessions and memories synced across machines" },
  { title: "Team workspace", description: "Shared context, skills, and agents for your team" },
  { title: "Analytics dashboard", description: "Token usage, cost tracking, agent performance" },
  { title: "Priority support", description: "Direct access to the team" },
]

const PRO_FEATURES_TR: ProFeatureItem[] = [
  { title: "Bulut senkronizasyonu", description: "Oturumlar ve hafıza makineler arasında senkronlanır" },
  { title: "Ekip çalışma alanı", description: "Ekibin için paylaşılan bağlam, beceriler ve ajanlar" },
  { title: "Analitik panosu", description: "Token kullanımı, maliyet takibi, ajan performansı" },
  { title: "Öncelikli destek", description: "Ekibe doğrudan erişim" },
]

export function localizeProFeatures(locale: AppLocale): ProFeatureItem[] {
  return locale === "tr" ? PRO_FEATURES_TR : PRO_FEATURES_EN
}

const FAQS_EN: FaqItem[] = [
  {
    q: "Is Aurict free?",
    a: "Yes — Aurict is open source under the GNU Affero General Public License v3. You bring your own API key for whichever AI provider you choose. There are no subscription fees for the core tool. Pro features (cloud sync, team workspaces, analytics) are planned and will have a paid tier.",
  },
  {
    q: "How is Aurict different from Claude Code?",
    a: `Claude Code is Anthropic-first. Aurict supports ${providerCount} built-in providers (${providerSummary}), 218+ auto-injected skills, a bash command classifier, and runs as a native compiled binary — no Node.js runtime required.`,
  },
  {
    q: "Does Aurict work on Windows?",
    a: "Yes. Aurict ships a native compiled binary for Windows x64 — no WSL, no PowerShell gymnastics, no extra runtime. Shell detection auto-picks Git Bash, MSYS2, or PowerShell as fallback.",
  },
  {
    q: "Which AI providers does Aurict support?",
    a: `${providerSummary}. Switch between them at any time with /providers.`,
  },
  {
    q: "Do I need Node.js installed?",
    a: "No. Aurict installs via npm install -g aurict but runs as a self-contained native binary. Node.js is only needed for the install step itself, not for running the tool.",
  },
  {
    q: "Can I use my existing MCP servers?",
    a: "Aurict can import compatible servers from claude_desktop_config.json. Use /mcp to confirm that each configured server connected and to inspect its available tools.",
  },
  {
    q: "How do I add my API key?",
    a: "The first time you run Aurict, an interactive setup wizard walks you through choosing a provider and entering your API key. You can also use /config set <provider> <key> at any time inside the terminal UI.",
  },
]

const FAQS_TR: FaqItem[] = [
  {
    q: "Aurict ücretsiz mi?",
    a: "Evet — Aurict, GNU Affero Genel Kamu Lisansı v3 kapsamında açık kaynaktır. Seçtiğin yapay zeka sağlayıcısı için kendi API anahtarını sen getirirsin. Temel araç için abonelik ücreti yoktur. Pro özellikleri (bulut senkronizasyonu, ekip çalışma alanları, analitik) planlandı ve ücretli bir katmanı olacak.",
  },
  {
    q: "Aurict, Claude Code'tan nasıl farklı?",
    a: `Claude Code Anthropic odaklıdır. Aurict ${providerCount} yerleşik sağlayıcıyı (${providerSummary}), 218+ otomatik enjekte edilen beceriyi ve bir bash komut sınıflandırıcıyı destekler; Node.js runtime gerektirmeyen yerel derlenmiş bir ikili olarak çalışır.`,
  },
  {
    q: "Aurict Windows'ta çalışır mı?",
    a: "Evet. Aurict, Windows x64 için yerel derlenmiş bir ikili sunar — WSL yok, PowerShell cambazlığı yok, ek runtime yok. Kabuk tespiti yedek olarak Git Bash, MSYS2 veya PowerShell'i otomatik seçer.",
  },
  {
    q: "Aurict hangi yapay zeka sağlayıcılarını destekliyor?",
    a: `${providerSummary}. Aralarında istediğin an /providers ile geçiş yap.`,
  },
  {
    q: "Node.js kurulu olmalı mı?",
    a: "Hayır. Aurict, npm install -g aurict ile kurulur ama kendi kendine yeten yerel bir ikili olarak çalışır. Node.js yalnızca kurulum adımı için gerekir, aracı çalıştırmak için değil.",
  },
  {
    q: "Mevcut MCP sunucularımı kullanabilir miyim?",
    a: "Aurict, claude_desktop_config.json içindeki uyumlu sunucuları içe aktarabilir. Kullanmadan önce her bağlantıyı ve kullanılabilir aracı /mcp içinde doğrulayın.",
  },
  {
    q: "API anahtarımı nasıl eklerim?",
    a: "Aurict'ı ilk çalıştırdığında, etkileşimli kurulum sihirbazı seni bir sağlayıcı seçip API anahtarını girme konusunda yönlendirir. Terminal arayüzünün içinde istediğin an /config set <sağlayıcı> <anahtar> komutunu da kullanabilirsin.",
  },
]

export function localizeFaqs(locale: AppLocale): FaqItem[] {
  return locale === "tr" ? FAQS_TR : FAQS_EN
}

const WHY_STATS_EN: WhyStatItem[] = [
  {
    value: "9",
    label: "specialist agents",
    detail: "Explore, code, review, test, docs, security, debug, performance, analytics.",
  },
  {
    value: "218+",
    label: "contextual skills",
    detail: "Framework and project signals select the right context without manual attachment.",
  },
  {
    value: "native",
    label: "macOS · Linux · Windows",
    detail: "Installed through npm, executed as a compiled standalone binary.",
  },
]

const WHY_STATS_TR: WhyStatItem[] = [
  {
    value: "9",
    label: "uzman ajan",
    detail: "Keşfet, kodla, incele, test et, dokümanla, güvenliği sağla, hataları ayıkla, performansı ölç, analiz et.",
  },
  {
    value: "218+",
    label: "bağlamsal beceri",
    detail: "Framework ve proje sinyalleri, manuel ekleme olmadan doğru bağlamı seçer.",
  },
  {
    value: "native",
    label: "macOS · Linux · Windows",
    detail: "npm ile kurulur, derlenmiş bağımsız bir ikili olarak çalıştırılır.",
  },
]

export function localizeWhyStats(locale: AppLocale): WhyStatItem[] {
  return locale === "tr" ? WHY_STATS_TR : WHY_STATS_EN
}

const DIFFERENTIATORS_EN: DifferentiatorItem[] = [
  {
    index: "01",
    title: "Coordinator-first architecture",
    body: "Aurict routes work through specialized agents instead of hoping a single prompt keeps every concern in memory.",
  },
  {
    index: "02",
    title: "Context is treated as infrastructure",
    body: "Static, session, dynamic, skills, memories, tools, and cached boundaries are separated so attention is not wasted.",
  },
  {
    index: "03",
    title: "Tools are gated, not blindly exposed",
    body: "Bash classification, sandbox policy, approvals, protected paths, output limits, and optional security profiles keep execution controlled.",
  },
  {
    index: "04",
    title: "Open where it matters",
    body: "Use your own model provider, MCP servers, skills, slash commands, and workflows without moving the codebase into a vendor IDE.",
  },
]

const DIFFERENTIATORS_TR: DifferentiatorItem[] = [
  {
    index: "01",
    title: "Önce koordinatör mimarisi",
    body: "Aurict, tek bir prompt'un her konuyu bellekte tutmasını umaktansa işi uzmanlaşmış ajanlar üzerinden yönlendirir.",
  },
  {
    index: "02",
    title: "Bağlam altyapı olarak ele alınır",
    body: "Statik, oturum, dinamik, beceri, hafıza, araç ve önbelleğe alınmış sınırlar ayrılır; böylece dikkat boşa harcanmaz.",
  },
  {
    index: "03",
    title: "Araçlar denetimli açılır, körü körüne serbest bırakılmaz",
    body: "Bash sınıflandırma, sandbox politikası, onaylar, korunan yollar, çıktı sınırları ve isteğe bağlı güvenlik profilleri yürütmeyi denetimli tutar.",
  },
  {
    index: "04",
    title: "Önemli yerde açık",
    body: "Kod tabanını bir satıcı IDE'sine taşımadan kendi model sağlayıcını, MCP sunucularını, becerilerini, slash komutlarını ve iş akışlarını kullan.",
  },
]

export function localizeDifferentiators(locale: AppLocale): DifferentiatorItem[] {
  return locale === "tr" ? DIFFERENTIATORS_TR : DIFFERENTIATORS_EN
}

const INSTALL_STEPS_EN: InstallStep[] = [
  {
    step: "01",
    title: "Install",
    code: "curl -fsSL https://aurict.com/install.sh | bash",
    note: "Mac and Linux — no Node, Bun, or sudo.",
  },
  {
    step: "02",
    title: "Run",
    code: "aurict",
    note: "Launch in any project directory.",
  },
  {
    step: "03",
    title: "Configure",
    code: "# Pick provider, API key, model, and security mode",
    note: "Interactive setup keeps security tools off unless you opt in.",
  },
  {
    step: "04",
    title: "Security",
    code: "aurict /config security active-lite",
    note: "Optional. Targets still need /config security allow <target>.",
  },
]

const INSTALL_STEPS_TR: InstallStep[] = [
  {
    step: "01",
    title: "Kur",
    code: "curl -fsSL https://aurict.com/install.sh | bash",
    note: "Mac ve Linux — Node, Bun veya sudo gerekmez.",
  },
  {
    step: "02",
    title: "Çalıştır",
    code: "aurict",
    note: "Herhangi bir proje dizininde başlat.",
  },
  {
    step: "03",
    title: "Yapılandır",
    code: "# Sağlayıcı, API anahtarı, model ve güvenlik modu seç",
    note: "Etkileşimli kurulum, sen açmayı seçene kadar güvenlik araçlarını kapalı tutar.",
  },
  {
    step: "04",
    title: "Güvenlik",
    code: "aurict /config security active-lite",
    note: "İsteğe bağlı. Hedefler hâlâ /config security allow <hedef> gerektirir.",
  },
]

export function localizeInstallSteps(locale: AppLocale): InstallStep[] {
  return locale === "tr" ? INSTALL_STEPS_TR : INSTALL_STEPS_EN
}

const SOCIAL_PROOF_EN: SocialProofItem[] = [
  { label: "Open source on GitHub", cta: "Star ★" },
  { label: "npm install -g aurict", cta: "View on npm" },
  { label: "AGPLv3 licensed", cta: "Read license" },
  { label: "macOS · Linux · Windows", cta: "See install options" },
]

const SOCIAL_PROOF_TR: SocialProofItem[] = [
  { label: "GitHub'da açık kaynak", cta: "Yıldızla ★" },
  { label: "npm install -g aurict", cta: "npm'de gör" },
  { label: "AGPLv3 lisanslı", cta: "Lisansı oku" },
  { label: "macOS · Linux · Windows", cta: "Kurulum seçeneklerine bak" },
]

export function localizeSocialProof(locale: AppLocale): SocialProofItem[] {
  return locale === "tr" ? SOCIAL_PROOF_TR : SOCIAL_PROOF_EN
}

const HERO_EN: HeroCopy = {
  eyebrow: "open-source terminal ai agent",
  title: "Your terminal, rebuilt as an agent runtime.",
  subcopy:
    "Aurict coordinates specialist agents, project-aware skills, sandboxed tools, and any model provider without forcing you into an IDE or proprietary cloud.",
  githubCta: "star on GitHub",
  systemLines: [
    { label: "agents", value: "explore · code · review · test · docs · security" },
    { label: "context", value: "skills loaded lazily, cache boundary preserved" },
    { label: "guardrails", value: "sandbox policy active, approvals required" },
  ],
  stats: [
    { value: "9", label: "specialist agents" },
    { value: "218+", label: "contextual skills" },
    { value: "3", label: "native platforms" },
  ],
}

const HERO_TR: HeroCopy = {
  eyebrow: "açık kaynak terminal yapay zeka ajanı",
  title: "Terminalin, bir ajan çalışma ortamına dönüştü.",
  subcopy:
    "Aurict, seni bir IDE'ye veya özel buluta zorlamadan uzman ajanları, proje farkında becerileri, sandbox'a alınmış araçları ve herhangi bir model sağlayıcıyı koordine eder.",
  githubCta: "GitHub'da yıldızla",
  systemLines: [
    { label: "agents", value: "keşfet · kodla · incele · test et · dokümanla · güvenlik" },
    { label: "context", value: "beceriler tembel yüklenir, önbellek sınırı korunur" },
    { label: "guardrails", value: "sandbox politikası aktif, onay gerekli" },
  ],
  stats: [
    { value: "9", label: "uzman ajanlar" },
    { value: "218+", label: "bağlamsal beceriler" },
    { value: "3", label: "yerel platformlar" },
  ],
}

export function localizeHero(locale: AppLocale): HeroCopy {
  return locale === "tr" ? HERO_TR : HERO_EN
}

const HOME_COPY_EN: HomeCopy = {
  features: {
    eyebrow: "Capabilities",
    title1: "Not just autocomplete.",
    title2: "An AI team in your terminal.",
  },
  faq: {
    eyebrow: "FAQ",
    title: "Common questions",
  },
  why: {
    eyebrow: "why aurict",
    title: "Not a chat box. A runtime for real developer work.",
    subcopy:
      "The design is opinionated: keep the model focused, keep tools accountable, and make long-running tasks survive real project complexity.",
  },
  install: {
    eyebrow: "Get started",
    title1: "Up and running in",
    title2: "30 seconds.",
    securityHeader: "Optional security capability",
    securityParts: [
      { text: "Aurict starts with security tools hidden from the model. Choose ", strong: false },
      { text: "Passive", strong: true },
      { text: " for defensive review and reporting, ", strong: false },
      { text: "Active Lite", strong: true },
      { text: " for controlled Docker-backed scans, or ", strong: false },
      { text: "Kali Full", strong: true },
      {
        text: " only when you want the larger experimental image. Active profiles still require Docker, an allowlisted target, permission approval, rate limits, and concurrency limits.",
        strong: false,
      },
    ],
    copy: "copy",
    copied: "copied!",
  },
  waitlist: {
    eyebrow: "Early access",
    title1: "Be first.",
    title2: "Shape the product.",
    subcopy:
      "Aurict is free and open source. Pro features are coming — early members get founding pricing, priority access, and a direct line to the team.",
    errorEmail: "Enter a valid email.",
    errorGeneric: "Something went wrong. Please try again.",
    joining: "Joining...",
    join: "Join →",
    successTitle: "You're on the list!",
    successBody: "#{count} — we'll email you when Pro launches.",
    countJoined: "developers already joined",
    proComingSoon: "Coming soon",
    proFounding: "Founding pricing",
    unlockCta: "Unlock with early access →",
  },
  socialProof: {
    heading: "Free and open source",
  },
}

const HOME_COPY_TR: HomeCopy = {
  features: {
    eyebrow: "Yetenekler",
    title1: "Yalnızca otomatik tamamlama değil.",
    title2: "Terminalinde bir yapay zeka ekibi.",
  },
  faq: {
    eyebrow: "SSS",
    title: "Sıkça sorulan sorular",
  },
  why: {
    eyebrow: "neden aurict",
    title: "Bir sohbet kutusu değil. Gerçek geliştirici işi için bir çalışma ortamı.",
    subcopy:
      "Tasarım görüş sahibi: modeli odaklı tut, araçları sorumlu kılm ve uzun süren görevlerin gerçek proje karmaşasında ayakta kalmasını sağla.",
  },
  install: {
    eyebrow: "Başlarken",
    title1: "Çalışır durumda,",
    title2: "30 saniyede.",
    securityHeader: "İsteğe bağlı güvenlik yeteneği",
    securityParts: [
      { text: "Aurict, güvenlik araçlarını modelden gizli olarak başlatır. Savunma amaçlı inceleme ve raporlama için ", strong: false },
      { text: "Pasif", strong: true },
      { text: "'i, denetimli Docker destekli taramalar için ", strong: false },
      { text: "Active Lite", strong: true },
      { text: "'ı veya daha büyük deneysel imajı yalnızca istediğinde ", strong: false },
      { text: "Kali Full", strong: true },
      {
        text: "'ı seç. Aktif profiller hâlâ Docker, izin verilen hedef, izin onayı, hız sınırı ve eşzamanlılık sınırı gerektirir.",
        strong: false,
      },
    ],
    copy: "kopyala",
    copied: "kopyalandı!",
  },
  waitlist: {
    eyebrow: "Erken erişim",
    title1: "İlk sen ol.",
    title2: "Ürünü şekillendir.",
    subcopy:
      "Aurict ücretsiz ve açık kaynaktır. Pro özellikleri geliyor — erken üyeler kurucu fiyatlandırması, öncelikli erişim ve ekibe doğrudan hat kazanır.",
    errorEmail: "Geçerli bir e-posta gir.",
    errorGeneric: "Bir şeyler ters gitti. Lütfen tekrar dene.",
    joining: "Katılıyor...",
    join: "Katıl →",
    successTitle: "Listedesin!",
    successBody: "#{count} — Pro çıkınca sana e-posta göndereceğiz.",
    countJoined: "geliştirici zaten katıldı",
    proComingSoon: "Yakında",
    proFounding: "Kurucu fiyatlandırması",
    unlockCta: "Erken erişimle kilidini aç →",
  },
  socialProof: {
    heading: "Ücretsiz ve açık kaynak",
  },
}

export function localizeHomeCopy(locale: AppLocale): HomeCopy {
  return locale === "tr" ? HOME_COPY_TR : HOME_COPY_EN
}
