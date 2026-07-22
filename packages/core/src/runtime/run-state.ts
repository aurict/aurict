import type { RunPhase, RunStateSnapshot, RunTransitionReason } from "./contracts.js"

const TERMINAL = new Set<RunPhase>(["blocked", "completed", "failed", "cancelled"])

const ALLOWED: Record<RunPhase, ReadonlySet<RunPhase>> = {
  created: new Set(["preparing", "failed", "cancelled"]),
  preparing: new Set(["planning", "executing", "verifying", "blocked", "completed", "failed", "cancelled"]),
  planning: new Set(["executing", "verifying", "blocked", "completed", "failed", "cancelled"]),
  executing: new Set(["verifying", "recovering", "blocked", "completed", "failed", "cancelled"]),
  verifying: new Set(["recovering", "blocked", "completed", "failed", "cancelled"]),
  recovering: new Set(["executing", "verifying", "blocked", "completed", "failed", "cancelled"]),
  blocked: new Set(),
  completed: new Set(),
  failed: new Set(),
  cancelled: new Set(),
}

export class RunStateMachine {
  private phase: RunPhase = "created"
  private revision = 0
  private readonly startedAt: number
  private updatedAt: number
  private readonly transitions: RunStateSnapshot["transitions"] = []

  constructor(
    private readonly runId: string,
    private readonly now: () => number = Date.now,
  ) {
    this.startedAt = this.now()
    this.updatedAt = this.startedAt
  }

  get current(): RunPhase { return this.phase }
  get terminal(): boolean { return TERMINAL.has(this.phase) }

  transition(to: RunPhase, reason: RunTransitionReason): RunStateSnapshot {
    if (to === this.phase) return this.snapshot()
    if (!ALLOWED[this.phase].has(to)) {
      throw new Error(`Invalid run-state transition: ${this.phase} -> ${to} (${reason})`)
    }
    const at = this.now()
    this.transitions.push({ from: this.phase, to, reason, at })
    this.phase = to
    this.revision++
    this.updatedAt = at
    return this.snapshot()
  }

  snapshot(): RunStateSnapshot {
    return {
      runId: this.runId,
      phase: this.phase,
      revision: this.revision,
      startedAt: this.startedAt,
      updatedAt: this.updatedAt,
      transitions: this.transitions.map(transition => ({ ...transition })),
    }
  }
}
