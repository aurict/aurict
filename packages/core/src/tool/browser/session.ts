import { launchBrowser, readAccessibilitySnapshot, requireBrowserPage } from "../built-in/_ui-inspect-browser.js"
import type { Browser, BrowserEngine, BrowserPage } from "../built-in/_ui-inspect-browser.js"
import type { ExecuteResult, ToolContext } from "../types.js"

interface BrowserSession {
  browser: Browser
  page: BrowserPage
  engine: BrowserEngine
  expiresAt: number
  timer: ReturnType<typeof setTimeout>
}

export type BrowserAction = "open" | "navigate" | "snapshot" | "click" | "fill" | "press" | "screenshot" | "assert_text" | "assert_visible" | "assert_url" | "close"

export interface BrowserInput {
  action: BrowserAction
  url?: string
  html?: string
  selector?: string
  value?: string
  key?: string
  expected?: string
  viewport?: { width: number; height: number }
}

const SESSION_TTL_MS = 2 * 60_000
const sessions = new Map<string, BrowserSession>()

export async function executeBrowserAction(input: BrowserInput, ctx: ToolContext): Promise<ExecuteResult> {
  if (input.action === "open") return openSession(input, ctx)
  if (input.action === "close") {
    await closeBrowserSession(ctx.sessionId)
    return { output: "Browser session closed." }
  }
  const session = sessions.get(ctx.sessionId)
  if (!session) return { output: "", error: "No active browser session. Call browser action=open first." }
  refresh(session, ctx.sessionId)
  switch (input.action) {
    case "navigate":
      await session.page.goto(validateBrowserUrl(required(input.url, "url")), { waitUntil: "networkidle", timeout: 20_000 } as never)
      return pageState(session.page)
    case "snapshot": {
      const snapshot = await readAccessibilitySnapshot(session.page, session.engine, input.selector)
      return { output: JSON.stringify({ url: session.page.url(), title: await session.page.title(), accessibility: snapshot }, null, 2) }
    }
    case "click":
      await evaluate(session.page, clickScript(required(input.selector, "selector")))
      return pageState(session.page)
    case "fill":
      await evaluate(session.page, fillScript(required(input.selector, "selector"), input.value ?? ""))
      return pageState(session.page)
    case "press":
      if (!session.page.keyboard) return { output: "", error: `${session.engine} page does not expose keyboard.press` }
      await session.page.keyboard.press(required(input.key, "key"))
      return pageState(session.page)
    case "screenshot":
      return screenshot(session.page, ctx)
    case "assert_text":
      return assertText(session.page, input.selector, required(input.expected, "expected"))
    case "assert_visible":
      return assertVisible(session.page, required(input.selector, "selector"))
    case "assert_url":
      return assertUrl(session.page, required(input.expected, "expected"))
    default:
      return { output: "", error: `Unsupported browser action: ${input.action}` }
  }
}

async function openSession(input: BrowserInput, ctx: ToolContext): Promise<ExecuteResult> {
  await closeBrowserSession(ctx.sessionId)
  if (!input.url && !input.html) return { output: "", error: "url or html is required for browser open" }
  const launched = await launchBrowser()
  if (!launched.ok) return { output: "", error: launched.error }
  let page: BrowserPage | undefined
  try {
    page = requireBrowserPage(await launched.browser.newPage())
    if (input.viewport) {
      if (page.setViewportSize) await page.setViewportSize(input.viewport)
      else await page.setViewport?.(input.viewport)
    }
    if (input.url) await page.goto(validateBrowserUrl(input.url), { waitUntil: "networkidle", timeout: 20_000 } as never)
    else await page.setContent(input.html!, { waitUntil: "networkidle" } as never)
    const session: BrowserSession = {
      browser: launched.browser, page, engine: launched.engine,
      expiresAt: Date.now() + SESSION_TTL_MS,
      timer: setTimeout(() => void closeBrowserSession(ctx.sessionId), SESSION_TTL_MS),
    }
    sessions.set(ctx.sessionId, session)
    return pageState(page)
  } catch (error) {
    await page?.close().catch(() => undefined)
    await launched.browser.close().catch(() => undefined)
    return { output: "", error: error instanceof Error ? error.message : String(error) }
  }
}

