import { fingerprintWorkspaceRevision } from "../transaction/workspace-revision.js"
import { recordVerificationRevision } from "../agent/working-set.js"
import { filterTscForFile, runIncrementalTsc } from "./tsc.js"

export interface PostEditVerificationJob {
  id: string
  filePath: string
  status: "pending" | "passed" | "failed"
  output?: string
  workspaceRevision?: string
  startedAt: number
  finishedAt?: number
}

const jobs = new Map<string, PostEditVerificationJob[]>()

export function schedulePostEditTsc(options: {
  sessionId: string
  workdir: string
  filePath: string
}): PostEditVerificationJob {
  const job: PostEditVerificationJob = {
    id: crypto.randomUUID(),
    filePath: options.filePath,
    status: "pending",
    startedAt: Date.now(),
  }
  const sessionJobs = jobs.get(options.sessionId) ?? []
  sessionJobs.push(job)
  jobs.set(options.sessionId, sessionJobs.slice(-8))

  void runJob(job, options).catch((error) => {
    finish(job, "failed", error instanceof Error ? error.message : String(error))
  })
  return { ...job }
}

export function getPostEditVerificationJobs(sessionId: string): PostEditVerificationJob[] {
  return (jobs.get(sessionId) ?? []).map(job => ({ ...job }))
}

export function clearPostEditVerificationJobs(sessionId?: string): void {
  if (sessionId) jobs.delete(sessionId)
  else jobs.clear()
}

async function runJob(
  job: PostEditVerificationJob,
  options: { sessionId: string; workdir: string; filePath: string },
): Promise<void> {
  const output = await runIncrementalTsc(options.workdir, [options.filePath])
  const relevant = filterTscForFile(output, options.filePath)
  const revision = await fingerprintWorkspaceRevision(options.workdir, [options.filePath])
  job.workspaceRevision = revision.hash
  const status = relevant && relevant !== "✓" ? "failed" : "passed"
  finish(job, status, status === "failed" ? relevant : relevant || "No errors for changed file")
  recordVerificationRevision(
    options.sessionId,
    "post_edit_tsc",
    status,
    revision.hash,
    `tsc:${status} ${options.filePath}${job.output ? ` — ${job.output}` : ""}`,
  )
}

function finish(job: PostEditVerificationJob, status: "passed" | "failed", output: string): void {
  job.status = status
  job.output = output.slice(0, 4_000)
  job.finishedAt = Date.now()
}
