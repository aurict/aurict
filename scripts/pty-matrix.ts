#!/usr/bin/env bun
/**
 * Real-PTY regression matrix for the interactive terminal UI.
 *
 * Each scenario starts the CLI in a pseudo-terminal (Bun.spawn `terminal`),
 * drives it with scripted keys against an in-process, scripted
 * OpenAI-compatible provider, replays the raw byte stream through xterm.js,
 * and checks invariants on the emulated screen plus scrollback.
 *
 * Isolation: HOME, state, snapshots, config, and the workdir are temporary.
 * MCP servers are pre-disabled and the local server is off, so nothing
 * touches the network, global installs, or the user's home directory.
 *
 * Usage: bun run test:pty [--only <name>] [--binary <path>] [--keep]
 */
import { mkdirSync, mkdtempSync, rmSync, writeFileSync, existsSync } from "node:fs"
import { tmpdir } from "node:os"
import { join, resolve } from "node:path"
import xterm from "@xterm/headless"

const ROOT = join(import.meta.dir, "..")
const args = process.argv.slice(2)
const only = args.includes("--only") ? args[args.indexOf("--only") + 1] : undefined
const binary = args.includes("--binary") ? resolve(args[args.indexOf("--binary") + 1]!) : undefined
const keep = args.includes("--keep")

// ── Scripted provider ────────────────────────────────────────────────────────

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms))

function longAnswer(topic: string): string {
  const lines = [`## Summary for ${topic}`, "", "- **one** first point", "- **two** second point", "", "```ts", "const answer = 42", "```", ""]
  for (let i = 1; i <= 24; i++) lines.push(`${i}. Detail line ${i} about ${topic}.`)
  return [...lines, "", "That covers the overview."].join("\n")
}

function sse(parts: Array<{ text?: string; tool?: { name: string; args: object } }>, finish: string, delay: number): Response {
  const encoder = new TextEncoder()
  const chunk = (delta: object, reason: string | null = null) =>
    encoder.encode(`data: ${JSON.stringify({ id: "c", object: "chat.completion.chunk", created: 0, model: "m", choices: [{ index: 0, delta, finish_reason: reason }] })}\n\n`)
  return new Response(new ReadableStream({
    async start(controller) {
      controller.enqueue(chunk({ role: "assistant", content: "" }))
      let toolIndex = 0
      for (const part of parts) {
        const words = part.text?.split(/(?<=\s)/) ?? []
        for (let i = 0; i < words.length; i += 3) {
          controller.enqueue(chunk({ content: words.slice(i, i + 3).join("") }))
          await sleep(delay)
        }
        if (part.tool) {
          controller.enqueue(chunk({ tool_calls: [{ index: toolIndex, id: `call_${toolIndex}_${Date.now()}`, type: "function", function: { name: part.tool.name, arguments: JSON.stringify(part.tool.args) } }] }))
          toolIndex++
        }
      }
      controller.enqueue(chunk({}, finish))
      controller.enqueue(encoder.encode(`data: ${JSON.stringify({ id: "c", object: "chat.completion.chunk", created: 0, model: "m", choices: [], usage: { prompt_tokens: 1200, completion_tokens: 340, total_tokens: 1540 } })}\n\n`))
      controller.enqueue(encoder.encode("data: [DONE]\n\n"))
      controller.close()
    },
  }), { headers: { "content-type": "text/event-stream" } })
}

type ChatMessage = { role: string; content: unknown }
const textOf = (content: unknown) => typeof content === "string" ? content
  : Array.isArray(content) ? content.map((part) => (part as { text?: string }).text ?? "").join("") : ""

