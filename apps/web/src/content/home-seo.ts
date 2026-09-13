import { localizeCapabilityItems, localizeFaqs } from "@/content/landing-translations"
import { providerCount } from "@/content/product-facts"
import type { AppLocale } from "@/i18n/config"
import { localizedUrl } from "@/i18n/metadata"

type HomeSeoCopy = {
  title: string
  description: string
  keywords: string[]
  howToName: string
  howToDescription: string
  install: string
  run: string
  configure: string
  installText: string
  runText: string
  configureText: string
}

const copy: Record<AppLocale, HomeSeoCopy> = {
  en: {
    title: "Aurict — Open-Source Terminal Agent & AI Coding Runtime",
    description: "Open-source terminal agent for multi-agent AI coding, MCP, local project context, BYOK model providers, explicit approvals, and verified developer workflows.",
    keywords: ["terminal agent", "open source terminal agent", "AI coding agent", "terminal AI assistant", "multi-agent coding", "MCP client", "CLI coding assistant", "BYOK AI agent"],
    howToName: "How to install the Aurict terminal agent", howToDescription: "Install and start the open-source Aurict terminal agent in three steps.", install: "Install Aurict", run: "Start the terminal agent", configure: "Choose a model provider", installText: "Run npm install -g aurict in your terminal.", runText: "Open a project directory and run aurict.", configureText: "Choose a supported provider, add your API key, and select a model.",
  },
  tr: {
    title: "Aurict — Açık Kaynak Terminal Ajanı ve Yapay Zekâ Kodlama",
    description: "Çoklu ajanlı yapay zekâ kodlama, MCP, yerel proje bağlamı, BYOK sağlayıcılar, açık onaylar ve doğrulanmış iş akışları için açık kaynak terminal ajanı.",
    keywords: ["terminal ajanı", "açık kaynak terminal ajanı", "yapay zekâ kodlama ajanı", "terminal yapay zekâ asistanı", "çoklu ajan kodlama", "MCP istemcisi", "CLI kodlama asistanı"],
    howToName: "Aurict terminal ajanı nasıl kurulur?", howToDescription: "Açık kaynak Aurict terminal ajanını üç adımda kurun ve başlatın.", install: "Aurict'i kur", run: "Terminal ajanını başlat", configure: "Model sağlayıcısı seç", installText: "Terminalinizde npm install -g aurict komutunu çalıştırın.", runText: "Bir proje dizini açın ve aurict komutunu çalıştırın.", configureText: "Desteklenen bir sağlayıcı seçin, API anahtarınızı ekleyin ve modeli belirleyin.",
  },
  de: {
    title: "Aurict — Open-Source-Terminal-Agent für KI-Coding",
    description: "Open-Source-Terminal-Agent für Multi-Agent-KI-Coding, MCP, lokalen Projektkontext, eigene Modellanbieter, explizite Freigaben und verifizierte Entwicklerabläufe.",
    keywords: ["Terminal Agent", "Open Source Terminal Agent", "KI Coding Agent", "Terminal KI Assistent", "Multi-Agent Coding", "MCP Client", "CLI Coding Assistent"],
    howToName: "Aurict Terminal-Agent installieren", howToDescription: "Installieren und starten Sie den Open-Source-Terminal-Agenten Aurict in drei Schritten.", install: "Aurict installieren", run: "Terminal-Agent starten", configure: "Modellanbieter wählen", installText: "Führen Sie npm install -g aurict im Terminal aus.", runText: "Öffnen Sie ein Projektverzeichnis und führen Sie aurict aus.", configureText: "Wählen Sie einen Anbieter, hinterlegen Sie Ihren API-Schlüssel und wählen Sie ein Modell.",
  },
  fr: {
    title: "Aurict — Agent de terminal open source pour coder avec l’IA",
    description: "Agent de terminal open source pour le code IA multi-agent, MCP, le contexte local, les fournisseurs BYOK, les approbations et les workflows vérifiés.",
    keywords: ["agent de terminal", "agent terminal open source", "agent de code IA", "assistant IA terminal", "code multi-agent", "client MCP", "assistant de code CLI"],
    howToName: "Installer l’agent de terminal Aurict", howToDescription: "Installez et lancez l’agent de terminal open source Aurict en trois étapes.", install: "Installer Aurict", run: "Lancer l’agent", configure: "Choisir un fournisseur", installText: "Exécutez npm install -g aurict dans le terminal.", runText: "Ouvrez un dossier de projet et exécutez aurict.", configureText: "Choisissez un fournisseur compatible, ajoutez votre clé API et sélectionnez un modèle.",
  },
  es: {
    title: "Aurict — Agente terminal open source para código con IA",
    description: "Agente de terminal de código abierto para programación multiagente con IA, MCP, contexto local, proveedores BYOK, aprobaciones explícitas y flujos verificados.",
    keywords: ["agente de terminal", "agente terminal código abierto", "agente de programación IA", "asistente IA terminal", "programación multiagente", "cliente MCP", "asistente de código CLI"],
    howToName: "Instalar el agente de terminal Aurict", howToDescription: "Instala e inicia el agente de terminal de código abierto Aurict en tres pasos.", install: "Instalar Aurict", run: "Iniciar el agente", configure: "Elegir proveedor", installText: "Ejecuta npm install -g aurict en la terminal.", runText: "Abre un directorio de proyecto y ejecuta aurict.", configureText: "Elige un proveedor compatible, añade tu clave API y selecciona un modelo.",
  },
}

