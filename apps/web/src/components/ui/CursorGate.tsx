"use client"

import type { CSSProperties } from "react"
import { useEffect, useState } from "react"
import { useLocale } from "next-intl"
import { Link } from "@/i18n/navigation"
import type { AppLocale } from "@/i18n/routing"
import { localizeEnglish } from "@/i18n/client-content"

const storageKey = [97, 49, 49, 121, 58, 109, 111, 116, 105, 111, 110, 58, 114, 111, 117, 116, 101]
  .map((code) => String.fromCharCode(code))
  .join("")
const maxAgeMs = 20_000

const manifesto = [
  "Aurict is an answer to wasted intelligence.",
  "It was not born from abundance. It was built from constraint.",
  "No private cluster. No endless capital. No permission from the giants.",
  "If the largest models cannot be trained yet, the existing ones must be driven with more discipline.",
  "Context should be protected from noise. Tokens should earn their place.",
  "Bring your own key. Bring your own model. Keep your control.",
  "Aurict does not worship the model behind the API. It orchestrates it.",
  "The cursor is not decoration. It is the pause before action.",
  "The ascent is not automatic. It is orchestrated.",
  "aurict█ ready to execute",
]

const manifestoTr = [
  "Aurict, boşa harcanan zekâya verilmiş bir yanıttır.",
  "Bolluktan doğmadı. Kısıtların içinde inşa edildi.",
  "Özel küme yok. Sonsuz sermaye yok. Devlerden izin yok.",
  "En büyük modeller henüz eğitilemiyorsa, var olanlar daha disiplinli yönlendirilmelidir.",
  "Bağlam gürültüden korunmalı. Her token yerini hak etmelidir.",
  "Kendi anahtarını getir. Kendi modelini getir. Kontrol sende kalsın.",
  "Aurict, API'nin arkasındaki modele tapmaz. Onu orkestre eder.",
  "İmleç bir süs değildir. Eylemden önceki duraksamadır.",
  "Yükseliş otomatik değildir. Orkestre edilir.",
  "aurict█ yürütmeye hazır",
]

export function CursorGate() {
  const locale = useLocale() as AppLocale
  const tr = locale === "tr"
  const t = (source: string) => localizeEnglish(locale, source)
  const localizedManifesto = tr ? manifestoTr : manifesto.map(t)
  const [state, setState] = useState<"checking" | "closed" | "open">("checking")

  useEffect(() => {
    const frame = window.requestAnimationFrame(() => {
      const raw = sessionStorage.getItem(storageKey)
      sessionStorage.removeItem(storageKey)
      const timestamp = raw ? Number(raw) : Number.NaN
      setState(
        Number.isFinite(timestamp) && Date.now() - timestamp <= maxAgeMs
          ? "open"
          : "closed",
      )
    })
    return () => window.cancelAnimationFrame(frame)
  }, [])

  if (state === "checking") {
    return <main className="cursor-page cursor-page-empty" />
  }

  if (state === "closed") {
    return (
      <main className="cursor-page cursor-page-empty">
        <div className="cursor-no-signal mono">
          <span>{tr ? "sinyal yok" : t("no signal")}</span>
          <Link href="/">{tr ? "ana sayfaya dön" : t("return to surface")}</Link>
        </div>
      </main>
    )
  }

  return (
    <main className="cursor-page">
      <div className="cursor-grid" aria-hidden="true" />
      <div className="cursor-gate" aria-hidden="true">
        <div className="cursor-door cursor-door-left" />
        <div className="cursor-door cursor-door-right" />
        <div className="cursor-gate-line" />
      </div>
      <div className="cursor-channel mono" aria-hidden="true">
        <span>{tr ? "dizi kabul edildi" : t("sequence accepted")}</span>
        <span>{tr ? "yükseliş kanalı açılıyor" : t("opening ascent channel")}</span>
      </div>
      <section className="cursor-manifesto-stage" aria-label="Aurict manifesto">
        <div className="cursor-manifesto-shell">
          <p className="cursor-mark mono">aurict<span className="aur-cursor">█</span></p>
          <div className="cursor-manifesto-sequence">
            {localizedManifesto.map((line, index) => (
              <p
                className="cursor-manifesto-line"
                key={line}
                style={{ "--slide-index": index } as CSSProperties}
              >
                {line}
              </p>
            ))}
          </div>
        </div>
      </section>
      <Link className="cursor-return mono" href="/">{tr ? "ana sayfaya dön" : t("return to surface")}</Link>
    </main>
  )
}
