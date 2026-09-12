import type { AppLocale } from "@/i18n/config"

export type TerminalAgentCopy = {
  metadata: { title: string; description: string; keywords: string[] }
  breadcrumb: string
  hero: { eyebrow: string; title: string; lede: string; install: string; github: string; proof: string[] }
  definition: { title: string; paragraphs: string[] }
  evidence?: {
    eyebrow: string
    title: string
    intro: string
    items: Array<{ title: string; body: string; href: string; label: string; external?: boolean }>
  }
  capabilities: { eyebrow: string; title: string; intro: string; items: Array<{ title: string; body: string }> }
  workflow: { eyebrow: string; title: string; steps: Array<{ title: string; body: string }> }
  useCases: { eyebrow: string; title: string; intro: string; items: Array<{ title: string; body: string; href: string }> }
  compare: { eyebrow: string; title: string; body: string; cta: string }
  faq: { eyebrow: string; title: string; items: Array<{ question: string; answer: string }> }
  final: { title: string; body: string; docs: string; install: string }
}

const content = {
  en: {
    metadata: {
      title: "Open-Source Terminal Agent for AI Coding",
      description: "Aurict is an open-source terminal agent for AI coding. Inspect repositories, delegate to specialist agents, run tools with approvals, and use your own model provider.",
      keywords: ["open source terminal agent", "open source AI terminal agent", "open source terminal coding agent", "terminal agent", "AI terminal agent", "terminal coding agent", "CLI AI agent", "terminal AI coding assistant", "multi-agent coding", "BYOK coding agent", "MCP terminal agent"],
    },
    breadcrumb: "Terminal Agent",
    hero: {
      eyebrow: "open-source terminal agent",
      title: "An open-source terminal agent for AI coding.",
      lede: "Aurict is a terminal-native AI coding agent that reads your project, delegates work to specialists, uses typed tools, and asks before sensitive actions. Bring your own model provider and keep the workflow in the shell you already use.",
      install: "install Aurict", github: "view source", proof: ["9 specialist agents", "218+ contextual skills", "12 built-in providers", "macOS · Linux · Windows"],
    },
    definition: {
      title: "What is an open-source terminal agent?",
      paragraphs: [
        "An open-source terminal agent is an AI assistant that works inside a command-line environment and makes its implementation available for inspection. Unlike autocomplete alone, it can inspect a repository, plan a task, call development tools, edit files, run verification commands, and report what changed.",
        "Aurict turns that pattern into a controlled runtime. Specialized agents handle exploration, implementation, review, tests, documentation, security, debugging, performance, and analytics while the coordinator keeps the task and evidence connected.",
        "The terminal stays the control surface: project context remains visible, shell commands pass through classification and approval rules, and you can switch model providers without moving the codebase into a vendor-specific IDE.",
      ],
    },
    evidence: {
      eyebrow: "open source, inspectable, verifiable",
      title: "Check the runtime before you trust it.",
      intro: "Aurict's source, package, license, and operating model are public. Review the implementation and security boundaries instead of relying on a closed product claim.",
      items: [
        {
          title: "Source and license",
          body: "Inspect the terminal runtime, permission paths, agent orchestration, tests, and AGPLv3 license in the public repository.",
          href: "https://github.com/aurict/aurict",
          label: "review the source on GitHub",
          external: true,
        },
        {
          title: "Published CLI package",
          body: "Review the public npm package and install the platform-specific Aurict CLI with one command.",
          href: "https://www.npmjs.com/package/aurict",
          label: "inspect the npm package",
          external: true,
        },
        {
          title: "Documented controls",
          body: "Read how providers, approvals, MCP connections, sessions, hooks, skills, and worktrees are configured.",
          href: "/docs",
          label: "read the technical documentation",
        },
      ],
    },
    capabilities: {
      eyebrow: "terminal-native capabilities", title: "More than a chat prompt attached to a shell.", intro: "A useful coding agent needs context, tools, boundaries, and verification—not just model access.",
      items: [
        { title: "Project-aware context", body: "Aurict detects the framework, package manager, structure, and relevant files before work begins." },
        { title: "Multi-agent execution", body: "Nine specialist roles separate exploration, coding, review, testing, security, and other concerns." },
        { title: "Explicit command control", body: "Shell commands are classified before execution; dangerous actions stop for direct approval." },
        { title: "MCP and custom tools", body: "Import compatible MCP configuration and extend the runtime with project or user tools and skills." },
        { title: "Provider choice", body: "Use built-in adapters for leading cloud and local model providers through a consistent workflow." },
        { title: "Verification evidence", body: "Changed files, checks, open work, and waivers remain visible in a durable completion record." },
      ],
    },
    workflow: {
      eyebrow: "how it works", title: "From request to verified change.",
      steps: [
        { title: "Understand", body: "Scan the codebase and identify the files, dependencies, conventions, and risks that shape the task." },
        { title: "Delegate", body: "Route independent parts to the right specialist agents while preserving one coordinated objective." },
        { title: "Act with boundaries", body: "Use typed tools and scoped permissions. Sensitive commands and exceptional writes still require approval." },
        { title: "Verify and report", body: "Exercise the affected path, run relevant checks, and return evidence with any remaining work." },
      ],
    },
    useCases: {
      eyebrow: "terminal agent use cases", title: "One runtime, several engineering workflows.", intro: "Use Aurict for focused tasks or for work that crosses several parts of a repository.",
      items: [
        { title: "Repository exploration", body: "Map architecture, dependencies, ownership boundaries, and the files most relevant to a change.", href: "/blog/how-to-use-ai-coding-assistant" },
        { title: "Refactoring", body: "Plan and implement multi-file changes while preserving conventions and verifying behavior.", href: "/use-cases/refactoring" },
        { title: "Code review", body: "Inspect changes for correctness, security, performance risks, and missing tests.", href: "/use-cases/code-review" },
        { title: "Testing and documentation", body: "Generate meaningful tests and update technical documentation from the actual code paths.", href: "/use-cases/testing" },
      ],
    },
    compare: { eyebrow: "choose with evidence", title: "Compare terminal coding agents by workflow—not slogans.", body: "Evaluate provider support, permission scope, project context, extensibility, verification, operating-system support, and how clearly the tool reports unfinished work.", cta: "compare Aurict with alternatives" },
    faq: {
      eyebrow: "terminal agent FAQ", title: "Common questions about AI agents in the terminal.",
      items: [
        { question: "Is Aurict a terminal agent or an IDE extension?", answer: "Aurict is a terminal-native runtime. It runs in your existing shell and does not require moving the project into a vendor-specific editor." },
        { question: "Is Aurict free and open source?", answer: "Yes. Aurict is released under the AGPLv3 license, its source is public on GitHub, and the CLI is free to install. You supply credentials for any paid model provider you choose to use." },
        { question: "Which operating systems does the Aurict terminal agent support?", answer: "Aurict provides compiled binaries for macOS, Linux, and Windows x64. The npm package selects the matching platform binary." },
        { question: "Can I choose the AI model provider?", answer: "Yes. Aurict uses a bring-your-own-key model with built-in adapters for supported cloud and local providers. You can switch from the terminal." },
        { question: "Can the agent run terminal commands automatically?", answer: "Commands pass through classification and permission controls. Safe actions can run within the active policy; dangerous or out-of-scope actions require explicit approval." },
        { question: "Does Aurict support MCP servers?", answer: "Aurict can import compatible MCP server configuration. Use /mcp to verify each connection and inspect the tools it exposes." },
      ],
    },
    final: { title: "Put an agent runtime in your terminal.", body: "Install the open-source CLI, choose a provider, and start inside an existing project.", docs: "read the documentation", install: "copy install command" },
  },
  tr: {
    metadata: {
      title: "Terminal Ajanı ile Yapay Zekâ Kodlama — Açık Kaynak",
      description: "Aurict; çoklu ajan orkestrasyonu, MCP, yerel proje bağlamı, BYOK sağlayıcılar ve açık komut onayları sunan açık kaynak terminal ajanıdır.",
      keywords: ["terminal ajanı", "yapay zekâ terminal ajanı", "terminal kodlama ajanı", "açık kaynak terminal ajanı", "CLI yapay zekâ ajanı", "terminal yapay zekâ kodlama asistanı", "çoklu ajan kodlama"],
    },
    breadcrumb: "Terminal Ajanı",
    hero: {
      eyebrow: "açık kaynak terminal ajanı", title: "Terminal için geliştirilmiş bir yapay zekâ kodlama ajanı.",
      lede: "Aurict projenizi okur, işi uzman ajanlara dağıtır, tipli araçlar kullanır ve hassas eylemlerden önce onay ister. Kendi model sağlayıcınızı kullanın; iş akışını mevcut kabuğunuzda tutun.",
      install: "Aurict'i kur", github: "kaynak kodu gör", proof: ["9 uzman ajan", "218+ bağlamsal beceri", "12 yerleşik sağlayıcı", "macOS · Linux · Windows"],
    },
    definition: {
      title: "Terminal ajanı nedir?",
      paragraphs: [
        "Terminal ajanı, komut satırı ortamında çalışan bir yapay zekâ asistanıdır. Yalnızca otomatik tamamlamadan farklı olarak bir depoyu inceleyebilir, görevi planlayabilir, geliştirme araçlarını çağırabilir, dosyaları düzenleyebilir, doğrulama komutları çalıştırabilir ve değişenleri raporlayabilir.",
        "Aurict bu yaklaşımı denetimli bir çalışma zamanına dönüştürür. Uzman ajanlar keşif, uygulama, inceleme, test, dokümantasyon, güvenlik, hata ayıklama, performans ve analitiği ele alırken koordinatör görev ile kanıtı bir arada tutar.",
        "Terminal kontrol yüzeyi olarak kalır: proje bağlamı görünürdür, kabuk komutları sınıflandırma ve onay kurallarından geçer, model sağlayıcısını kod tabanını başka bir IDE'ye taşımadan değiştirebilirsiniz.",
      ],
    },
    capabilities: {
      eyebrow: "terminal odaklı yetenekler", title: "Kabuğa eklenmiş bir sohbet isteminden fazlası.", intro: "Kullanışlı bir kodlama ajanı yalnızca model erişimine değil; bağlama, araçlara, sınırlara ve doğrulamaya ihtiyaç duyar.",
      items: [
        { title: "Proje farkında bağlam", body: "Aurict işe başlamadan önce framework'ü, paket yöneticisini, yapıyı ve ilgili dosyaları algılar." },
        { title: "Çoklu ajan yürütmesi", body: "Dokuz uzman rol keşif, kodlama, inceleme, test, güvenlik ve diğer sorumlulukları ayırır." },
        { title: "Açık komut kontrolü", body: "Kabuk komutları çalışmadan önce sınıflandırılır; tehlikeli eylemler doğrudan onay için durur." },
        { title: "MCP ve özel araçlar", body: "Uyumlu MCP yapılandırmasını içe aktarın; çalışma zamanını proje veya kullanıcı araçlarıyla genişletin." },
        { title: "Sağlayıcı seçimi", body: "Önde gelen bulut ve yerel model sağlayıcılarını tutarlı bir iş akışıyla kullanın." },
        { title: "Doğrulama kanıtı", body: "Değişen dosyalar, kontroller, açık işler ve muafiyetler kalıcı tamamlanma kaydında görünür kalır." },
      ],
    },
    workflow: {
      eyebrow: "nasıl çalışır", title: "İstekten doğrulanmış değişikliğe.",
      steps: [
        { title: "Anla", body: "Kod tabanını tara; görevi şekillendiren dosyaları, bağımlılıkları, kuralları ve riskleri belirle." },
        { title: "Dağıt", body: "Tek bir koordineli hedefi korurken bağımsız parçaları doğru uzman ajanlara yönlendir." },
        { title: "Sınırlar içinde hareket et", body: "Tipli araçlar ve kapsamlı izinler kullan. Hassas komutlar ve istisnai yazmalar yine onay gerektirir." },
        { title: "Doğrula ve raporla", body: "Etkilenen yolu çalıştır, ilgili kontrolleri yürüt ve kalan işlerle birlikte kanıtı sun." },
      ],
    },
    useCases: {
      eyebrow: "terminal ajanı kullanım alanları", title: "Tek çalışma zamanı, farklı mühendislik akışları.", intro: "Aurict'i odaklı görevlerde veya bir deponun birden çok bölümünü kapsayan işlerde kullanın.",
      items: [
        { title: "Depo keşfi", body: "Mimariyi, bağımlılıkları, sahiplik sınırlarını ve değişiklik için önemli dosyaları haritalayın.", href: "/blog/how-to-use-ai-coding-assistant" },
        { title: "Yeniden düzenleme", body: "Kuralları koruyup davranışı doğrulayarak çok dosyalı değişiklikleri planlayın ve uygulayın.", href: "/use-cases/refactoring" },
        { title: "Kod incelemesi", body: "Değişiklikleri doğruluk, güvenlik, performans riski ve eksik testler açısından inceleyin.", href: "/use-cases/code-review" },
        { title: "Test ve dokümantasyon", body: "Gerçek kod yollarından anlamlı testler üretin ve teknik dokümantasyonu güncelleyin.", href: "/use-cases/testing" },
      ],
    },
    compare: { eyebrow: "kanıtla seçin", title: "Terminal kodlama ajanlarını sloganlarla değil, iş akışıyla karşılaştırın.", body: "Sağlayıcı desteğini, izin kapsamını, proje bağlamını, genişletilebilirliği, doğrulamayı, işletim sistemi desteğini ve aracın eksik işleri ne kadar açık raporladığını değerlendirin.", cta: "Aurict'i alternatiflerle karşılaştır" },
    faq: {
      eyebrow: "terminal ajanı SSS", title: "Terminaldeki yapay zekâ ajanları hakkında sık sorulanlar.",
      items: [
        { question: "Aurict bir terminal ajanı mı, IDE eklentisi mi?", answer: "Aurict terminal odaklı bir çalışma zamanıdır. Mevcut kabuğunuzda çalışır ve projeyi belirli bir editöre taşımanızı gerektirmez." },
        { question: "Aurict terminal ajanı hangi işletim sistemlerini destekler?", answer: "Aurict macOS, Linux ve Windows x64 için derlenmiş ikililer sunar. npm paketi platformunuza uygun ikiliyi seçer." },
        { question: "Yapay zekâ model sağlayıcısını seçebilir miyim?", answer: "Evet. Aurict, desteklenen bulut ve yerel sağlayıcılar için yerleşik adaptörlerle kendi anahtarını getir modelini kullanır." },
        { question: "Ajan terminal komutlarını otomatik çalıştırabilir mi?", answer: "Komutlar sınıflandırma ve izin denetiminden geçer. Tehlikeli veya kapsam dışı eylemler açık onay gerektirir." },
        { question: "Aurict MCP sunucularını destekliyor mu?", answer: "Aurict uyumlu MCP yapılandırmasını içe aktarabilir. Her bağlantıyı ve sunduğu araçları /mcp ile doğrulayın." },
      ],
    },
    final: { title: "Terminalinize bir ajan çalışma zamanı ekleyin.", body: "Açık kaynak CLI'ı kurun, sağlayıcınızı seçin ve mevcut projenizin içinde başlayın.", docs: "dokümantasyonu oku", install: "kurulum komutunu kopyala" },
  },
  de: {
    metadata: {
      title: "Terminal-Agent für KI-Coding — Open Source & Multi-Agent",
      description: "Aurict ist ein Open-Source-Terminal-Agent für KI-Coding mit Multi-Agent-Orchestrierung, MCP, lokalem Projektkontext, eigenen API-Schlüsseln und expliziten Freigaben.",
      keywords: ["Terminal Agent", "KI Terminal Agent", "Coding Agent Terminal", "Open Source Terminal Agent", "CLI KI Agent", "KI Coding Assistent", "Multi-Agent Coding"],
    },
    breadcrumb: "Terminal-Agent",
    hero: {
      eyebrow: "Open-Source-Terminal-Agent", title: "Ein KI-Coding-Agent für das Terminal.",
      lede: "Aurict liest Ihr Projekt, verteilt Arbeit an spezialisierte Agenten, nutzt typisierte Werkzeuge und fragt vor sensiblen Aktionen. Verwenden Sie Ihren eigenen Modellanbieter und bleiben Sie in Ihrer gewohnten Shell.",
      install: "Aurict installieren", github: "Quellcode ansehen", proof: ["9 Spezialagenten", "218+ Kontext-Skills", "12 integrierte Anbieter", "macOS · Linux · Windows"],
    },
    definition: {
      title: "Was ist ein Terminal-Agent?",
      paragraphs: [
        "Ein Terminal-Agent ist ein KI-Assistent in der Kommandozeile. Anders als reine Autovervollständigung kann er Repositories untersuchen, Aufgaben planen, Entwicklungswerkzeuge aufrufen, Dateien bearbeiten, Prüfungen ausführen und Änderungen erklären.",
        "Aurict macht daraus eine kontrollierte Laufzeit. Fachagenten übernehmen Analyse, Implementierung, Review, Tests, Dokumentation, Sicherheit, Debugging, Performance und Analytics; der Koordinator verbindet Aufgabe und Nachweise.",
        "Das Terminal bleibt die Kontrolloberfläche: Projektkontext ist sichtbar, Shell-Befehle durchlaufen Klassifikation und Freigaben, und Modellanbieter lassen sich ohne Wechsel in eine proprietäre IDE austauschen.",
      ],
    },
    capabilities: {
      eyebrow: "Terminal-native Funktionen", title: "Mehr als ein Chat-Prompt in der Shell.", intro: "Ein nützlicher Coding-Agent braucht Kontext, Werkzeuge, Grenzen und Verifikation — nicht nur Modellzugriff.",
      items: [
        { title: "Projektkontext", body: "Aurict erkennt Framework, Paketmanager, Struktur und relevante Dateien vor Arbeitsbeginn." },
        { title: "Multi-Agent-Ausführung", body: "Neun Spezialrollen trennen Analyse, Code, Review, Tests, Sicherheit und weitere Aufgaben." },
        { title: "Explizite Befehlsfreigabe", body: "Shell-Befehle werden vorab klassifiziert; gefährliche Aktionen warten auf direkte Zustimmung." },
        { title: "MCP und eigene Werkzeuge", body: "Importieren Sie kompatible MCP-Konfigurationen und erweitern Sie die Laufzeit mit Tools und Skills." },
        { title: "Anbieterwahl", body: "Nutzen Sie führende Cloud- und lokale Modellanbieter in einem einheitlichen Ablauf." },
        { title: "Verifikationsnachweise", body: "Dateien, Prüfungen, offene Arbeit und Ausnahmen bleiben in einem dauerhaften Abschlussnachweis sichtbar." },
      ],
    },
    workflow: {
      eyebrow: "Ablauf", title: "Von der Anfrage zur geprüften Änderung.",
      steps: [
        { title: "Verstehen", body: "Codebasis scannen und relevante Dateien, Abhängigkeiten, Konventionen und Risiken bestimmen." },
        { title: "Delegieren", body: "Unabhängige Teile an passende Fachagenten verteilen und ein gemeinsames Ziel bewahren." },
        { title: "Begrenzt handeln", body: "Typisierte Werkzeuge und klaren Berechtigungsumfang nutzen; sensible Aktionen brauchen Zustimmung." },
        { title: "Prüfen und berichten", body: "Betroffene Pfade ausführen, relevante Checks starten und Nachweise samt offener Arbeit liefern." },
      ],
    },
    useCases: {
      eyebrow: "Einsatzbereiche", title: "Eine Laufzeit für mehrere Engineering-Abläufe.", intro: "Nutzen Sie Aurict für fokussierte Aufgaben oder Änderungen über mehrere Repository-Bereiche.",
      items: [
        { title: "Repository-Analyse", body: "Architektur, Abhängigkeiten, Grenzen und relevante Dateien für eine Änderung erfassen.", href: "/blog/how-to-use-ai-coding-assistant" },
        { title: "Refactoring", body: "Änderungen über mehrere Dateien planen, Konventionen bewahren und Verhalten prüfen.", href: "/use-cases/refactoring" },
        { title: "Code-Review", body: "Änderungen auf Korrektheit, Sicherheit, Performance und fehlende Tests untersuchen.", href: "/use-cases/code-review" },
        { title: "Tests und Dokumentation", body: "Aussagekräftige Tests erzeugen und technische Dokumentation aus realen Codepfaden aktualisieren.", href: "/use-cases/testing" },
      ],
    },
    compare: { eyebrow: "mit Nachweisen wählen", title: "Terminal-Agenten nach Workflow vergleichen — nicht nach Slogans.", body: "Achten Sie auf Anbieter, Berechtigungen, Projektkontext, Erweiterbarkeit, Verifikation, Betriebssysteme und transparente Berichte zu offener Arbeit.", cta: "Aurict mit Alternativen vergleichen" },
    faq: {
      eyebrow: "Terminal-Agent FAQ", title: "Häufige Fragen zu KI-Agenten im Terminal.",
      items: [
        { question: "Ist Aurict ein Terminal-Agent oder eine IDE-Erweiterung?", answer: "Aurict ist eine Terminal-native Laufzeit in Ihrer vorhandenen Shell. Eine anbieterspezifische IDE ist nicht erforderlich." },
        { question: "Welche Betriebssysteme werden unterstützt?", answer: "Aurict bietet kompilierte Binärdateien für macOS, Linux und Windows x64." },
        { question: "Kann ich den Modellanbieter wählen?", answer: "Ja. Aurict unterstützt eigene API-Schlüssel für integrierte Cloud- und lokale Anbieter." },
        { question: "Kann der Agent Terminalbefehle automatisch ausführen?", answer: "Befehle durchlaufen Klassifikation und Berechtigungen. Gefährliche oder nicht abgedeckte Aktionen benötigen Zustimmung." },
        { question: "Unterstützt Aurict MCP-Server?", answer: "Kompatible MCP-Konfiguration kann importiert werden. Prüfen Sie Verbindungen und Werkzeuge mit /mcp." },
      ],
    },
    final: { title: "Bringen Sie eine Agentenlaufzeit ins Terminal.", body: "Installieren Sie die Open-Source-CLI, wählen Sie einen Anbieter und starten Sie im vorhandenen Projekt.", docs: "Dokumentation lesen", install: "Installationsbefehl kopieren" },
  },
  fr: {
    metadata: {
      title: "Agent de terminal pour coder avec l’IA — Open Source",
      description: "Aurict est un agent de terminal open source pour le code assisté par IA, avec orchestration multi-agent, MCP, contexte local, fournisseurs BYOK et approbations explicites.",
      keywords: ["agent de terminal", "agent IA terminal", "agent de code terminal", "agent terminal open source", "agent IA CLI", "assistant de code IA", "code multi-agent"],
    },
    breadcrumb: "Agent de terminal",
    hero: {
      eyebrow: "agent de terminal open source", title: "Un agent de code IA conçu pour le terminal.",
      lede: "Aurict lit votre projet, délègue aux agents spécialisés, utilise des outils typés et demande votre accord avant les actions sensibles. Choisissez votre fournisseur de modèle et gardez votre terminal habituel.",
      install: "installer Aurict", github: "voir le code source", proof: ["9 agents spécialisés", "218+ compétences", "12 fournisseurs intégrés", "macOS · Linux · Windows"],
    },
    definition: {
      title: "Qu’est-ce qu’un agent de terminal ?",
      paragraphs: [
        "Un agent de terminal est un assistant IA qui travaille en ligne de commande. Au-delà de l’autocomplétion, il peut explorer un dépôt, planifier une tâche, utiliser des outils, modifier des fichiers, lancer des vérifications et expliquer ses changements.",
        "Aurict transforme ce modèle en runtime contrôlé. Des agents spécialisés couvrent exploration, implémentation, revue, tests, documentation, sécurité, débogage, performance et analyse, tandis que le coordinateur relie objectif et preuves.",
        "Le terminal reste l’interface de contrôle : le contexte du projet est visible, les commandes passent par des règles de classification et d’autorisation, et vous changez de fournisseur sans déplacer le code vers un IDE propriétaire.",
      ],
    },
    capabilities: {
      eyebrow: "capacités natives du terminal", title: "Bien plus qu’un prompt de chat dans un shell.", intro: "Un agent de code utile exige du contexte, des outils, des limites et des vérifications — pas seulement un modèle.",
      items: [
        { title: "Contexte du projet", body: "Aurict détecte le framework, le gestionnaire de paquets, la structure et les fichiers pertinents." },
        { title: "Exécution multi-agent", body: "Neuf rôles séparent exploration, code, revue, tests, sécurité et autres responsabilités." },
        { title: "Contrôle explicite", body: "Les commandes sont classées avant exécution ; les actions dangereuses attendent votre approbation." },
        { title: "MCP et outils personnalisés", body: "Importez une configuration MCP compatible et ajoutez vos outils et compétences." },
        { title: "Choix du fournisseur", body: "Utilisez des fournisseurs cloud ou locaux dans un workflow cohérent." },
        { title: "Preuves de vérification", body: "Fichiers, contrôles, travaux ouverts et dérogations restent visibles dans une preuve durable." },
      ],
    },
    workflow: {
      eyebrow: "fonctionnement", title: "De la demande au changement vérifié.",
      steps: [
        { title: "Comprendre", body: "Analyser le dépôt et identifier fichiers, dépendances, conventions et risques utiles." },
        { title: "Déléguer", body: "Confier les parties indépendantes aux agents adaptés tout en gardant un objectif commun." },
        { title: "Agir dans les limites", body: "Utiliser outils typés et autorisations ciblées ; les actions sensibles demandent un accord." },
        { title: "Vérifier et rendre compte", body: "Exercer le parcours concerné, lancer les contrôles et fournir les preuves avec le travail restant." },
      ],
    },
    useCases: {
      eyebrow: "cas d’usage", title: "Un runtime pour plusieurs workflows d’ingénierie.", intro: "Utilisez Aurict pour une tâche précise ou une évolution couvrant plusieurs parties d’un dépôt.",
      items: [
        { title: "Exploration du dépôt", body: "Cartographier architecture, dépendances, responsabilités et fichiers pertinents.", href: "/blog/how-to-use-ai-coding-assistant" },
        { title: "Refactorisation", body: "Planifier des changements multi-fichiers, préserver les conventions et vérifier le comportement.", href: "/use-cases/refactoring" },
        { title: "Revue de code", body: "Examiner exactitude, sécurité, performance et tests manquants.", href: "/use-cases/code-review" },
        { title: "Tests et documentation", body: "Créer des tests utiles et mettre à jour la documentation à partir des vrais parcours du code.", href: "/use-cases/testing" },
      ],
    },
    compare: { eyebrow: "choisir avec des preuves", title: "Comparez les agents de terminal par workflow, pas par slogan.", body: "Évaluez fournisseurs, permissions, contexte projet, extensibilité, vérification, systèmes pris en charge et transparence sur le travail restant.", cta: "comparer Aurict aux alternatives" },
    faq: {
      eyebrow: "FAQ agent de terminal", title: "Questions fréquentes sur les agents IA dans le terminal.",
      items: [
        { question: "Aurict est-il un agent de terminal ou une extension IDE ?", answer: "Aurict est un runtime natif du terminal qui fonctionne dans votre shell. Aucun éditeur propriétaire n’est imposé." },
        { question: "Quels systèmes sont compatibles ?", answer: "Aurict fournit des binaires compilés pour macOS, Linux et Windows x64." },
        { question: "Puis-je choisir le fournisseur de modèle ?", answer: "Oui. Aurict accepte vos propres clés pour ses fournisseurs cloud et locaux pris en charge." },
        { question: "L’agent peut-il lancer des commandes automatiquement ?", answer: "Les commandes passent par classification et permissions. Les actions dangereuses ou hors périmètre exigent une approbation." },
        { question: "Aurict prend-il en charge MCP ?", answer: "Une configuration MCP compatible peut être importée. Vérifiez les connexions et outils avec /mcp." },
      ],
    },
    final: { title: "Ajoutez un runtime agentique à votre terminal.", body: "Installez la CLI open source, choisissez un fournisseur et démarrez dans un projet existant.", docs: "lire la documentation", install: "copier la commande" },
  },
  es: {
    metadata: {
      title: "Agente de terminal para programar con IA — Código abierto",
      description: "Aurict es un agente de terminal de código abierto para programar con IA, con orquestación multiagente, MCP, contexto local, proveedores BYOK y aprobaciones explícitas.",
      keywords: ["agente de terminal", "agente IA terminal", "agente de código terminal", "agente terminal código abierto", "agente IA CLI", "asistente de programación IA", "programación multiagente"],
    },
    breadcrumb: "Agente de terminal",
    hero: {
      eyebrow: "agente de terminal de código abierto", title: "Un agente de programación con IA creado para la terminal.",
      lede: "Aurict lee tu proyecto, delega en agentes especialistas, usa herramientas tipadas y pide aprobación antes de acciones sensibles. Usa tu proveedor de modelos y conserva tu terminal habitual.",
      install: "instalar Aurict", github: "ver código fuente", proof: ["9 agentes especialistas", "218+ habilidades", "12 proveedores integrados", "macOS · Linux · Windows"],
    },
    definition: {
      title: "¿Qué es un agente de terminal?",
      paragraphs: [
        "Un agente de terminal es un asistente de IA que trabaja en la línea de comandos. Además de autocompletar, puede explorar un repositorio, planificar tareas, utilizar herramientas, editar archivos, ejecutar verificaciones y explicar los cambios.",
        "Aurict convierte ese patrón en un runtime controlado. Agentes especialistas cubren exploración, implementación, revisión, pruebas, documentación, seguridad, depuración, rendimiento y analítica mientras el coordinador conecta objetivo y evidencias.",
        "La terminal sigue siendo la superficie de control: el contexto permanece visible, los comandos pasan por clasificación y permisos, y puedes cambiar de proveedor sin trasladar el código a un IDE propietario.",
      ],
    },
    capabilities: {
      eyebrow: "capacidades nativas de terminal", title: "Más que un prompt de chat añadido al shell.", intro: "Un agente de programación útil necesita contexto, herramientas, límites y verificación, no solo acceso a un modelo.",
      items: [
        { title: "Contexto del proyecto", body: "Aurict detecta framework, gestor de paquetes, estructura y archivos relevantes antes de empezar." },
        { title: "Ejecución multiagente", body: "Nueve roles separan exploración, código, revisión, pruebas, seguridad y otras tareas." },
        { title: "Control explícito", body: "Los comandos se clasifican antes de ejecutarse; las acciones peligrosas esperan aprobación." },
        { title: "MCP y herramientas propias", body: "Importa una configuración MCP compatible y amplía el runtime con herramientas y habilidades." },
        { title: "Elección de proveedor", body: "Usa proveedores de modelos en la nube o locales con un flujo coherente." },
        { title: "Pruebas de verificación", body: "Archivos, controles, trabajo abierto y excepciones siguen visibles en un registro duradero." },
      ],
    },
    workflow: {
      eyebrow: "cómo funciona", title: "De la petición al cambio verificado.",
      steps: [
        { title: "Entender", body: "Analizar el repositorio e identificar archivos, dependencias, convenciones y riesgos." },
        { title: "Delegar", body: "Enviar partes independientes a los especialistas adecuados manteniendo un objetivo coordinado." },
        { title: "Actuar con límites", body: "Usar herramientas tipadas y permisos acotados; las acciones sensibles requieren aprobación." },
        { title: "Verificar e informar", body: "Ejecutar la ruta afectada, lanzar controles y entregar evidencias junto al trabajo restante." },
      ],
    },
    useCases: {
      eyebrow: "casos de uso", title: "Un runtime para varios flujos de ingeniería.", intro: "Usa Aurict para tareas concretas o cambios que cruzan varias partes de un repositorio.",
      items: [
        { title: "Exploración del repositorio", body: "Mapea arquitectura, dependencias, límites y archivos relevantes para un cambio.", href: "/blog/how-to-use-ai-coding-assistant" },
        { title: "Refactorización", body: "Planifica cambios en varios archivos, conserva convenciones y verifica el comportamiento.", href: "/use-cases/refactoring" },
        { title: "Revisión de código", body: "Examina corrección, seguridad, rendimiento y pruebas ausentes.", href: "/use-cases/code-review" },
        { title: "Pruebas y documentación", body: "Genera pruebas útiles y actualiza documentación desde las rutas reales del código.", href: "/use-cases/testing" },
      ],
    },
    compare: { eyebrow: "elige con evidencias", title: "Compara agentes de terminal por flujo, no por eslóganes.", body: "Evalúa proveedores, permisos, contexto del proyecto, extensibilidad, verificación, sistemas compatibles y transparencia sobre trabajo pendiente.", cta: "comparar Aurict con alternativas" },
    faq: {
      eyebrow: "preguntas sobre agentes", title: "Preguntas habituales sobre agentes de IA en la terminal.",
      items: [
        { question: "¿Aurict es un agente de terminal o una extensión de IDE?", answer: "Aurict es un runtime nativo de terminal que funciona en tu shell. No exige un editor propietario." },
        { question: "¿Qué sistemas operativos admite?", answer: "Aurict ofrece binarios compilados para macOS, Linux y Windows x64." },
        { question: "¿Puedo elegir el proveedor de modelos?", answer: "Sí. Aurict admite tus propias claves para proveedores locales y en la nube compatibles." },
        { question: "¿Puede ejecutar comandos automáticamente?", answer: "Los comandos pasan por clasificación y permisos. Las acciones peligrosas o fuera de alcance exigen aprobación." },
        { question: "¿Aurict admite servidores MCP?", answer: "Puedes importar configuraciones MCP compatibles y verificar conexiones y herramientas con /mcp." },
      ],
    },
    final: { title: "Añade un runtime de agentes a tu terminal.", body: "Instala la CLI de código abierto, elige proveedor y empieza dentro de un proyecto existente.", docs: "leer la documentación", install: "copiar comando" },
  },
} satisfies Record<AppLocale, TerminalAgentCopy>

export function localizeTerminalAgent(locale: AppLocale): TerminalAgentCopy {
  return content[locale]
}
