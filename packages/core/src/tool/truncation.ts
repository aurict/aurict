export type TruncationStrategy = "head" | "tail" | "head_tail" | "smart"

export interface TruncationConfig {
  maxChars:   number
  strategy:   TruncationStrategy
  headRatio?: number   // head_tail için head oranı (0–1, default 0.6)
}

interface PerToolOverride {
  maxChars?: number
  strategy?: TruncationStrategy
}

export interface GlobalTruncationConfig {
  maxChars?: number
  strategy?: TruncationStrategy
  perTool?:  Record<string, PerToolOverride>
}

const DEFAULTS: TruncationConfig = {
  maxChars:  4_000,
  strategy:  "head_tail",
  headRatio: 0.6,
}

let _global: GlobalTruncationConfig = {}

/** loop.ts config yükledikten sonra çağırır */
export function setTruncationConfig(cfg: GlobalTruncationConfig): void {
  _global = cfg
}

/** Tool adına göre efektif konfigürasyonu çözer */
export function resolveTruncationConfig(toolName: string): TruncationConfig {
  const override = _global.perTool?.[toolName] ?? {}
  return {
    ...DEFAULTS,
    maxChars: override.maxChars ?? _global.maxChars ?? DEFAULTS.maxChars,
    strategy: override.strategy ?? _global.strategy ?? DEFAULTS.strategy,
  }
}

/**
 * Uzun tool çıktısını seçilen stratejiye göre kırpar.
 * output.length <= cfg.maxChars ise dokunmadan döner.
 */
export function truncateOutput(
  output:   string,
  cfg:      TruncationConfig,
  toolName: string = "",
): string {
  const { maxChars, strategy, headRatio = 0.6 } = cfg

  // grep: satır bazlı özel özet
  if (toolName === "grep") {
    const lines = output.split("\n")
    if (lines.length <= 50) return output
    const files = new Set(lines.map(l => l.split(":")[0]).filter(Boolean))
    const kept  = lines.slice(0, 50).join("\n")
    return `${kept}\n[${lines.length} matches across ${files.size} file(s) — showing first 50]`
  }

  if (output.length <= maxChars) return output

  const lines = output.split("\n")

  switch (strategy) {
    case "head": {
      const body    = output.slice(0, maxChars)
      const omitted = output.length - maxChars
      return `${body}\n[... ${omitted} chars omitted ...]`
    }

    case "tail": {
      const body    = output.slice(-maxChars)
      const omitted = output.length - maxChars
      return `[... ${omitted} chars omitted ...]\n${body}`
    }

    case "smart": {
      // Stack trace → tail ağırlıklı (son frame'ler daha bilgilendirici)
      const peek = output.slice(0, 300).toLowerCase()
      const isStack = /traceback|stack trace|\tat |\s+at \w/.test(peek)
        || /error:/.test(peek) && /\n\s+at /.test(output.slice(0, 1_000))

      // JSON/array → head (yapı başında)
      const isJson = output.trimStart().startsWith("{") || output.trimStart().startsWith("[")

      let headSize: number
      let tailSize: number

      if (isStack) {
        headSize = Math.floor(maxChars * 0.25)
        tailSize = maxChars - headSize
      } else if (isJson) {
        headSize = maxChars
        tailSize = 0
      } else {
        headSize = Math.floor(maxChars * headRatio)
        tailSize = maxChars - headSize
      }

      if (tailSize === 0) {
        const omitted = output.length - headSize
        return `${output.slice(0, headSize)}\n[... ${omitted} chars omitted ...]`
      }

      const head    = output.slice(0, headSize)
      const tail    = output.slice(-tailSize)
      const omitted = output.length - headSize - tailSize
      if (omitted <= 0) return output
      return `${head}\n\n[... ${omitted} chars / ${lines.length} total lines omitted ...]\n\n${tail}`
    }

    case "head_tail":
    default: {
      const headSize = Math.floor(maxChars * headRatio)
      const tailSize = maxChars - headSize
      const head     = output.slice(0, headSize)
      const tail     = output.slice(-tailSize)
      const omitted  = output.length - headSize - tailSize
      if (omitted <= 0) return output
      return `${head}\n\n[... ${omitted} chars / ${lines.length} total lines omitted ...]\n\n${tail}`
    }
  }
}
