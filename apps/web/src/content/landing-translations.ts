import type { AppLocale } from "@/i18n/routing"

type Triple = [string, string, string]
type Quad = [string, string, string, string]
type Pair = [string, string]

export const whyItemsEn: Triple[] = [
  ["01", "Agent-first, not prompt-first.", "Every task routes to a domain specialist — explore, code, review, test, debug, docs, security, performance, analytics — each with its own tools and context budget. Complex work decomposes and runs in parallel instead of waiting in a single queue."],
  ["02", "Reads your codebase before your prompt.", "On first run, Aurict walks your directory tree, detects framework and package manager, and ranks the files most likely to matter — no manual context to attach, nothing to paste."],
  ["03", "Zero-setup, genuinely cross-platform.", "One install command ships a native compiled binary for macOS, Linux, and Windows — no Node runtime at execution time, no WSL detour, no Rosetta tax on Apple Silicon."],
  ["04", "Open, and built to be extended.", "Bring compatible MCP servers, custom commands, and shared team skills. Imported servers are visible and inspectable in the terminal — nothing is locked behind a proprietary cloud."],
]
export const whyItemsTr: Triple[] = [
  ["01", "İstemden önce ajan.", "Her görev uzman bir ajana yönlendirilir — keşif, kod, inceleme, test, hata ayıklama, dokümantasyon, güvenlik, performans ve analitik. Her ajanın kendi araçları ve bağlam bütçesi vardır. Karmaşık işler ayrıştırılır; tek kuyrukta beklemek yerine paralel yürütülür."],
  ["02", "İsteminizden önce kod tabanınızı okur.", "İlk çalıştırmada Aurict dizin ağacınızı gezer, framework'ü ve paket yöneticisini algılar, en önemli dosyaları sıralar — elle bağlam eklemeniz veya metin yapıştırmanız gerekmez."],
  ["03", "Sıfır kurulum, gerçek çoklu platform desteği.", "Tek kurulum komutuyla macOS, Linux ve Windows için yerel derlenmiş ikili sunulur — çalışma anında Node.js gerekmez, WSL'ye yönelmek gerekmez, Apple Silicon'da Rosetta yükü yoktur."],
  ["04", "Açık ve genişletilebilir.", "Uyumlu MCP sunucularınızı, özel komutlarınızı ve paylaşılan ekip becerilerinizi getirin. İçe aktarılan sunucular terminalde görünür ve incelenebilir — hiçbir şey özel bir bulutun ardına kilitlenmez."],
]

export const capabilityItemsEn: Triple[] = [
  ["bash classifier", "Every shell command is analyzed before it runs — safe commands execute instantly, destructive ones stop for confirmation.", "oklch(0.65 0.19 25)"],
  ["sandbox execution", "Risky calls pass through a policy sandbox: approvals, protected paths, scrubbed env, timeouts, and an audit trail.", "oklch(0.65 0.19 25)"],
  ["multi-agent orchestration", "Nine specialists in isolated workers — explore, code, review, test, docs, security, debug, performance, analytics.", "var(--accent)"],
  ["218+ contextual skills", "Framework and tool-specific context, injected automatically the moment your stack is detected.", "oklch(0.72 0.15 145)"],
  ["mcp client", "Import compatible existing configuration, then inspect each connected server and its tools before relying on it.", "oklch(0.72 0.15 145)"],
  ["windows native", "A real compiled binary for x64 — no WSL, no PowerShell workarounds. Shell auto-detected.", "oklch(0.78 0.15 80)"],
  ["persistent memory", "Decisions and conventions stored locally and recalled per-session — across every restart.", "var(--accent)"],
  ["design agent", "150+ design systems and 111 skill templates — describe a UI idea, pick a system, get a full implementation brief.", "var(--accent)"],
  ["verified completion", "Changed files, verification evidence, open work, and waivers remain visible in a durable completion proof.", "oklch(0.72 0.15 145)"],
  ["workspace intelligence", "Search source semantically, inspect installed package APIs, read workspace images, and verify work through browser or eval tools.", "#818cf8"],
]
export const capabilityItemsTr: Triple[] = [
  ["bash sınıflandırıcı", "Her kabuk komutu çalışmadan önce analiz edilir — güvenli komutlar anında çalışır, yıkıcı komutlar ise onay için durur.", "oklch(0.65 0.19 25)"],
  ["sandbox çalıştırma", "Riskli çağrılar politika kontrollü bir sandbox'tan geçer: onaylar, korunan yollar, temizlenmiş ortam değişkenleri, zaman aşımları ve denetim kaydı.", "oklch(0.65 0.19 25)"],
  ["çok-ajan orkestrasyonu", "Yalıtılmış çalışanlarda dokuz uzman — keşfet, kodla, incele, test et, dokümanla, güvenliği sağla, hata ayıkla, performans, analitik.", "var(--accent)"],
  ["218+ bağlamsal beceri", "Framework ve araçlara özel bağlam, teknoloji yığınınız algılandığı anda otomatik olarak eklenir.", "oklch(0.72 0.15 145)"],
  ["mcp istemcisi", "Uyumlu mevcut yapılandırmayı içe aktarın; ardından güvenmeden önce bağlı her sunucuyu ve araçlarını inceleyin.", "oklch(0.72 0.15 145)"],
  ["windows yerel", "x64 için gerçek derlenmiş ikili — WSL yok, PowerShell geçici çözümü yok. Kabuk otomatik algılanır.", "oklch(0.78 0.15 80)"],
  ["kalıcı bellek", "Kararlar ve kurallar yerel olarak saklanır, her oturumda anımsanır — her yeniden başlatmada.", "var(--accent)"],
  ["tasarım ajanı", "150'den fazla tasarım sistemi ve 111 beceri şablonu — bir arayüz fikri anlatın, sistem seçin, eksiksiz uygulama brifingi alın.", "var(--accent)"],
  ["kanıtlı tamamlanma", "Değişen dosyalar, doğrulama kanıtı, açık işler ve muafiyetler kalıcı bir tamamlanma kaydında görünür kalır.", "oklch(0.72 0.15 145)"],
  ["çalışma alanı zekâsı", "Kaynakta anlamsal arama yapın, kurulu paket API'larını inceleyin, çalışma alanı görsellerini okuyun ve işi tarayıcı ya da eval araçlarıyla doğrulayın.", "#818cf8"],
]

