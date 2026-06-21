#!/usr/bin/env bun
import { cpSync, existsSync, mkdirSync, readFileSync, rmSync, writeFileSync } from "node:fs"
import { dirname, join, resolve, relative } from "node:path"
import { tmpdir } from "node:os"

type Assertion =
  | { type: "file_contains"; path: string; text: string }
  | { type: "file_not_contains"; path: string; text: string }
  | { type: "command"; cmd: string; timeoutMs?: number }

interface EvalTask {
  id: string
  title: string
  prompt: string
  fixture: string
  referenceSolution?: Record<string, string>
  assertions: Assertion[]
}

interface Result {
  id: string
  title: string
  ok: boolean
  durationMs: number
  mode: "reference" | "candidate"
  details: string[]
}

const ROOT = resolve(import.meta.dir, "..")
const TASK_DIR = join(ROOT, "evals", "tasks")
const argv = process.argv.slice(2)
const listOnly = argv.includes("--list")
const smoke = argv.includes("--smoke")
const jsonOutput = argv.includes("--json")
const taskFilter = argv.find((arg) => arg.startsWith("--task="))?.slice("--task=".length)

function loadTasks(): EvalTask[] {
  if (!existsSync(TASK_DIR)) return []
  const files = Array.from(new Bun.Glob("*.json").scanSync({ cwd: TASK_DIR })).sort()
  return files
    .map((file) => JSON.parse(readFileSync(join(TASK_DIR, file), "utf8")) as EvalTask)
    .filter((task) => !taskFilter || task.id === taskFilter)
}

function shellSplit(cmd: string): string[] {
  const parts = cmd.match(/(?:[^\s"']+|"[^"]*"|'[^']*')+/g) ?? []
  return parts.map((part) => part.replace(/^['"]|['"]$/g, ""))
}

function expandCommand(template: string, task: EvalTask, workdir: string): string {
  return template
    .replaceAll("{workdir}", workdir)
    .replaceAll("{prompt}", task.prompt)
    .replaceAll("{prompt_json}", JSON.stringify(task.prompt))
    .replaceAll("{task}", task.id)
}

async function runCommand(cmd: string, cwd: string, timeoutMs = 30_000): Promise<{ ok: boolean; output: string }> {
  const args = shellSplit(cmd)
  if (args.length === 0) return { ok: false, output: "empty command" }

  const proc = Bun.spawn(args, {
    cwd,
    stdout: "pipe",
    stderr: "pipe",
  })

  const timeout = setTimeout(() => proc.kill(), timeoutMs)
  const [stdout, stderr, exitCode] = await Promise.all([
    new Response(proc.stdout).text(),
    new Response(proc.stderr).text(),
    proc.exited,
  ])
  clearTimeout(timeout)

  const output = [stdout, stderr].filter(Boolean).join("\n").trim()
  return { ok: exitCode === 0, output }
}

function applyReference(task: EvalTask, workdir: string): string[] {
  const details: string[] = []
  for (const [relPath, content] of Object.entries(task.referenceSolution ?? {})) {
    const absPath = join(workdir, relPath)
    mkdirSync(dirname(absPath), { recursive: true })
    writeFileSync(absPath, content, "utf8")
    details.push(`reference wrote ${relPath}`)
  }
  return details
}

async function assertTask(task: EvalTask, workdir: string): Promise<string[]> {
  const details: string[] = []
  for (const assertion of task.assertions) {
    if (assertion.type === "file_contains" || assertion.type === "file_not_contains") {
      const absPath = join(workdir, assertion.path)
      if (!existsSync(absPath)) throw new Error(`${assertion.type}: missing file ${assertion.path}`)
      const content = readFileSync(absPath, "utf8")
      const hasText = content.includes(assertion.text)
      if (assertion.type === "file_contains" && !hasText) {
        throw new Error(`file_contains failed: ${assertion.path} missing ${JSON.stringify(assertion.text)}`)
      }
      if (assertion.type === "file_not_contains" && hasText) {
        throw new Error(`file_not_contains failed: ${assertion.path} contains ${JSON.stringify(assertion.text)}`)
      }
      details.push(`${assertion.type} ${assertion.path}`)
      continue
    }

    const result = await runCommand(assertion.cmd, workdir, assertion.timeoutMs)
    if (!result.ok) {
      throw new Error(`command failed: ${assertion.cmd}\n${result.output}`)
    }
    details.push(`command ok: ${assertion.cmd}`)
  }
  return details
}

async function runTask(task: EvalTask): Promise<Result> {
  const start = Date.now()
  const tmpRoot = join(tmpdir(), `aurict-eval-${task.id}-${Date.now()}`)
  const fixture = resolve(ROOT, task.fixture)
  const candidateCommand = process.env["AURICT_EVAL_COMMAND"]
  const mode: Result["mode"] = candidateCommand ? "candidate" : "reference"
  const details: string[] = []

  try {
    if (!existsSync(fixture)) throw new Error(`fixture not found: ${task.fixture}`)
    cpSync(fixture, tmpRoot, { recursive: true })
    writeFileSync(join(tmpRoot, "AURICT_EVAL_PROMPT.txt"), task.prompt, "utf8")

    if (candidateCommand) {
      const cmd = expandCommand(candidateCommand, task, tmpRoot)
      const result = await runCommand(cmd, tmpRoot, 120_000)
      details.push(`candidate: ${cmd}`)
      if (!result.ok) throw new Error(`candidate command failed\n${result.output}`)
    } else {
      details.push(...applyReference(task, tmpRoot))
    }

    details.push(...await assertTask(task, tmpRoot))

    return {
      id: task.id,
      title: task.title,
      ok: true,
      durationMs: Date.now() - start,
      mode,
      details,
    }
  } catch (err) {
    return {
      id: task.id,
      title: task.title,
      ok: false,
      durationMs: Date.now() - start,
      mode,
      details: [...details, err instanceof Error ? err.message : String(err)],
    }
  } finally {
    if (!process.env["AURICT_EVAL_KEEP_TMP"]) {
      rmSync(tmpRoot, { recursive: true, force: true })
    } else {
      console.error(`[eval] kept ${relative(ROOT, tmpRoot)}`)
    }
  }
}

const tasks = loadTasks()

if (listOnly) {
  for (const task of tasks) {
    console.log(`${task.id}\t${task.title}`)
  }
  process.exit(0)
}

if (tasks.length === 0) {
  console.error(taskFilter ? `No eval task found for ${taskFilter}` : "No eval tasks found.")
  process.exit(1)
}

const selected = smoke ? tasks.slice(0, 1) : tasks
const results = await Promise.all(selected.map(runTask))

for (const result of results) {
  if (jsonOutput) continue
  const mark = result.ok ? "PASS" : "FAIL"
  console.log(`${mark} ${result.id} (${result.mode}, ${result.durationMs}ms) — ${result.title}`)
  for (const detail of result.details) {
    console.log(`  ${detail}`)
  }
}

const failed = results.filter((result) => !result.ok)
if (jsonOutput) {
  console.log(JSON.stringify({
    ok: failed.length === 0,
    passed: results.length - failed.length,
    total: results.length,
    failed: failed.map((result) => result.id),
    results,
  }, null, 2))
} else {
  console.log("")
  console.log(`${results.length - failed.length}/${results.length} eval task(s) passed`)
}

process.exit(failed.length > 0 ? 1 : 0)
