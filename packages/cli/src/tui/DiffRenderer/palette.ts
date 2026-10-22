import type { Theme } from "../../utils/theme.js"

export interface DiffPalette {
  baseBg: string
  addBg: string
  addWordBg: string
  removeBg: string
  removeWordBg: string
  hunkBg: string
}

function blendHex(base: string, tint: string, amount: number): string {
  const from = /^#([\da-f]{2})([\da-f]{2})([\da-f]{2})$/i.exec(base)
  const to = /^#([\da-f]{2})([\da-f]{2})([\da-f]{2})$/i.exec(tint)
  if (!from || !to) return base

  const channel = (index: number) => Math.round(
    parseInt(from[index]!, 16) * (1 - amount) + parseInt(to[index]!, 16) * amount,
  ).toString(16).padStart(2, "0")

  return `#${channel(1)}${channel(2)}${channel(3)}`
}

/**
 * Diff surfaces are derived from the active theme instead of using fixed dark
 * greens/reds, so they remain readable in both dark and light palettes.
 */
export function getDiffPalette(theme: Theme): DiffPalette {
  const baseBg = theme.bgDeep ?? theme.bgHighlight
  return {
    baseBg,
    addBg: theme.diffAddBg ?? blendHex(baseBg, theme.success, 0.22),
    addWordBg: blendHex(baseBg, theme.success, 0.48),
    removeBg: theme.diffRemoveBg ?? blendHex(baseBg, theme.error, 0.22),
    removeWordBg: blendHex(baseBg, theme.error, 0.48),
    hunkBg: blendHex(baseBg, theme.accent, 0.18),
  }
}
