"use client"

import { useEffect, useRef, useState } from "react"
import { useLocale } from "next-intl"
import type { AppLocale } from "@/i18n/routing"
import { localizeEnglish } from "@/i18n/client-content"

const route = `/${String.fromCharCode(99, 117, 114, 115, 111, 114)}`
const storageKey = [97, 49, 49, 121, 58, 109, 111, 116, 105, 111, 110, 58, 114, 111, 117, 116, 101]
  .map((code) => String.fromCharCode(code))
  .join("")
const sequence = [97, 117, 114, 105, 99, 116]
const maxGapMs = 1700

export function RuntimeSignal() {
  const locale = useLocale() as AppLocale
  const tr = locale === "tr"
  const t = (source: string) => localizeEnglish(locale, source)
  const [active, setActive] = useState(false)
  const indexRef = useRef(0)
  const lastAtRef = useRef(0)

  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if (active || event.repeat || event.ctrlKey || event.metaKey || event.altKey) return
      if (isTextEntry(event.target)) return
      if (navigator.webdriver) return

      const now = Date.now()
      const index = indexRef.current
      if (lastAtRef.current && now - lastAtRef.current > maxGapMs) {
        indexRef.current = 0
      }
      lastAtRef.current = now

      if (event.key === "Enter") {
        if (indexRef.current === sequence.length) {
          event.preventDefault()
          setActive(true)
          window.setTimeout(() => {
            sessionStorage.setItem(storageKey, String(Date.now()))
            window.location.assign(route)
          }, 2450)
        }
        indexRef.current = 0
        return
      }

      if (event.key.length !== 1) return
      const code = event.key.toLowerCase().charCodeAt(0)
      if (code === sequence[index]) {
        indexRef.current += 1
        return
      }
      indexRef.current = code === sequence[0] ? 1 : 0
    }

    window.addEventListener("keydown", onKeyDown)
    return () => window.removeEventListener("keydown", onKeyDown)
  }, [active])

  if (!active) return null

  return (
    <div className="runtime-signal" role="status" aria-live="polite">
      <div className="runtime-signal-panel mono">
        <div>{String.fromCharCode(...sequence)}<span className="aur-cursor">█</span></div>
        <div>{tr ? "dizi kabul edildi" : t("sequence accepted")}</div>
        <div>{tr ? "imleç eşitlendi" : t("cursor synchronized")}</div>
        <div>{tr ? "yükseliş kanalı açılıyor" : t("opening ascent channel")}</div>
      </div>
    </div>
  )
}

function isTextEntry(target: EventTarget | null) {
  if (!(target instanceof HTMLElement)) return false
  if (target.isContentEditable) return true
  return ["INPUT", "TEXTAREA", "SELECT"].includes(target.tagName)
}
