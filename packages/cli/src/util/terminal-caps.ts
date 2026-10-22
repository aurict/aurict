/**
 * Terminal Capability Detection
 *
 * Detects which features the terminal emulator supports.
 * Different terminals support different escape sequences and protocols.
 * This utility detects terminal capabilities at runtime.
 *
 * Supported terminals:
 * - iTerm2, Kitty, WezTerm, Alacritty, Ghostty
 * - VS Code Terminal, JetBrains Terminal
 * - GNOME Terminal, Konsole, xterm
 * - tmux, screen (multiplexer detection)
 */

export interface TerminalCapabilities {
  /** Bracketed paste mode (\x1b[?2004h) */
  bracketedPaste: boolean
  /** SGR extended mouse protocol (\x1b[?1006h) */
  mouseSGR: boolean
  /** Kitty keyboard protocol (CSI u) */
  kittyKeyboard: boolean
  /** 24-bit true color support */
  trueColor: boolean
  /** Unicode/Emoji support */
  unicode: boolean
  /** Terminal name (detected) */
  name: string
  /** Whether a multiplexer is in use (tmux/screen) */
  multiplexer: "tmux" | "screen" | null
}

// Terminal names and their capabilities
const TERMINAL_PROFILES: Record<string, Partial<TerminalCapabilities>> = {
  "iTerm.app": {
    name: "iTerm2",
    bracketedPaste: true,
    mouseSGR: true,
    kittyKeyboard: false,
    trueColor: true,
    unicode: true,
  },
  "kitty": {
    name: "Kitty",
    bracketedPaste: true,
    mouseSGR: true,
    kittyKeyboard: true,
    trueColor: true,
    unicode: true,
  },
  "WezTerm": {
    name: "WezTerm",
    bracketedPaste: true,
    mouseSGR: true,
    kittyKeyboard: true,
    trueColor: true,
    unicode: true,
  },
  "Alacritty": {
    name: "Alacritty",
    bracketedPaste: true,
    mouseSGR: true,
    kittyKeyboard: false,
    trueColor: true,
    unicode: true,
  },
  "ghostty": {
    name: "Ghostty",
    bracketedPaste: true,
    mouseSGR: true,
    kittyKeyboard: true,
    trueColor: true,
    unicode: true,
  },
  "vscode": {
    name: "VS Code",
    bracketedPaste: true,
    mouseSGR: true,
    kittyKeyboard: false,
    trueColor: true,
    unicode: true,
  },
  "Hyper": {
    name: "Hyper",
    bracketedPaste: true,
    mouseSGR: true,
    kittyKeyboard: false,
    trueColor: true,
    unicode: true,
  },
  "Apple_Terminal": {
    name: "macOS Terminal",
    bracketedPaste: true,
    mouseSGR: true,
    kittyKeyboard: false,
    trueColor: false, // Apple Terminal supports 256 color, not true color
    unicode: true,
  },
}

/**
 * Detect terminal capabilities
 */
export function detectTerminalCaps(): TerminalCapabilities {
  const termProgram = process.env["TERM_PROGRAM"] ?? ""
  const term        = process.env["TERM"] ?? ""
  const colorTerm   = process.env["COLORTERM"] ?? ""
  const lang        = process.env["LANG"] ?? process.env["LC_ALL"] ?? ""

  // Multiplexer detection
  const multiplexer: "tmux" | "screen" | null =
    process.env["TMUX"] ? "tmux" :
    process.env["STY"]  ? "screen" :
    null

  // Is there a known terminal profile?
  const profile = TERMINAL_PROFILES[termProgram]

  // True color detection
  const trueColor = profile?.trueColor ?? (
    colorTerm === "truecolor" ||
    colorTerm === "24bit" ||
    termProgram === "iTerm.app" ||
    termProgram === "WezTerm" ||
    termProgram === "kitty" ||
    termProgram === "Alacritty" ||
    termProgram === "ghostty" ||
    term.includes("256color") // xterm-256color usually supports true color
  )

  // Unicode detection (from locale)
  const unicode = profile?.unicode ?? (
    lang.includes("UTF-8") ||
    lang.includes("utf8") ||
    lang.includes("UTF8") ||
    process.platform === "darwin" // macOS is usually UTF-8
  )

  // Bracketed paste — supported by nearly all modern terminals
  const bracketedPaste = profile?.bracketedPaste ?? (
    term !== "dumb" &&
    term !== "linux" && // Linux console doesn't support it
    !term.startsWith("vt")
  )

  // Mouse SGR — supported by most modern terminals
  const mouseSGR = profile?.mouseSGR ?? (
    term !== "dumb" &&
    term !== "linux"
  )

  // Kitty keyboard protocol — only Kitty and a handful of modern terminals
  const kittyKeyboard = profile?.kittyKeyboard ?? (
    termProgram === "kitty" ||
    termProgram === "WezTerm" ||
    termProgram === "ghostty" ||
    !!process.env["KITTY_WINDOW_ID"]
  )

  // Terminal name
  const name = profile?.name ?? (
    termProgram ||
    term ||
    "unknown"
  )

  return {
    bracketedPaste,
    mouseSGR,
    kittyKeyboard,
    trueColor,
    unicode,
    name,
    multiplexer,
  }
}

// Singleton — avoid recomputing on every call
let cachedCaps: TerminalCapabilities | null = null

/**
 * Get terminal capabilities (cached)
 */
export function getTerminalCaps(): TerminalCapabilities {
  if (!cachedCaps) {
    cachedCaps = detectTerminalCaps()
  }
  return cachedCaps
}

/**
 * Check whether the terminal supports a given feature
 */
export function supports(feature: keyof Omit<TerminalCapabilities, "name" | "multiplexer">): boolean {
  return getTerminalCaps()[feature] === true
}
