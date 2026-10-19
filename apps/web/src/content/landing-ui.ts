import type { AppLocale } from "@/i18n/config"

type LandingUiCopy = {
  hero: {
    worksWith: string
    moreProviders: (count: number) => string
    copied: string
  }
  hub: {
    eyebrow: string
    title: string
    subtitle: string
    core: string
    cliBody: string
    cliLink: string
    hoprelBody: string
    hoprelTasks: [string, string, string]
    approve: string
    hoprelLink: string
    mobileBody: string
    mobileLink: string
    decisionBody: string
    decisionSub: string
    decisionLink: string
    getStarted: string
  }
  sections: {
    why: [string, string, string]
    capabilities: [string, string, string]
    terminalAria: string
    security: [string, string, string]
    securityCommand: string
    install: [string, string]
    integrations: [string, string, string]
    final: [string, string]
    quickInstall: string
  }
  faq: { eyebrow: string; title: string; body: string }
}

const copy = {
  en: {
    hero: { worksWith: "works with", moreProviders: (count) => `+${count} more — bring your own key`, copied: "$ copied" },
    hub: {
      eyebrow: "one company · connected products", title: "The Aurict ecosystem", subtitle: "One company. Connected products. Built around you.", core: "The company. The connection.",
      cliBody: "Open-source terminal AI coding agent. Bring your own model, keep context local, approve every action.", cliLink: "Explore Aurict CLI",
      hoprelBody: "Local-first desktop AI agent workspace for macOS, Windows and Linux.", hoprelTasks: ["Read the project files", "Plan the change", "Waiting for your approval"], approve: "Approve", hoprelLink: "Download Hoprel",
      mobileBody: "Our studio of consumer apps and games.", mobileLink: "Meet our studio",
      decisionBody: "Private, on-device decisions in under 10 ms.", decisionSub: "Raw data never leaves the device.", decisionLink: "Explore Aurict Decision", getStarted: "Get started",
    },
    sections: {
      why: ["why aurict", "Designed to understand the work before it answers the prompt.", "Aurict does not replace one chat window with another. It makes your project, risk, and the shape of the work visible."],
      capabilities: ["capability architecture", "Understand the work. Coordinate it. Act safely.", "Every capability is part of the same operating path from context to result."], terminalAria: "Aurict terminal workflow example",
      security: ["security posture", "Confirmation is the default, not an afterthought.", "Security capability starts hidden from the model entirely. You choose how far Aurict is allowed to reach."],
      securityCommand: "$ aurict /config security allow <target> — every active profile still requires an allowlisted target and explicit approval.",
      install: ["install", "Thirty seconds, one command, your existing shell."], integrations: ["open ecosystem", "Works with the tools you already run.", "via MCP — connect anything with a config file"],
      final: ["start in your own context", "Start where your work belongs."], quickInstall: "$ quick install",
    },
    faq: { eyebrow: "faq", title: "Questions engineers actually ask.", body: "The short answers you need to make a decision." },
  },
  tr: {
    hero: { worksWith: "uyumlu", moreProviders: (count) => `+${count} daha — kendi anahtarını getir`, copied: "$ kopyalandı" },
    hub: {
      eyebrow: "tek şirket · bağlantılı ürünler", title: "Aurict ekosistemi", subtitle: "Tek şirket. Bağlantılı ürünler. Senin etrafında tasarlandı.", core: "Şirket. Bağlantı.",
      cliBody: "Açık kaynak terminal yapay zekâ kodlama ajanı. Kendi modelini getir, bağlamı yerelde tut, her eylemi onayla.", cliLink: "Aurict CLI'ı keşfet",
      hoprelBody: "macOS, Windows ve Linux için yerel öncelikli masaüstü yapay zekâ ajan çalışma alanı.", hoprelTasks: ["Proje dosyalarını oku", "Değişikliği planla", "Onayını bekliyor"], approve: "Onayla", hoprelLink: "Hoprel'i indir",
      mobileBody: "Tüketici uygulamaları ve oyunlar stüdyomuz.", mobileLink: "Stüdyomuzla tanış",
      decisionBody: "10 ms altında, cihaz içinde gizli kararlar.", decisionSub: "Ham veri cihazdan asla çıkmaz.", decisionLink: "Aurict Decision'ı keşfet", getStarted: "Başla",
    },
    sections: {
      why: ["neden aurict", "İstemi yanıtlamadan önce işi anlamak için tasarlandı.", "Aurict bir sohbet penceresini başka bir sohbet penceresiyle değiştirmez. Projenizi, riskinizi ve çalışmanın nasıl bölüneceğini görünür kılar."],
      capabilities: ["yetenek mimarisi", "Çalışmayı anlayın, koordine edin, güvenle yürütün.", "Her yetenek, bağlamdan sonuca uzanan aynı operasyon akışının bir parçasıdır."], terminalAria: "Aurict terminal çalışma akışı örneği",
      security: ["güvenlik duruşu", "Onay varsayılan; sonradan eklenen bir düşünce değil.", "Güvenlik yeteneği tamamen modele gizli başlar. Aurict'in ne kadar ileri uzanabileceğine siz karar verirsiniz."],
      securityCommand: "$ aurict /config security allow <hedef> — her aktif profil, izin listesine alınmış bir hedef ve açık onay gerektirir.",
      install: ["kurulum", "Otuz saniye, tek komut, halihazırda kullandığınız kabuk."], integrations: ["açık ekosistem", "Zaten kullandığınız araçlarla çalışır.", "MCP ile — yapılandırma dosyası olan her şeyi bağlayın"],
      final: ["kendi bağlamınızda başlayın", "İşinizin ait olduğu yerde başlayın."], quickInstall: "$ hızlı kurulum",
    },
    faq: { eyebrow: "sss", title: "Mühendislerin gerçekten sorduğu sorular.", body: "Karar vermek için gereken kısa yanıtlar." },
  },
  de: {
    hero: { worksWith: "kompatibel mit", moreProviders: (count) => `+${count} weitere — eigener API-Schlüssel`, copied: "$ kopiert" },
    hub: {
      eyebrow: "ein Unternehmen · vernetzte Produkte", title: "Das Aurict-Ökosystem", subtitle: "Ein Unternehmen. Vernetzte Produkte. Rund um dich gebaut.", core: "Das Unternehmen. Die Verbindung.",
      cliBody: "Open-Source-KI-Coding-Agent fürs Terminal. Eigenes Modell, lokaler Kontext, jede Aktion von dir freigegeben.", cliLink: "Aurict CLI entdecken",
      hoprelBody: "Local-first KI-Agent-Workspace für macOS, Windows und Linux.", hoprelTasks: ["Projektdateien lesen", "Änderung planen", "Wartet auf deine Freigabe"], approve: "Freigeben", hoprelLink: "Hoprel herunterladen",
      mobileBody: "Unser Studio für Apps und Spiele.", mobileLink: "Unser Studio kennenlernen",
      decisionBody: "Private Entscheidungen auf dem Gerät in unter 10 ms.", decisionSub: "Rohdaten verlassen nie das Gerät.", decisionLink: "Aurict Decision entdecken", getStarted: "Loslegen",
    },
    sections: {
      why: ["warum aurict", "Versteht die Arbeit, bevor es den Prompt beantwortet.", "Aurict ersetzt nicht nur ein Chatfenster. Projekt, Risiko und Aufteilung der Arbeit werden sichtbar."],
      capabilities: ["Funktionsarchitektur", "Arbeit verstehen. Koordinieren. Sicher handeln.", "Jede Funktion gehört zum selben Weg vom Kontext zum Ergebnis."], terminalAria: "Beispiel eines Aurict-Terminalablaufs",
      security: ["Sicherheitsmodell", "Bestätigung ist Standard, kein Zusatz.", "Sicherheitsfunktionen sind anfangs vollständig vor dem Modell verborgen. Sie bestimmen die Reichweite."],
      securityCommand: "$ aurict /config security allow <ziel> — aktive Profile benötigen weiterhin ein freigegebenes Ziel und eine explizite Bestätigung.",
      install: ["Installation", "Dreißig Sekunden, ein Befehl, Ihre vorhandene Shell."], integrations: ["offenes Ökosystem", "Funktioniert mit Ihren vorhandenen Werkzeugen.", "über MCP — alles mit Konfigurationsdatei verbinden"],
      final: ["im eigenen Kontext starten", "Beginnen Sie dort, wo Ihre Arbeit hingehört."], quickInstall: "$ schnell installieren",
    },
    faq: { eyebrow: "FAQ", title: "Fragen, die Entwickler wirklich stellen.", body: "Kurze Antworten für eine fundierte Entscheidung." },
  },
  fr: {
    hero: { worksWith: "compatible avec", moreProviders: (count) => `+${count} autres — utilisez votre propre clé`, copied: "$ copié" },
    hub: {
      eyebrow: "une entreprise · des produits connectés", title: "L’écosystème Aurict", subtitle: "Une entreprise. Des produits connectés. Pensés pour vous.", core: "L’entreprise. Le lien.",
      cliBody: "Agent de code IA open source pour le terminal. Votre modèle, votre contexte local, chaque action approuvée par vous.", cliLink: "Découvrir Aurict CLI",
      hoprelBody: "Espace d’agents IA local-first pour macOS, Windows et Linux.", hoprelTasks: ["Lire les fichiers du projet", "Planifier la modification", "En attente de votre accord"], approve: "Approuver", hoprelLink: "Télécharger Hoprel",
      mobileBody: "Notre studio d’applis et de jeux grand public.", mobileLink: "Découvrir le studio",
      decisionBody: "Décisions privées sur l’appareil en moins de 10 ms.", decisionSub: "Les données brutes ne quittent jamais l’appareil.", decisionLink: "Découvrir Aurict Decision", getStarted: "Commencer",
    },
    sections: {
      why: ["pourquoi aurict", "Comprendre le travail avant de répondre au prompt.", "Aurict ne remplace pas une fenêtre de chat par une autre. Il rend visibles le projet, le risque et la répartition du travail."],
      capabilities: ["architecture des capacités", "Comprendre. Coordonner. Agir en sécurité.", "Chaque capacité appartient au même parcours, du contexte au résultat."], terminalAria: "Exemple de flux Aurict dans le terminal",
      security: ["posture de sécurité", "La confirmation est la règle, pas un ajout.", "Les capacités de sécurité sont d’abord invisibles au modèle. Vous décidez jusqu’où Aurict peut aller."],
      securityCommand: "$ aurict /config security allow <cible> — chaque profil actif exige encore une cible autorisée et une approbation explicite.",
      install: ["installation", "Trente secondes, une commande, votre terminal habituel."], integrations: ["écosystème ouvert", "Fonctionne avec vos outils actuels.", "via MCP — connectez tout outil disposant d’une configuration"],
      final: ["commencer dans votre contexte", "Commencez là où votre travail se trouve."], quickInstall: "$ installation rapide",
    },
    faq: { eyebrow: "FAQ", title: "Les vraies questions des développeurs.", body: "Des réponses courtes pour prendre une décision." },
  },
  es: {
    hero: { worksWith: "compatible con", moreProviders: (count) => `+${count} más — usa tu propia clave`, copied: "$ copiado" },
    hub: {
      eyebrow: "una empresa · productos conectados", title: "El ecosistema Aurict", subtitle: "Una empresa. Productos conectados. Hechos a tu medida.", core: "La empresa. La conexión.",
      cliBody: "Agente de código con IA de código abierto para la terminal. Tu modelo, tu contexto local, cada acción aprobada por ti.", cliLink: "Explorar Aurict CLI",
      hoprelBody: "Espacio de agentes de IA local-first para macOS, Windows y Linux.", hoprelTasks: ["Leer los archivos del proyecto", "Planificar el cambio", "Esperando tu aprobación"], approve: "Aprobar", hoprelLink: "Descargar Hoprel",
      mobileBody: "Nuestro estudio de apps y juegos.", mobileLink: "Conoce nuestro estudio",
      decisionBody: "Decisiones privadas en el dispositivo en menos de 10 ms.", decisionSub: "Los datos sin procesar nunca salen del dispositivo.", decisionLink: "Explorar Aurict Decision", getStarted: "Empezar",
    },
    sections: {
      why: ["por qué aurict", "Diseñado para entender el trabajo antes de responder.", "Aurict no sustituye una ventana de chat por otra. Hace visibles el proyecto, el riesgo y la forma del trabajo."],
      capabilities: ["arquitectura de capacidades", "Entiende. Coordina. Actúa con seguridad.", "Cada capacidad forma parte del mismo recorrido desde el contexto hasta el resultado."], terminalAria: "Ejemplo de flujo de Aurict en la terminal",
      security: ["postura de seguridad", "La confirmación es lo predeterminado.", "Las capacidades de seguridad comienzan ocultas para el modelo. Tú decides hasta dónde puede llegar Aurict."],
      securityCommand: "$ aurict /config security allow <objetivo> — cada perfil activo requiere un objetivo permitido y aprobación explícita.",
      install: ["instalación", "Treinta segundos, un comando, tu terminal habitual."], integrations: ["ecosistema abierto", "Funciona con las herramientas que ya usas.", "mediante MCP — conecta cualquier herramienta con configuración"],
      final: ["empieza con tu propio contexto", "Empieza donde está tu trabajo."], quickInstall: "$ instalación rápida",
    },
    faq: { eyebrow: "preguntas", title: "Lo que los desarrolladores realmente preguntan.", body: "Respuestas breves para tomar una decisión." },
  },
} satisfies Record<AppLocale, LandingUiCopy>

export function localizeLandingUi(locale: AppLocale): LandingUiCopy {
  return copy[locale]
}
