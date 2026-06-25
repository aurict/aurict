import { z } from "zod"
import { findChromium } from "./_browser-renderer.js"
import type { ToolDef, ToolContext, ExecuteResult } from "../types.js"

// ── Types ─────────────────────────────────────────────────────────────────────

interface AXNode {
  role:             string
  name?:            string
  value?:           string | number
  description?:     string
  disabled?:        boolean
  expanded?:        boolean
  checked?:         boolean | "mixed"
  pressed?:         boolean | "mixed"
  selected?:        boolean
  required?:        boolean
  readonly?:        boolean
  level?:           number
  children?:        AXNode[]
}

interface InteractiveEl {
  role:     string
  name:     string
  tag:      string
  disabled: boolean
  x:        number
  y:        number
  w:        number
  h:        number
}

interface PageInfo {
  title:        string
  description:  string
  url:          string
  viewport:     { width: number; height: number }
  colorScheme:  "dark" | "light" | "unknown"
  cssVars:      { prop: string; value: string }[]
  axTree:       AXNode | null
  interactive:  InteractiveEl[]
}

// ── ARIA tree formatter ───────────────────────────────────────────────────────

const SKIP_ROLES = new Set(["none", "presentation", "generic"])

const INTERACTIVE_ROLES = new Set([
  "button", "link", "checkbox", "radio", "textbox", "combobox",
  "listbox", "menuitem", "menuitemcheckbox", "menuitemradio",
  "option", "switch", "tab", "treeitem", "searchbox", "spinbutton",
  "slider", "scrollbar",
])

function formatTree(node: AXNode, depth: number, lines: string[], maxDepth: number): void {
  if (depth > maxDepth) return
  if (SKIP_ROLES.has(node.role) && !node.name && !(node.children?.length)) return

  const indent = "  ".repeat(depth)
  const parts:  string[] = [node.role]

  if (node.name)                                  parts[0] += ` "${node.name}"`
  if (node.level)                                 parts.push(`h${node.level}`)
  if (node.disabled)                              parts.push("disabled")
  if (node.required)                              parts.push("required")
  if (node.readonly)                              parts.push("readonly")
  if (node.checked === true)                      parts.push("checked")
  if (node.checked === false)                     parts.push("unchecked")
  if (node.checked === "mixed")                   parts.push("mixed")
  if (node.pressed === true)                      parts.push("pressed")
  if (node.expanded !== undefined)                parts.push(node.expanded ? "expanded" : "collapsed")
  if (typeof node.value === "string" && node.value.length > 0) {
    parts.push(`= "${node.value.slice(0, 60)}"`)
  }
  if (node.description && node.description !== node.name) {
    parts.push(`(${node.description.slice(0, 60)})`)
  }

  lines.push(`${indent}${parts.join("  ")}`)

  for (const child of node.children ?? []) {
    formatTree(child, depth + 1, lines, maxDepth)
  }
}

// ── ANSI ──────────────────────────────────────────────────────────────────────

const C = {
  reset:   "\x1b[0m",
  bold:    "\x1b[1m",
  dim:     "\x1b[2m",
  cyan:    "\x1b[36m",
  green:   "\x1b[32m",
  yellow:  "\x1b[33m",
  blue:    "\x1b[34m",
  red:     "\x1b[31m",
  gray:    "\x1b[90m",
}

// ── Output formatter ──────────────────────────────────────────────────────────

