import { findChromium } from "./_browser-renderer.js"

export type BrowserEngine = "playwright" | "puppeteer"

export type AccessibilitySnapshot =
  | { kind: "aria"; value: string }
  | { kind: "tree"; value: unknown }

export type BrowserPage = {
  goto(url: string, opts?: unknown): Promise<unknown>
  setContent(html: string, opts?: unknown): Promise<unknown>
  setViewportSize?(opts: unknown): Promise<unknown>
  setViewport?(opts: unknown): Promise<unknown>
  evaluate(script: string): Promise<unknown>
  title(): Promise<string>
  url(): string
  locator?(selector: string): unknown
  $(selector: string): Promise<unknown>
  accessibility?: unknown
  keyboard?: { press(key: string): Promise<unknown> }
  screenshot?(opts?: unknown): Promise<unknown>
  close(): Promise<unknown>
}

export type Browser = {
  newPage(): Promise<unknown>
  close(): Promise<unknown>
}

type BrowserLauncher = {
  launch(opts: unknown): Promise<unknown>
}

type AriaTarget = {
  ariaSnapshot(opts?: unknown): Promise<string>
}

type AccessibilityApi = {
  snapshot(opts?: unknown): Promise<unknown>
}

function asRecord(value: unknown): Record<string, unknown> | undefined {
  return value !== null && typeof value === "object" ? value as Record<string, unknown> : undefined
}

function asLauncher(value: unknown): BrowserLauncher | undefined {
  const record = asRecord(value)
  return typeof record?.["launch"] === "function" ? record as unknown as BrowserLauncher : undefined
}

function asBrowser(value: unknown): Browser | undefined {
  const record = asRecord(value)
  if (typeof record?.["newPage"] !== "function" || typeof record["close"] !== "function") return undefined
  return record as unknown as Browser
}

function asAriaTarget(value: unknown): AriaTarget | undefined {
  const record = asRecord(value)
  return typeof record?.["ariaSnapshot"] === "function" ? record as unknown as AriaTarget : undefined
}

function asAccessibilityApi(value: unknown): AccessibilityApi | undefined {
  const record = asRecord(value)
  return typeof record?.["snapshot"] === "function" ? record as unknown as AccessibilityApi : undefined
}

function errorMessage(error: unknown): string {
  return error instanceof Error ? error.message : String(error)
}

function importOptional(specifier: string): Promise<unknown> {
  return import(specifier)
}

export function requireBrowserPage(value: unknown): BrowserPage {
  const record = asRecord(value)
  const requiredMethods = ["goto", "setContent", "evaluate", "title", "url", "close"]
  if (!record || requiredMethods.some((method) => typeof record[method] !== "function")) {
    throw new TypeError("Browser library returned an incompatible page object.")
  }
  return record as unknown as BrowserPage
}

export async function launchBrowser(): Promise<
  | { ok: true; browser: Browser; engine: BrowserEngine }
  | { ok: false; error: string }
> {
  const executablePath = await findChromium()
  const launchOpts = {
    executablePath: executablePath ?? undefined,
    args: ["--no-sandbox", "--disable-setuid-sandbox", "--disable-dev-shm-usage"],
  }
  const attempts: string[] = []

  const candidates: { engine: BrowserEngine; load(): Promise<unknown>; launcher(module: unknown): unknown }[] = [
    {
      engine: "playwright",
      load: () => importOptional("playwright-core"),
      launcher: (module) => asRecord(module)?.["chromium"],
    },
    {
      engine: "puppeteer",
      load: () => importOptional("puppeteer-core"),
      launcher: (module) => asRecord(module)?.["default"],
    },
  ]

  for (const candidate of candidates) {
    try {
      const module = await candidate.load()
      const launcher = asLauncher(candidate.launcher(module))
      if (!launcher) throw new TypeError("module did not expose a Chromium launcher")

      const browser = asBrowser(await launcher.launch(launchOpts))
      if (!browser) throw new TypeError("launcher returned an incompatible browser object")
      return { ok: true, browser, engine: candidate.engine }
    } catch (error) {
      attempts.push(`${candidate.engine}: ${errorMessage(error)}`)
    }
  }

  return {
    ok: false,
    error: [
      "No supported browser library could be launched.",
      ...attempts.map((attempt) => `  ${attempt}`),
      "Install one:",
      "  bun add -d playwright-core   # then: bunx playwright install chromium",
      "  bun add -d puppeteer-core",
    ].join("\n"),
  }
}

export async function readAccessibilitySnapshot(
  page: BrowserPage,
  engine: BrowserEngine,
  selector?: string,
): Promise<AccessibilitySnapshot | null> {
  if (engine === "playwright") {
    const target = asAriaTarget(page.locator?.(selector ?? "body"))
    if (!target) throw new TypeError("Playwright page did not expose locator().ariaSnapshot().")
    return { kind: "aria", value: await target.ariaSnapshot() }
  }

  const accessibility = asAccessibilityApi(page.accessibility)
  if (!accessibility) throw new TypeError("Puppeteer page did not expose accessibility.snapshot().")
  const root = selector ? await page.$(selector) : undefined
  const snapshot = await accessibility.snapshot(root ? { root } : undefined)
  return snapshot === null ? null : { kind: "tree", value: snapshot }
}