const provider = Bun.serve({
  port: 0,
  async fetch(request) {
    const url = new URL(request.url)
    if (url.pathname.endsWith("/api/tags")) return Response.json({ models: [] })
    if (!url.pathname.endsWith("/chat/completions")) return new Response("not found", { status: 404 })
    const body = await request.json() as { messages: ChatMessage[]; stream?: boolean; tools?: Array<{ function: { name: string } }> }
    if (!body.stream) {
      return Response.json({ id: "c", object: "chat.completion", created: 0, model: "m", choices: [{ index: 0, message: { role: "assistant", content: "{}" }, finish_reason: "stop" }], usage: { prompt_tokens: 1, completion_tokens: 1, total_tokens: 2 } })
    }
    const lastUser = [...body.messages].reverse().find((message) => message.role === "user")
    const prompt = textOf(lastUser?.content)
    const toolResults = body.messages.slice(body.messages.lastIndexOf(lastUser!)).filter((message) => message.role === "tool").length
    const tool = (pattern: RegExp) => (body.tools ?? []).map((entry) => entry.function.name).find((name) => pattern.test(name))
    const delay = /slow/i.test(prompt) ? 90 : 10
    if (/use tools/i.test(prompt)) {
      if (toolResults === 0) return sse([{ text: "Inspecting first. " }, { tool: { name: tool(/glob/)!, args: { pattern: "*.md" } } }], "tool_calls", delay)
      if (toolResults === 1) return sse([{ text: "Reading the README. " }, { tool: { name: tool(/(^|_)read$/)!, args: { path: "README.md" } } }], "tool_calls", delay)
      return sse([{ text: longAnswer("the tool run") }], "stop", delay)
    }
    if (/writefile/i.test(prompt)) {
      if (toolResults === 0) return sse([{ text: "Creating the file. " }, { tool: { name: tool(/(^|_)write$/)!, args: { path: "created.txt", content: "made by the agent\n" } } }], "tool_calls", delay)
      return sse([{ text: "Done writing the file." }], "stop", delay)
    }
    if (/short/i.test(prompt)) return sse([{ text: "Short answer: yes." }], "stop", delay)
    return sse([{ text: longAnswer(prompt.replace(/\W+/g, " ").trim().slice(0, 24)) }], "stop", delay)
  },
})

// ── PTY driver ───────────────────────────────────────────────────────────────

type Step =
  | { wait: number }
  | { until: string; timeout?: number }
  | { send: string }
  | { resize: [number, number] }
  | { mark: string }
  | { check: (run: RunContext) => string | null }

interface RunContext { workdir: string }

interface Scenario {
  name: string
  cols: number
  rows: number
  args?: string[]
  env?: Record<string, string>
  steps: Step[]
  expect: (result: RunResult) => string[]
}

interface RunResult {
  raw: string
  lines: string[]
  screens: Map<string, string[]>
  exitCode: number | null
  workdir: string
  failures: string[]
}

const ENTER = "\r"
const ESC = "\x1b"
const CTRL_C = "\x03"
const START: Step[] = [{ until: "Project Auto", timeout: 30_000 }, { wait: 300 }, { send: "n" }, { wait: 300 }]
const EXIT: Step[] = [{ wait: 300 }, { send: CTRL_C }, { wait: 300 }, { send: CTRL_C }]

function count(haystack: string, needle: string): number {
  return haystack.split(needle).length - 1
}

function seed(base: string): { env: Record<string, string>; workdir: string } {
  const home = join(base, "home")
  const state = join(base, "state")
  const workdir = join(base, "work")
  for (const directory of [join(home, ".aurict"), state, join(base, "remote"), join(base, "snapshots"), join(base, "config"), workdir]) mkdirSync(directory, { recursive: true })
  const disabled = { enabled: false }
  writeFileSync(join(home, ".aurict", "mcp.json"), JSON.stringify({ mcpServers: { filesystem: disabled, git: disabled, fetch: disabled, codegraph: disabled } }))
  writeFileSync(join(state, "config.json"), JSON.stringify({ server: { disabled: true } }))
  writeFileSync(join(workdir, "README.md"), "# Sample\n\nA tiny workspace for terminal tests.\n")
  writeFileSync(join(workdir, "notes.md"), "notes\n")
  const env: Record<string, string> = {
    PATH: process.env["PATH"] ?? "",
    HOME: home,
    AURICT_STATE_DIR: state,
    AURICT_HOME: state,
    AURICT_REMOTE_STATE_DIR: join(base, "remote"),
    AURICT_SNAPSHOT_DIR: join(base, "snapshots"),
    XDG_CONFIG_HOME: join(base, "config"),
    OLLAMA_HOST: `http://127.0.0.1:${provider.port}`,
    OLLAMA_BASE_URL: `http://127.0.0.1:${provider.port}/v1`,
    OLLAMA_DEFAULT_MODEL: "llama3.2",
    TERM: "xterm-256color",
    COLORTERM: "truecolor",
    LANG: "en_US.UTF-8",
  }
  return { env, workdir }
}