function format(info: PageInfo): string {
  const lines: string[] = []

  lines.push("")
  lines.push(`${C.bold}${C.cyan}ui_inspect${C.reset}  ${C.bold}${info.url}${C.reset}`)
  lines.push(`${C.gray}${"─".repeat(60)}${C.reset}`)
  lines.push("")

  // ── Page meta ─────────────────────────────────────────────────────────
  lines.push(`${C.bold}Page:${C.reset}  ${info.title || C.gray + "(no title)" + C.reset}`)
  if (info.description) lines.push(`${C.gray}       ${info.description.slice(0, 120)}${C.reset}`)
  lines.push(
    `${C.gray}Viewport:${C.reset} ${info.viewport.width}×${info.viewport.height}  ` +
    `${C.gray}Theme:${C.reset} ${info.colorScheme}`
  )
  lines.push("")

  // ── ARIA tree ─────────────────────────────────────────────────────────
  if (info.axTree) {
    lines.push(`${C.bold}Accessibility tree:${C.reset}`)
    const treeLines: string[] = []
    formatTree(info.axTree, 0, treeLines, 8)
    for (const l of treeLines) lines.push(`  ${l}`)
    lines.push("")
  }

  // ── Interactive elements ──────────────────────────────────────────────
  if (info.interactive.length > 0) {
    lines.push(`${C.bold}Interactive elements:${C.reset} ${C.gray}${info.interactive.length} total${C.reset}`)
    for (const el of info.interactive.slice(0, 30)) {
      const pos     = `${C.gray}(${Math.round(el.x)},${Math.round(el.y)}) ${Math.round(el.w)}×${Math.round(el.h)}${C.reset}`
      const dis     = el.disabled ? `  ${C.yellow}disabled${C.reset}` : ""
      const role    = `${C.blue}${el.role}${C.reset}`
      const name    = el.name ? ` "${el.name.slice(0, 60)}"` : ""
      lines.push(`  ${role}${name}  ${pos}${dis}`)
    }
    if (info.interactive.length > 30) {
      lines.push(`  ${C.gray}… ${info.interactive.length - 30} more${C.reset}`)
    }
    lines.push("")
  }

  // ── CSS design tokens ─────────────────────────────────────────────────
  if (info.cssVars.length > 0) {
    lines.push(`${C.bold}CSS variables (${info.cssVars.length}):${C.reset}`)
    for (const v of info.cssVars.slice(0, 20)) {
      lines.push(`  ${C.cyan}${v.prop}${C.reset}  ${v.value}`)
    }
    if (info.cssVars.length > 20) {
      lines.push(`  ${C.gray}… ${info.cssVars.length - 20} more${C.reset}`)
    }
    lines.push("")
  }

  return lines.join("\n")
}

// ── Browser launcher ──────────────────────────────────────────────────────────

type BrowserPage = {
  goto(url: string, opts?: unknown):             Promise<void>
  setContent(html: string, opts?: unknown):      Promise<void>
  setViewportSize?(opts: unknown):               Promise<void>
  evaluate<T>(fn: (...args: unknown[]) => T):    Promise<T>
  title():                                       Promise<string>
  url():                                         string
  accessibility: { snapshot(opts?: unknown):     Promise<AXNode | null> }
  close():                                       Promise<void>
}

type Browser = {
  newPage():   Promise<BrowserPage>
  close():     Promise<void>
}

async function launchBrowser(): Promise<{ browser: Browser; error?: never } | { browser?: never; error: string }> {
  const executablePath = await findChromium()
  const launchOpts = {
    executablePath: executablePath ?? undefined,
    args: ["--no-sandbox", "--disable-setuid-sandbox", "--disable-dev-shm-usage"],
  }

  try {
    // @ts-ignore — optional peer dependency
    const pw = await import("playwright-core")
    const browser = await (pw.chromium as { launch(o: unknown): Promise<Browser> }).launch(launchOpts)
    return { browser }
  } catch { /* try puppeteer */ }

  try {
    // @ts-ignore — optional peer dependency
    const pp = await import("puppeteer-core")
    const browser = await (pp.default as { launch(o: unknown): Promise<Browser> }).launch(launchOpts)
    return { browser }
  } catch { /* neither available */ }

  return {
    error: [
      "No browser library found. Install one:",
      "  bun add -d playwright-core   # then: bunx playwright install chromium",
      "  bun add -d puppeteer-core",
    ].join("\n"),
  }
}

// ── In-page extraction scripts ────────────────────────────────────────────────

const GET_PAGE_INFO = `(() => {
  const styles  = getComputedStyle(document.documentElement)
  const bgColor = styles.backgroundColor || ""
  const isDark  = (() => {
    const m = bgColor.match(/rgb\\((\\d+),\\s*(\\d+),\\s*(\\d+)/)
    if (!m) return null
    const [,r,g,b] = m.map(Number)
    return (r*0.299 + g*0.587 + b*0.114) < 128
  })()

  const cssVars = []
  for (const sheet of document.styleSheets) {
    try {
      for (const rule of sheet.cssRules) {
        if (rule.selectorText === ':root') {
          for (const prop of rule.style) {
            if (prop.startsWith('--')) {
              cssVars.push({ prop, value: rule.style.getPropertyValue(prop).trim() })
            }
          }
        }
      }
    } catch {}
  }

  const metaDesc = document.querySelector('meta[name="description"]')?.getAttribute('content') || ''

  return { isDark, cssVars, metaDesc }
})()`

