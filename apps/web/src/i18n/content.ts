import translations from "./generated-content-translations.json"
import type { AppLocale } from "./config"
import { contentOverrides } from "./content-overrides"

type MachineLocale = Exclude<AppLocale, "en" | "tr">

const catalogs = translations as Record<MachineLocale, Record<string, string>>
const preservedKeys = new Set([
  "afterCode", "beforeCode", "code", "color", "command", "date",
  "external", "href", "icon", "language", "slug", "status", "updatedAt", "url",
])

export function localizeEnglish(locale: AppLocale, source: string) {
  if (locale === "en" || locale === "tr") return source
  return contentOverrides[locale][source] ?? catalogs[locale][source] ?? source
}

export function localizeEnglishContent<T>(locale: AppLocale, source: T): T {
  if (locale === "en" || locale === "tr") return source
  return translateValue(locale, source) as T
}

function translateValue(locale: MachineLocale, value: unknown, key?: string): unknown {
  if (typeof value === "string") {
    return key && preservedKeys.has(key) ? value : (contentOverrides[locale][value] ?? catalogs[locale][value] ?? value)
  }
  if (Array.isArray(value)) return value.map((item) => translateValue(locale, item))
  if (!value || typeof value !== "object") return value

  if ("type" in value && value.type === "code") return value

  return Object.fromEntries(
    Object.entries(value).map(([entryKey, entryValue]) => [
      entryKey,
      translateValue(locale, entryValue, entryKey),
    ]),
  )
}
