import { createContext, useContext } from "react"

export interface Theme {
  name:          string
  /** Brand palette id (`whiskey-amber`, `oxblood`, `ink-sapphire`, `deep-emerald`) or undefined for legacy themes */
  brandId?:      string
  accent:        string
  accentAlt:     string
  /** Dark ink color used for text rendered on top of `accent` (button labels). Brand spec: oklch(0.16 0.02 H). */
  accentInk?:    string
  success:       string
  error:         string
  warning:       string
  userColor:     string
  assistantDot:  string
  toolColor:     string
  systemColor:   string
  textPrimary:   string
  textSecondary: string
  textDim:       string
  /** Warm-neutral eyebrow/label tone used for mono uppercase labels (eyebrow). */
  textLabel?:    string
  borderDim:     string
  borderBright:  string
  borderActive:  string
  bgHighlight:   string
  /** Darkest background — used for terminal/code-block surfaces. Brand spec: oklch(0.09 c*0.7 h). */
  bgDeep?:       string
  /** Card background — used for surfaces/panels. Brand spec: oklch(0.175 c h). */
  bgCard?:       string
  /** Card hover background — Brand spec: oklch(0.195 c h). */
  bgCardHover?:  string
  /** Alternate section background — Brand spec: oklch(0.155 c h). */
  bgAlt?:        string
  buddyMain:     string
  buddyEar:      string
  /** Fixed diff row backgrounds; when absent they are blended from the palette. */
  diffAddBg?:    string
  diffRemoveBg?: string
}

// Colour values: "#rrggbb", an ANSI name, or "" for the terminal's own default
// colour (the Codex look draws text in the default foreground).

