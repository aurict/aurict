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
  maxChars:  16_000,
  strategy:  "head_tail",
  headRatio: 0.6,
}

let _global: GlobalTruncationConfig = {}

/** loop.ts config yükledikten sonra çağırır */
export function setTruncationConfig(cfg: GlobalTruncationConfig): void {
  _global = cfg
}

/** Tool adına göre efektif konfigürasyonu çözer */
export function resolveTruncationConfig(
  toolName: string,
  config: GlobalTruncationConfig = _global,
  contextWindow?: number,
): TruncationConfig {
  const override = config.perTool?.[toolName] ?? {}
  return {
    ...DEFAULTS,
    maxChars: override.maxChars ?? config.maxChars ?? adaptiveMaxChars(toolName, contextWindow),
    strategy: override.strategy ?? config.strategy ?? DEFAULTS.strategy,
  }
}

export function adaptiveMaxChars(toolName: string, contextWindow?: number): number {
  if (!contextWindow || !Number.isFinite(contextWindow)) return DEFAULTS.maxChars
  const isLargeRead = toolName === "read" || toolName === "read_tool_output"
  const share = isLargeRead ? 0.03 : 0.015
  const minimum = isLargeRead ? 12_000 : 6_000
  const maximum = isLargeRead ? 48_000 : 32_000
  // Four characters/token is deliberately conservative for code-heavy output.
  return Math.round(Math.min(maximum, Math.max(minimum, contextWindow * share * 4)))
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
    const distribution = grepDistribution(lines)
    const kept = lines.slice(0, 50).join("\n")
    return `${distribution}\n\n${kept}\n[${lines.length} result lines — showing first 50]`
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

function grepDistribution(lines: string[]): string {
  const counts = new Map<string, number>()
  for (const line of lines) {
    const match = /^(.+?):\d+:/.exec(line)
    if (!match?.[1]) continue
    counts.set(match[1], (counts.get(match[1]) ?? 0) + 1)
  }
  const ranked = [...counts.entries()].sort((left, right) => right[1] - left[1])
  const shown = ranked.slice(0, 12).map(([file, count]) => `${file} (${count})`).join(", ")
  const remainder = ranked.length > 12 ? `, +${ranked.length - 12} more files` : ""
  return `[grep summary: ${lines.length} result lines across ${ranked.length} files · ${shown}${remainder}]`
}
