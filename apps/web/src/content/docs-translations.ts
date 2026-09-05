import type { AppLocale } from "@/i18n/routing"
import { productFacts, providerCount } from "@/content/product-facts"

const providerCode = productFacts.providers
  .map((provider) => `${provider.id.padEnd(12)} → ${provider.name}`)
  .join("\n")

const DOCS_SECTIONS_EN = [
  {
    title: "Product Surfaces",
    anchor: "product-surfaces",
    content: [
      {
        heading: "Terminal agent",
        body: "The CLI is the primary Aurict runtime: BYOK providers, project context, typed tools, checkpoints, sessions, skills, MCP, hooks, local API access, and multi-agent workflows run where developers already work.",
        code: "aurict\n/config\n/providers\n/sessions\n/agent\n/mcp",
      },
      {
        heading: "Web platform",
        body: "The web app is the public trust and onboarding surface. It contains the landing page, docs, roadmap, changelog, manifesto, Firebase-backed auth, browser login flow, privacy policy, terms, and account deletion direction.",
        code: "apps/web\n/routes: /docs /roadmap /changelog /about /privacy /terms /auth/device",
      },
      {
        heading: "Mobile BYOK assistant",
        body: "The Flutter app extends Aurict beyond the terminal: BYOK chat, provider sessions, research and document workflows, PDF generation, scoped assistant-answer reporting, and Android release hardening.",
        code: "mobile/lib/main.dart\nmobile/lib/agent/mobile_chat_stream.dart\nmobile/lib/agent/mobile_feedback_report.dart",
      },
    ],
  },
  {
    title: "Security & Privacy",
    anchor: "security-privacy",
    content: [
      {
        heading: "Secret boundaries",
        body: "Provider keys, Firebase service files, Android keystores, key properties, local env files, SQLite runtime data, and backend prototype files are excluded from source control. CI restores release secrets from GitHub Actions secrets when producing Android artifacts.",
        code: ".env\n.env.local\ngoogle-services.json\n*.jks\n*.keystore\nkey.properties\napps/backend/",
      },
      {
        heading: "Account and feedback flows",
        body: "The web and mobile surfaces include privacy, terms, account deletion, and report-feedback paths. Reported assistant answers are treated as scoped feedback events for review, not as a blanket upload of a user's project.",
        code: "POST /feedback/reports\nPOST /account/delete\n/privacy\n/terms",
      },
    ],
  },
  {
    title: "Installation",
    anchor: "installation",
    content: [
      {
        heading: "macOS and Linux",
        body: "Download the matching self-contained release binary without installing Node.js or Bun. The installer verifies the release SHA-256 checksum before installing to ~/.local/bin.",
        code: "curl -fsSL https://aurict.com/install.sh | bash",
      },
      {
        heading: "npm",
        body: "Use npm when you prefer package-manager updates or are on Windows. The correct platform binary (macOS arm64/x64, Linux x64/arm64, Windows x64) is selected automatically.",
        code: "npm install -g aurict",
      },
      {
        heading: "Direct release binary",
        body: "Use a GitHub Release when you need a portable binary, an offline-friendly deployment, or a fully manual installation. Download the asset for your operating system and CPU architecture, then compare its SHA-256 hash with the matching entry in checksums.txt before you run it.",
        code: "# Linux x64\ncurl -LO https://github.com/aurict/aurict/releases/latest/download/aurict-linux-x64\ncurl -LO https://github.com/aurict/aurict/releases/latest/download/checksums.txt\nsha256sum -c checksums.txt --ignore-missing\nchmod +x aurict-linux-x64\n./aurict-linux-x64\n\n# Windows PowerShell\nInvoke-WebRequest https://github.com/aurict/aurict/releases/latest/download/aurict-win32-x64.exe -OutFile aurict.exe\nInvoke-WebRequest https://github.com/aurict/aurict/releases/latest/download/checksums.txt -OutFile checksums.txt\nGet-FileHash .\\aurict.exe -Algorithm SHA256",
      },
      {
        heading: "Versioned, custom-directory, and removal options",
        body: "The one-line installer accepts a release version and an installation directory through environment variables. It installs only the Aurict binary; removing that binary removes this installation method. npm users can uninstall with npm.",
        code: "# Install a specific version into a custom user directory\nAURICT_INSTALL_VERSION=1.2.22 AURICT_INSTALL_DIR=~/.local/bin curl -fsSL https://aurict.com/install.sh | bash\n\n# Remove the curl-installer binary\nrm ~/.local/bin/aurict\n\n# Remove the npm package\nnpm uninstall -g aurict",
      },
      {
        heading: "First run",
        body: "Navigate to any project directory and launch. On first run, choose a provider, enter an API key, choose a model, then decide whether Project Auto may approve bounded file changes in this project for this session.",
        code: "cd your-project\naurict",
      },
      {
        heading: "Build from source",
        body: "Clone the repo and build with Bun. Requires Bun >= 1.1.",
        code: "git clone https://github.com/aurict/aurict\ncd aurict\nbun install\nbun run build",
      },
    ],
  },
  {
    title: "Configuration",
    anchor: "configuration",
    content: [
      {
        heading: "Project config — .aurict/config.json",
        body: "Place a config file in your project root or in ~/.aurict/ for global defaults. Project config overrides global config, CLI flags override both.",
        code: '{\n  "provider": "anthropic",\n  "model": "claude-sonnet-4-6",\n  "maxTokens": 8192,\n  "stream": true\n}',
      },
      {
        heading: "API keys via /config",
        body: "Set API keys from inside the terminal UI. Keys are encrypted and saved to ~/.aurict/config.json, persisting across sessions.",
        code: "# Inside the Aurict terminal:\n/config set anthropic sk-ant-...\n/config set openai sk-...\n/config set google AIza...\n\n# Show current config\n/config",
      },
      {
        heading: "Environment variables",
        body: "API keys can also be set via environment variables. They take precedence over config file keys.",
        code: "ANTHROPIC_API_KEY=sk-ant-...\nOPENAI_API_KEY=sk-...\nGOOGLE_GENERATIVE_AI_API_KEY=AIza...\nOPENROUTER_API_KEY=sk-or-...\nXAI_API_KEY=xai-...",
      },
    ],
  },
  {
    title: "Providers & Models",
    anchor: "providers",
    content: [
      {
        heading: "Switching providers",
        body: "Use /providers inside the TUI to see all available providers and their key status, then switch between them. A model picker opens automatically after switching.",
        code: "/providers",
      },
      {
        heading: "Supported providers",
        body: `${providerCount} providers are built in. Ollama requires no API key and works with locally running models. Use /providers and /models for the current models available to your configured providers.`,
        code: providerCode,
      },
      {
        heading: "Thinking / reasoning mode",
        body: "Models that support extended thinking (claude-opus-4, o3, deepseek-r1) show a reasoning budget picker after model selection. Use /models to adjust at any time.",
        code: "/models\n# → select model → select effort (off / low / med / high / max)",
      },
    ],
  },
  {
    title: "Custom Tools",
    anchor: "custom-tools",
    content: [
      {
        heading: "Creating a tool",
        body: "Drop a .js ESM file in ~/.aurict/tools/ (global) or .aurict/tools/ (project). Project tools override global tools with the same id. Tools are loaded at startup.",
        code: "// .aurict/tools/my-tool.js\nexport default {\n  id: \"my-tool\",\n  description: \"What this tool does\",\n  parameters: {\n    type: \"object\",\n    properties: {\n      input: { type: \"string\", description: \"Input text\" }\n    },\n    required: [\"input\"]\n  },\n  async execute({ input }, ctx) {\n    return { output: input.toUpperCase() }\n  }\n}",
      },
      {
        heading: "Tool context (ctx)",
        body: "The execute function receives a ctx object with the current working directory, session ID, and an abort signal.",
        code: "async execute({ input }, ctx) {\n  const { workdir, sessionId, signal } = ctx\n  // workdir: current project path\n  // signal:  AbortSignal for cancellation\n}",
      },
    ],
  },
  {
    title: "Custom Skills",
    anchor: "custom-skills",
    content: [
      {
        heading: "Creating a skill",
        body: "Skills are Markdown files injected into the system prompt when their trigger conditions match. Place them in ~/.aurict/skills/ or .aurict/skills/.",
        code: "<!-- .aurict/skills/conventions.md -->\n---\nname: conventions\ndescription: Our team coding conventions\n---\n\nAlways use 2-space indentation.\nPrefer functional components over class components.\nNever use var — always const or let.\nAll async functions must handle errors explicitly.",
      },
      {
        heading: "Auto-injected skills",
        body: "Aurict scans your project on startup and auto-injects relevant skills from its 218+ built-in library based on detected frameworks, languages, and config files.",
        code: "# Aurict detects and injects skills for:\nnext.js, react, vue, svelte, astro\npython, fastapi, django, flask\nrust, go, java, kotlin\ndocker, kubernetes, terraform\nbun, deno, node\n# ...and 200+ more combinations",
      },
    ],
  },
  {
    title: "MCP Integration",
    anchor: "mcp",
    content: [
      {
        heading: "Using your existing MCP config",
        body: "Aurict can import compatible servers from claude_desktop_config.json on startup. Use /mcp to confirm each connection and inspect the tools it exposes; server compatibility, credentials, and local dependencies still apply.",
        code: "# macOS\n~/Library/Application Support/Claude/claude_desktop_config.json\n\n# Linux\n~/.config/Claude/claude_desktop_config.json\n\n# Windows\n%APPDATA%\\Claude\\claude_desktop_config.json",
      },
      {
        heading: "Listing connected servers",
        body: "Use /mcp inside the TUI to see all connected MCP servers and their available tools.",
        code: "/mcp",
      },
    ],
  },
  {
    title: "Session Management",
    anchor: "sessions",
    content: [
      {
        heading: "Browsing sessions",
        body: "All sessions are persisted automatically. Use /sessions to open an interactive picker with fuzzy search, or Ctrl+R to open QuickSearch from anywhere.",
        code: "/sessions        # interactive picker\nCtrl+R           # QuickSearch (fuzzy)",
      },
      {
        heading: "Checkpoints & undo",
        body: "Aurict creates a checkpoint before every AI action. Use /undo to roll back N steps (files + conversation), or /checkpoints to list all saved states.",
        code: "/undo            # undo last step\n/undo 3          # undo last 3 steps\n/checkpoints     # list all checkpoints\n/replay <id>     # jump to any checkpoint",
      },
      {
        heading: "Forking & branching",
        body: "Fork the current session to create an independent copy, or branch the conversation to explore different approaches without losing your current state.",
        code: "/fork            # create independent copy\n/branch          # branch conversation\n/branch list     # list branches",
      },
      {
        heading: "Context compaction",
        body: "When approaching the context window limit, Aurict can compact old messages while preserving critical context. Use /compact to view or change the compaction strategy.",
        code: "/compact         # show current strategy\n/compact auto    # auto-compact at 80% usage\n/compact manual  # prompt before compacting\n/ctx             # show context usage",
      },
      {
        heading: "Project Auto",
        body: "Project Auto removes repeated prompts only for bounded write, edit, and apply_patch requests inside the active project. The grant is session-scoped and resets when the workdir changes. Shell commands, secrets, .git and .aurict paths, project escapes, dangerous operations, and broad deletions still require direct approval.",
        code: "/auto            # toggle Project Auto\n/autopilot       # alias\n\n# On startup: choose Yes or No for this project session",
      },
      {
        heading: "Completion proof",
        body: "Use /proof to inspect the durable completion record: changed files, verification evidence, open work, and explicit waivers. Required work stays gated while its evidence is pending or failed.",
        code: "/proof\n/proof json\n/proof waive verification test runner unavailable in this environment",
      },
    ],
  },
  {
    title: "Hooks",
    anchor: "hooks",
    content: [
      {
        heading: "What are hooks?",
        body: "Hooks are shell commands that run automatically at specific lifecycle events — before a tool call, after a response, or when a session starts. Place hook configs in .aurict/hooks.json.",
        code: '{\n  "hooks": [\n    {\n      "event": "pre-tool",\n      "tool":  "bash",\n      "run":   "echo \\"About to run: $TOOL_ARGS\\""\n    },\n    {\n      "event": "post-response",\n      "run":   "notify-send \\"Aurict finished\\""\n    }\n  ]\n}',
      },
      {
        heading: "Available hook events",
        body: "Hooks can fire on these events. Environment variables provide context about the triggering event.",
        code: "pre-tool        → before any tool executes ($TOOL_NAME, $TOOL_ARGS)\npost-tool       → after tool completes ($TOOL_NAME, $TOOL_RESULT)\npre-response    → before AI generates text\npost-response   → after AI response ($RESPONSE_TEXT)\nsession-start   → on launch ($SESSION_ID, $WORKDIR)\nsession-end     → on exit",
      },
    ],
  },
  {
    title: "Multi-Agent",
    anchor: "multi-agent",
    content: [
      {
        heading: "Specialist agents",
        body: "Aurict ships 9 built-in specialist agents, each pre-configured with domain-specific tools and system prompts. Switch with /agent.",
        code: "/agent           # show agent picker\n\n# Available agents:\nomni        → General-purpose (default)\nexplore     → Codebase exploration & analysis\ncode        → Implementation & refactoring\nreview      → Code review & best practices\ntest        → Test writing & coverage\ndocs        → Documentation generation\nsecurity    → Security audit & hardening\ndebug       → Root cause analysis\nperf        → Performance profiling",
      },
      {
        heading: "Coordinator mode",
        body: "In coordinator mode, Aurict decomposes complex tasks and delegates subtasks to specialist agents running in parallel worker threads. Enable with /coordinator.",
        code: "/coordinator     # toggle coordinator mode\n/agents          # list custom agents",
      },
      {
        heading: "Custom agents",
        body: "Define custom agents in .aurict/agents/ as JSON files. Each agent can have a custom system prompt, tool restrictions, and a default model.",
        code: '// .aurict/agents/my-agent.json\n{\n  "id": "my-agent",\n  "name": "My Agent",\n  "description": "Specialized for X",\n  "system": "You are an expert in...",\n  "tools": ["bash", "read", "write"],\n  "model": "claude-sonnet-4-6"\n}',
      },
      {
        heading: "Background tasks",
        body: "Send long-running tasks to the background so you can continue chatting. Background tasks run in a separate worker and notify you when done.",
        code: "/background      # move current task to background\n/background list # list running background tasks",
      },
    ],
  },
  {
    title: "Token & Cost Tracking",
    anchor: "cost",
    content: [
      {
        heading: "Viewing session cost",
        body: "Use /cost to see a full breakdown of token usage and estimated cost for the current session. Cache reads are shown at their discounted rate.",
        code: "/cost\n\n# Example output:\n# Fresh input:   12,430 tokens   $0.037\n# Output:         3,210 tokens   $0.048\n# Cache reads:   48,200 tokens   $0.014  (10× cheaper)\n# Cache writes:   8,400 tokens   $0.031\n# ──────────────────────────────────────\n# Total:         72,240 tokens   $0.130\n# Cache savings: $0.686 saved vs no caching",
      },
      {
        heading: "Context window usage",
        body: "The context bar in the status line shows real-time context window usage. It counts fresh input + cache reads + cache writes — the true context consumed.",
        code: "/ctx             # detailed context breakdown",
      },
    ],
  },
  {
    title: "Worktrees",
    anchor: "worktrees",
    content: [
      {
        heading: "Parallel development with worktrees",
        body: "Use /worktree to create and manage git worktrees — each worktree gets its own Aurict session, letting you work on multiple branches simultaneously without stashing.",
        code: "/worktree create feature/auth   # new worktree + session\n/worktree list                  # show active worktrees\n/worktree switch feature/auth   # switch to existing\n/worktree remove feature/auth   # clean up",
      },
    ],
  },
]