export const securityProfilesEn: Quad[] = [
  ["safe · default", "Passive", "Defensive review and reporting only. No offensive tooling is exposed to the model.", "oklch(0.72 0.15 145)"],
  ["warning · opt-in", "Active Lite", "Controlled, Docker-backed scans against an allowlisted target — rate-limited and permissioned.", "oklch(0.78 0.15 80)"],
  ["danger · explicit", "Kali Full", "The larger experimental image, for when you deliberately need the full toolset. Approval required every time.", "oklch(0.65 0.19 25)"],
]
export const securityProfilesTr: Quad[] = [
  ["güvenli · varsayılan", "Pasif", "Yalnızca savunma odaklı inceleme ve raporlama. Modele saldırı araçları sunulmaz.", "oklch(0.72 0.15 145)"],
  ["uyarı · isteğe bağlı", "Aktif Lite", "İzinli hedefe karşı denetimli, Docker destekli taramalar — hız sınırlı ve izinli.", "oklch(0.78 0.15 80)"],
  ["tehlike · açık", "Kali Full", "Tam araç setine gerçekten ihtiyaç duyduğunuz durumlar için daha büyük deneysel imaj. Her seferinde onay gerekir.", "oklch(0.65 0.19 25)"],
]

export const installStepsEn: Quad[] = [
  ["01 · install", "$ npm install -g aurict", "macOS, Linux, or Windows — same command everywhere.", "var(--accent)"],
  ["02 · run", "$ aurict", "Launch inside any project directory.", "var(--accent)"],
  ["03 · configure", "# provider, key, model, Project Auto", "Interactive setup — bounded project edits can be session-approved; sensitive work still asks.", "var(--accent)"],
  ["04 · security", "$ aurict /config security active-lite", "Optional. Targets still need explicit allow-listing.", "oklch(0.78 0.15 80)"],
]
export const installStepsTr: Quad[] = [
  ["01 · kurulum", "$ npm install -g aurict", "macOS, Linux veya Windows — her yerde aynı komut.", "var(--accent)"],
  ["02 · çalıştır", "$ aurict", "Herhangi bir proje dizini içinde başlatın.", "var(--accent)"],
  ["03 · yapılandır", "# sağlayıcı, anahtar, model, Project Auto", "Etkileşimli kurulum — sınırlı proje düzenlemeleri oturum için onaylanabilir; hassas işler yine sorulur.", "var(--accent)"],
  ["04 · güvenlik", "$ aurict /config security active-lite", "İsteğe bağlı. Hedeflerin hâlâ açık izin listesine alınması gerekir.", "oklch(0.78 0.15 80)"],
]

