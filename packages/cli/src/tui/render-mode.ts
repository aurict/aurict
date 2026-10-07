/**
 * Terminal render modes.
 *
 * - `inline` keeps Aurict in the terminal's main buffer: finished transcript
 *   rows are written once into native scrollback and only a bounded live area
 *   (stream tail, status, composer, footer) is redrawn. Native scroll,
 *   selection, search, and copy keep working, and the session stays visible
 *   after exit.
 * - `fullscreen` is the alternate-screen cockpit with an in-app viewport.
 */
export type TuiMode = "inline" | "fullscreen"

export const DEFAULT_TUI_MODE: TuiMode = "inline"

export interface TuiModeSources {
  /** `--inline` / `--fullscreen` CLI flags. */
  flag?: TuiMode | undefined
  /** `AURICT_TUI_MODE` environment variable. */
  env?: string | undefined
  /** `defaults.tuiMode` from the global config. */
  config?: string | undefined
}

function parseMode(value: string | undefined, source: string): TuiMode | undefined {
  if (value === undefined || value === "") return undefined
  const normalized = value.trim().toLowerCase()
  if (normalized === "inline" || normalized === "fullscreen") return normalized
  throw new Error(`Invalid ${source} '${value}'; expected inline or fullscreen`)
}

/** Flag beats environment, environment beats config; invalid values fail loudly. */
export function resolveTuiMode(sources: TuiModeSources): TuiMode {
  return sources.flag
    ?? parseMode(sources.env, "AURICT_TUI_MODE")
    ?? parseMode(sources.config, "defaults.tuiMode")
    ?? DEFAULT_TUI_MODE
}
