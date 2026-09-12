import type { AppLocale } from "@/i18n/config"

type Step = [number: string, title: string, detail: string]

type LandingUiCopy = {
  hero: {
    openSource: string
    localContext: string
    explicitControl: string
    surfaces: string
    title: [string, string]
    summary: string
    proof: string
    download: string
    install: string
    copied: string
    worksWith: string
    moreProviders: (count: number) => string
    threadAria: string
    liveContext: string
    prompt: string
    steps: Step[]
    awaiting: string
    threadFooter: [string, string, string]
  }
  sections: {
    ecosystem: [string, string, string]
    desktopWorkspace: string
    hoprelBody: string
    downloadHoprel: string
    nativeRuntime: string
    terminalBody: string
    installShell: string
    companion: string
    mobileCardBody: string
    visitMobile: string
    subProduct: string
    bondleyBody: string
    exploreBondley: string
    why: [string, string, string]
    capabilities: [string, string, string]
    terminalAria: string
    security: [string, string, string]
    securityCommand: string
    mobile: [string, string, string]
    install: [string, string]
    integrations: [string, string, string]
    final: [string, string]
    quickInstall: string
  }
  phone: {
    request: string
    answer: string
    scan: string
    running: string
    approval: string
    approvalBody: string
    approve: string
    deny: string
  }
  faq: { eyebrow: string; title: string; body: string }
}