export const mobileAssistantItemsEn: Pair[] = [
  ["BYOK chat", "Use your own OpenAI, Anthropic, Google, OpenRouter, xAI, Azure, Bedrock, or local model keys."],
  ["Research mode", "Ask for market scans, technical comparisons, repo research, source summaries, or planning briefs."],
  ["Document output", "Turn conversations into PDFs, specs, reports, checklists, release notes, or client-ready summaries."],
  ["Terminal companion", "Keep the same account for browser login, mobile approvals, and live CLI session control."],
]
export const mobileAssistantItemsTr: Pair[] = [
  ["BYOK sohbet", "Kendi OpenAI, Anthropic, Google, OpenRouter, xAI, Azure, Bedrock ya da yerel model anahtarlarınızı kullanın."],
  ["Araştırma modu", "Pazar taramaları, teknik karşılaştırmalar, depo araştırması, kaynak özetleri veya planlama brifingleri isteyin."],
  ["Belge çıktısı", "Sohbetleri PDF'lere, şartnamelere, raporlara, kontrol listelerine, sürüm notlarına veya müşteriye hazır özetlere dönüştürün."],
  ["Terminal yardımcısı", "Tarayıcı üzerinden giriş, mobil onaylar ve canlı CLI oturum denetimi için aynı hesabı kullanın."],
]

export const faqsEn: Pair[] = [
  ["Is Aurict free?", "Yes — Aurict is AGPLv3 licensed and open source on GitHub, free for individuals and teams alike. You bring your own model provider key."],
  ["How is this different from a single-agent chat tool?", "Aurict routes work across nine domain-specialist agents running in parallel, and isn't tied to a single model vendor — swap providers without changing your workflow."],
  ["Does it run natively on Windows?", "Yes — a real compiled binary for Windows x64. No WSL, no PowerShell workarounds; shell detection picks Git Bash, MSYS2, or PowerShell automatically."],
  ["What does the mobile app do?", "The mobile app is both a BYOK AI assistant and a companion for Aurict CLI. Chat with your own providers, run research tasks, generate PDFs or reports, and approve terminal actions from your phone."],
  ["Do I need Node.js installed?", "No. npm is only used as the installer — Aurict runs as a standalone compiled binary at execution time."],
  ["Can I use my existing MCP servers?", "Aurict can import compatible existing MCP configuration. Confirm every connection and available tool in /mcp before using it."],
]
export const faqsTr: Pair[] = [
  ["Aurict ücretsiz mi?", "Evet — Aurict AGPLv3 lisanslıdır ve GitHub'da açık kaynaktır; bireyler ve ekipler için ücretsizdir. Model sağlayıcı anahtarınızı siz getirirsiniz."],
  ["Bu, tek ajanlı bir sohbet aracından nasıl farklı?", "Aurict, işi paralel çalışan dokuz uzman ajana yönlendirir ve tek bir model sağlayıcısına bağlı değildir — iş akışınızı değiştirmeden sağlayıcı değiştirebilirsiniz."],
  ["Windows'da yerel olarak çalışır mı?", "Evet — Windows x64 için gerçek derlenmiş ikili. WSL yok, PowerShell geçici çözümü yok; kabuk algılama Git Bash, MSYS2 veya PowerShell'i otomatik seçer."],
  ["Mobil uygulama ne yapar?", "Mobil uygulama hem BYOK yapay zekâ asistanı hem de Aurict CLI yardımcısıdır. Kendi sağlayıcılarınızla sohbet edin, araştırma görevleri çalıştırın, PDF veya rapor üretin ve terminal eylemlerini telefonunuzdan onaylayın."],
  ["Node.js kurulu olmalı mı?", "Hayır. npm yalnızca yükleyici olarak kullanılır — Aurict çalışma anında bağımsız bir derlenmiş ikili olarak çalışır."],
  ["Mevcut MCP sunucularımı kullanabilir miyim?", "Aurict uyumlu mevcut MCP yapılandırmasını içe aktarabilir. Kullanmadan önce her bağlantıyı ve kullanılabilir aracı /mcp içinde doğrulayın."],
]

export function localizeWhyItems(l: AppLocale) { return l === "tr" ? whyItemsTr : whyItemsEn }
export function localizeCapabilityItems(l: AppLocale) { return l === "tr" ? capabilityItemsTr : capabilityItemsEn }
export function localizeSecurityProfiles(l: AppLocale) { return l === "tr" ? securityProfilesTr : securityProfilesEn }
export function localizeInstallSteps(l: AppLocale) { return l === "tr" ? installStepsTr : installStepsEn }
export function localizeMobileAssistantItems(l: AppLocale) { return l === "tr" ? mobileAssistantItemsTr : mobileAssistantItemsEn }
export function localizeFaqs(l: AppLocale) { return l === "tr" ? faqsTr : faqsEn }
