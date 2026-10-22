import { describe, expect, test } from "bun:test";
import { BRAND_PALETTE_IDS, THEMES } from "../src/utils/theme.js";
import { resolveSemanticTheme } from "../src/tui/theme/semantic-theme.js";
import { detectTerminalCapabilities } from "../src/tui/theme/terminal-capabilities.js";
import { validateThemeContrast } from "../src/tui/theme/theme-validation.js";

describe("semantic terminal theme contract", () => {
  test("every built-in palette resolves all user-facing roles", () => {
    // "" is allowed for foreground roles: it means the terminal's default colour (Codex look).
    const defined = (value: string) => typeof value === "string";
    for (const theme of Object.values(THEMES)) {
      const semantic = resolveSemanticTheme(theme);
      expect(Object.values(semantic.foreground).every(defined)).toBe(true);
      expect(semantic.foreground.muted).toBeTruthy();
      expect(Object.values(semantic.status).every(Boolean)).toBe(true);
      expect(Object.values(semantic.surface).every(Boolean)).toBe(true);
      expect(Object.values(semantic.diff).every(Boolean)).toBe(true);
    }
  });

  test("brand themes satisfy text, status, and focus contrast targets", () => {
    for (const id of BRAND_PALETTE_IDS)
      expect(validateThemeContrast(THEMES[id]!)).toEqual([]);
  });

  test("accessibility themes satisfy the same contrast contract", () => {
    for (const id of ["high-contrast", "colorblind-dark"])
      expect(validateThemeContrast(THEMES[id]!)).toEqual([]);
  });

  test("detects truecolor, ANSI, no-color, Unicode, and reduced-motion terminals", () => {
    expect(detectTerminalCapabilities({ TERM: "xterm-256color", COLORTERM: "truecolor", LANG: "en_US.UTF-8" })).toEqual({
      colorLevel: "truecolor", unicode: true, reducedMotion: false,
    });
    expect(detectTerminalCapabilities({ TERM: "xterm-256color", LANG: "en_US.UTF-8" }).colorLevel).toBe("ansi256");
    expect(detectTerminalCapabilities({ TERM: "dumb", NO_COLOR: "1", LANG: "C" })).toEqual({
      colorLevel: "none", unicode: false, reducedMotion: true,
    });
  });
});
