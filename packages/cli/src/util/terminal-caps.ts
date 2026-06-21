/**
 * Terminal Capability Detection
 *
 * Terminal emülatörünün desteklediği özellikleri algılar.
 * Farklı terminaller farklı escape sequence'leri ve protokolleri destekler.
 * Bu utility, runtime'da terminal yeteneklerini tespit eder.
 *
 * Desteklenen terminaller:
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
  /** 24-bit true color desteği */
  trueColor: boolean
  /** Unicode/Emoji desteği */
  unicode: boolean
  /** Terminal adı (algılanan) */
  name: string
  /** Multiplexer kullanılıyor mu (tmux/screen) */
  multiplexer: "tmux" | "screen" | null
}

// Terminal isimleri ve özellikleri
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
    trueColor: false, // Apple Terminal 256 color, true color değil
    unicode: true,
  },
}

/**
 * Terminal yeteneklerini algıla
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

  // Bilinen terminal profili var mı?
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
    term.includes("256color") // xterm-256color genelde true color destekler
  )

  // Unicode detection (locale'den)
  const unicode = profile?.unicode ?? (
    lang.includes("UTF-8") ||
    lang.includes("utf8") ||
    lang.includes("UTF8") ||
    process.platform === "darwin" // macOS genelde UTF-8
  )

  // Bracketed paste — neredeyse tüm modern terminaller destekler
  const bracketedPaste = profile?.bracketedPaste ?? (
    term !== "dumb" &&
    term !== "linux" && // Linux console desteklemiyor
    !term.startsWith("vt")
  )

  // Mouse SGR — çoğu modern terminal destekler
  const mouseSGR = profile?.mouseSGR ?? (
    term !== "dumb" &&
    term !== "linux"
  )

  // Kitty keyboard protocol — sadece Kitty ve birkaç modern terminal
  const kittyKeyboard = profile?.kittyKeyboard ?? (
    termProgram === "kitty" ||
    termProgram === "WezTerm" ||
    termProgram === "ghostty" ||
    !!process.env["KITTY_WINDOW_ID"]
  )

  // Terminal adı
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

// Singleton — her çağrıda yeniden hesaplama
let cachedCaps: TerminalCapabilities | null = null

/**
 * Terminal yeteneklerini al (cached)
 */
export function getTerminalCaps(): TerminalCapabilities {
  if (!cachedCaps) {
    cachedCaps = detectTerminalCaps()
  }
  return cachedCaps
}

/**
 * Cache'i temizle (test için)
 */
export function clearTerminalCapsCache(): void {
  cachedCaps = null
}

/**
 * Terminal adını kısa formatta döndür
 */
export function shortTerminalName(): string {
  const caps = getTerminalCaps()
  return caps.name
}

/**
 * Terminal'in belirli bir özelliği destekleyip desteklemediğini kontrol et
 */
export function supports(feature: keyof Omit<TerminalCapabilities, "name" | "multiplexer">): boolean {
  return getTerminalCaps()[feature] === true
}