export const THEMES: Record<string, Theme> = {
  // Codex layout in Aurict colours (desktop tokens): brand red #c9352b, text-safe
  // red #ff7a6b on dark, warm greys; body text keeps the terminal's own foreground.
  aurict: {
    name: "Aurict",
    // Text accents use the AA-safe red; brand red #c9352b is for borders and the wordmark cursor.
    accent: "#ff7a6b", accentAlt: "#ff7a6b", accentInk: "#1d0a08",
    success: "#5fbf74", error: "#e5484d", warning: "#e8c34a",
    userColor: "", assistantDot: "", toolColor: "", systemColor: "#8c7f77",
    textPrimary: "", textSecondary: "", textDim: "#8c7f77", textLabel: "#b5a99f",
    borderDim: "#2a211e", borderBright: "#3a2e2a", borderActive: "#c9352b",
    bgHighlight: "#1e1816", bgDeep: "#0b0908", bgCard: "#1e1816", bgCardHover: "#2a211e", bgAlt: "#100c0b",
    buddyMain: "#c9352b", buddyEar: "#ff7a6b",
    diffAddBg: "#1f3326", diffRemoveBg: "#4a1f1b",
  },
  "aurict-light": {
    name: "Aurict Light",
    accent: "#b8322a", accentAlt: "#c9352b", accentInk: "#ffffff",
    success: "#1f8a4c", error: "#b8322a", warning: "#9a6a00",
    userColor: "", assistantDot: "", toolColor: "", systemColor: "#74675f",
    textPrimary: "", textSecondary: "", textDim: "#74675f", textLabel: "#574b46",
    borderDim: "#e6ddd3", borderBright: "#d3c7bb", borderActive: "#c9352b",
    bgHighlight: "#f4eee6", bgDeep: "#faf6f1", bgCard: "#f4eee6", bgCardHover: "#fbf8f4", bgAlt: "#f1e9df",
    buddyMain: "#c9352b", buddyEar: "#b8322a",
    diffAddBg: "#dcf3e3", diffRemoveBg: "#fbe3df",
  },
  // ── Brand palettes (Aurict Design System — Whiskey Amber default) ──────────
  // oklch() targets from the design spec, calibrated to hex for ANSI 24-bit.
  // Functional safe/warning/danger hues kept ≥40° from accent, all on a
  // warm-neutral dark background (hue ~75–80° family).
  "whiskey-amber": {
    name: "Whiskey Amber",
    brandId: "whiskey-amber",
    accent: "#d9974a", accentAlt: "#e6b06a",
    accentInk: "#1f1809",
    success: "#5fbf74", error: "#dc5666", warning: "#e8c34a",
    userColor: "#f3ecd9", assistantDot: "#e6b06a",
    toolColor: "#9a8e74", systemColor: "#8a7e64",
    textPrimary: "#f3ecd9", textSecondary: "#c4baa1", textDim: "#8f846f",
    textLabel: "#8a7e64",
    borderDim: "#2a251c", borderBright: "#3d3526", borderActive: "#d9974a",
    bgHighlight: "#1c1810", bgDeep: "#0d0b07", bgCard: "#1a160e", bgCardHover: "#221d13", bgAlt: "#16120c",
    buddyMain: "#d9974a", buddyEar: "#e6b06a",
  },
  "oxblood": {
    name: "Oxblood",
    brandId: "oxblood",
    accent: "#c65f50", accentAlt: "#d27567",
    accentInk: "#1d0a08",
    success: "#5fbf74", error: "#dc5666", warning: "#e8c34a",
    userColor: "#f0e2d6", assistantDot: "#d27567",
    toolColor: "#988878", systemColor: "#877566",
    textPrimary: "#f0e2d6", textSecondary: "#c2b3a4", textDim: "#948276",
    textLabel: "#877566",
    borderDim: "#28160f", borderBright: "#3a2218", borderActive: "#c65f50",
    bgHighlight: "#1a0e0a", bgDeep: "#0b0604", bgCard: "#180c08", bgCardHover: "#21110b", bgAlt: "#140906",
    buddyMain: "#c0594a", buddyEar: "#d27567",
  },
  "ink-sapphire": {
    name: "Ink Sapphire",
    brandId: "ink-sapphire",
    accent: "#5d8fd6", accentAlt: "#7aa6e6",
    accentInk: "#08111f",
    success: "#5fbf74", error: "#dc5666", warning: "#e8c34a",
    userColor: "#e8ecf3", assistantDot: "#7aa6e6",
    toolColor: "#869aa8", systemColor: "#7a8a98",
    textPrimary: "#e8ecf3", textSecondary: "#bcc6d6", textDim: "#78899b",
    textLabel: "#7a8a98",
    borderDim: "#161d2c", borderBright: "#222c41", borderActive: "#5d8fd6",
    bgHighlight: "#0c111c", bgDeep: "#06080d", bgCard: "#0a1020", bgCardHover: "#10182c", bgAlt: "#08091a",
    buddyMain: "#5d8fd6", buddyEar: "#7aa6e6",
  },
  "deep-emerald": {
    name: "Deep Emerald",
    brandId: "deep-emerald",
    accent: "#4ea886", accentAlt: "#6cc0a0",
    accentInk: "#06140e",
    success: "#5fbf74", error: "#dc5666", warning: "#e8c34a",
    userColor: "#e8f0eb", assistantDot: "#6cc0a0",
    toolColor: "#86a094", systemColor: "#7a9084",
    textPrimary: "#e8f0eb", textSecondary: "#b8cac0", textDim: "#788e82",
    textLabel: "#7a9084",
    borderDim: "#10241a", borderBright: "#163225", borderActive: "#4ea886",
    bgHighlight: "#0a140f", bgDeep: "#050a07", bgCard: "#08140e", bgCardHover: "#0d1c14", bgAlt: "#0a120d",
    buddyMain: "#4ea886", buddyEar: "#6cc0a0",
  },
  // 1. Aurict Ion (default)
  dark: {
    name: "Aurict Ion",
    accent: "#a78bfa", accentAlt: "#38bdf8",
    success: "#34d399", error: "#fb7185", warning: "#facc15",
    userColor: "#f7f3ff", assistantDot: "#38bdf8",
    toolColor: "#8fa8bf", systemColor: "#817694",
    textPrimary: "#f7f3ff", textSecondary: "#c8bedc", textDim: "#817694",
    borderDim: "#27314a", borderBright: "#2f8fca", borderActive: "#38bdf8",
    bgHighlight: "#12172a", buddyMain: "#a78bfa", buddyEar: "#38bdf8",
  },
  "aurict-obsidian": {
    name: "Aurict Obsidian",
    accent: "#60a5fa", accentAlt: "#a78bfa",
    success: "#22c55e", error: "#ef4444", warning: "#eab308",
    userColor: "#e5e7eb", assistantDot: "#60a5fa",
    toolColor: "#8b95a1", systemColor: "#8b95a1",
    textPrimary: "#e5e7eb", textSecondary: "#cbd5e1", textDim: "#8b95a1",
    borderDim: "#242833", borderBright: "#3a4252", borderActive: "#60a5fa",
    bgHighlight: "#10131a", buddyMain: "#60a5fa", buddyEar: "#2563eb",
  },
  "aurict-spectral": {
    name: "Aurict Spectral",
    accent: "#2dd4bf", accentAlt: "#a3e635",
    success: "#a3e635", error: "#f43f5e", warning: "#fbbf24",
    userColor: "#e7fff8", assistantDot: "#2dd4bf",
    toolColor: "#77958d", systemColor: "#77958d",
    textPrimary: "#e7fff8", textSecondary: "#b7e6d8", textDim: "#77958d",
    borderDim: "#16342f", borderBright: "#28564e", borderActive: "#2dd4bf",
    bgHighlight: "#0a1d19", buddyMain: "#2dd4bf", buddyEar: "#0f766e",
  },
  // 2. Dracula
  dracula: {
    name: "Dracula",
    accent: "#bd93f9", accentAlt: "#8be9fd",
    success: "#50fa7b", error: "#ff5555", warning: "#ffb86c",
    userColor: "#8be9fd", assistantDot: "#bd93f9",
    toolColor: "#6272a4", systemColor: "#6272a4",
    textPrimary: "#f8f8f2", textSecondary: "#f1fa8c", textDim: "#6272a4",
    borderDim: "#44475a", borderBright: "#6272a4", borderActive: "#bd93f9",
    bgHighlight: "#44475a", buddyMain: "#bd93f9", buddyEar: "#9060d0",
  },
  // 3. Nord
  nord: {
    name: "Nord",
    accent: "#81a1c1", accentAlt: "#88c0d0",
    success: "#a3be8c", error: "#bf616a", warning: "#ebcb8b",
    userColor: "#88c0d0", assistantDot: "#81a1c1",
    toolColor: "#4c566a", systemColor: "#4c566a",
    textPrimary: "#d8dee9", textSecondary: "#e5e9f0", textDim: "#4c566a",
    borderDim: "#3b4252", borderBright: "#434c5e", borderActive: "#81a1c1",
    bgHighlight: "#3b4252", buddyMain: "#81a1c1", buddyEar: "#5e81ac",
  },
  // 4. Gruvbox Dark
  gruvbox: {
    name: "Gruvbox Dark",
    accent: "#83a598", accentAlt: "#689d6a",
    success: "#b8bb26", error: "#cc241d", warning: "#fabd2f",
    userColor: "#83a598", assistantDot: "#fe8019",
    toolColor: "#928374", systemColor: "#928374",
    textPrimary: "#ebdbb2", textSecondary: "#d5c4a1", textDim: "#928374",
    borderDim: "#3c3836", borderBright: "#504945", borderActive: "#83a598",
    bgHighlight: "#3c3836", buddyMain: "#fe8019", buddyEar: "#d65d0e",
  },
  // 5. Light
  light: {
    name: "Light",
    accent: "#0366d6", accentAlt: "#0074e8",
    success: "#22863a", error: "#d73a49", warning: "#e36209",
    userColor: "#0366d6", assistantDot: "#6f42c1",
    toolColor: "#586069", systemColor: "#6a737d",
    textPrimary: "#24292e", textSecondary: "#444d56", textDim: "#959da5",
    borderDim: "#e1e4e8", borderBright: "#d1d5da", borderActive: "#0366d6",
    bgHighlight: "#f6f8fa", buddyMain: "#6f42c1", buddyEar: "#5a32a3",
  },
  // 6. Monokai
  monokai: {
    name: "Monokai",
    accent: "#66d9e8", accentAlt: "#a6e22e",
    success: "#a6e22e", error: "#f92672", warning: "#fd971f",
    userColor: "#66d9e8", assistantDot: "#ae81ff",
    toolColor: "#75715e", systemColor: "#75715e",
    textPrimary: "#f8f8f2", textSecondary: "#cfcfc2", textDim: "#75715e",
    borderDim: "#3d3d3d", borderBright: "#555555", borderActive: "#66d9e8",
    bgHighlight: "#383830", buddyMain: "#ae81ff", buddyEar: "#8060cc",
  },
  // 7. Solarized Dark
  "solarized-dark": {
    name: "Solarized Dark",
    accent: "#268bd2", accentAlt: "#2aa198",
    success: "#859900", error: "#dc322f", warning: "#cb4b16",
    userColor: "#268bd2", assistantDot: "#6c71c4",
    toolColor: "#586e75", systemColor: "#657b83",
    textPrimary: "#839496", textSecondary: "#93a1a1", textDim: "#586e75",
    borderDim: "#073642", borderBright: "#586e75", borderActive: "#268bd2",
    bgHighlight: "#073642", buddyMain: "#268bd2", buddyEar: "#1a6090",
  },
  // 8. Tokyo Night
  "tokyo-night": {
    name: "Tokyo Night",
    accent: "#7aa2f7", accentAlt: "#7dcfff",
    success: "#9ece6a", error: "#f7768e", warning: "#e0af68",
    userColor: "#7aa2f7", assistantDot: "#bb9af7",
    toolColor: "#565f89", systemColor: "#565f89",
    textPrimary: "#c0caf5", textSecondary: "#a9b1d6", textDim: "#565f89",
    borderDim: "#1a1b26", borderBright: "#3b3d57", borderActive: "#7aa2f7",
    bgHighlight: "#1a1b26", buddyMain: "#bb9af7", buddyEar: "#9070d0",
  },
  // 9. Catppuccin Mocha
  "catppuccin-mocha": {
    name: "Catppuccin Mocha",
    accent: "#89b4fa", accentAlt: "#74c7ec",
    success: "#a6e3a1", error: "#f38ba8", warning: "#fab387",
    userColor: "#89b4fa", assistantDot: "#cba6f7",
    toolColor: "#585b70", systemColor: "#6c7086",
    textPrimary: "#cdd6f4", textSecondary: "#bac2de", textDim: "#6c7086",
    borderDim: "#313244", borderBright: "#45475a", borderActive: "#89b4fa",
    bgHighlight: "#313244", buddyMain: "#cba6f7", buddyEar: "#a080d0",
  },
  // 10. Catppuccin Latte
  "catppuccin-latte": {
    name: "Catppuccin Latte",
    accent: "#1e66f5", accentAlt: "#04a5e5",
    success: "#40a02b", error: "#d20f39", warning: "#fe640b",
    userColor: "#1e66f5", assistantDot: "#8839ef",
    toolColor: "#acb0be", systemColor: "#9ca0b0",
    textPrimary: "#4c4f69", textSecondary: "#5c5f77", textDim: "#acb0be",
    borderDim: "#e6e9ef", borderBright: "#ccd0da", borderActive: "#1e66f5",
    bgHighlight: "#eff1f5", buddyMain: "#8839ef", buddyEar: "#6020c0",
  },
  // 11. Everforest
  everforest: {
    name: "Everforest",
    accent: "#7fbbb3", accentAlt: "#83c092",
    success: "#a7c080", error: "#e67e80", warning: "#dbbc7f",
    userColor: "#7fbbb3", assistantDot: "#d699b6",
    toolColor: "#859289", systemColor: "#859289",
    textPrimary: "#d3c6aa", textSecondary: "#bdae93", textDim: "#859289",
    borderDim: "#2d353b", borderBright: "#475258", borderActive: "#7fbbb3",
    bgHighlight: "#2d353b", buddyMain: "#a7c080", buddyEar: "#7a9060",
  },
  // 12. Ayu Dark
  "ayu-dark": {
    name: "Ayu Dark",
    accent: "#39bae6", accentAlt: "#59c2ff",
    success: "#aad94c", error: "#ff3333", warning: "#ffb454",
    userColor: "#39bae6", assistantDot: "#e6b673",
    toolColor: "#3d424d", systemColor: "#626a73",
    textPrimary: "#b3b1ad", textSecondary: "#cccac2", textDim: "#3d424d",
    borderDim: "#0d1117", borderBright: "#3d424d", borderActive: "#39bae6",
    bgHighlight: "#0d1117", buddyMain: "#e6b673", buddyEar: "#b08040",
  },
  // 13. Rosé Pine
  "rose-pine": {
    name: "Rose Pine",
    accent: "#9ccfd8", accentAlt: "#31748f",
    success: "#31748f", error: "#eb6f92", warning: "#f6c177",
    userColor: "#9ccfd8", assistantDot: "#c4a7e7",
    toolColor: "#6e6a86", systemColor: "#6e6a86",
    textPrimary: "#e0def4", textSecondary: "#908caa", textDim: "#6e6a86",
    borderDim: "#1f1d2e", borderBright: "#403d52", borderActive: "#9ccfd8",
    bgHighlight: "#26233a", buddyMain: "#c4a7e7", buddyEar: "#9070b0",
  },
  // 14. Kanagawa
  kanagawa: {
    name: "Kanagawa",
    accent: "#7e9cd8", accentAlt: "#7fb4ca",
    success: "#98bb6c", error: "#e82424", warning: "#dca561",
    userColor: "#7fb4ca", assistantDot: "#957fb8",
    toolColor: "#54546d", systemColor: "#727169",
    textPrimary: "#dcd7ba", textSecondary: "#c8c093", textDim: "#54546d",
    borderDim: "#1f1f28", borderBright: "#363646", borderActive: "#7e9cd8",
    bgHighlight: "#2a2a37", buddyMain: "#957fb8", buddyEar: "#6a5590",
  },
  // 15. Material Palenight
  palenight: {
    name: "Material Palenight",
    accent: "#82aaff", accentAlt: "#89ddff",
    success: "#c3e88d", error: "#f07178", warning: "#ffcb6b",
    userColor: "#82aaff", assistantDot: "#c792ea",
    toolColor: "#4b5263", systemColor: "#676e95",
    textPrimary: "#a6accd", textSecondary: "#bfc7d5", textDim: "#4b5263",
    borderDim: "#1b1e2b", borderBright: "#2f3447", borderActive: "#82aaff",
    bgHighlight: "#212338", buddyMain: "#c792ea", buddyEar: "#9060b8",
  },
  // 16. GitHub Dark
  "github-dark": {
    name: "GitHub Dark",
    accent: "#79c0ff", accentAlt: "#56d364",
    success: "#3fb950", error: "#f85149", warning: "#e3b341",
    userColor: "#79c0ff", assistantDot: "#d2a8ff",
    toolColor: "#484f58", systemColor: "#8b949e",
    textPrimary: "#c9d1d9", textSecondary: "#b1bac4", textDim: "#484f58",
    borderDim: "#161b22", borderBright: "#30363d", borderActive: "#79c0ff",
    bgHighlight: "#161b22", buddyMain: "#d2a8ff", buddyEar: "#a070c8",
  },
  // 17. GitHub Light
  "github-light": {
    name: "GitHub Light",
    accent: "#0969da", accentAlt: "#1a7f37",
    success: "#1a7f37", error: "#cf222e", warning: "#9a6700",
    userColor: "#0969da", assistantDot: "#8250df",
    toolColor: "#6e7781", systemColor: "#57606a",
    textPrimary: "#24292f", textSecondary: "#32383f", textDim: "#6e7781",
    borderDim: "#d0d7de", borderBright: "#afb8c1", borderActive: "#0969da",
    bgHighlight: "#f6f8fa", buddyMain: "#8250df", buddyEar: "#5a30a0",
  },
  // 18. Cyberpunk
  cyberpunk: {
    name: "Cyberpunk 2077",
    accent: "#00ffff", accentAlt: "#ff00ff",
    success: "#00ff41", error: "#ff0054", warning: "#ffff00",
    userColor: "#00ffff", assistantDot: "#ff00ff",
    toolColor: "#444466", systemColor: "#8888aa",
    textPrimary: "#e0e0ff", textSecondary: "#c0c0ee", textDim: "#555577",
    borderDim: "#0a0a1a", borderBright: "#222244", borderActive: "#00ffff",
    bgHighlight: "#0a0a1a", buddyMain: "#ff00ff", buddyEar: "#cc00cc",
  },
  // 19. One Light
  "one-light": {
    name: "One Light",
    accent: "#4078f2", accentAlt: "#0184bc",
    success: "#50a14f", error: "#e45649", warning: "#c18401",
    userColor: "#4078f2", assistantDot: "#a626a4",
    toolColor: "#a0a1a7", systemColor: "#696c77",
    textPrimary: "#383a42", textSecondary: "#4b5263", textDim: "#a0a1a7",
    borderDim: "#e5e5e6", borderBright: "#c2c2c3", borderActive: "#4078f2",
    bgHighlight: "#fafafa", buddyMain: "#a626a4", buddyEar: "#7a1a7a",
  },
  // 20. Matrix
  matrix: {
    name: "Matrix",
    accent: "#00ff41", accentAlt: "#00cc33",
    success: "#00ff41", error: "#ff3300", warning: "#ffcc00",
    userColor: "#00ff41", assistantDot: "#00cc33",
    toolColor: "#004400", systemColor: "#007700",
    textPrimary: "#00cc33", textSecondary: "#009922", textDim: "#004400",
    borderDim: "#001100", borderBright: "#003300", borderActive: "#00ff41",
    bgHighlight: "#001100", buddyMain: "#00ff41", buddyEar: "#00aa22",
  },
  // 21. Cozy
  cozy: {
    name: "Cozy",
    accent: "#f97316", accentAlt: "#fbbf24",
    success: "#86a832", error: "#e05c4b", warning: "#f59e0b",
    userColor: "#fde8c8", assistantDot: "#f97316",
    toolColor: "#7a6a55", systemColor: "#7a6a55",
    textPrimary: "#ede0c8", textSecondary: "#d4c4a8", textDim: "#7a6a55",
    borderDim: "#221a10", borderBright: "#4a3520", borderActive: "#f97316",
    bgHighlight: "#1e1408", buddyMain: "#f97316", buddyEar: "#c2580a",
  },
  // ── Codex look: terminal default text, one blue accent, faint gray chrome ──
  "system-ansi": {
    name: "System ANSI",
    accent: "cyan", accentAlt: "blue",
    success: "green", error: "red", warning: "yellow",
    userColor: "white", assistantDot: "cyan",
    toolColor: "white", systemColor: "gray",
    textPrimary: "white", textSecondary: "white", textDim: "gray",
    borderDim: "gray", borderBright: "white", borderActive: "cyan",
    bgHighlight: "black", buddyMain: "cyan", buddyEar: "blue",
  },
  "high-contrast": {
    name: "High Contrast",
    accent: "#69c8ff", accentAlt: "#9bdcff", accentInk: "#00131f",
    success: "#7ee787", error: "#ff7b8b", warning: "#ffd866",
    userColor: "#ffffff", assistantDot: "#9bdcff",
    toolColor: "#e6edf3", systemColor: "#b6c2cf",
    textPrimary: "#ffffff", textSecondary: "#e6edf3", textDim: "#aab6c2",
    textLabel: "#b6c2cf",
    borderDim: "#52606d", borderBright: "#82909e", borderActive: "#69c8ff",
    bgHighlight: "#111820", bgDeep: "#05080c", bgCard: "#0c1218", bgCardHover: "#17212b", bgAlt: "#090f14",
    buddyMain: "#69c8ff", buddyEar: "#9bdcff",
  },
  "colorblind-dark": {
    name: "Colorblind Dark",
    accent: "#56b4e9", accentAlt: "#cc79a7", accentInk: "#06141a",
    success: "#009e73", error: "#f05a71", warning: "#f0e442",
    userColor: "#f3f6f8", assistantDot: "#56b4e9",
    toolColor: "#d0d7de", systemColor: "#9da7b1",
    textPrimary: "#f3f6f8", textSecondary: "#d0d7de", textDim: "#8995a1",
    textLabel: "#9da7b1",
    borderDim: "#35404b", borderBright: "#596674", borderActive: "#56b4e9",
    bgHighlight: "#111820", bgDeep: "#070a0d", bgCard: "#0d1319", bgCardHover: "#17212b", bgAlt: "#0a0f14",
    buddyMain: "#56b4e9", buddyEar: "#cc79a7",
  },
}

export const DEFAULT_THEME = "aurict"
export const THEME_NAMES   = Object.keys(THEMES)

export const BRAND_PALETTE_IDS = ["whiskey-amber", "oxblood", "ink-sapphire", "deep-emerald"] as const
export type BrandPaletteId = (typeof BRAND_PALETTE_IDS)[number]

export function isBrandTheme(id: string): boolean {
  return (BRAND_PALETTE_IDS as readonly string[]).includes(id)
}

export const ThemeContext = createContext<Theme>(THEMES[DEFAULT_THEME]!)
export const useTheme     = () => useContext(ThemeContext)
