import type { AppLocale } from "@/i18n/routing"

type Block = { type: "paragraph" | "heading" | "code" | "list"; text?: string; language?: string; items?: string[] }
type LocalizablePost = { slug: string; title: string; description: string; category: string; readTime: string; content: Block[] }

const tr: Record<string, Omit<LocalizablePost, "slug">> = {
  "how-to-use-ai-coding-assistant": {
    title: "2026'da Yapay Zekâ Kodlama Asistanı Nasıl Kullanılır?", description: "Yapay zekâ kodlama asistanlarına başlamak için pratik bir rehber. En iyi uygulamaları, yaygın hataları ve terminal tabanlı araçlarla verimliliği artırma yollarını öğrenin.", category: "Rehber", readTime: "8 dk okuma",
    content: [
      { type: "heading", text: "Yapay Zekâ Kodlama Asistanlarına Başlamak" },
      { type: "paragraph", text: "Yapay zekâ kodlama asistanları basit otomatik tamamlama araçlarından gelişmiş geliştirme ortaklarına dönüştü. 2026'da Aurict gibi terminal tabanlı asistanlar çoklu ajan orkestrasyonu, bağlamsal beceriler ve kod tabanını derinlemesine anlama sunuyor." },
      { type: "heading", text: "Doğru Aracı Seçmek" }, { type: "paragraph", text: "Bir yapay zekâ kodlama asistanı seçerken şu unsurları değerlendirin:" },
      { type: "list", items: ["Sağlayıcı esnekliği — Anthropic, OpenAI, Google ve diğerleri arasında geçiş yapabiliyor musunuz?", "Ajan mimarisi — Uzman ajanlar mı, tek bir model mi kullanıyor?", "Bağlam farkındalığı — Kod tabanınızı otomatik anlayabiliyor mu?", "Platform desteği — macOS, Linux ve Windows'ta yerel olarak çalışıyor mu?"] },
      { type: "heading", text: "Kurulum ve Yapılandırma" }, { type: "paragraph", text: "Aurict'i kurmak bir dakikadan kısa sürer:" }, { type: "code", language: "bash", text: "npm install -g aurict\naurict" },
      { type: "paragraph", text: "İlk çalıştırma akışı; sağlayıcı seçimi, API anahtarı yapılandırması, model seçimi ve geçerli proje oturumundaki sınırlı dosya değişiklikleri için isteğe bağlı Project Auto kararında size rehberlik eder." }, { type: "heading", text: "En İyi Uygulamalar" }, { type: "paragraph", text: "Yapay zekâ kodlama asistanınızdan en iyi sonucu almak için:" },
      { type: "list", items: ["İsteklerinizi belirgin yazın — belirsiz istemler belirsiz sonuçlar üretir", "Göreve uygun ajanı kullanın — keşif, kod, inceleme, test vb.", "Kalıcı bellekten yararlanın — yapay zekâ tercihlerinizi hatırlar", "Yapay zekâ önerilerini inceleyin — güvenin ama doğrulayın"] },
      { type: "heading", text: "Sonuç" }, { type: "paragraph", text: "Yapay zekâ kodlama asistanları artık deneysel değil; modern geliştirme için temel araçlardır. Aurict'in çoklu ajan yaklaşımı ve bağlamsal becerileri, terminal odaklı iş akışı isteyen geliştiriciler için güçlü bir seçenektir." },
    ],
  },
  "claude-code-vs-aurict": {
    title: "Claude Code ve Aurict: Hangi Terminal Yapay Zekâsı Size Uygun?", description: "Claude Code ile Aurict'in ayrıntılı karşılaştırması. Sağlayıcı desteğini, ajan mimarisini, maliyeti ve farklı iş akışlarına uygunluğu ele alıyoruz.", category: "Karşılaştırma", readTime: "10 dk okuma",
    content: [
      { type: "heading", text: "Genel Bakış" }, { type: "paragraph", text: "Claude Code ve Aurict, terminal tabanlı yapay zekâ kodlama asistanlarıdır ancak farklı yaklaşımlar izler. Bu karşılaştırma, her aracın nereye oturduğunu netleştirmeye yardım eder." },
      { type: "heading", text: "Sağlayıcı Desteği" }, { type: "paragraph", text: "Claude Code, Anthropic'in Claude modelleri etrafında konumlanır. Aurict ise sağlayıcı esnekliği için tasarlanmıştır:" },
      { type: "list", items: ["Anthropic", "OpenAI", "Google", "OpenRouter", "xAI", "Azure OpenAI", "AWS Bedrock", "Ollama", "OpenCode", "NVIDIA NIM", "Z.AI (GLM)", "Alibaba (Qwen)"] },
      { type: "heading", text: "Mimari" }, { type: "paragraph", text: "Aurict; keşif, kod, inceleme, test, doküman, güvenlik, hata ayıklama, performans ve analitik iş akışları için uzman ajanlar kullanır. Bu yaklaşım, tek genel asistan döngüsüne göre çok adımlı mühendislik görevlerine daha uygundur." },
      { type: "heading", text: "Maliyet" }, { type: "paragraph", text: "Aurict açık kaynaklıdır ve kendi anahtarını getir modeliyle çalışır. Gerçek model maliyetiniz seçtiğiniz sağlayıcıya ve modele bağlıdır." },
      { type: "heading", text: "Hangisini Seçmelisiniz?" }, { type: "paragraph", text: "Claude ekosistemine yoğun biçimde yatırım yaptıysanız Claude Code uygun olabilir. Sağlayıcı esnekliği, uzman ajan orkestrasyonu ve bağlamsal beceriler istiyorsanız Aurict daha uygun olabilir." },
    ],
  },
  "terminal-ai-tools-2026": {
    title: "2026'nın En İyi Terminal Yapay Zekâ Araçları", description: "2026 terminal yapay zekâ ekosistemine genel bakış. İş akışınıza uygun aracı bulmak için Aurict, Claude Code, Aider, OpenCode ve diğerlerini karşılaştırın.", category: "Genel Bakış", readTime: "12 dk okuma",
    content: [
      { type: "heading", text: "Terminal Yapay Zekâ Rönesansı" }, { type: "paragraph", text: "2026, terminal tabanlı yapay zekâ kodlama araçlarında hızlı bir büyüme gördü. Geliştiriciler IDE'ye bağlı asistanlardan daha esnek ve güçlü terminal araçlarına yöneliyor." },
      { type: "heading", text: "Öne Çıkan Araçlar" }, { type: "paragraph", text: "2026'daki önde gelen terminal yapay zekâ araçları şunlardır:" }, { type: "list", items: ["Aurict — Çoklu ajan, 12 yerleşik sağlayıcı ve kanıtlı tamamlanma", "Claude Code — Anthropic'in resmi terminal aracı", "Aider — Git odaklı yapay zekâ eşli programlama", "OpenCode — Açık kaynak terminal yapay zekâsı", "GitHub Copilot CLI — Komut satırı ajanı"] },
      { type: "heading", text: "Temel Farklar" }, { type: "paragraph", text: "Bu araçları birbirinden ayıran nedir?" }, { type: "list", items: ["Çoklu ajan ve tek model mimarisi", "Sağlayıcı esnekliği ve bağımlılık", "Bağlam farkındalığı ve kod tabanı anlayışı", "Platform desteği: yerel binary'ler ve çalışma zamanı bağımlılıkları", "Genişletilebilirlik: özel araçlar, beceriler, MCP"] },
      { type: "heading", text: "Sonuç" }, { type: "paragraph", text: "Terminal yapay zekâ alanı hızla olgunlaşıyor. Aurict'in çoklu ajan yaklaşımı ve geniş sağlayıcı desteği, esneklik ve güç isteyen geliştiriciler için güçlü bir seçenek oluşturur." },
    ],
  },
  "multi-agent-ai-coding": {
    title: "Çoklu Ajan Yapay Zekâ Neden Kodlamanın Geleceği?", description: "Çoklu ajan mimarisinin yapay zekâ kodlama asistanlarını nasıl dönüştürdüğünü keşfedin. Uzman ajanların karmaşık görevlerde tek model yaklaşımlarını neden geçtiğini öğrenin.", category: "Mimari", readTime: "7 dk okuma",
    content: [
      { type: "heading", text: "Tek Model Yapay Zekânın Sorunu" }, { type: "paragraph", text: "Yapay zekâ kodlama araçlarının çoğu tüm görevler için tek model kullanır. Bu, basit isteklerde işe yarar ancak karmaşık ve çok adımlı geliştirme işlerinde yetersiz kalır." },
      { type: "heading", text: "Çoklu Ajan Çözümü" }, { type: "paragraph", text: "Çoklu ajan sistemleri, her biri belirli görevler için iyileştirilmiş uzman ajanları kullanır. Aurict dokuz uzman ajan içerir:" }, { type: "list", items: ["Keşif — Kod tabanı analizi ve gezinme", "Kod — Uygulama ve yeniden düzenleme", "İnceleme — Kod inceleme ve iyi uygulamalar", "Test — Test üretimi ve kapsam", "Doküman — Dokümantasyon üretimi", "Güvenlik — Güvenlik açığı taraması", "Hata ayıklama — Kök neden analizi", "Performans — Profilleme ve optimizasyon", "Analitik — Veri analizi ve içgörü"] },
      { type: "heading", text: "Paralel Çalıştırma" }, { type: "paragraph", text: "Çoklu ajan sistemleri karmaşık görevleri parçalara ayırıp ajanları paralel çalıştırabilir. Tek modelin on dakikada yaptığı iş, birlikte çalışan beş uzman ajanla iki dakikaya inebilir." }, { type: "heading", text: "Bağlam Uzmanlaşması" }, { type: "paragraph", text: "Her ajanın kendi bağlam bütçesi ve alan bilgisi vardır. Güvenlik ajanı kod üretimine token harcamaz; tamamen açık bulmaya odaklanır." },
    ],
  },
  "mcp-model-context-protocol": {
    title: "MCP (Model Context Protocol) Nedir ve Neden Önemlidir?", description: "Model Context Protocol için kapsamlı rehber. MCP'nin yapay zekâ asistanlarını mevcut araçlarınıza nasıl bağladığını ve yeteneklerini nasıl genişlettiğini öğrenin.", category: "Teknik", readTime: "9 dk okuma",
    content: [
      { type: "heading", text: "MCP'ye Giriş" }, { type: "paragraph", text: "Model Context Protocol (MCP), yapay zekâ asistanlarının harici araçlara ve veri kaynaklarına bağlanmasını sağlayan açık bir standarttır. Yapay zekâ için evrensel bir adaptör gibi düşünülebilir." },
      { type: "heading", text: "MCP Nasıl Çalışır?" }, { type: "paragraph", text: "MCP, yapay zekâ modellerinin harici sistemlerle etkileşmesi için standart bir arayüz tanımlar. Her araç için özel entegrasyon kurmak yerine asistanlar MCP ile uyumlu her hizmete bağlanabilir." },
      { type: "heading", text: "Yaygın MCP Kullanım Alanları" }, { type: "list", items: ["Veritabanı sorguları — Yapay zekânızdan PostgreSQL'i doğrudan sorgulamasını isteyin", "Dosya sistemi erişimi — Uygun izinlerle dosya okuyup yazın", "API entegrasyonu — GitHub, Slack, Jira ve diğerlerine bağlanın", "Tarayıcı otomasyonu — Test ve tarama için tarayıcı kontrolü"] },
      { type: "heading", text: "Aurict'in MCP Desteği" }, { type: "paragraph", text: "Aurict, claude_desktop_config.json içindeki uyumlu MCP yapılandırmasını içe aktarabilir. Kullanmadan önce her bağlantıyı ve sunulan araçları /mcp ile doğrulayın." }, { type: "code", language: "json", text: "{\n  \"mcpServers\": {\n    \"postgres\": {\n      \"command\": \"npx\",\n      \"args\": [\"-y\", \"@modelcontextprotocol/server-postgres\"],\n      \"env\": {\n        \"DATABASE_URL\": \"postgresql://localhost:5432/mydb\"\n      }\n    }\n  }\n}" },
      { type: "heading", text: "Yapay Zekâ Entegrasyonunun Geleceği" }, { type: "paragraph", text: "MCP, yapay zekâ araç entegrasyonu için standart hâline geliyor. Daha fazla araç MCP'yi benimsedikçe Aurict gibi asistanlar her entegrasyon için özel kod gerektirmeden daha güçlü olur." },
    ],
  },
}

export function localizeBlogPost<T extends LocalizablePost>(post: T, locale: AppLocale): T {
  return locale === "tr" && tr[post.slug] ? { ...post, ...tr[post.slug] } : post
}