export function localizeHomeSeo(locale: AppLocale) {
  return copy[locale]
}

export function homeStructuredData(locale: AppLocale) {
  const seo = copy[locale]
  const url = localizedUrl("/", locale)
  const faqs = localizeFaqs(locale)
  const docsLocale = locale

  return {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "WebSite", "@id": "https://aurict.com/#website", url: "https://aurict.com", name: "Aurict", alternateName: "Aurict AI", inLanguage: ["en", "tr", "de", "fr", "es"],
        description: seo.description, publisher: { "@id": "https://aurict.com/#organization" },
      },
      {
        "@type": "Organization", "@id": "https://aurict.com/#organization", name: "Aurict", url: "https://aurict.com",
        logo: { "@type": "ImageObject", url: "https://aurict.com/aurict-logo-v5.svg" },
        sameAs: ["https://github.com/aurict/aurict", "https://www.npmjs.com/package/aurict"],
      },
      {
        "@type": "WebPage", "@id": `${url}#webpage`, url, name: seo.title, description: seo.description,
        inLanguage: locale, isPartOf: { "@id": "https://aurict.com/#website" }, mainEntity: { "@id": "https://aurict.com/#software" },
      },
      {
        "@type": "SoftwareApplication", "@id": "https://aurict.com/#software", name: "Aurict", alternateName: ["Aurict Terminal Agent", "Aurict AI Coding Agent"],
        applicationCategory: "DeveloperApplication", applicationSubCategory: "AI coding agent", operatingSystem: "macOS, Linux, Windows",
        description: seo.description, url, downloadUrl: "https://www.npmjs.com/package/aurict", installUrl: "https://aurict.com/install.sh",
        codeRepository: "https://github.com/aurict/aurict", license: "https://www.gnu.org/licenses/agpl-3.0.html",
        featureList: localizeCapabilityItems(locale).map(([title]) => title),
        offers: { "@type": "Offer", price: "0", priceCurrency: "USD" },
        author: { "@id": "https://aurict.com/#organization" },
        softwareHelp: { "@type": "CreativeWork", url: localizedUrl("/docs", docsLocale), inLanguage: docsLocale },
        softwareRequirements: `${providerCount} built-in model provider adapters; user supplies provider credentials`,
      },
      {
        "@type": "HowTo", name: seo.howToName, description: seo.howToDescription, totalTime: "PT1M", inLanguage: locale,
        step: [
          { "@type": "HowToStep", position: 1, name: seo.install, text: seo.installText, url: `${url}#install` },
          { "@type": "HowToStep", position: 2, name: seo.run, text: seo.runText, url: `${url}#install` },
          { "@type": "HowToStep", position: 3, name: seo.configure, text: seo.configureText, url: localizedUrl("/docs", docsLocale) },
        ],
      },
      {
        "@type": "FAQPage", inLanguage: locale,
        mainEntity: faqs.map(([question, answer]) => ({ "@type": "Question", name: question, acceptedAnswer: { "@type": "Answer", text: answer } })),
      },
    ],
  }
}
