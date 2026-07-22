import type { Comparison } from "@/content/comparisons"
import type { AppLocale } from "@/i18n/routing"

const phrases: Record<string, string> = {
  "Terminal workflow": "Terminal iş akışı",
  "Provider configuration": "Sağlayıcı yapılandırması",
  "MCP": "MCP",
  "Completion record": "Tamamlanma kaydı",
  "Primary surface": "Birincil yüzey",
  "Model selection": "Model seçimi",
  "Automation control": "Otomasyon kontrolü",
  "Runtime": "Çalışma zamanı",
  "Model connectivity": "Model bağlantısı",
  "Edit approval": "Düzenleme izni",
  "Terminal agent": "Terminal ajanı",
  "Permission scope": "İzin kapsamı",
  "Provider approach": "Sağlayıcı yaklaşımı",
  "Edit permissions": "Düzenleme izinleri",
  "Code intelligence": "Kod zekâsı",
}

type Translation = Pick<Comparison, "title" | "description" | "tagline" | "differentiator" | "ourStrengths" | "theirStrengths">

const tr: Record<string, Translation> = {
  "claude-code": {
    title: "Aurict ve Claude Code",
    description: "İkisi de terminal kodlama ajanıdır. Aurict geniş yerleşik sağlayıcı kataloğuna, sınırlı Project Auto'ya ve kalıcı tamamlanma kanıtına odaklanır; Claude Code ise Anthropic, Bedrock ve Vertex dağıtım yolları sunar.",
    tagline: "Sağlayıcı genişliği ve kanıt odaklı teslim",
    differentiator: "Sağlayıcı seçimi + kalıcı kanıt",
    ourStrengths: ["12 yerleşik sağlayıcı adaptörü", "Proje içi sınırlı dosya değişiklikleri için Project Auto", "Doğrulama kanıtı ve açık işleri içeren kalıcı tamamlanma kaydı", "Yerel anlamsal arama, dependency docs, görsel okuma ve doğrulama araçları"],
    theirStrengths: ["Resmî Anthropic iş akışı", "Anthropic Console, Claude aboneliği, Bedrock ve Vertex kimlik doğrulama yolları"],
  },
  cursor: {
    title: "Aurict ve Cursor",
    description: "Cursor bir IDE deneyimini CLI ve model seçimiyle birleştirir. Aurict terminal öncelikli çalışma zamanı, proje kapsamlı otomasyon denetimleri ve kanıta dayalı tamamlanma için tasarlanmıştır.",
    tagline: "Terminal öncelikli çalışma zamanı ve IDE iş akışı",
    differentiator: "Kapsamlı otomasyon + terminal denetimi",
    ourStrengths: ["IDE bağımlılığı olmadan terminal öncelikli çalışma", "Project Auto tek proje oturumuyla sınırlıdır", "Tamamlanma kanıtı, evidence ve açık işleri görünür tutar", "Anlamsal arama, dependency docs, vision ve doğrulama için yerel araç zinciri"],
    theirStrengths: ["Görsel düzenleyici deneyimi", "Satır içi öneriler ve görsel diff iş akışı", "Seçilmiş model seti ve yapılandırılabilir MCP sunucuları"],
  },
  aider: {
    title: "Aurict ve Aider",
    description: "İkisi de terminal tabanlı kendi modelini getir iş akışlarını destekler. Aurict, kapsamlı izinler, kalıcı tamamlanma kanıtı ve yerel çalışma alanı zekâsı için daha geniş bir runtime katmanı ekler.",
    tagline: "Git odaklı eşleşme ve kanıtlı runtime",
    differentiator: "Kapsamlı izin + doğrulama kaydı",
    ourStrengths: ["Project Auto yalnızca sınırlı proje içi düzenlemeleri kapsar", "Kalıcı /proof tamamlanma kaydı", "Anlamsal kaynak araması ve kurulu dependency dokümantasyonu", "Doğrulama için tarayıcı ve eval araçları"],
    theirStrengths: ["Odaklı Git merkezli eşli programlama iş akışı", "Geniş LLM ve yerel model bağlantısı"],
  },
  "github-copilot": {
    title: "Aurict ve GitHub Copilot CLI",
    description: "İkisi de model seçimi, izinler, MCP ve özelleştirme içeren terminal ajanı iş akışları sunar. Aurict kendi sağlayıcı kataloğu, sınırlı Project Auto ve kalıcı tamamlanma kanıtıyla ayrışır.",
    tagline: "Açık kapsamlı otomasyon ve yerel kanıt",
    differentiator: "Project Auto + tamamlanma kanıtı",
    ourStrengths: ["12 yerleşik sağlayıcı adaptörü", "Sınırlı düzenlemeler için proje yerelinde otomatik onay", "Değişiklik, kanıt, açık iş ve muafiyet içeren tamamlanma kaydı", "Yerel çalışma alanı zekâsı araçları"],
    theirStrengths: ["GitHub ekosistemi entegrasyonu", "Copilot CLI model seçimi, MCP, eklentiler ve özel ajanlar"],
  },
  opencode: {
    title: "Aurict ve OpenCode",
    description: "İkisi de provider ve izin yapılandırması sunan açık kaynak terminal kodlama ajanlarıdır. Aurict seçilmiş yerleşik sağlayıcı kataloğu, sınırlı Project Auto, tamamlanma kanıtı ve yerel doğrulama araç zincirine odaklanır.",
    tagline: "Seçilmiş runtime denetimleri ve kanıt odaklı teslim",
    differentiator: "Kapsamlı proje otomasyonu + tamamlanma kanıtı",
    ourStrengths: ["12 yerleşik sağlayıcı adaptörü", "Güvenli, tipli dosya değişiklikleri için sınırlı Project Auto", "Kalıcı tamamlanma kanıtı ve doğrulama evidence'ı", "Anlamsal arama, dependency docs, vision, browser ve eval araçları"],
    theirStrengths: ["Geniş sağlayıcı ekosistemi", "Araç başına allow, deny ve ask izinleri", "Yerleşik LSP ve genişletilebilir MCP araçları"],
  },
}

export function localizeComparison(comparison: Comparison, locale: AppLocale): Comparison {
  if (locale !== "tr") return comparison
  const translation = tr[comparison.slug]
  if (!translation) return comparison

  return {
    ...comparison,
    ...translation,
    rows: comparison.rows.map((row) => ({ ...row, name: phrases[row.name] ?? row.name })),
  }
}
