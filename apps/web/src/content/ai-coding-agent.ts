import type { AppLocale } from "@/i18n/config"

type AiCodingAgentCopy = {
  metadata: { title: string; description: string; keywords: string[] }
  breadcrumb: string
  hero: { eyebrow: string; title: string; lede: string; install: string; compare: string; proof: string[] }
  definition: { title: string; paragraphs: string[] }
  differences: { eyebrow: string; title: string; intro: string; items: Array<{ title: string; body: string }> }
  evaluation: { eyebrow: string; title: string; intro: string; items: Array<{ title: string; body: string }> }
  workflows: { eyebrow: string; title: string; intro: string; items: Array<{ title: string; body: string; href: string }> }
  alternatives: { eyebrow: string; title: string; body: string; links: Array<{ label: string; href: string }> }
  faq: { eyebrow: string; title: string; items: Array<{ question: string; answer: string }> }
  final: { title: string; body: string; docs: string; install: string }
}

const content = {
  en: {
    metadata: {
      title: "AI Coding Agent — Open Source & Terminal-Native",
      description: "Aurict is an open-source AI coding agent with project context, specialist agents, BYOK providers, MCP, explicit approvals, and verification evidence.",
      keywords: ["AI coding agent", "coding agent", "open source AI coding agent", "agentic coding", "CLI coding agent", "AI software engineering agent", "Claude Code alternative", "multi-agent coding assistant"],
    },
    breadcrumb: "AI Coding Agent",
    hero: {
      eyebrow: "open-source AI coding agent",
      title: "An AI coding agent for work beyond autocomplete.",
      lede: "Aurict can inspect a repository, coordinate specialist agents, edit project files through typed tools, run checks, and preserve completion evidence. You choose the model provider and keep the terminal as the control surface.",
      install: "install Aurict", compare: "compare coding agents", proof: ["9 specialist agents", "12 built-in providers", "MCP-compatible tools", "macOS · Linux · Windows"],
    },
    definition: {
      title: "What is an AI coding agent?",
      paragraphs: [
        "An AI coding agent is software that can move from a development request to actions inside a codebase. It goes beyond suggesting the next line: it can inspect files, reason about dependencies, use development tools, make scoped changes, run verification, and explain the result.",
        "A coding assistant usually waits for a narrowly framed prompt or offers inline suggestions. An agent can coordinate a longer workflow, but that extra autonomy needs boundaries. Useful systems make permissions, project scope, tool activity, verification, and unfinished work visible to the developer.",
        "Aurict implements that pattern as an open-source terminal runtime. Specialist roles separate exploration, implementation, review, testing, documentation, security, debugging, performance, and analytics while one coordinated task keeps the evidence connected.",
      ],
    },
    differences: {
      eyebrow: "agent vs assistant", title: "The difference is the workflow, not the label.", intro: "Evaluate what the tool can actually do after receiving a task.",
      items: [
        { title: "Repository context", body: "An agent maps relevant files, dependencies, conventions, and risks before changing code." },
        { title: "Tool use", body: "It can call explicit tools for search, file changes, documentation, browser checks, tests, and evaluation." },
        { title: "Bounded action", body: "Permissions and project scope determine which actions may proceed and which require direct approval." },
        { title: "Verification", body: "A completion record distinguishes executed checks from assumptions, waivers, and work that remains open." },
      ],
    },
    evaluation: {
      eyebrow: "buyer checklist", title: "How to choose an AI coding agent.", intro: "Compare products against your real repositories and operating constraints.",
      items: [
        { title: "Provider and model choice", body: "Check whether the runtime supports your preferred hosted or local models and whether you control the provider credentials." },
        { title: "Permission model", body: "Look for clear boundaries around shell commands, file mutations, external services, secrets, and destructive actions." },
        { title: "Context quality", body: "Confirm how the agent discovers architecture, installed dependencies, project instructions, and relevant source without flooding the model." },
        { title: "Evidence of completion", body: "Require the agent to report changed files, checks it actually ran, failures, skipped work, and unresolved risks." },
        { title: "Extensibility", body: "Evaluate MCP support, custom tools, reusable skills, and whether integrations stay inspectable." },
        { title: "Workflow fit", body: "Test terminal, IDE, remote-server, operating-system, latency, and cost tradeoffs using a representative task." },
      ],
    },
    workflows: {
      eyebrow: "coding agent use cases", title: "Use the same runtime across the engineering loop.", intro: "Start with one bounded task, then expand only when the agent proves it can preserve project constraints.",
      items: [
        { title: "Repository exploration", body: "Map architecture, dependencies, ownership, and the files relevant to a proposed change.", href: "/terminal-agent" },
        { title: "Refactoring", body: "Plan multi-file changes, preserve public contracts, and verify affected behavior.", href: "/use-cases/refactoring" },
        { title: "Code review", body: "Inspect a diff for correctness, security, performance, maintainability, and missing tests.", href: "/use-cases/code-review" },
        { title: "Testing and documentation", body: "Add meaningful coverage and update documentation from the paths that were actually changed.", href: "/use-cases/testing" },
      ],
    },
    alternatives: {
      eyebrow: "alternatives", title: "Compare AI coding agents with documented criteria.", body: "Aurict overlaps with terminal agents and AI development environments, but each product makes different tradeoffs. Review official sources and test the same task before choosing.",
      links: [
        { label: "Claude Code alternative", href: "/compare/claude-code" }, { label: "Cursor alternative", href: "/compare/cursor" },
        { label: "Aider alternative", href: "/compare/aider" }, { label: "GitHub Copilot CLI alternative", href: "/compare/github-copilot" },
        { label: "OpenCode alternative", href: "/compare/opencode" },
      ],
    },
    faq: {
      eyebrow: "AI coding agent FAQ", title: "Questions developers ask before adopting an agent.",
      items: [
        { question: "Is Aurict an AI coding agent or an autocomplete tool?", answer: "Aurict is a terminal-native agent runtime. It is designed to inspect projects, coordinate tools and specialist roles, make scoped changes, run verification, and report evidence rather than only predict inline code." },
        { question: "Is Aurict a Claude Code alternative?", answer: "Yes for developers comparing terminal coding workflows. Aurict emphasizes provider choice, specialist agents, scoped Project Auto, and durable completion evidence; Claude Code provides Anthropic's official coding workflow. Compare both against the same repository task." },
        { question: "Can I choose the AI model provider?", answer: "Yes. Aurict includes adapters for supported cloud and local providers. You supply the relevant provider credentials and choose a model available through that provider." },
        { question: "Can an AI coding agent run terminal commands?", answer: "Aurict classifies commands and applies permission rules before execution. Dangerous or out-of-scope actions require direct approval; the exact behavior depends on the active permission mode." },
        { question: "Does an AI coding agent replace code review and tests?", answer: "No. Agent output still needs proportionate human review and executable verification. Aurict's proof record is intended to show what was checked and what remains unresolved, not to replace engineering judgment." },
      ],
    },
    final: { title: "Try an agent on a real, bounded task.", body: "Install the open-source CLI, choose a provider, open an existing project, and judge the result by its diff and verification evidence.", docs: "read the documentation", install: "copy install command" },
  },
  tr: {
    metadata: {
      title: "Yapay Zekâ Kodlama Ajanı — Açık Kaynak",
      description: "Aurict; proje bağlamı, uzman ajanlar, BYOK sağlayıcıları, MCP, açık onaylar ve doğrulama kanıtı sunan açık kaynak bir yapay zekâ kodlama ajanıdır.",
      keywords: ["yapay zekâ kodlama ajanı", "AI kodlama ajanı", "açık kaynak kodlama ajanı", "terminal kodlama ajanı", "ajan tabanlı kodlama", "Claude Code alternatifi", "çoklu ajan kodlama asistanı"],
    },
    breadcrumb: "Yapay Zekâ Kodlama Ajanı",
    hero: {
      eyebrow: "açık kaynak yapay zekâ kodlama ajanı", title: "Otomatik tamamlamanın ötesindeki işler için bir kodlama ajanı.",
      lede: "Aurict bir depoyu inceleyebilir, uzman ajanları koordine edebilir, tipli araçlarla proje dosyalarını düzenleyebilir, kontrolleri çalıştırabilir ve tamamlanma kanıtını saklayabilir. Model sağlayıcısını siz seçer, kontrol yüzeyi olarak terminali kullanırsınız.",
      install: "Aurict'i kur", compare: "kodlama ajanlarını karşılaştır", proof: ["9 uzman ajan", "12 yerleşik sağlayıcı", "MCP uyumlu araçlar", "macOS · Linux · Windows"],
    },
    definition: {
      title: "Yapay zekâ kodlama ajanı nedir?",
      paragraphs: [
        "Yapay zekâ kodlama ajanı, bir geliştirme isteğini kod tabanı içindeki eylemlere dönüştürebilen yazılımdır. Bir sonraki satırı önermenin ötesine geçerek dosyaları inceler, bağımlılıkları değerlendirir, geliştirme araçlarını kullanır, kapsamlı değişiklikler yapar, doğrulama çalıştırır ve sonucu açıklar.",
        "Kodlama asistanı çoğunlukla dar bir istem bekler veya satır içi öneri sunar. Ajan daha uzun bir iş akışını koordine edebilir; ancak bu özerklik sınırlara ihtiyaç duyar. Yararlı sistemler izinleri, proje kapsamını, araç etkinliğini, doğrulamayı ve bitmemiş işi geliştiriciye görünür kılar.",
        "Aurict bu yaklaşımı açık kaynak bir terminal çalışma zamanı olarak uygular. Uzman roller keşif, uygulama, inceleme, test, dokümantasyon, güvenlik, hata ayıklama, performans ve analitiği ayırırken koordineli görev bütün kanıtları birbirine bağlar.",
      ],
    },
    differences: {
      eyebrow: "ajan ve asistan", title: "Fark etikette değil, iş akışındadır.", intro: "Aracın bir görev aldıktan sonra gerçekten neler yapabildiğini değerlendirin.",
      items: [
        { title: "Depo bağlamı", body: "Ajan kodu değiştirmeden önce ilgili dosyaları, bağımlılıkları, kuralları ve riskleri eşler." },
        { title: "Araç kullanımı", body: "Arama, dosya değişiklikleri, doküman, tarayıcı kontrolü, test ve değerlendirme için açık araçlar çağırabilir." },
        { title: "Sınırlı eylem", body: "İzinler ve proje kapsamı hangi eylemlerin ilerleyebileceğini, hangilerinin doğrudan onay gerektirdiğini belirler." },
        { title: "Doğrulama", body: "Tamamlanma kaydı çalıştırılan kontrolleri varsayımlardan, muafiyetlerden ve açık kalan işlerden ayırır." },
      ],
    },
    evaluation: {
      eyebrow: "seçim kontrol listesi", title: "Yapay zekâ kodlama ajanı nasıl seçilir?", intro: "Ürünleri gerçek depolarınız ve çalışma kısıtlarınız üzerinden karşılaştırın.",
      items: [
        { title: "Sağlayıcı ve model seçimi", body: "Çalışma zamanının tercih ettiğiniz bulut veya yerel modelleri desteklediğini ve sağlayıcı kimlik bilgilerini sizin yönettiğinizi doğrulayın." },
        { title: "İzin modeli", body: "Terminal komutları, dosya değişiklikleri, dış servisler, sırlar ve yıkıcı eylemler için açık sınırlar arayın." },
        { title: "Bağlam kalitesi", body: "Ajanın mimariyi, kurulu bağımlılıkları, proje talimatlarını ve ilgili kaynakları modele gereksiz yük bindirmeden nasıl bulduğunu inceleyin." },
        { title: "Tamamlanma kanıtı", body: "Değişen dosyaların, gerçekten çalıştırılan kontrollerin, hataların, atlanan işlerin ve çözülmemiş risklerin raporlanmasını isteyin." },
        { title: "Genişletilebilirlik", body: "MCP desteğini, özel araçları, tekrar kullanılabilir yetenekleri ve entegrasyonların denetlenebilirliğini değerlendirin." },
        { title: "İş akışı uyumu", body: "Terminal, IDE, uzak sunucu, işletim sistemi, gecikme ve maliyet dengelerini temsili bir görevle test edin." },
      ],
    },
    workflows: {
      eyebrow: "kodlama ajanı kullanım alanları", title: "Mühendislik döngüsü boyunca aynı çalışma zamanını kullanın.", intro: "Tek ve sınırlı bir görevle başlayın; ajan proje kısıtlarını koruduğunu kanıtladıkça kapsamı genişletin.",
      items: [
        { title: "Depo keşfi", body: "Mimariyi, bağımlılıkları, sahipliği ve önerilen değişiklikle ilgili dosyaları eşleyin.", href: "/terminal-agent" },
        { title: "Yeniden düzenleme", body: "Çok dosyalı değişiklikleri planlayın, açık sözleşmeleri koruyun ve etkilenen davranışı doğrulayın.", href: "/use-cases/refactoring" },
        { title: "Kod incelemesi", body: "Diff'i doğruluk, güvenlik, performans, bakım kolaylığı ve eksik testler açısından inceleyin.", href: "/use-cases/code-review" },
        { title: "Test ve dokümantasyon", body: "Anlamlı kapsam ekleyin ve dokümanları gerçekten değişen kod yollarından güncelleyin.", href: "/use-cases/testing" },
      ],
    },
    alternatives: {
      eyebrow: "alternatifler", title: "Yapay zekâ kodlama ajanlarını belgelenmiş ölçütlerle karşılaştırın.", body: "Aurict terminal ajanları ve yapay zekâ geliştirme ortamlarıyla örtüşür; ancak her ürün farklı dengeler kurar. Seçmeden önce resmî kaynakları okuyun ve aynı görevi test edin.",
      links: [
        { label: "Claude Code alternatifi", href: "/compare/claude-code" }, { label: "Cursor alternatifi", href: "/compare/cursor" },
        { label: "Aider alternatifi", href: "/compare/aider" }, { label: "GitHub Copilot CLI alternatifi", href: "/compare/github-copilot" },
        { label: "OpenCode alternatifi", href: "/compare/opencode" },
      ],
    },
    faq: {
      eyebrow: "kodlama ajanı SSS", title: "Geliştiricilerin bir ajanı kullanmadan önce sorduğu sorular.",
      items: [
        { question: "Aurict bir yapay zekâ kodlama ajanı mı, otomatik tamamlama aracı mı?", answer: "Aurict terminal tabanlı bir ajan çalışma zamanıdır. Yalnızca satır içi kod tahmin etmek yerine projeleri incelemek, araçları ve uzman rolleri koordine etmek, kapsamlı değişiklikler yapmak, doğrulama çalıştırmak ve kanıt raporlamak için tasarlanmıştır." },
        { question: "Aurict bir Claude Code alternatifi mi?", answer: "Terminal kodlama iş akışlarını karşılaştıran geliştiriciler için evet. Aurict sağlayıcı seçimine, uzman ajanlara, sınırlı Project Auto'ya ve kalıcı tamamlanma kanıtına odaklanır; Claude Code Anthropic'in resmî kodlama iş akışını sunar. İkisini aynı depo göreviyle karşılaştırın." },
        { question: "Yapay zekâ model sağlayıcısını seçebilir miyim?", answer: "Evet. Aurict desteklenen bulut ve yerel sağlayıcılar için adaptörler içerir. İlgili sağlayıcı kimlik bilgilerini siz sağlarsınız ve o sağlayıcıdaki bir modeli seçersiniz." },
        { question: "Kodlama ajanı terminal komutlarını çalıştırabilir mi?", answer: "Aurict komutları sınıflandırır ve çalıştırmadan önce izin kurallarını uygular. Tehlikeli veya kapsam dışı eylemler doğrudan onay gerektirir; tam davranış etkin izin moduna bağlıdır." },
        { question: "Yapay zekâ kodlama ajanı kod incelemesinin ve testlerin yerini alır mı?", answer: "Hayır. Ajan çıktısı yine uygun insan incelemesi ve çalıştırılabilir doğrulama gerektirir. Aurict'in kanıt kaydı neyin kontrol edildiğini ve neyin çözülmeden kaldığını gösterir; mühendislik kararının yerini almaz." },
      ],
    },
    final: { title: "Bir ajanı gerçek ve sınırlı bir görevde deneyin.", body: "Açık kaynak CLI'ı kurun, sağlayıcı seçin, mevcut bir projeyi açın ve sonucu diff ile doğrulama kanıtına göre değerlendirin.", docs: "dokümantasyonu oku", install: "kurulum komutunu kopyala" },
  },
  de: {
    metadata: {
      title: "KI-Coding-Agent — Open Source und Terminal-nativ",
      description: "Aurict ist ein Open-Source-KI-Coding-Agent mit Projektkontext, Spezialagenten, eigenen Anbietern, MCP, Freigaben und Prüfnachweisen.",
      keywords: ["KI Coding Agent", "Coding Agent", "Open Source KI Agent", "agentisches Coding", "CLI Coding Agent", "KI Softwareentwicklung", "Claude Code Alternative", "Multi-Agent Coding"],
    },
    breadcrumb: "KI-Coding-Agent",
    hero: {
      eyebrow: "Open-Source-KI-Coding-Agent", title: "Ein KI-Coding-Agent für Aufgaben jenseits der Autovervollständigung.",
      lede: "Aurict untersucht Repositories, koordiniert Spezialagenten, bearbeitet Projektdateien mit typisierten Werkzeugen, führt Prüfungen aus und bewahrt Nachweise auf. Sie wählen den Modellanbieter; das Terminal bleibt die Kontrolloberfläche.",
      install: "Aurict installieren", compare: "Coding-Agenten vergleichen", proof: ["9 Spezialagenten", "12 integrierte Anbieter", "MCP-kompatible Werkzeuge", "macOS · Linux · Windows"],
    },
    definition: {
      title: "Was ist ein KI-Coding-Agent?",
      paragraphs: [
        "Ein KI-Coding-Agent kann eine Entwicklungsanfrage in konkrete Aktionen in einer Codebasis übersetzen. Er geht über Zeilenvorschläge hinaus: Er untersucht Dateien, bewertet Abhängigkeiten, nutzt Entwicklungswerkzeuge, nimmt begrenzte Änderungen vor, führt Prüfungen aus und erklärt das Ergebnis.",
        "Ein Coding-Assistent wartet meist auf eine eng formulierte Anfrage oder bietet Inline-Vorschläge. Ein Agent kann längere Abläufe koordinieren, doch diese Autonomie braucht Grenzen. Gute Systeme machen Berechtigungen, Projektumfang, Werkzeugaktivität, Verifikation und offene Arbeit sichtbar.",
        "Aurict setzt dieses Muster als offene Terminal-Laufzeit um. Spezialrollen trennen Analyse, Implementierung, Review, Tests, Dokumentation, Sicherheit, Debugging, Performance und Analytics, während eine koordinierte Aufgabe alle Nachweise verbindet.",
      ],
    },
    differences: {
      eyebrow: "Agent oder Assistent", title: "Der Unterschied liegt im Ablauf, nicht im Namen.", intro: "Bewerten Sie, was ein Werkzeug nach Erhalt einer Aufgabe tatsächlich tun kann.",
      items: [
        { title: "Repository-Kontext", body: "Ein Agent erfasst relevante Dateien, Abhängigkeiten, Konventionen und Risiken, bevor er Code ändert." },
        { title: "Werkzeugnutzung", body: "Er kann klar definierte Werkzeuge für Suche, Dateiänderungen, Dokumentation, Browserprüfungen, Tests und Evaluation nutzen." },
        { title: "Begrenztes Handeln", body: "Berechtigungen und Projektumfang bestimmen, was direkt ausgeführt werden darf und was Ihre Freigabe benötigt." },
        { title: "Verifikation", body: "Ein Abschlussnachweis trennt ausgeführte Prüfungen von Annahmen, Ausnahmen und offener Arbeit." },
      ],
    },
    evaluation: {
      eyebrow: "Auswahlcheckliste", title: "So wählen Sie einen KI-Coding-Agenten.", intro: "Vergleichen Sie Produkte anhand Ihrer echten Repositories und Betriebsanforderungen.",
      items: [
        { title: "Anbieter- und Modellwahl", body: "Prüfen Sie, ob Ihre bevorzugten Cloud- oder lokalen Modelle unterstützt werden und Sie die Zugangsdaten kontrollieren." },
        { title: "Berechtigungsmodell", body: "Achten Sie auf klare Grenzen für Shell-Befehle, Dateiänderungen, externe Dienste, Geheimnisse und destruktive Aktionen." },
        { title: "Kontextqualität", body: "Prüfen Sie, wie Architektur, Abhängigkeiten, Projektanweisungen und relevante Quellen ohne unnötigen Modellkontext gefunden werden." },
        { title: "Abschlussnachweise", body: "Verlangen Sie Angaben zu geänderten Dateien, ausgeführten Prüfungen, Fehlern, übersprungener Arbeit und offenen Risiken." },
        { title: "Erweiterbarkeit", body: "Bewerten Sie MCP, eigene Werkzeuge, wiederverwendbare Skills und die Prüfbarkeit von Integrationen." },
        { title: "Workflow-Eignung", body: "Testen Sie Terminal, IDE, Remote-Server, Betriebssystem, Latenz und Kosten mit einer repräsentativen Aufgabe." },
      ],
    },
    workflows: {
      eyebrow: "Einsatzbereiche", title: "Eine Laufzeit für den gesamten Engineering-Zyklus.", intro: "Beginnen Sie mit einer begrenzten Aufgabe und erweitern Sie den Umfang erst, wenn der Agent die Projektregeln zuverlässig wahrt.",
      items: [
        { title: "Repository-Analyse", body: "Architektur, Abhängigkeiten, Zuständigkeiten und relevante Dateien einer Änderung erfassen.", href: "/terminal-agent" },
        { title: "Refactoring", body: "Änderungen über mehrere Dateien planen, öffentliche Verträge erhalten und betroffenes Verhalten prüfen.", href: "/use-cases/refactoring" },
        { title: "Code-Review", body: "Diffs auf Korrektheit, Sicherheit, Performance, Wartbarkeit und fehlende Tests prüfen.", href: "/use-cases/code-review" },
        { title: "Tests und Dokumentation", body: "Aussagekräftige Tests ergänzen und Dokumentation aus den tatsächlich geänderten Pfaden aktualisieren.", href: "/use-cases/testing" },
      ],
    },
    alternatives: {
      eyebrow: "Alternativen", title: "KI-Coding-Agenten nach belegbaren Kriterien vergleichen.", body: "Aurict überschneidet sich mit Terminal-Agenten und KI-Entwicklungsumgebungen, doch jedes Produkt setzt andere Schwerpunkte. Prüfen Sie offizielle Quellen und testen Sie dieselbe Aufgabe.",
      links: [
        { label: "Claude-Code-Alternative", href: "/compare/claude-code" }, { label: "Cursor-Alternative", href: "/compare/cursor" },
        { label: "Aider-Alternative", href: "/compare/aider" }, { label: "GitHub-Copilot-CLI-Alternative", href: "/compare/github-copilot" },
        { label: "OpenCode-Alternative", href: "/compare/opencode" },
      ],
    },
    faq: {
      eyebrow: "FAQ zu Coding-Agenten", title: "Fragen vor dem Einsatz eines Agenten.",
      items: [
        { question: "Ist Aurict ein KI-Coding-Agent oder Autovervollständigung?", answer: "Aurict ist eine Terminal-native Agentenlaufzeit. Sie untersucht Projekte, koordiniert Werkzeuge und Spezialrollen, nimmt begrenzte Änderungen vor, prüft sie und berichtet Nachweise, statt nur Inline-Code vorherzusagen." },
        { question: "Ist Aurict eine Alternative zu Claude Code?", answer: "Ja, wenn Sie Terminal-Coding-Abläufe vergleichen. Aurict betont Anbieterwahl, Spezialagenten, begrenztes Project Auto und dauerhafte Nachweise; Claude Code bietet Anthropic's offiziellen Ablauf. Testen Sie beide an derselben Aufgabe." },
        { question: "Kann ich den Modellanbieter wählen?", answer: "Ja. Aurict enthält Adapter für unterstützte Cloud- und lokale Anbieter. Sie hinterlegen die Zugangsdaten und wählen ein verfügbares Modell." },
        { question: "Kann der Agent Terminalbefehle ausführen?", answer: "Aurict klassifiziert Befehle und prüft Berechtigungen. Gefährliche oder nicht abgedeckte Aktionen benötigen direkte Zustimmung." },
        { question: "Ersetzt ein Coding-Agent Code-Review und Tests?", answer: "Nein. Ergebnisse brauchen weiterhin angemessene menschliche Prüfung und ausführbare Verifikation. Der Nachweis zeigt, was geprüft wurde und was offen bleibt." },
      ],
    },
    final: { title: "Testen Sie einen Agenten an einer echten, begrenzten Aufgabe.", body: "Installieren Sie die Open-Source-CLI, wählen Sie einen Anbieter, öffnen Sie ein Projekt und bewerten Sie Diff und Prüfnachweise.", docs: "Dokumentation lesen", install: "Installationsbefehl kopieren" },
  },
  fr: {
    metadata: {
      title: "Agent de code IA — Open source et natif du terminal",
      description: "Aurict est un agent de code IA open source avec contexte projet, agents spécialisés, fournisseurs BYOK, MCP, approbations et preuves de vérification.",
      keywords: ["agent de code IA", "agent de programmation", "agent IA open source", "code agentique", "agent CLI", "ingénierie logicielle IA", "alternative Claude Code", "code multi-agent"],
    },
    breadcrumb: "Agent de code IA",
    hero: {
      eyebrow: "agent de code IA open source", title: "Un agent de code IA pour aller au-delà de l’autocomplétion.",
      lede: "Aurict explore un dépôt, coordonne des agents spécialisés, modifie les fichiers avec des outils typés, lance les vérifications et conserve les preuves. Vous choisissez le fournisseur de modèles et gardez le terminal comme interface de contrôle.",
      install: "installer Aurict", compare: "comparer les agents", proof: ["9 agents spécialisés", "12 fournisseurs intégrés", "outils compatibles MCP", "macOS · Linux · Windows"],
    },
    definition: {
      title: "Qu’est-ce qu’un agent de code IA ?",
      paragraphs: [
        "Un agent de code IA transforme une demande de développement en actions dans une base de code. Au-delà de la ligne suivante, il explore les fichiers, raisonne sur les dépendances, utilise des outils, effectue des changements ciblés, lance des vérifications et explique le résultat.",
        "Un assistant attend généralement une demande étroite ou propose du code en ligne. Un agent coordonne un workflow plus long, mais cette autonomie exige des limites. Les systèmes utiles rendent visibles les permissions, le périmètre, les outils, les vérifications et le travail inachevé.",
        "Aurict applique ce modèle dans un runtime de terminal open source. Des rôles spécialisés séparent exploration, implémentation, revue, tests, documentation, sécurité, débogage, performance et analyse tout en reliant les preuves à un objectif commun.",
      ],
    },
    differences: {
      eyebrow: "agent ou assistant", title: "La différence tient au workflow, pas au nom.", intro: "Évaluez ce que l’outil fait réellement après avoir reçu une tâche.",
      items: [
        { title: "Contexte du dépôt", body: "Un agent cartographie fichiers, dépendances, conventions et risques avant de modifier le code." },
        { title: "Utilisation d’outils", body: "Il appelle des outils explicites pour la recherche, les fichiers, la documentation, le navigateur, les tests et l’évaluation." },
        { title: "Action limitée", body: "Les permissions et le périmètre déterminent ce qui peut avancer et ce qui exige votre approbation." },
        { title: "Vérification", body: "Une preuve de livraison distingue les contrôles exécutés des hypothèses, dérogations et travaux ouverts." },
      ],
    },
    evaluation: {
      eyebrow: "critères de choix", title: "Comment choisir un agent de code IA.", intro: "Comparez les produits sur vos vrais dépôts et vos contraintes d’exploitation.",
      items: [
        { title: "Choix du fournisseur", body: "Vérifiez la prise en charge de vos modèles cloud ou locaux et votre contrôle des identifiants." },
        { title: "Modèle d’autorisation", body: "Cherchez des limites claires pour le shell, les fichiers, les services externes, les secrets et les actions destructrices." },
        { title: "Qualité du contexte", body: "Contrôlez comment l’agent découvre architecture, dépendances, consignes et sources pertinentes sans saturer le modèle." },
        { title: "Preuves de livraison", body: "Exigez le détail des fichiers modifiés, contrôles exécutés, échecs, travaux ignorés et risques ouverts." },
        { title: "Extensibilité", body: "Évaluez MCP, les outils personnalisés, les compétences réutilisables et l’inspectabilité des intégrations." },
        { title: "Adéquation au workflow", body: "Testez terminal, IDE, serveur distant, système, latence et coût sur une tâche représentative." },
      ],
    },
    workflows: {
      eyebrow: "cas d’usage", title: "Le même runtime pour tout le cycle d’ingénierie.", intro: "Commencez par une tâche limitée, puis élargissez le périmètre quand l’agent prouve qu’il respecte les contraintes du projet.",
      items: [
        { title: "Exploration du dépôt", body: "Cartographier architecture, dépendances, responsabilités et fichiers liés à un changement.", href: "/terminal-agent" },
        { title: "Refactorisation", body: "Planifier les changements multi-fichiers, préserver les contrats publics et vérifier le comportement.", href: "/use-cases/refactoring" },
        { title: "Revue de code", body: "Examiner un diff pour l’exactitude, la sécurité, la performance, la maintenance et les tests manquants.", href: "/use-cases/code-review" },
        { title: "Tests et documentation", body: "Ajouter une couverture utile et actualiser la documentation depuis les parcours réellement modifiés.", href: "/use-cases/testing" },
      ],
    },
    alternatives: {
      eyebrow: "alternatives", title: "Comparez les agents avec des critères documentés.", body: "Aurict recoupe les agents de terminal et les environnements de développement IA, mais chaque produit fait des compromis différents. Consultez les sources officielles et testez la même tâche.",
      links: [
        { label: "alternative à Claude Code", href: "/compare/claude-code" }, { label: "alternative à Cursor", href: "/compare/cursor" },
        { label: "alternative à Aider", href: "/compare/aider" }, { label: "alternative à GitHub Copilot CLI", href: "/compare/github-copilot" },
        { label: "alternative à OpenCode", href: "/compare/opencode" },
      ],
    },
    faq: {
      eyebrow: "FAQ agent de code", title: "Les questions avant d’adopter un agent.",
      items: [
        { question: "Aurict est-il un agent de code ou un outil d’autocomplétion ?", answer: "Aurict est un runtime agentique natif du terminal. Il explore les projets, coordonne outils et spécialistes, effectue des changements ciblés, vérifie et rapporte les preuves au lieu de seulement prédire du code." },
        { question: "Aurict est-il une alternative à Claude Code ?", answer: "Oui pour comparer les workflows de terminal. Aurict privilégie le choix du fournisseur, les spécialistes, Project Auto limité et les preuves durables ; Claude Code propose le workflow officiel d’Anthropic. Testez les deux sur la même tâche." },
        { question: "Puis-je choisir le fournisseur de modèles ?", answer: "Oui. Aurict propose des adaptateurs cloud et locaux. Vous fournissez les identifiants et choisissez un modèle disponible." },
        { question: "L’agent peut-il exécuter des commandes ?", answer: "Aurict classe les commandes et applique les permissions avant exécution. Les actions dangereuses ou hors périmètre exigent une approbation directe." },
        { question: "Un agent remplace-t-il la revue et les tests ?", answer: "Non. Le résultat exige toujours une revue humaine proportionnée et des vérifications exécutables. La preuve indique ce qui a été contrôlé et ce qui reste ouvert." },
      ],
    },
    final: { title: "Testez un agent sur une tâche réelle et limitée.", body: "Installez la CLI open source, choisissez un fournisseur, ouvrez un projet et jugez le diff et les preuves de vérification.", docs: "lire la documentation", install: "copier la commande" },
  },
  es: {
    metadata: {
      title: "Agente de programación IA — Open source y para terminal",
      description: "Aurict es un agente de programación IA open source con contexto de proyecto, especialistas, proveedores BYOK, MCP, aprobaciones y pruebas.",
      keywords: ["agente de programación IA", "agente de código", "agente IA open source", "programación con agentes", "agente CLI", "ingeniería de software IA", "alternativa a Claude Code", "programación multiagente"],
    },
    breadcrumb: "Agente de programación IA",
    hero: {
      eyebrow: "agente de programación IA open source", title: "Un agente de programación IA para ir más allá del autocompletado.",
      lede: "Aurict explora repositorios, coordina especialistas, edita archivos mediante herramientas tipadas, ejecuta controles y conserva pruebas. Tú eliges el proveedor de modelos y mantienes la terminal como superficie de control.",
      install: "instalar Aurict", compare: "comparar agentes", proof: ["9 agentes especialistas", "12 proveedores integrados", "herramientas compatibles con MCP", "macOS · Linux · Windows"],
    },
    definition: {
      title: "¿Qué es un agente de programación IA?",
      paragraphs: [
        "Un agente de programación IA convierte una petición de desarrollo en acciones dentro del código. Va más allá de sugerir la siguiente línea: explora archivos, razona sobre dependencias, usa herramientas, hace cambios acotados, verifica y explica el resultado.",
        "Un asistente suele esperar una petición estrecha u ofrecer sugerencias en línea. Un agente coordina un flujo más largo, pero esa autonomía necesita límites. Los sistemas útiles muestran permisos, alcance, actividad de herramientas, verificación y trabajo pendiente.",
        "Aurict implementa este patrón como runtime de terminal open source. Los roles especialistas separan exploración, implementación, revisión, pruebas, documentación, seguridad, depuración, rendimiento y analítica, conectados por una tarea coordinada.",
      ],
    },
    differences: {
      eyebrow: "agente o asistente", title: "La diferencia está en el flujo, no en la etiqueta.", intro: "Evalúa lo que la herramienta puede hacer realmente después de recibir una tarea.",
      items: [
        { title: "Contexto del repositorio", body: "Un agente identifica archivos, dependencias, convenciones y riesgos antes de modificar el código." },
        { title: "Uso de herramientas", body: "Puede invocar herramientas explícitas para búsqueda, archivos, documentación, navegador, pruebas y evaluación." },
        { title: "Acción acotada", body: "Los permisos y el alcance determinan qué acciones avanzan y cuáles requieren tu aprobación." },
        { title: "Verificación", body: "El registro final separa los controles ejecutados de suposiciones, excepciones y trabajo pendiente." },
      ],
    },
    evaluation: {
      eyebrow: "lista de selección", title: "Cómo elegir un agente de programación IA.", intro: "Compara los productos con repositorios reales y tus restricciones operativas.",
      items: [
        { title: "Proveedor y modelo", body: "Comprueba si admite tus modelos alojados o locales y si tú controlas las credenciales." },
        { title: "Modelo de permisos", body: "Busca límites claros para comandos, archivos, servicios externos, secretos y acciones destructivas." },
        { title: "Calidad del contexto", body: "Confirma cómo descubre arquitectura, dependencias, instrucciones y fuentes relevantes sin saturar el modelo." },
        { title: "Pruebas de finalización", body: "Exige un informe de archivos cambiados, controles ejecutados, fallos, trabajo omitido y riesgos abiertos." },
        { title: "Extensibilidad", body: "Evalúa MCP, herramientas propias, habilidades reutilizables y si las integraciones son inspeccionables." },
        { title: "Encaje del flujo", body: "Prueba terminal, IDE, servidor remoto, sistema operativo, latencia y coste con una tarea representativa." },
      ],
    },
    workflows: {
      eyebrow: "casos de uso", title: "El mismo runtime durante todo el ciclo de ingeniería.", intro: "Empieza con una tarea acotada y amplía el alcance cuando el agente demuestre que conserva las restricciones del proyecto.",
      items: [
        { title: "Exploración del repositorio", body: "Mapear arquitectura, dependencias, responsables y archivos relacionados con un cambio.", href: "/terminal-agent" },
        { title: "Refactorización", body: "Planificar cambios en varios archivos, conservar contratos públicos y verificar el comportamiento.", href: "/use-cases/refactoring" },
        { title: "Revisión de código", body: "Examinar un diff por corrección, seguridad, rendimiento, mantenibilidad y pruebas ausentes.", href: "/use-cases/code-review" },
        { title: "Pruebas y documentación", body: "Añadir cobertura útil y actualizar la documentación desde las rutas realmente modificadas.", href: "/use-cases/testing" },
      ],
    },
    alternatives: {
      eyebrow: "alternativas", title: "Compara agentes con criterios documentados.", body: "Aurict coincide con agentes de terminal y entornos de desarrollo IA, pero cada producto prioriza aspectos distintos. Consulta fuentes oficiales y prueba la misma tarea.",
      links: [
        { label: "alternativa a Claude Code", href: "/compare/claude-code" }, { label: "alternativa a Cursor", href: "/compare/cursor" },
        { label: "alternativa a Aider", href: "/compare/aider" }, { label: "alternativa a GitHub Copilot CLI", href: "/compare/github-copilot" },
        { label: "alternativa a OpenCode", href: "/compare/opencode" },
      ],
    },
    faq: {
      eyebrow: "preguntas sobre agentes", title: "Lo que se pregunta antes de adoptar un agente.",
      items: [
        { question: "¿Aurict es un agente de programación o autocompletado?", answer: "Aurict es un runtime de agentes nativo de terminal. Explora proyectos, coordina herramientas y especialistas, hace cambios acotados, verifica e informa pruebas en lugar de limitarse a predecir código." },
        { question: "¿Aurict es una alternativa a Claude Code?", answer: "Sí para comparar flujos de terminal. Aurict prioriza proveedores, especialistas, Project Auto acotado y pruebas duraderas; Claude Code ofrece el flujo oficial de Anthropic. Prueba ambos con la misma tarea." },
        { question: "¿Puedo elegir el proveedor de modelos?", answer: "Sí. Aurict incluye adaptadores para proveedores cloud y locales. Tú aportas las credenciales y eliges un modelo disponible." },
        { question: "¿Puede el agente ejecutar comandos?", answer: "Aurict clasifica los comandos y aplica permisos antes de ejecutarlos. Las acciones peligrosas o fuera de alcance exigen aprobación directa." },
        { question: "¿Sustituye un agente la revisión y las pruebas?", answer: "No. El resultado aún requiere revisión humana y verificación ejecutable. El registro muestra qué se comprobó y qué queda pendiente." },
      ],
    },
    final: { title: "Prueba un agente con una tarea real y acotada.", body: "Instala la CLI open source, elige un proveedor, abre un proyecto y evalúa el diff y las pruebas de verificación.", docs: "leer la documentación", install: "copiar comando" },
  },
} satisfies Record<AppLocale, AiCodingAgentCopy>

export function localizeAiCodingAgent(locale: AppLocale): AiCodingAgentCopy {
  return content[locale]
}
