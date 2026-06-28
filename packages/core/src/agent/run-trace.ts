import { appendFile, mkdir, readFile } from "node:fs/promises"
import { join } from "node:path"

export interface RunTraceEvent {
  ts: number
  sessionId: string
  type: string
  data: Record<string, unknown>
}

export async function recordRunTrace(
  workdir: string,
  sessionId: string,
  type: string,
  data: Record<string, unknown>,
): Promise<void> {
  if (!sessionId || process.env["AURICT_DISABLE_RUN_TRACE"] === "1") return
  const dir = traceDir(workdir)
  await mkdir(dir, { recursive: true })
  const event: RunTraceEvent = {
    ts: Date.now(),
    sessionId,
    type,
    data: sanitizeData(data),
  }
  await appendFile(tracePath(workdir, sessionId), JSON.stringify(event) + "\n", "utf8")
}

export async function readLatestTraceEvents(
  workdir: string,
  sessionId: string,
  limit = 40,
): Promise<RunTraceEvent[]> {
  try {
    const raw = await readFile(tracePath(workdir, sessionId), "utf8")
    return raw
      .trim()
      .split(/\r?\n/)
      .filter(Boolean)
      .slice(-limit)
      .map(line => JSON.parse(line) as RunTraceEvent)
  } catch {
    return []
  }
}

function sanitizeData(data: Record<string, unknown>): Record<string, unknown> {
  const serialized = JSON.stringify(data, (_key, value) => {
    if (typeof value === "string") return value.length > 2_000 ? `${value.slice(0, 2_000)}…[truncated]` : value
    return value
  })
  return JSON.parse(serialized) as Record<string, unknown>
}

function traceDir(workdir: string): string {
  return join(workdir, ".aurict", "traces")
}

function tracePath(workdir: string, sessionId: string): string {
  return join(traceDir(workdir), `${safeSessionId(sessionId)}.jsonl`)
}

function safeSessionId(sessionId: string): string {
  return sessionId.replace(/[^a-zA-Z0-9_.:-]/g, "_")
}