const DOCS_SECTIONS_TR = [
  {
    title: "Ürünler ve platformlar",
    anchor: "product-surfaces",
    content: [
      {
        heading: "Terminal ajanı",
        body: "CLI, geliştiricilerin zaten çalıştığı yerde çalışan birincil Aurict çalışma zamanıdır: BYOK sağlayıcıları, proje bağlamı, tipli araçlar, kontrol noktaları, oturumlar, beceriler, MCP, kancalar, yerel API erişimi ve çoklu ajan iş akışları.",
        code: "aurict\n/config\n/providers\n/sessions\n/agent\n/mcp",
      },
      {
        heading: "Web platformu",
        body: "Web uygulaması, herkese açık tanıtım ve başlangıç noktasıdır. Açılış sayfası, belgeler, yol haritası, değişiklik günlüğü, manifesto, Firebase destekli kimlik doğrulama, tarayıcı giriş akışı, gizlilik politikası, kullanım koşulları ve hesap silme yönergesini içerir.",
        code: "apps/web\n/routes: /docs /roadmap /changelog /about /privacy /terms /auth/device",
      },
      {
        heading: "Mobil BYOK asistanı",
        body: "Flutter uygulaması, Aurict'i terminalin ötesine taşır: BYOK sohbeti, sağlayıcı oturumları, araştırma ve belge iş akışları, PDF oluşturma, kapsamı belirlenmiş asistan yanıtı raporlama ve Android sürüm sürecini sağlamlaştırma.",
        code: "mobile/lib/main.dart\nmobile/lib/agent/mobile_chat_stream.dart\nmobile/lib/agent/mobile_feedback_report.dart",
      },
    ],
  },
  {
    title: "Güvenlik ve Gizlilik",
    anchor: "security-privacy",
    content: [
      {
        heading: "Gizli sınırlar",
        body: "Sağlayıcı anahtarları, Firebase servis dosyaları, Android keystore'ları, key.properties dosyası, yerel env dosyaları, SQLite çalışma zamanı verileri ve backend prototip dosyaları kaynak kontrolünün dışında tutulur. CI, Android paketleri üretirken yayın gizli bilgilerini GitHub Actions secrets'tan geri yükler.",
        code: ".env\n.env.local\ngoogle-services.json\n*.jks\n*.keystore\nkey.properties\napps/backend/",
      },
      {
        heading: "Hesap ve geri bildirim akışları",
        body: "Web ve mobil uygulamalar gizlilik, koşullar, hesap silme ve geri bildirim raporlama yollarını içerir. Bildirilen asistan yanıtları, kullanıcının projesinin toplu bir yüklenmesi olarak değil, inceleme için kapsamı belirlenmiş geri bildirim olayları olarak ele alınır.",
        code: "POST /feedback/reports\nPOST /account/delete\n/privacy\n/terms",
      },
    ],
  },
  {
    title: "Kurulum",
    anchor: "installation",
    content: [
      {
        heading: "macOS ve Linux",
        body: "Node.js veya Bun kurmadan eşleşen kendi kendine yeten yayın ikili dosyasını indirin. Yükleyici, ~/.local/bin dizinine kurmadan önce yayının SHA-256 sağlama toplamını doğrular.",
        code: "curl -fsSL https://aurict.com/install.sh | bash",
      },
      {
        heading: "npm",
        body: "Paket yöneticisi güncellemelerini tercih ediyorsanız veya Windows kullanıyorsanız npm'i kullanın. Doğru platform ikili dosyası (macOS arm64/x64, Linux x64/arm64, Windows x64) otomatik olarak seçilir.",
        code: "npm install -g aurict",
      },
      {
        heading: "Doğrudan yayın ikili dosyası",
        body: "Taşınabilir bir ikili dosya, çevrimdışı dostu dağıtım veya tamamen manuel bir kurulum gerektiğinde bir GitHub Release kullanın. İşletim sisteminiz ve CPU mimariniz için varlığı indirin, ardından çalıştırmadan önce SHA-256 hash'ini checksums.txt içindeki ilgili girdiyle karşılaştırın.",
        code: "# Linux x64\ncurl -LO https://github.com/aurict/aurict/releases/latest/download/aurict-linux-x64\ncurl -LO https://github.com/aurict/aurict/releases/latest/download/checksums.txt\nsha256sum -c checksums.txt --ignore-missing\nchmod +x aurict-linux-x64\n./aurict-linux-x64\n\n# Windows PowerShell\nInvoke-WebRequest https://github.com/aurict/aurict/releases/latest/download/aurict-win32-x64.exe -OutFile aurict.exe\nInvoke-WebRequest https://github.com/aurict/aurict/releases/latest/download/checksums.txt -OutFile checksums.txt\nGet-FileHash .\\aurict.exe -Algorithm SHA256",
      },
      {
        heading: "Sürümlemeli, özel dizinli ve kaldırma seçenekleri",
        body: "Tek satırlık yükleyici, ortam değişkenleri aracılığıyla bir yayın sürümü ve kurulum dizini kabul eder. Yalnızca Aurict ikili dosyasını kurar; bu ikili dosyayı kaldırmak bu kurulum yöntemini kaldırır. npm kullanıcıları npm ile kaldırabilir.",
        code: "# Install a specific version into a custom user directory\nAURICT_INSTALL_VERSION=1.2.22 AURICT_INSTALL_DIR=~/.local/bin curl -fsSL https://aurict.com/install.sh | bash\n\n# Remove the curl-installer binary\nrm ~/.local/bin/aurict\n\n# Remove the npm package\nnpm uninstall -g aurict",
      },
      {
        heading: "İlk çalıştırma",
        body: "Herhangi bir proje dizinine gidin ve başlatın. İlk çalıştırmada bir sağlayıcı seçin, API anahtarınızı girin, modeli belirleyin; ardından Project Auto'nun bu projedeki sınırlı dosya değişikliklerini bu oturum için onaylamasını isteyip istemediğinizi seçin.",
        code: "cd your-project\naurict",
      },
      {
        heading: "Kaynaktan derleme",
        body: "Depoyu klonlayın ve Bun ile derleyin. Bun >= 1.1 gerektirir.",
        code: "git clone https://github.com/aurict/aurict\ncd aurict\nbun install\nbun run build",
      },
    ],
  },
  {
    title: "Yapılandırma",
    anchor: "configuration",
    content: [
      {
        heading: "Proje yapılandırması — .aurict/config.json",
        body: "Bir yapılandırma dosyasını proje kök dizinine veya genel varsayılanlar için ~/.aurict/ içine yerleştirin. Proje yapılandırması genel yapılandırmayı, CLI bayrakları ise her ikisini de geçersiz kılar.",
        code: '{\n  "provider": "anthropic",\n  "model": "claude-sonnet-4-6",\n  "maxTokens": 8192,\n  "stream": true\n}',
      },
      {
        heading: "API anahtarları /config ile",
        body: "API anahtarlarını terminal arayüzünün içinden ayarlayın. Anahtarlar şifrelenir ve ~/.aurict/config.json dosyasına kaydedilerek oturumlar boyunca korunur.",
        code: "# Inside the Aurict terminal:\n/config set anthropic sk-ant-...\n/config set openai sk-...\n/config set google AIza...\n\n# Show current config\n/config",
      },
      {
        heading: "Ortam değişkenleri",
        body: "API anahtarları ortam değişkenleri aracılığıyla da ayarlanabilir. Bunlar, yapılandırma dosyası anahtarlarının öncelindedir.",
        code: "ANTHROPIC_API_KEY=sk-ant-...\nOPENAI_API_KEY=sk-...\nGOOGLE_GENERATIVE_AI_API_KEY=AIza...\nOPENROUTER_API_KEY=sk-or-...\nXAI_API_KEY=xai-...",
      },
    ],
  },
  {
    title: "Sağlayıcılar ve Modeller",
    anchor: "providers",
    content: [
      {
        heading: "Sağlayıcı değiştirme",
        body: "Tüm mevcut sağlayıcıları ve anahtar durumlarını görmek için TUI içinde /providers kullanın, ardından aralarında geçiş yapın. Geçişten sonra otomatik olarak bir model seçici açılır.",
        code: "/providers",
      },
      {
        heading: "Desteklenen sağlayıcılar",
        body: `${providerCount} sağlayıcı yerleşik olarak gelir. Ollama API anahtarı gerektirmez ve yerel olarak çalışan modellerle çalışır. Yapılandırdığınız sağlayıcılarda güncel modelleri görmek için /providers ve /models kullanın.`,
        code: providerCode,
      },
      {
        heading: "Düşünme / muhakeme modu",
        body: "Genişletilmiş düşünmeyi destekleyen modeller (claude-opus-4, o3, deepseek-r1), model seçiminden sonra bir muhakeme bütçesi seçici gösterir. İstediğiniz zaman ayarlamak için /models kullanın.",
        code: "/models\n# → select model → select effort (off / low / med / high / max)",
      },
    ],
  },
  {
    title: "Özel Araçlar",
    anchor: "custom-tools",
    content: [
      {
        heading: "Araç oluşturma",
        body: "Bir .js ESM dosyasını ~/.aurict/tools/ (genel) veya .aurict/tools/ (proje) içine bırakın. Proje araçları aynı id'ye sahip genel araçların öncelindedir. Araçlar başlangıçta yüklenir.",
        code: "// .aurict/tools/my-tool.js\nexport default {\n  id: \"my-tool\",\n  description: \"What this tool does\",\n  parameters: {\n    type: \"object\",\n    properties: {\n      input: { type: \"string\", description: \"Input text\" }\n    },\n    required: [\"input\"]\n  },\n  async execute({ input }, ctx) {\n    return { output: input.toUpperCase() }\n  }\n}",
      },
      {
        heading: "Araç bağlamı (ctx)",
        body: "Execute fonksiyonu, geçerli çalışma dizini, oturum kimliği ve bir iptal sinyali içeren bir ctx nesnesi alır.",
        code: "async execute({ input }, ctx) {\n  const { workdir, sessionId, signal } = ctx\n  // workdir: current project path\n  // signal:  AbortSignal for cancellation\n}",
      },
    ],
  },
  {
    title: "Özel Beceriler",
    anchor: "custom-skills",
    content: [
      {
        heading: "Beceri oluşturma",
        body: "Beceriler, tetikleme koşulları eşleştiğinde sistem istemine enjekte edilen Markdown dosyalarıdır. Bunları ~/.aurict/skills/ veya .aurict/skills/ içine yerleştirin.",
        code: "<!-- .aurict/skills/conventions.md -->\n---\nname: conventions\ndescription: Our team coding conventions\n---\n\nAlways use 2-space indentation.\nPrefer functional components over class components.\nNever use var — always const or let.\nAll async functions must handle errors explicitly.",
      },
      {
        heading: "Otomatik enjekte edilen beceriler",
        body: "Aurict, başlangıçta projenizi tarar ve algılanan çerçevelere, dillere ve yapılandırma dosyalarına göre 218+ yerleşik kütüphanesinden ilgili becerileri otomatik olarak enjekte eder.",
        code: "# Aurict detects and injects skills for:\nnext.js, react, vue, svelte, astro\npython, fastapi, django, flask\nrust, go, java, kotlin\ndocker, kubernetes, terraform\nbun, deno, node\n# ...and 200+ more combinations",
      },
    ],
  },
  {
    title: "MCP Entegrasyonu",
    anchor: "mcp",
    content: [
      {
        heading: "Mevcut MCP yapılandırmanızı kullanma",
        body: "Aurict, başlangıçta claude_desktop_config.json içindeki uyumlu sunucuları içe aktarabilir. Her bağlantıyı ve sunduğu araçları /mcp ile doğrulayın; sunucu uyumluluğu, kimlik bilgileri ve yerel bağımlılıklar yine geçerlidir.",
        code: "# macOS\n~/Library/Application Support/Claude/claude_desktop_config.json\n\n# Linux\n~/.config/Claude/claude_desktop_config.json\n\n# Windows\n%APPDATA%\\Claude\\claude_desktop_config.json",
      },
      {
        heading: "Bağlı sunucuları listeleme",
        body: "Bağlı tüm MCP sunucularını ve kullanılabilir araçlarını görmek için TUI içinde /mcp kullanın.",
        code: "/mcp",
      },
    ],
  },
  {
    title: "Oturum Yönetimi",
    anchor: "sessions",
    content: [
      {
        heading: "Oturumlara göz atma",
        body: "Tüm oturumlar otomatik olarak kalıcılaştırılır. Bulanık arama içeren etkileşimli bir seçici açmak için /sessions kullanın veya herhangi bir yerden QuickSearch'i açmak için Ctrl+R'a basın.",
        code: "/sessions        # interactive picker\nCtrl+R           # QuickSearch (fuzzy)",
      },
      {
        heading: "Kontrol noktaları ve geri alma",
        body: "Aurict, her yapay zeka eyleminden önce bir kontrol noktası oluşturur. N adımı (dosyalar + konuşma) geri almak için /undo, kaydedilen tüm durumları listelemek için /checkpoints kullanın.",
        code: "/undo            # undo last step\n/undo 3          # undo last 3 steps\n/checkpoints     # list all checkpoints\n/replay <id>     # jump to any checkpoint",
      },
      {
        heading: "Çatallama ve dallanma",
        body: "Bağımsız bir kopya oluşturmak için geçerli oturumu çatallayın veya mevcut durumunuzu kaybetmeden farklı yaklaşımları keşfetmek için konuşmayı dallandırın.",
        code: "/fork            # create independent copy\n/branch          # branch conversation\n/branch list     # list branches",
      },
      {
        heading: "Bağlam sıkıştırma",
        body: "Bağlam penceresi sınırına yaklaşıldığında Aurict, kritik bağlamı koruyarak eski mesajları sıkıştırabilir. Sıkıştırma stratejisini görüntülemek veya değiştirmek için /compact kullanın.",
        code: "/compact         # show current strategy\n/compact auto    # auto-compact at 80% usage\n/compact manual  # prompt before compacting\n/ctx             # show context usage",
      },
      {
        heading: "Project Auto",
        body: "Project Auto yalnızca etkin proje içindeki sınırlı write, edit ve apply_patch isteklerinde tekrar eden izinleri kaldırır. İzin oturum kapsamındadır ve çalışma dizini değiştiğinde sıfırlanır. Kabuk komutları, secret'lar, .git ve .aurict yolları, proje dışına çıkışlar, tehlikeli işlemler ve geniş silmeler hâlâ doğrudan onay ister.",
        code: "/auto            # Project Auto'yu aç/kapat\n/autopilot       # takma ad\n\n# Başlangıçta bu proje oturumu için Evet veya Hayır seçin",
      },
      {
        heading: "Tamamlanma kanıtı",
        body: "Kalıcı tamamlanma kaydını görmek için /proof kullanın: değişen dosyalar, doğrulama kanıtı, açık işler ve açıkça verilmiş muafiyetler. Kanıtı bekleyen veya başarısız olan gerekli işler tamamlanmış sayılmaz.",
        code: "/proof\n/proof json\n/proof waive verification test runner unavailable in this environment",
      },
    ],
  },
  {
    title: "Hook'lar",
    anchor: "hooks",
    content: [
      {
        heading: "Hook'lar nedir?",
        body: "Hook'lar, belirli yaşam döngüsü olaylarında — bir araç çağrısından önce, bir yanıttan sonra veya bir oturum başladığında — otomatik olarak çalışan kabuk komutlarıdır. Hook yapılandırmalarını .aurict/hooks.json içine yerleştirin.",
        code: '{\n  "hooks": [\n    {\n      "event": "pre-tool",\n      "tool":  "bash",\n      "run":   "echo \\"About to run: $TOOL_ARGS\\""\n    },\n    {\n      "event": "post-response",\n      "run":   "notify-send \\"Aurict finished\\""\n    }\n  ]\n}',
      },
      {
        heading: "Mevcut hook olayları",
        body: "Hook'lar bu olaylarda tetiklenebilir. Ortam değişkenleri, tetikleyici olay hakkında bağlam sağlar.",
        code: "pre-tool        → before any tool executes ($TOOL_NAME, $TOOL_ARGS)\npost-tool       → after tool completes ($TOOL_NAME, $TOOL_RESULT)\npre-response    → before AI generates text\npost-response   → after AI response ($RESPONSE_TEXT)\nsession-start   → on launch ($SESSION_ID, $WORKDIR)\nsession-end     → on exit",
      },
    ],
  },
  {
    title: "Çoklu Ajan",
    anchor: "multi-agent",
    content: [
      {
        heading: "Uzman ajanlar",
        body: "Aurict, her biri alana özgü araçlar ve sistem istemleriyle önceden yapılandırılmış 9 yerleşik uzman ajanla gelir. /agent ile geçiş yapın.",
        code: "/agent           # show agent picker\n\n# Available agents:\nomni        → General-purpose (default)\nexplore     → Codebase exploration & analysis\ncode        → Implementation & refactoring\nreview      → Code review & best practices\ntest        → Test writing & coverage\ndocs        → Documentation generation\nsecurity    → Security audit & hardening\ndebug       → Root cause analysis\nperf        → Performance profiling",
      },
      {
        heading: "Koordinatör modu",
        body: "Koordinatör modunda Aurict, karmaşık görevleri parçalara ayırır ve alt görevleri paralel çalışan iş parçacıklarındaki uzman ajanlara devreder. /coordinator ile etkinleştirin.",
        code: "/coordinator     # toggle coordinator mode\n/agents          # list custom agents",
      },
      {
        heading: "Özel ajanlar",
        body: "Özel ajanları .aurict/agents/ içinde JSON dosyaları olarak tanımlayın. Her ajan özel bir sistem istemi, araç kısıtlamaları ve varsayılan bir modele sahip olabilir.",
        code: '// .aurict/agents/my-agent.json\n{\n  "id": "my-agent",\n  "name": "My Agent",\n  "description": "Specialized for X",\n  "system": "You are an expert in...",\n  "tools": ["bash", "read", "write"],\n  "model": "claude-sonnet-4-6"\n}',
      },
      {
        heading: "Arka plan görevleri",
        body: "Sohbet etmeye devam edebilmeniz için uzun süren görevleri arka plana gönderin. Arka plan görevleri ayrı bir işçide çalışır ve tamamlandığında sizi bilgilendirir.",
        code: "/background      # move current task to background\n/background list # list running background tasks",
      },
    ],
  },
  {
    title: "Token ve Maliyet Takibi",
    anchor: "cost",
    content: [
      {
        heading: "Oturum maliyetini görüntüleme",
        body: "Geçerli oturum için token kullanımının ve tahmini maliyetin tam dökümünü görmek için /cost kullanın. Önbellek okumaları indirimli oranlarıyla gösterilir.",
        code: "/cost\n\n# Example output:\n# Fresh input:   12,430 tokens   $0.037\n# Output:         3,210 tokens   $0.048\n# Cache reads:   48,200 tokens   $0.014  (10× cheaper)\n# Cache writes:   8,400 tokens   $0.031\n# ──────────────────────────────────────\n# Total:         72,240 tokens   $0.130\n# Cache savings: $0.686 saved vs no caching",
      },
      {
        heading: "Bağlam penceresi kullanımı",
        body: "Durum satırındaki bağlam çubuğu, gerçek zamanlı bağlam penceresi kullanımını gösterir. Yeni girdi + önbellek okumaları + önbellek yazmalarını — tüketilen gerçek bağlamı — sayar.",
        code: "/ctx             # detailed context breakdown",
      },
    ],
  },
  {
    title: "Worktree'ler",
    anchor: "worktrees",
    content: [
      {
        heading: "Worktree'lerle paralel geliştirme",
        body: "Git worktree'lerini oluşturmak ve yönetmek için /worktree kullanın — her worktree kendi Aurict oturumunu alır, böylece stash'lemeden birden fazla dal üzerinde aynı anda çalışabilirsiniz.",
        code: "/worktree create feature/auth   # new worktree + session\n/worktree list                  # show active worktrees\n/worktree switch feature/auth   # switch to existing\n/worktree remove feature/auth   # clean up",
      },
    ],
  },
]