const copy = {
  en: {
    hero: {
      openSource: "open source", localContext: "local context", explicitControl: "explicit control",
      surfaces: "desktop · terminal · mobile · finance", title: ["One intelligence.", "Every surface."],
      summary: "Aurict brings agentic work to the surface that fits: Hoprel for a local-first desktop workspace, a native terminal runtime for code, Aurict Mobile for research and remote control, and Bondley.one for fixed-income intelligence.",
      proof: "one account · your providers · local context · explicit control", download: "download Hoprel", install: "$ install", copied: "$ copied", worksWith: "works with",
      moreProviders: (count) => `+${count} more — bring your own key`, threadAria: "Aurict work thread", liveContext: "live context", prompt: "Move this codebase forward safely.",
      steps: [["01", "context scan", "84 files · framework detected"], ["02", "delegate specialists", "explore · code · review"], ["03", "explicit approval", "commands stop before they run"], ["04", "deliver the result", "files · evidence · next step"]],
      awaiting: "awaiting", threadFooter: ["parallel specialists", "local-first", "auditable"],
    },
    sections: {
      ecosystem: ["the aurict ecosystem", "Choose the surface. Keep the context.", "Each product has a distinct job. The same Aurict identity, providers, and work travel with you."],
      desktopWorkspace: "desktop workspace", hoprelBody: "A local-first AI workspace for conversations, files, artifacts, Design Studio, Finance Desk, and remote control.", downloadHoprel: "download Hoprel",
      nativeRuntime: "native runtime", terminalBody: "The open-source runtime for agentic coding, multi-agent execution, MCP, local context, scoped Project Auto, and explicit approvals.", installShell: "explore the open-source terminal agent",
      companion: "companion", mobileCardBody: "BYOK chat, research, document generation, and live remote control when your desktop work needs your attention.", visitMobile: "visit Aurict Mobile",
      subProduct: "aurict sub-product", bondleyBody: "Bonds, yields, and spreads in one research workspace, turning market data into clear, comparable analysis.", exploreBondley: "explore Bondley",
      why: ["why aurict", "Designed to understand the work before it answers the prompt.", "Aurict does not replace one chat window with another. It makes your project, risk, and the shape of the work visible."],
      capabilities: ["capability architecture", "Understand the work. Coordinate it. Act safely.", "Every capability is part of the same operating path from context to result."], terminalAria: "Aurict terminal workflow example",
      security: ["security posture", "Confirmation is the default, not an afterthought.", "Security capability starts hidden from the model entirely. You choose how far Aurict is allowed to reach."],
      securityCommand: "$ aurict /config security allow <target> — every active profile still requires an allowlisted target and explicit approval.",
      mobile: ["mobile · BYOK assistant", "A personal AI workspace in your pocket.", "Aurict mobile is a bring-your-own-key assistant for model chat, research, PDFs, reports, and terminal control away from your desk."],
      install: ["install", "Thirty seconds, one command, your existing shell."], integrations: ["open ecosystem", "Works with the tools you already run.", "via MCP — connect anything with a config file"],
      final: ["start in your own context", "Start where your work belongs."], quickInstall: "$ quick install",
    },
    phone: { request: "Research AI support tools for solo founders and make a PDF brief.", answer: "I’ll compare pricing, workflows, and positioning.", scan: "research scan", running: "running", approval: "approval", approvalBody: "approve a terminal action from mobile", approve: "approve", deny: "deny" },
    faq: { eyebrow: "faq", title: "Questions engineers actually ask.", body: "The short answers you need to make a decision." },
  },
  tr: {
    hero: {
      openSource: "açık kaynak", localContext: "yerel bağlam", explicitControl: "açık kontrol", surfaces: "masaüstü · terminal · mobil · finans", title: ["İşiniz neredeyse,", "Aurict orada."],
      summary: "İşiniz neredeyse Aurict oradadır: Hoprel'de yerel öncelikli masaüstü çalışma alanı, terminalde kodlama, Aurict Mobile ile araştırma ve uzaktan kontrol, Bondley.one ile sabit getirili piyasa zekâsı.",
      proof: "tek hesap · kendi sağlayıcılarınız · yerel bağlam · açık kontrol", download: "Hoprel'i indir", install: "$ kur", copied: "$ kopyalandı", worksWith: "uyumlu",
      moreProviders: (count) => `+${count} daha — kendi anahtarını getir`, threadAria: "Aurict çalışma akışı", liveContext: "canlı bağlam", prompt: "Bu kod tabanında güvenle ilerle.",
      steps: [["01", "bağlam taraması", "84 dosya · framework algılandı"], ["02", "uzmanlara ayır", "keşfet · kodla · incele"], ["03", "açık onay", "komut çalışmadan önce durur"], ["04", "sonuç teslimi", "dosyalar · kanıt · sonraki adım"]],
      awaiting: "bekliyor", threadFooter: ["paralel uzmanlar", "yerel öncelikli", "denetlenebilir"],
    },
    sections: {
      ecosystem: ["aurict ekosistemi", "Nerede çalışacağınızı seçin. Bağlamı koruyun.", "Her ürünün ayrı bir işi var. Aynı Aurict kimliği, sağlayıcıları ve çalışmanız sizinle birlikte yolculuk eder."],
      desktopWorkspace: "masaüstü çalışma alanı", hoprelBody: "Sohbetler, dosyalar, çıktılar, Tasarım Stüdyosu, Finans Masası ve uzaktan kontrol için yerel öncelikli bir yapay zekâ çalışma alanı.", downloadHoprel: "Hoprel'i indir",
      nativeRuntime: "yerel çalışma zamanı", terminalBody: "Ajan tabanlı kodlama, çoklu ajan yürütmesi, MCP, yerel bağlam, sınırlı Project Auto ve açık onaylar için açık kaynak çalışma zamanı.", installShell: "kabuğunuza kurun",
      companion: "yoldaş", mobileCardBody: "BYOK sohbeti, araştırma, belge üretimi ve masaüstü çalışmanız ilginizi gerektirdiğinde canlı uzaktan kontrol.", visitMobile: "Aurict Mobile'ı ziyaret et",
      subProduct: "aurict alt ürünü", bondleyBody: "Tahvilleri, getirileri ve spreadleri tek bir araştırma alanında buluşturur; piyasa verisini açık ve karşılaştırılabilir analizlere dönüştürür.", exploreBondley: "Bondley'i keşfet",
      why: ["neden aurict", "İstemi yanıtlamadan önce işi anlamak için tasarlandı.", "Aurict bir sohbet penceresini başka bir sohbet penceresiyle değiştirmez. Projenizi, riskinizi ve çalışmanın nasıl bölüneceğini görünür kılar."],
      capabilities: ["yetenek mimarisi", "Çalışmayı anlayın, koordine edin, güvenle yürütün.", "Her yetenek, bağlamdan sonuca uzanan aynı operasyon akışının bir parçasıdır."], terminalAria: "Aurict terminal çalışma akışı örneği",
      security: ["güvenlik duruşu", "Onay varsayılan; sonradan eklenen bir düşünce değil.", "Güvenlik yeteneği tamamen modele gizli başlar. Aurict'in ne kadar ileri uzanabileceğine siz karar verirsiniz."],
      securityCommand: "$ aurict /config security allow <hedef> — her aktif profil, izin listesine alınmış bir hedef ve açık onay gerektirir.",
      mobile: ["mobil · BYOK asistanı", "Cebinizde kişisel bir yapay zekâ çalışma alanı.", "Aurict mobil; model sohbeti, araştırma, PDF, rapor ve masanızdan uzaktayken terminal kontrolü için kendi anahtarını-getir asistanıdır."],
      install: ["kurulum", "Otuz saniye, tek komut, halihazırda kullandığınız kabuk."], integrations: ["açık ekosistem", "Zaten kullandığınız araçlarla çalışır.", "MCP ile — yapılandırma dosyası olan her şeyi bağlayın"],
      final: ["kendi bağlamınızda başlayın", "İşinizin ait olduğu yerde başlayın."], quickInstall: "$ hızlı kurulum",
    },
    phone: { request: "Solo girişimciler için AI destek araçlarını araştır ve PDF özeti hazırla.", answer: "Fiyatlandırma, iş akışları ve konumlandırmayı karşılaştıracağım.", scan: "araştırma taraması", running: "çalışıyor", approval: "onay", approvalBody: "terminal eylemini mobilden onayla", approve: "onayla", deny: "reddet" },
    faq: { eyebrow: "sss", title: "Mühendislerin gerçekten sorduğu sorular.", body: "Karar vermek için gereken kısa yanıtlar." },
  },
  de: {
    hero: {
      openSource: "Open Source", localContext: "lokaler Kontext", explicitControl: "explizite Kontrolle", surfaces: "Desktop · Terminal · Mobil · Finanzen", title: ["Eine Intelligenz.", "Auf jeder Oberfläche."],
      summary: "Aurict bringt agentenbasierte Arbeit dorthin, wo sie passt: Hoprel als lokaler Desktop-Arbeitsbereich, eine native Terminal-Laufzeit für Code, Aurict Mobile für Recherche und Fernsteuerung und Bondley.one für Anleihenanalysen.",
      proof: "ein Konto · Ihre Anbieter · lokaler Kontext · explizite Kontrolle", download: "Hoprel herunterladen", install: "$ installieren", copied: "$ kopiert", worksWith: "kompatibel mit",
      moreProviders: (count) => `+${count} weitere — eigener API-Schlüssel`, threadAria: "Aurict-Arbeitsablauf", liveContext: "Live-Kontext", prompt: "Entwickle diese Codebasis sicher weiter.",
      steps: [["01", "Kontext scannen", "84 Dateien · Framework erkannt"], ["02", "Spezialisten beauftragen", "Analyse · Code · Review"], ["03", "explizite Freigabe", "Befehle warten vor der Ausführung"], ["04", "Ergebnis liefern", "Dateien · Nachweise · nächster Schritt"]],
      awaiting: "wartet", threadFooter: ["parallele Spezialisten", "local-first", "prüfbar"],
    },
    sections: {
      ecosystem: ["das aurict-ökosystem", "Oberfläche wählen. Kontext behalten.", "Jedes Produkt hat eine klare Aufgabe. Identität, Anbieter und Arbeit begleiten Sie."],
      desktopWorkspace: "Desktop-Arbeitsbereich", hoprelBody: "Ein lokaler KI-Arbeitsbereich für Gespräche, Dateien, Artefakte, Design, Finanzen und Fernsteuerung.", downloadHoprel: "Hoprel herunterladen",
      nativeRuntime: "native Laufzeit", terminalBody: "Die Open-Source-Laufzeit für agentenbasiertes Coding, Multi-Agent-Ausführung, MCP, lokalen Kontext und explizite Freigaben.", installShell: "im Terminal installieren",
      companion: "Begleiter", mobileCardBody: "BYOK-Chat, Recherche, Dokumente und Live-Fernsteuerung, wenn Ihre Desktop-Arbeit Aufmerksamkeit benötigt.", visitMobile: "Aurict Mobile öffnen",
      subProduct: "aurict-teilprodukt", bondleyBody: "Anleihen, Renditen und Spreads in einem Recherchebereich mit klaren, vergleichbaren Analysen.", exploreBondley: "Bondley entdecken",
      why: ["warum aurict", "Versteht die Arbeit, bevor es den Prompt beantwortet.", "Aurict ersetzt nicht nur ein Chatfenster. Projekt, Risiko und Aufteilung der Arbeit werden sichtbar."],
      capabilities: ["Funktionsarchitektur", "Arbeit verstehen. Koordinieren. Sicher handeln.", "Jede Funktion gehört zum selben Weg vom Kontext zum Ergebnis."], terminalAria: "Beispiel eines Aurict-Terminalablaufs",
      security: ["Sicherheitsmodell", "Bestätigung ist Standard, kein Zusatz.", "Sicherheitsfunktionen sind anfangs vollständig vor dem Modell verborgen. Sie bestimmen die Reichweite."],
      securityCommand: "$ aurict /config security allow <ziel> — aktive Profile benötigen weiterhin ein freigegebenes Ziel und eine explizite Bestätigung.",
      mobile: ["mobil · BYOK-Assistent", "Ein persönlicher KI-Arbeitsbereich in Ihrer Tasche.", "Aurict Mobile ist Ihr BYOK-Assistent für Modellchats, Recherche, PDFs, Berichte und Terminalsteuerung unterwegs."],
      install: ["Installation", "Dreißig Sekunden, ein Befehl, Ihre vorhandene Shell."], integrations: ["offenes Ökosystem", "Funktioniert mit Ihren vorhandenen Werkzeugen.", "über MCP — alles mit Konfigurationsdatei verbinden"],
      final: ["im eigenen Kontext starten", "Beginnen Sie dort, wo Ihre Arbeit hingehört."], quickInstall: "$ schnell installieren",
    },
    phone: { request: "Recherchiere KI-Supporttools für Solo-Gründer und erstelle ein PDF-Briefing.", answer: "Ich vergleiche Preise, Abläufe und Positionierung.", scan: "Recherche", running: "läuft", approval: "Freigabe", approvalBody: "Terminalaktion mobil freigeben", approve: "freigeben", deny: "ablehnen" },
    faq: { eyebrow: "FAQ", title: "Fragen, die Entwickler wirklich stellen.", body: "Kurze Antworten für eine fundierte Entscheidung." },
  },
  fr: {
    hero: {
      openSource: "open source", localContext: "contexte local", explicitControl: "contrôle explicite", surfaces: "bureau · terminal · mobile · finance", title: ["Une intelligence.", "Sur chaque interface."],
      summary: "Aurict apporte le travail agentique sur la bonne interface : Hoprel pour le bureau local-first, un runtime natif dans le terminal pour le code, Aurict Mobile pour la recherche et le contrôle à distance, et Bondley.one pour l’analyse obligataire.",
      proof: "un compte · vos fournisseurs · contexte local · contrôle explicite", download: "télécharger Hoprel", install: "$ installer", copied: "$ copié", worksWith: "compatible avec",
      moreProviders: (count) => `+${count} autres — utilisez votre propre clé`, threadAria: "Flux de travail Aurict", liveContext: "contexte actif", prompt: "Fais progresser ce code en toute sécurité.",
      steps: [["01", "analyse du contexte", "84 fichiers · framework détecté"], ["02", "délégation", "exploration · code · revue"], ["03", "autorisation explicite", "les commandes attendent avant exécution"], ["04", "livraison", "fichiers · preuves · prochaine étape"]],
      awaiting: "en attente", threadFooter: ["spécialistes en parallèle", "local-first", "auditable"],
    },
    sections: {
      ecosystem: ["l’écosystème aurict", "Choisissez l’interface. Gardez le contexte.", "Chaque produit a un rôle distinct. Votre identité, vos fournisseurs et votre travail vous suivent."],
      desktopWorkspace: "espace de bureau", hoprelBody: "Un espace IA local-first pour les conversations, fichiers, livrables, le design, la finance et le contrôle à distance.", downloadHoprel: "télécharger Hoprel",
      nativeRuntime: "runtime natif", terminalBody: "Le runtime open source pour le code agentique, l’exécution multi-agent, MCP, le contexte local et les autorisations explicites.", installShell: "installer dans le terminal",
      companion: "compagnon", mobileCardBody: "Chat BYOK, recherche, génération de documents et contrôle à distance quand votre travail de bureau réclame votre attention.", visitMobile: "ouvrir Aurict Mobile",
      subProduct: "produit aurict", bondleyBody: "Obligations, rendements et spreads dans un espace de recherche produisant des analyses claires et comparables.", exploreBondley: "découvrir Bondley",
      why: ["pourquoi aurict", "Comprendre le travail avant de répondre au prompt.", "Aurict ne remplace pas une fenêtre de chat par une autre. Il rend visibles le projet, le risque et la répartition du travail."],
      capabilities: ["architecture des capacités", "Comprendre. Coordonner. Agir en sécurité.", "Chaque capacité appartient au même parcours, du contexte au résultat."], terminalAria: "Exemple de flux Aurict dans le terminal",
      security: ["posture de sécurité", "La confirmation est la règle, pas un ajout.", "Les capacités de sécurité sont d’abord invisibles au modèle. Vous décidez jusqu’où Aurict peut aller."],
      securityCommand: "$ aurict /config security allow <cible> — chaque profil actif exige encore une cible autorisée et une approbation explicite.",
      mobile: ["mobile · assistant BYOK", "Un espace IA personnel dans votre poche.", "Aurict Mobile est un assistant BYOK pour discuter, rechercher, créer des PDF et rapports, et piloter le terminal à distance."],
      install: ["installation", "Trente secondes, une commande, votre terminal habituel."], integrations: ["écosystème ouvert", "Fonctionne avec vos outils actuels.", "via MCP — connectez tout outil disposant d’une configuration"],
      final: ["commencer dans votre contexte", "Commencez là où votre travail se trouve."], quickInstall: "$ installation rapide",
    },
    phone: { request: "Recherche les outils de support IA pour indépendants et crée un résumé PDF.", answer: "Je vais comparer les prix, les workflows et le positionnement.", scan: "recherche", running: "en cours", approval: "autorisation", approvalBody: "approuver une action du terminal sur mobile", approve: "approuver", deny: "refuser" },
    faq: { eyebrow: "FAQ", title: "Les vraies questions des développeurs.", body: "Des réponses courtes pour prendre une décision." },
  },
  es: {
    hero: {
      openSource: "código abierto", localContext: "contexto local", explicitControl: "control explícito", surfaces: "escritorio · terminal · móvil · finanzas", title: ["Una inteligencia.", "En cada entorno."],
      summary: "Aurict lleva el trabajo con agentes al entorno adecuado: Hoprel como espacio de escritorio local-first, un runtime nativo de terminal para código, Aurict Mobile para investigación y control remoto, y Bondley.one para inteligencia de renta fija.",
      proof: "una cuenta · tus proveedores · contexto local · control explícito", download: "descargar Hoprel", install: "$ instalar", copied: "$ copiado", worksWith: "compatible con",
      moreProviders: (count) => `+${count} más — usa tu propia clave`, threadAria: "Flujo de trabajo de Aurict", liveContext: "contexto activo", prompt: "Haz avanzar este código de forma segura.",
      steps: [["01", "analizar contexto", "84 archivos · framework detectado"], ["02", "delegar especialistas", "explorar · programar · revisar"], ["03", "aprobación explícita", "los comandos esperan antes de ejecutarse"], ["04", "entregar resultado", "archivos · pruebas · siguiente paso"]],
      awaiting: "esperando", threadFooter: ["especialistas en paralelo", "local-first", "auditable"],
    },
    sections: {
      ecosystem: ["el ecosistema aurict", "Elige el entorno. Conserva el contexto.", "Cada producto tiene una función. La identidad, los proveedores y el trabajo viajan contigo."],
      desktopWorkspace: "espacio de escritorio", hoprelBody: "Un espacio de IA local-first para conversaciones, archivos, entregables, diseño, finanzas y control remoto.", downloadHoprel: "descargar Hoprel",
      nativeRuntime: "runtime nativo", terminalBody: "El runtime de código abierto para programación con agentes, ejecución multiagente, MCP, contexto local y aprobaciones explícitas.", installShell: "instalar en la terminal",
      companion: "compañero", mobileCardBody: "Chat BYOK, investigación, documentos y control remoto en vivo cuando tu trabajo de escritorio necesita atención.", visitMobile: "visitar Aurict Mobile",
      subProduct: "producto aurict", bondleyBody: "Bonos, rendimientos y diferenciales en un espacio de investigación con análisis claros y comparables.", exploreBondley: "explorar Bondley",
      why: ["por qué aurict", "Diseñado para entender el trabajo antes de responder.", "Aurict no sustituye una ventana de chat por otra. Hace visibles el proyecto, el riesgo y la forma del trabajo."],
      capabilities: ["arquitectura de capacidades", "Entiende. Coordina. Actúa con seguridad.", "Cada capacidad forma parte del mismo recorrido desde el contexto hasta el resultado."], terminalAria: "Ejemplo de flujo de Aurict en la terminal",
      security: ["postura de seguridad", "La confirmación es lo predeterminado.", "Las capacidades de seguridad comienzan ocultas para el modelo. Tú decides hasta dónde puede llegar Aurict."],
      securityCommand: "$ aurict /config security allow <objetivo> — cada perfil activo requiere un objetivo permitido y aprobación explícita.",
      mobile: ["móvil · asistente BYOK", "Un espacio de IA personal en tu bolsillo.", "Aurict Mobile es un asistente BYOK para conversar, investigar, crear PDF e informes y controlar la terminal a distancia."],
      install: ["instalación", "Treinta segundos, un comando, tu terminal habitual."], integrations: ["ecosistema abierto", "Funciona con las herramientas que ya usas.", "mediante MCP — conecta cualquier herramienta con configuración"],
      final: ["empieza con tu propio contexto", "Empieza donde está tu trabajo."], quickInstall: "$ instalación rápida",
    },
    phone: { request: "Investiga herramientas de soporte con IA para fundadores y prepara un resumen en PDF.", answer: "Compararé precios, flujos de trabajo y posicionamiento.", scan: "investigación", running: "en curso", approval: "aprobación", approvalBody: "aprobar una acción de terminal desde el móvil", approve: "aprobar", deny: "rechazar" },
    faq: { eyebrow: "preguntas", title: "Lo que los desarrolladores realmente preguntan.", body: "Respuestas breves para tomar una decisión." },
  },
} satisfies Record<AppLocale, LandingUiCopy>

export function localizeLandingUi(locale: AppLocale): LandingUiCopy {
  return copy[locale]
}
