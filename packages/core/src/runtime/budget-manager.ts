import type { RunBudgetLimits, RunBudgetSnapshot, ToolOutcome } from "./contracts.js"

export class BudgetExceededError extends Error {
  readonly code = "AGENT_BUDGET_EXCEEDED"

  constructor(readonly dimension: keyof RunBudgetLimits, readonly limit: number, readonly actual: number) {
    super(`Agent run budget exceeded for ${dimension}: ${actual} > ${limit}`)
    this.name = "BudgetExceededError"
  }
}

export class RunBudgetManager {
  private readonly startedAt = Date.now()
  private modelTurns = 0
  private toolCalls = 0
  private mutationCalls = 0
  private verificationRuns = 0
  private inputTokens = 0
  private outputTokens = 0
  private costUsd = 0

  constructor(readonly limits: RunBudgetLimits = {}) {}

  recordModelTurn(): void {
    this.modelTurns++
    this.assert("modelTurns", this.modelTurns)
    this.assertWallTime()
  }

  recordToolCall(): void {
    this.toolCalls++
    this.assert("toolCalls", this.toolCalls)
    this.assertWallTime()
  }

  recordToolOutcome(outcome: ToolOutcome): void {
    if (outcome.effects.some(effect => effect.kind === "workspace_write" || effect.kind === "external_write")) {
      this.mutationCalls++
      this.assert("mutationCalls", this.mutationCalls)
    }
    if (outcome.verification.some(check => check.status !== "skipped")) {
      this.verificationRuns++
      this.assert("verificationRuns", this.verificationRuns)
    }
    this.assertWallTime()
  }

  recordUsage(inputTokens: number, outputTokens: number, costUsd = 0): void {
    this.inputTokens += inputTokens
    this.outputTokens += outputTokens
    this.costUsd += costUsd
    this.assert("inputTokens", this.inputTokens)
    this.assert("outputTokens", this.outputTokens)
    this.assert("costUsd", this.costUsd)
    this.assertWallTime()
  }

  snapshot(): RunBudgetSnapshot {
    return {
      limits: { ...this.limits },
      usage: {
        wallTimeMs: Date.now() - this.startedAt,
        modelTurns: this.modelTurns,
        toolCalls: this.toolCalls,
        mutationCalls: this.mutationCalls,
        verificationRuns: this.verificationRuns,
        inputTokens: this.inputTokens,
        outputTokens: this.outputTokens,
        costUsd: this.costUsd,
      },
    }
  }

  assertWallTime(): void {
    this.assert("wallTimeMs", Date.now() - this.startedAt)
  }

  private assert(dimension: keyof RunBudgetLimits, actual: number): void {
    const limit = this.limits[dimension]
    if (limit !== undefined && actual > limit) throw new BudgetExceededError(dimension, limit, actual)
  }
}
