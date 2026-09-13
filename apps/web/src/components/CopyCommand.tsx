"use client"

import { useState } from "react"
import { useLocale } from "next-intl"
import type { AppLocale } from "@/i18n/config"

const statusLabels: Record<AppLocale, { copy: string; copied: string; failed: string }> = {
  en: { copy: "Copy", copied: "Copied", failed: "Unable to copy" },
  tr: { copy: "Kopyala", copied: "Kopyalandı", failed: "Kopyalanamadı" },
  de: { copy: "Kopieren", copied: "Kopiert", failed: "Kopieren fehlgeschlagen" },
  fr: { copy: "Copier", copied: "Copié", failed: "Impossible de copier" },
  es: { copy: "Copiar", copied: "Copiado", failed: "No se pudo copiar" },
}

type CopyCommandProps = {
  command: string
  color?: string
  className?: string
  label?: string
  copiedLabel?: string
}

export function CopyCommand({ command, color, className = "mono copy-command", label, copiedLabel }: CopyCommandProps) {
  const locale = useLocale() as AppLocale
  const status = statusLabels[locale]
  const [copied, setCopied] = useState(false)
  const [copyFailed, setCopyFailed] = useState(false)

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(command)
      setCopyFailed(false)
      setCopied(true)
      setTimeout(() => setCopied(false), 1600)
    } catch (error) {
      console.error("Unable to copy command to the clipboard.", error)
      setCopyFailed(true)
      setTimeout(() => setCopyFailed(false), 1600)
    }
  }

  return (
    <button type="button" className={className} onClick={handleCopy} style={color ? { color } : undefined}>
      {label ? <span>{copied ? (copiedLabel ?? status.copied) : label}</span> : <>
        <span className="copy-command-text">{command}</span>
        <span className="copy-command-icon" aria-hidden="true">{copied ? "✓" : "⧉"}</span>
      </>}
      <span className="sr-only" aria-live="polite">{copyFailed ? status.failed : copied ? status.copied : `${status.copy} ${command}`}</span>
    </button>
  )
}