async function replay(raw: Buffer, cols: number, rows: number, resizes: Array<{ at: number; cols: number; rows: number }>, upto = raw.length): Promise<string[]> {
  const terminal = new xterm.Terminal({ cols, rows, scrollback: 20_000, allowProposedApi: true })
  const write = (bytes: Uint8Array) => new Promise<void>((resolve) => terminal.write(bytes, resolve))
  let cursor = 0
  for (const resize of resizes) {
    if (resize.at > upto) break
    await write(raw.subarray(cursor, resize.at))
    cursor = resize.at
    terminal.resize(resize.cols, resize.rows)
  }
  await write(raw.subarray(cursor, upto))
  const buffer = terminal.buffer.active
  const lines: string[] = []
  for (let index = 0; index < buffer.length; index++) lines.push(buffer.getLine(index)?.translateToString(true) ?? "")
  terminal.dispose()
  return lines
}

async function run(scenario: Scenario): Promise<RunResult> {
  const base = mkdtempSync(join(tmpdir(), `aurict-pty-${scenario.name}-`))
  const { env, workdir } = seed(base)
  const chunks: Buffer[] = []
  let size = 0
  const resizes: Array<{ at: number; cols: number; rows: number }> = []
  const marks: Array<{ name: string; at: number }> = []
  const failures: string[] = []
  const command = binary
    ? [binary, ...(scenario.args ?? [])]
    : [process.execPath, "run", join(ROOT, "packages/cli/src/index.ts"), ...(scenario.args ?? [])]
  const proc = Bun.spawn([...command, "-p", "ollama", "-m", "llama3.2"], {
    cwd: workdir,
    env: { ...env, ...scenario.env },
    terminal: {
      cols: scenario.cols,
      rows: scenario.rows,
      data(_terminal: unknown, data: Uint8Array) {
        chunks.push(Buffer.from(data))
        size += data.length
      },
    },
  } as Parameters<typeof Bun.spawn>[1])
  const terminal = (proc as unknown as { terminal: { write(data: string): void; resize(cols: number, rows: number): void } }).terminal
  const output = () => Buffer.concat(chunks).toString("utf8")

  for (const step of [...scenario.steps, ...EXIT]) {
    if ("wait" in step) await sleep(step.wait)
    else if ("send" in step) {
      terminal.write(step.send)
      await sleep(60)
    } else if ("resize" in step) {
      resizes.push({ at: size, cols: step.resize[0], rows: step.resize[1] })
      terminal.resize(step.resize[0], step.resize[1])
      await sleep(60)
    } else if ("mark" in step) marks.push({ name: step.mark, at: size })
    else if ("check" in step) {
      const failure = step.check({ workdir })
      if (failure) failures.push(failure)
    } else {
      const deadline = Date.now() + (step.timeout ?? 20_000)
      while (!output().includes(step.until) && Date.now() < deadline) await sleep(50)
      if (!output().includes(step.until)) failures.push(`timed out waiting for ${JSON.stringify(step.until)}`)
    }
  }
  const exited = await Promise.race([proc.exited, sleep(10_000).then(() => null)])
  if (exited === null) {
    proc.kill()
    failures.push("process did not exit after Ctrl+C Ctrl+C")
  }
  await sleep(100)
  const raw = Buffer.concat(chunks)
  const screens = new Map<string, string[]>()
  for (const mark of marks) screens.set(mark.name, await replay(raw, scenario.cols, scenario.rows, resizes, mark.at))
  const result: RunResult = {
    raw: raw.toString("utf8"),
    lines: await replay(raw, scenario.cols, scenario.rows, resizes),
    screens,
    exitCode: typeof exited === "number" ? exited : null,
    workdir,
    failures,
  }
  if (!keep) rmSync(base, { recursive: true, force: true })
  else {
    writeFileSync(join(base, "output.raw"), raw)
    writeFileSync(join(base, "resizes.json"), JSON.stringify(resizes))
    console.log(`  kept ${base} (output.raw, resizes.json)`)
  }
  return result
}

// ── Invariants ───────────────────────────────────────────────────────────────

const ALT_ENTER = "\x1b[?1049h"
const ALT_EXIT = "\x1b[?1049l"
const MOUSE_ON = "\x1b[?1000h"
const CLEAR_ALL = "\x1b[2J\x1b[3J\x1b[H"
const SYNC = "\x1b[?2026h"

