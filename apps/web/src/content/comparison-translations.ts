import type { Comparison } from "@/content/comparisons"
import type { AppLocale } from "@/i18n/routing"
import { localizeEnglishContent } from "@/i18n/content"

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
    description: "Doğru terminal kodlama ajanını seçmek için Aurict ile Claude Code'u sağlayıcılar, izinler, MCP, ajan iş akışları ve doğrulama açısından karşılaştırın.",
    tagline: "Sağlayıcı genişliği ve kanıt odaklı teslim",
    differentiator: "Sağlayıcı seçimi + kalıcı kanıt",
    ourStrengths: ["12 yerleşik sağlayıcı adaptörü", "Proje içi sınırlı dosya değişiklikleri için Project Auto", "Doğrulama kanıtı ve açık işleri içeren kalıcı tamamlanma kaydı", "Yerel anlamsal arama, dependency docs, görsel okuma ve doğrulama araçları"],
    theirStrengths: ["Resmî Anthropic iş akışı", "Anthropic Console, Claude aboneliği, Bedrock ve Vertex kimlik doğrulama yolları"],
  },
  cursor: {
    title: "Aurict ve Cursor",
    description: "Aurict ile Cursor'u terminal ve IDE akışları, model seçimi, MCP, otomasyon denetimleri ve kanıta dayalı tamamlanma açısından karşılaştırın.",
    tagline: "Terminal öncelikli çalışma zamanı ve IDE iş akışı",
    differentiator: "Kapsamlı otomasyon + terminal denetimi",
    ourStrengths: ["IDE bağımlılığı olmadan terminal öncelikli çalışma", "Project Auto tek proje oturumuyla sınırlıdır", "Tamamlanma kanıtı, evidence ve açık işleri görünür tutar", "Anlamsal arama, dependency docs, vision ve doğrulama için yerel araç zinciri"],
    theirStrengths: ["Görsel düzenleyici deneyimi", "Satır içi öneriler ve görsel diff iş akışı", "Seçilmiş model seti ve yapılandırılabilir MCP sunucuları"],
  },
  aider: {
    title: "Aurict ve Aider",
    description: "Aurict ile Aider'ı terminal akışları, model seçimi, izinler, Git entegrasyonu, çalışma alanı zekâsı ve doğrulama açısından karşılaştırın.",
    tagline: "Git odaklı eşleşme ve kanıtlı runtime",
    differentiator: "Kapsamlı izin + doğrulama kaydı",
    ourStrengths: ["Project Auto yalnızca sınırlı proje içi düzenlemeleri kapsar", "Kalıcı /proof tamamlanma kaydı", "Anlamsal kaynak araması ve kurulu dependency dokümantasyonu", "Doğrulama için tarayıcı ve eval araçları"],
    theirStrengths: ["Odaklı Git merkezli eşli programlama iş akışı", "Geniş LLM ve yerel model bağlantısı"],
  },
  "github-copilot": {
    title: "Aurict ve GitHub Copilot CLI",
    description: "Aurict ile GitHub Copilot CLI'ı model seçimi, izinler, MCP, otomasyon kapsamı, ekosistem entegrasyonu ve doğrulama açısından karşılaştırın.",
    tagline: "Açık kapsamlı otomasyon ve yerel kanıt",
    differentiator: "Project Auto + tamamlanma kanıtı",
    ourStrengths: ["12 yerleşik sağlayıcı adaptörü", "Sınırlı düzenlemeler için proje yerelinde otomatik onay", "Değişiklik, kanıt, açık iş ve muafiyet içeren tamamlanma kaydı", "Yerel çalışma alanı zekâsı araçları"],
    theirStrengths: ["GitHub ekosistemi entegrasyonu", "Copilot CLI model seçimi, MCP, eklentiler ve özel ajanlar"],
  },
  opencode: {
    title: "Aurict ve OpenCode",
    description: "Aurict ile OpenCode'u sağlayıcılar, izinler, MCP, proje otomasyonu, çalışma alanı zekâsı ve doğrulama kanıtı açısından karşılaştırın.",
    tagline: "Seçilmiş runtime denetimleri ve kanıt odaklı teslim",
    differentiator: "Kapsamlı proje otomasyonu + tamamlanma kanıtı",
    ourStrengths: ["12 yerleşik sağlayıcı adaptörü", "Güvenli, tipli dosya değişiklikleri için sınırlı Project Auto", "Kalıcı tamamlanma kanıtı ve doğrulama evidence'ı", "Anlamsal arama, dependency docs, vision, browser ve eval araçları"],
    theirStrengths: ["Geniş sağlayıcı ekosistemi", "Araç başına allow, deny ve ask izinleri", "Yerleşik LSP ve genişletilebilir MCP araçları"],
  },
}

export function localizeComparison(comparison: Comparison, locale: AppLocale): Comparison {
  if (locale !== "tr") return localizeEnglishContent(locale, comparison)
  const translation = tr[comparison.slug]
  if (!translation) return comparison

  return {
    ...comparison,
    ...translation,
    rows: comparison.rows.map((row) => ({ ...row, name: phrases[row.name] ?? row.name })),
  }
}
