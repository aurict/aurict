/**
 * Shared Playwright browser renderer.
 * Uses system-installed Chromium/Chrome via playwright-core.
 * Never downloads a bundled browser.
 */

import { existsSync } from "node:fs"
import { join } from "node:path"
import { tmpdir, homedir } from "node:os"

const CHROME_CANDIDATES = [
  // Linux
  "/usr/bin/chromium-browser",
  "/usr/bin/chromium",
  "/usr/bin/google-chrome",
  "/usr/bin/google-chrome-stable",
  "/usr/local/bin/chromium",
  "/snap/bin/chromium",
  // macOS
  "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
  "/Applications/Chromium.app/Contents/MacOS/Chromium",
  // Common user-installed
  join(homedir(), ".local/share/google-chrome/chrome"),
]

export type PdfOptions = {
  format?:          "A4" | "Letter" | "A3" | "Legal"
  landscape?:       boolean
  printBackground?: boolean
  margin?:          { top?: string; bottom?: string; left?: string; right?: string }
}

export type ImageOptions = {
  width?:   number
  height?:  number
  fullPage?: boolean
}

let _executablePath: string | null | undefined = undefined

export async function findChromium(): Promise<string | null> {
  if (_executablePath !== undefined) return _executablePath

  for (const p of CHROME_CANDIDATES) {
    if (existsSync(p)) { _executablePath = p; return p }
  }

  // Try which/where
  try {
    const proc = Bun.spawn(["which", "chromium-browser"], { stdout: "pipe", stderr: "pipe" })
    const out = (await new Response(proc.stdout).text()).trim()
    if (out && existsSync(out)) { _executablePath = out; return out }
  } catch { /* skip */ }

  try {
    const proc = Bun.spawn(["which", "google-chrome"], { stdout: "pipe", stderr: "pipe" })
    const out = (await new Response(proc.stdout).text()).trim()
    if (out && existsSync(out)) { _executablePath = out; return out }
  } catch { /* skip */ }

  _executablePath = null
  return null
}

function installHint(): string {
  return [
    "No Chromium/Chrome browser found.",
    "Install with one of:",
    "  apt install chromium-browser",
    "  apt install google-chrome-stable",
    "  brew install --cask google-chrome",
    "Or install playwright browsers: bunx playwright install chromium",
  ].join("\n")
}

export async function renderHtmlToPdf(
  html:        string,
  outputPath:  string,
  opts:        PdfOptions = {},
): Promise<{ ok: true; path: string } | { ok: false; error: string }> {
  const executablePath = await findChromium()

  // Try playwright-core first, then puppeteer
  let chromium: unknown
  let usePuppeteer = false
  try {
    // @ts-ignore — optional peer dependency
    const pw = await import("playwright-core")
    chromium = pw.chromium
  } catch {
    try {
      // @ts-ignore — optional peer dependency
      const pp = await import("puppeteer-core")
      chromium = pp.default
      usePuppeteer = true
    } catch {
      if (!executablePath) return { ok: false, error: installHint() }
      return { ok: false, error: "Install playwright-core: bun add playwright-core" }
    }
  }

  try {
    let browser: { newPage(): Promise<Page>; close(): Promise<void> }
    if (usePuppeteer) {
      const pp = chromium as { launch(o: unknown): Promise<typeof browser> }
      browser = await pp.launch({
        executablePath: executablePath ?? undefined,
        args: ["--no-sandbox", "--disable-setuid-sandbox"],
      })
    } else {
      const pw = chromium as { launch(o: unknown): Promise<typeof browser> }
      browser = await pw.launch({
        executablePath: executablePath ?? undefined,
        args: ["--no-sandbox", "--disable-setuid-sandbox"],
      })
    }

    const page = await browser.newPage() as Page
    await page.setContent(html, { waitUntil: "networkidle" } as never)
    await page.pdf({
      path:            outputPath,
      format:          opts.format ?? "A4",
      landscape:       opts.landscape ?? false,
      printBackground: opts.printBackground ?? true,
      margin:          opts.margin ?? { top: "20mm", bottom: "20mm", left: "25mm", right: "25mm" },
    } as never)
    await browser.close()
    return { ok: true, path: outputPath }
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : String(err) }
  }
}

export async function renderHtmlToImage(
  html:        string,
  outputPath:  string,
  opts:        ImageOptions = {},
): Promise<{ ok: true; path: string } | { ok: false; error: string }> {
  const executablePath = await findChromium()

  let chromium: unknown
  let usePuppeteer = false
  try {
    // @ts-ignore — optional peer dependency
    const pw = await import("playwright-core")
    chromium = pw.chromium
  } catch {
    try {
      // @ts-ignore — optional peer dependency
      const pp = await import("puppeteer-core")
      chromium = pp.default
      usePuppeteer = true
    } catch {
      if (!executablePath) return { ok: false, error: installHint() }
      return { ok: false, error: "Install playwright-core: bun add playwright-core" }
    }
  }

  try {
    let browser: { newPage(): Promise<Page>; close(): Promise<void> }
    const launchOpts = {
      executablePath: executablePath ?? undefined,
      args: ["--no-sandbox", "--disable-setuid-sandbox"],
    }
    if (usePuppeteer) {
      browser = await (chromium as { launch(o: unknown): Promise<typeof browser> }).launch(launchOpts)
    } else {
      browser = await (chromium as { launch(o: unknown): Promise<typeof browser> }).launch(launchOpts)
    }

    const page = await browser.newPage() as Page
    await page.setViewportSize?.({ width: opts.width ?? 1200, height: opts.height ?? 800 } as never)
    await page.setContent(html, { waitUntil: "networkidle" } as never)
    await page.screenshot({
      path:     outputPath,
      fullPage: opts.fullPage ?? true,
    } as never)
    await browser.close()
    return { ok: true, path: outputPath }
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : String(err) }
  }
}

export function tempPath(ext: string): string {
  return join(tmpdir(), `aurict-${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`)
}

// Minimal page type shim — the actual object comes from playwright/puppeteer
type Page = {
  setContent(html: string, opts?: unknown): Promise<void>
  pdf(opts?: unknown): Promise<void>
  screenshot(opts?: unknown): Promise<void>
  setViewportSize?(opts: unknown): Promise<void>
}