function inlineBasics(result: RunResult, options: { resets?: [number, number]; altScreens?: number } = {}): string[] {
  const failures: string[] = []
  const [minResets, maxResets] = options.resets ?? [0, 0]
  const resets = count(result.raw, CLEAR_ALL)
  if (resets < minResets || resets > maxResets) failures.push(`expected ${minResets}-${maxResets} full reprints, saw ${resets}`)
  if (count(result.raw, ALT_ENTER) !== (options.altScreens ?? 0)) failures.push(`expected ${options.altScreens ?? 0} alternate-screen entries, saw ${count(result.raw, ALT_ENTER)}`)
  if (count(result.raw, ALT_EXIT) !== (options.altScreens ?? 0)) failures.push(`alternate-screen exits do not match entries (${count(result.raw, ALT_EXIT)})`)
  if (result.raw.includes(MOUSE_ON)) failures.push("inline mode enabled mouse tracking")
  if (result.exitCode !== 0) failures.push(`exit code ${result.exitCode}`)
  if (!result.lines.some((line) => line.startsWith("Token usage:"))) failures.push("exit summary missing")
  return failures
}

function exactlyOnce(result: RunResult, needles: string[]): string[] {
  const text = result.lines.join("\n")
  return needles.flatMap((needle) => {
    const seen = count(text, needle)
    return seen === 1 ? [] : [`expected ${JSON.stringify(needle)} once in scrollback, saw ${seen}`]
  })
}

function screenContains(result: RunResult, mark: string, needle: string): string[] {
  return result.screens.get(mark)?.some((line) => line.includes(needle)) ? [] : [`screen "${mark}" lacks ${JSON.stringify(needle)}`]
}