export async function closeBrowserSession(sessionId: string): Promise<void> {
  const session = sessions.get(sessionId)
  if (!session) return
  sessions.delete(sessionId)
  clearTimeout(session.timer)
  await session.page.close().catch(() => undefined)
  await session.browser.close().catch(() => undefined)
}

function refresh(session: BrowserSession, sessionId: string): void {
  clearTimeout(session.timer)
  session.expiresAt = Date.now() + SESSION_TTL_MS
  session.timer = setTimeout(() => void closeBrowserSession(sessionId), SESSION_TTL_MS)
}

async function pageState(page: BrowserPage): Promise<ExecuteResult> {
  return { output: JSON.stringify({ url: page.url(), title: await page.title() }, null, 2) }
}

async function screenshot(page: BrowserPage, ctx: ToolContext): Promise<ExecuteResult> {
  if (!page.screenshot) return { output: "", error: "Browser page does not support screenshots" }
  const value = await page.screenshot({ type: "png", fullPage: false })
  const data = typeof value === "string"
    ? value
    : Buffer.from(value as Uint8Array).toString("base64")
  const output = `Screenshot captured: ${page.url()} (image/png, ${Buffer.from(data, "base64").length} bytes)`
  return ctx.supportsVision === false
    ? { output: `${output}. Current model is text-only; use snapshot for model-readable verification.` }
    : { output, content: [{ type: "image", data, mimeType: "image/png" }] }
}

async function assertText(page: BrowserPage, selector: string | undefined, expected: string): Promise<ExecuteResult> {
  const actual = await evaluate(page, textScript(selector))
  const text = String(actual ?? "")
  if (!text.includes(expected)) return { output: "", error: `Browser assertion failed: expected text '${expected}', received '${text.slice(0, 500)}'` }
  return { output: `Assertion passed: text contains '${expected}'.` }
}

async function assertVisible(page: BrowserPage, selector: string): Promise<ExecuteResult> {
  const visible = await evaluate(page, visibleScript(selector))
  if (visible !== true) return { output: "", error: `Browser assertion failed: '${selector}' is not visible.` }
  return { output: `Assertion passed: '${selector}' is visible.` }
}

async function assertUrl(page: BrowserPage, expected: string): Promise<ExecuteResult> {
  const actual = page.url()
  if (!actual.includes(expected)) return { output: "", error: `Browser assertion failed: URL '${actual}' does not contain '${expected}'.` }
  return { output: `Assertion passed: URL contains '${expected}'.` }
}

async function evaluate(page: BrowserPage, script: string): Promise<unknown> {
  return page.evaluate(script)
}

export function validateBrowserUrl(raw: string): string {
  const url = new URL(raw)
  if (!['http:', 'https:'].includes(url.protocol)) throw new Error(`Unsupported browser URL protocol: ${url.protocol}`)
  if (url.username || url.password) throw new Error("Credential-bearing browser URLs are not allowed")
  return url.toString()
}

export function isLocalBrowserUrl(raw: string): boolean {
  try {
    const host = new URL(raw).hostname.toLowerCase()
    return host === "localhost" || host === "127.0.0.1" || host === "::1"
  } catch { return false }
}

function clickScript(selector: string): string {
  return `(() => { const el = document.querySelector(${JSON.stringify(selector)}); if (!el) throw new Error('Element not found'); el.click(); return true })()`
}

function fillScript(selector: string, value: string): string {
  return `(() => { const el = document.querySelector(${JSON.stringify(selector)}); if (!el) throw new Error('Element not found'); if (!('value' in el)) throw new Error('Element is not fillable'); el.focus(); el.value = ${JSON.stringify(value)}; el.dispatchEvent(new Event('input', { bubbles: true })); el.dispatchEvent(new Event('change', { bubbles: true })); return true })()`
}

function textScript(selector: string | undefined): string {
  return `(() => { const el = ${selector ? `document.querySelector(${JSON.stringify(selector)})` : "document.body"}; if (!el) throw new Error('Element not found'); return el.textContent || '' })()`
}

function visibleScript(selector: string): string {
  return `(() => { const el = document.querySelector(${JSON.stringify(selector)}); if (!el) return false; const r = el.getBoundingClientRect(); const s = getComputedStyle(el); return r.width > 0 && r.height > 0 && s.display !== 'none' && s.visibility !== 'hidden' })()`
}

function required(value: string | undefined, label: string): string {
  if (!value?.trim()) throw new Error(`${label} is required`)
  return value
}