const GET_INTERACTIVE = `(() => {
  const sel = 'button, input:not([type="hidden"]), select, textarea, a[href], [role="button"], [role="link"], [role="checkbox"], [role="radio"], [role="textbox"], [role="combobox"], [role="menuitem"], [role="tab"]'
  return Array.from(document.querySelectorAll(sel)).map(el => {
    const r = el.getBoundingClientRect()
    return {
      tag:      el.tagName.toLowerCase(),
      role:     el.getAttribute('role') || el.tagName.toLowerCase(),
      name:     (el.getAttribute('aria-label') || el.textContent || el.getAttribute('placeholder') || el.getAttribute('value') || '').trim().slice(0, 80),
      disabled: !!(el.disabled || el.getAttribute('aria-disabled') === 'true'),
      x: r.left, y: r.top, w: r.width, h: r.height,
    }
  }).filter(el => el.w > 0 && el.h > 0)
})()`

// ── Tool ──────────────────────────────────────────────────────────────────────

export const uiInspectTool: ToolDef = {
  id: "ui_inspect",

  spec: { category: "read", riskLevel: "low" },

  description: `Extracts the accessibility tree and interactive element map from any web page or HTML.

Gives text-only models a structured view of UI without needing vision:
- Full ARIA accessibility tree (roles, names, states, hierarchy)
- Every interactive element with its position (x, y, width, height)
- CSS design tokens from :root variables
- Page title, meta description, color scheme (dark/light)

USE THIS to understand:
- What a UI page contains before writing tests or interaction code
- Whether a component is accessible (missing labels, wrong roles)
- The layout structure of a page you're building or debugging
- What buttons/inputs exist and where they are

Works with local dev servers (http://localhost:3000) and any reachable URL.
Requires playwright-core or puppeteer-core: bun add -d playwright-core

EXAMPLES:
  { url: "http://localhost:3000" }
  { url: "http://localhost:3000/dashboard", selector: "main" }
  { html: "<button disabled>Submit</button><input placeholder='Email' />" }`,

  parameters: z.object({
    url:      z.string().optional().describe("URL to inspect (http://localhost:3000, etc.)"),
    html:     z.string().optional().describe("Raw HTML to render and inspect"),
    selector: z.string().optional().describe("CSS selector to scope the tree to a specific element"),
    viewport: z.object({
      width:  z.number().optional().default(1280),
      height: z.number().optional().default(800),
    }).optional(),
  }),

  async execute(args, _ctx: ToolContext): Promise<ExecuteResult> {
    const url      = args["url"]  ? String(args["url"])  : undefined
    const html     = args["html"] ? String(args["html"]) : undefined
    const selector = args["selector"] ? String(args["selector"]) : undefined
    const vpArgs   = args["viewport"] as { width?: number; height?: number } | undefined
    const viewport = { width: vpArgs?.width ?? 1280, height: vpArgs?.height ?? 800 }

    if (!url && !html) return { output: "", error: "Either 'url' or 'html' is required" }

    const launched = await launchBrowser()
    if (launched.error) return { output: "", error: launched.error }
    const browser = launched.browser!

    let page: BrowserPage | undefined
    try {
      page = await browser.newPage()
      page.setViewportSize?.({ width: viewport.width, height: viewport.height })

      if (url) {
        await page.goto(url, { waitUntil: "networkidle", timeout: 15000 } as never)
      } else if (html) {
        await page.setContent(html, { waitUntil: "networkidle" } as never)
      }

      const title         = await page.title()
      const currentUrl    = url ?? "(inline html)"

      // ── Scoped root for accessibility snapshot ───────────────────────
      let axRoot: BrowserPage | unknown = page
      if (selector) {
        // @ts-ignore
        const el = await page.$(selector)
        if (el) axRoot = el
      }

      // @ts-ignore — accessibility API shared across playwright/puppeteer
      const axTree: AXNode | null = await (axRoot as { accessibility?: { snapshot(): Promise<AXNode | null> } })
        .accessibility?.snapshot?.() ?? null

      // ── In-page data ─────────────────────────────────────────────────
      // @ts-ignore
      const pageData = await page.evaluate(GET_PAGE_INFO) as {
        isDark:    boolean | null
        cssVars:   { prop: string; value: string }[]
        metaDesc:  string
      }

      // @ts-ignore
      const interactive = await page.evaluate(GET_INTERACTIVE) as InteractiveEl[]

      const info: PageInfo = {
        title,
        description:  pageData.metaDesc,
        url:          currentUrl,
        viewport,
        colorScheme:  pageData.isDark === null ? "unknown" : pageData.isDark ? "dark" : "light",
        cssVars:      pageData.cssVars,
        axTree,
        interactive,
      }

      return { output: format(info) }

    } catch (err) {
      return { output: "", error: err instanceof Error ? err.message : String(err) }
    } finally {
      await page?.close()
      await browser?.close()
    }
  },
}
