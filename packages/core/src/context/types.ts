import type { Task } from "../task/types.js"

export interface ContextConstraint {
  id: string
  content: string
  source: "user" | "project" | "task"
}

export interface ContextDecision {
  id: string
  content: string
  source: string
  recordedAt: number
}

export interface WorkspaceFact {
  id: string
  content: string
  source: string
  confidence: "observed" | "reported"
}

export interface ContextFileRef {
  path: string
  reason: string
  status?: "active" | "changed" | "verified" | "failed"
}

export interface FailedStrategy {
  fingerprint: string
  summary: string
  attempts: number
}

export interface TaskContext {
  version: 1
  objective: string
  constraints: ContextConstraint[]
  decisions: ContextDecision[]
  workspaceFacts: WorkspaceFact[]
  relevantFiles: ContextFileRef[]
  failedStrategies: FailedStrategy[]
  openQuestions: string[]
  tasks: Task[]
  evidenceRefs: string[]
  requestedCapabilities?: string[]
  updatedAt: number
}