const scenarios: Scenario[] = [
  {
    name: "inline-tools-80x24",
    cols: 80, rows: 24,
    steps: [...START, { send: "use tools please" }, { send: ENTER }, { until: "That covers the overview", timeout: 30_000 }, { wait: 800 }],
    expect: (result) => [
      ...inlineBasics(result),
      ...exactlyOnce(result, ["use tools please", "Inspecting first.", "Reading the README.", "Summary for the tool run", "That covers the overview", "Worked for"]),
    ],
  },
  {
    name: "inline-tiny-60x18",
    cols: 60, rows: 18,
    steps: [...START, { send: "short question" }, { send: ENTER }, { until: "Short answer: yes.", timeout: 20_000 }, { wait: 600 }],
    expect: (result) => [...inlineBasics(result), ...exactlyOnce(result, ["short question", "Short answer: yes."])],
  },
  {
    name: "inline-wide-140x40",
    cols: 140, rows: 40,
    steps: [...START, { send: "explain the wide layout" }, { send: ENTER }, { until: "That covers the overview", timeout: 30_000 }, { wait: 600 }],
    expect: (result) => [...inlineBasics(result), ...exactlyOnce(result, ["Summary for explain the wide layo", "Detail line 24 about", "That covers the overview"])],
  },
  {
    name: "inline-resize",
    cols: 80, rows: 24,
    steps: [
      ...START, { send: "slow explain resizing" }, { send: ENTER }, { wait: 1500 },
      { resize: [100, 30] }, { wait: 700 }, { resize: [60, 20] },
      { until: "That covers the overview", timeout: 40_000 }, { wait: 800 },
    ],
    expect: (result) => [
      ...inlineBasics(result, { resets: [1, 2] }),
      ...exactlyOnce(result, ["Summary for slow explain resizing", "Detail line 1 about", "Detail line 24 about", "That covers the overview"]),
    ],
  },
  {
    name: "inline-status-and-interrupt",
    cols: 80, rows: 24,
    steps: [...START, { send: "slow long explanation" }, { send: ENTER }, { wait: 2500 }, { mark: "running" }, { send: ESC }, { wait: 1200 }],
    expect: (result) => [
      ...inlineBasics(result),
      ...screenContains(result, "running", "esc to interrupt)"),
      ...exactlyOnce(result, ["Turn cancelled"]),
    ],
  },
  {
    name: "inline-pager",
    cols: 80, rows: 24,
    steps: [
      ...START, { send: "explain the pager" }, { send: ENTER }, { until: "That covers the overview", timeout: 30_000 }, { wait: 600 },
      { send: "\x14" }, { wait: 700 }, { mark: "pager" }, { send: ESC }, { wait: 700 }, { mark: "closed" },
    ],
    expect: (result) => [
      ...inlineBasics(result, { altScreens: 1 }),
      ...screenContains(result, "pager", "Transcript"),
      ...screenContains(result, "closed", "That covers the overview"),
      ...exactlyOnce(result, ["Summary for explain the pager"]),
    ],
  },
  {
    name: "inline-rewind-restores-files",
    cols: 80, rows: 24,
    steps: [
      ...START, { send: "/approvals full" }, { send: ENTER }, { wait: 400 },
      { send: "please writefile" }, { send: ENTER }, { until: "Done writing the file.", timeout: 20_000 }, { wait: 700 },
      { check: ({ workdir }) => existsSync(join(workdir, "created.txt")) ? null : "agent write did not create the file" },
      { send: "/rewind" }, { send: ENTER }, { wait: 700 }, { send: ENTER }, { wait: 700 }, { mark: "confirm" }, { send: ENTER }, { wait: 1000 },
      { check: ({ workdir }) => existsSync(join(workdir, "created.txt")) ? "rewind left the created file in place" : null },
      { check: ({ workdir }) => existsSync(join(workdir, "README.md")) ? null : "rewind removed a file the agent never touched" },
    ],
    expect: (result) => [
      ...inlineBasics(result, { resets: [1, 1], altScreens: 2 }),
      ...screenContains(result, "confirm", "Rewind conversation and files"),
      ...exactlyOnce(result, ["1 file restored"]),
    ],
  },
  {
    name: "fullscreen-80x24",
    cols: 80, rows: 24,
    args: ["--fullscreen"],
    steps: [...START, { send: "short fullscreen" }, { send: ENTER }, { until: "Short answer: yes.", timeout: 20_000 }, { wait: 600 }],
    expect: (result) => {
      const failures: string[] = []
      if (count(result.raw, ALT_ENTER) < 1) failures.push("fullscreen never entered the alternate screen")
      if (count(result.raw, ALT_EXIT) < 1) failures.push("fullscreen never left the alternate screen")
      if (!result.raw.includes(MOUSE_ON)) failures.push("fullscreen did not enable mouse scrolling")
      if (!result.lines.some((line) => line.includes("recent transcript"))) failures.push("exit transcript missing")
      if (result.exitCode !== 0) failures.push(`exit code ${result.exitCode}`)
      return failures
    },
  },
  {
    name: "no-color",
    cols: 80, rows: 24,
    env: { NO_COLOR: "1" },
    steps: [...START, { send: "short no color" }, { send: ENTER }, { until: "Short answer: yes.", timeout: 20_000 }, { wait: 600 }],
    expect: (result) => [
      ...inlineBasics(result),
      ...(/\x1b\[(?:3|4|9|10)[0-9](?:;[0-9]+)*m/.test(result.raw) ? ["NO_COLOR output still contains colour escapes"] : []),
    ],
  },
  {
    name: "ascii-glyphs",
    cols: 80, rows: 24,
    env: { AURICT_ASCII: "1" },
    steps: [...START, { send: "short ascii" }, { send: ENTER }, { until: "Short answer: yes.", timeout: 20_000 }, { wait: 600 }],
    expect: (result) => {
      const conversation = result.lines.slice(result.lines.findIndex((line) => line.includes("short ascii")))
      const offenders = conversation.filter((line) => /[◆◇▸›●○◌∴│─✗…]/u.test(line))
      return [...inlineBasics(result), ...(offenders.length > 0 ? [`non-ASCII glyphs under AURICT_ASCII: ${JSON.stringify(offenders.slice(0, 3))}`] : [])]
    },
  },
  {
    name: "term-dumb",
    cols: 80, rows: 24,
    env: { TERM: "dumb", COLORTERM: "" },
    steps: [...START, { send: "short dumb" }, { send: ENTER }, { until: "Short answer: yes.", timeout: 20_000 }, { wait: 600 }],
    expect: (result) => [
      ...inlineBasics(result),
      ...(result.raw.includes(SYNC) ? ["TERM=dumb still received synchronized-update markers"] : []),
    ],
  },
]

// ── Runner ───────────────────────────────────────────────────────────────────

let failed = 0
for (const scenario of scenarios.filter((candidate) => !only || candidate.name === only)) {
  const started = Date.now()
  const result = await run(scenario)
  const failures = [...result.failures, ...scenario.expect(result)]
  const seconds = ((Date.now() - started) / 1000).toFixed(1)
  if (failures.length === 0) {
    console.log(`✓ ${scenario.name} (${seconds}s)`)
  } else {
    failed++
    console.log(`✗ ${scenario.name} (${seconds}s)`)
    for (const failure of failures) console.log(`    ${failure}`)
  }
}
provider.stop(true)
console.log(failed === 0 ? "\nPTY matrix passed." : `\n${failed} PTY scenario(s) failed.`)
process.exit(failed === 0 ? 0 : 1)