export function localizeDocsSections(locale: AppLocale) {
  return locale === "tr" ? DOCS_SECTIONS_TR : DOCS_SECTIONS_EN
}

export function localizeDocsBreadcrumbJsonLd(locale: AppLocale) {
  return {
    "@context": "https://schema.org",
    "@type":    "BreadcrumbList",
    "itemListElement": [
      { "@type": "ListItem", "position": 1, "name": locale === "tr" ? "Ana Sayfa" : "Home", "item": "https://aurict.com" },
      { "@type": "ListItem", "position": 2, "name": locale === "tr" ? "Belgeler" : "Documentation", "item": "https://aurict.com/docs" },
    ],
  }
}

export function localizeDocsArticleJsonLd(locale: AppLocale) {
  return {
    "@context":    "https://schema.org",
    "@type":       "TechArticle",
    "headline":    locale === "tr" ? "Aurict Belgeleri — Başlangıç" : "Aurict Documentation — Getting Started",
    "description": locale === "tr" ? "Aurict terminal yapay zeka kodlama asistanı için eksiksiz kurulum, yapılandırma ve genişletme rehberi." : "Complete installation, configuration, and extension guide for Aurict terminal AI coding assistant.",
    "url":         "https://aurict.com/docs",
    "author": { "@type": "Organization", "name": "aurict", "url": "https://github.com/aurict" },
    "publisher": { "@type": "Organization", "name": "Aurict", "url": "https://aurict.com" },
    "datePublished": "2026-06-07",
    "dateModified":  "2026-07-22",
  }
}
