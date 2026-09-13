import type { AppLocale } from "@/i18n/routing"
import { localizeEnglishContent } from "@/i18n/client-content"

export interface CommandItem {
  label: string
  href: string
  icon?: string
  category: string
}

export const COMMANDS_EN: CommandItem[] = [
  // Pages
  { label: "Home", href: "/", category: "Pages", icon: "🏠" },
  { label: "About", href: "/about", category: "Pages", icon: "▣" },
  { label: "Roadmap", href: "/roadmap", category: "Pages", icon: "▤" },
  { label: "Documentation", href: "/docs", category: "Pages", icon: "📖" },
  { label: "Changelog", href: "/changelog", category: "Pages", icon: "📋" },
  { label: "Blog", href: "/blog", category: "Pages", icon: "✍️" },
  { label: "AI Coding Agent", href: "/ai-coding-agent", category: "Pages", icon: "◇" },
  { label: "Terminal Agent", href: "/terminal-agent", category: "Pages", icon: "▸" },

  // Sections
  { label: "Features", href: "/#features", category: "Sections", icon: "⚡" },
  { label: "Install", href: "/#install", category: "Sections", icon: "📦" },
  { label: "FAQ", href: "/#faq", category: "Sections", icon: "❓" },
  { label: "Install", href: "/#install", category: "Sections", icon: "📦" },

  // Compare
  { label: "All Comparisons", href: "/compare", category: "Compare", icon: "⚖️" },
  { label: "vs Claude Code", href: "/compare/claude-code", category: "Compare", icon: "⚔️" },
  { label: "vs Cursor", href: "/compare/cursor", category: "Compare", icon: "⚔️" },
  { label: "vs Aider", href: "/compare/aider", category: "Compare", icon: "⚔️" },
  { label: "vs GitHub Copilot", href: "/compare/github-copilot", category: "Compare", icon: "⚔️" },

  // Use Cases
  { label: "Refactoring", href: "/use-cases/refactoring", category: "Use Cases", icon: "🔄" },
  { label: "Code Review", href: "/use-cases/code-review", category: "Use Cases", icon: "🔍" },
  { label: "Testing", href: "/use-cases/testing", category: "Use Cases", icon: "🧪" },
  { label: "Documentation", href: "/use-cases/documentation", category: "Use Cases", icon: "📝" },

  // External
  { label: "GitHub", href: "https://github.com/aurict/aurict", category: "External", icon: "🐙" },
  { label: "npm", href: "https://www.npmjs.com/package/aurict", category: "External", icon: "📦" },
]

export const COMMANDS_TR: CommandItem[] = [
  // Sayfalar
  { label: "Ana Sayfa", href: "/", category: "Sayfalar", icon: "🏠" },
  { label: "Hakkında", href: "/about", category: "Sayfalar", icon: "▣" },
  { label: "Yol Haritası", href: "/roadmap", category: "Sayfalar", icon: "▤" },
  { label: "Dokümantasyon", href: "/docs", category: "Sayfalar", icon: "📖" },
  { label: "Değişiklik Günlüğü", href: "/changelog", category: "Sayfalar", icon: "📋" },
  { label: "Blog", href: "/blog", category: "Sayfalar", icon: "✍️" },
  { label: "Yapay Zekâ Kodlama Ajanı", href: "/ai-coding-agent", category: "Sayfalar", icon: "◇" },
  { label: "Terminal Ajanı", href: "/terminal-agent", category: "Sayfalar", icon: "▸" },

  // Bölümler
  { label: "Yetenekler", href: "/#capabilities", category: "Bölümler", icon: "⚡" },
  { label: "SSS", href: "/#faq", category: "Bölümler", icon: "❓" },
  { label: "Kurulum", href: "/#install", category: "Bölümler", icon: "📦" },

  // Karşılaştırma
  { label: "Tüm Karşılaştırmalar", href: "/compare", category: "Karşılaştırma", icon: "⚖️" },
  { label: "Claude Code Karşılaştırması", href: "/compare/claude-code", category: "Karşılaştırma", icon: "⚔️" },
  { label: "Cursor Karşılaştırması", href: "/compare/cursor", category: "Karşılaştırma", icon: "⚔️" },
  { label: "Aider Karşılaştırması", href: "/compare/aider", category: "Karşılaştırma", icon: "⚔️" },
  { label: "GitHub Copilot Karşılaştırması", href: "/compare/github-copilot", category: "Karşılaştırma", icon: "⚔️" },

  // Kullanım Alanları
  { label: "Yeniden Düzenleme", href: "/use-cases/refactoring", category: "Kullanım Alanları", icon: "🔄" },
  { label: "Kod İncelemesi", href: "/use-cases/code-review", category: "Kullanım Alanları", icon: "🔍" },
  { label: "Test Etme", href: "/use-cases/testing", category: "Kullanım Alanları", icon: "🧪" },
  { label: "Dokümantasyon", href: "/use-cases/documentation", category: "Kullanım Alanları", icon: "📝" },

  // Harici
  { label: "GitHub", href: "https://github.com/aurict/aurict", category: "Harici", icon: "🐙" },
  { label: "npm", href: "https://www.npmjs.com/package/aurict", category: "Harici", icon: "📦" },
]

export function localizeCommands(locale: AppLocale | string): CommandItem[] {
  if (locale === "tr") return COMMANDS_TR
  return localizeEnglishContent(locale as AppLocale, COMMANDS_EN)
}
