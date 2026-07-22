import type { TaskContext } from "./types.js"

export function formatTaskContext(context: TaskContext, maxChars = 4_000): string {
  const openTasks = context.tasks.filter(task => !["done", "cancelled"].includes(task.status))
  const lines = [
    "[Structured Task Context]",
    `Objective: ${context.objective || "(unknown)"}`,
    context.constraints.length
      ? `Constraints: ${context.constraints.map(item => item.content).join("; ")}`
      : "",
    openTasks.length
      ? `Open tasks: ${openTasks.map(task => `${task.id}:${task.subject} [${task.status}]`).join("; ")}`
      : "Open tasks: (none)",
    context.relevantFiles.length
      ? `Relevant files: ${context.relevantFiles.map(file => `${file.path} (${file.status ?? "active"})`).join(", ")}`
      : "",
    context.failedStrategies.length
      ? `Failed strategies: ${context.failedStrategies.map(item => `${item.summary} (${item.attempts}x)`).join("; ")}`
      : "",
    context.evidenceRefs.length ? `Evidence: ${context.evidenceRefs.join(", ")}` : "",
    "Treat this structured state as authoritative over older transcript summaries.",
  ].filter(Boolean)
  const text = lines.join("\n")
  return text.length <= maxChars ? text : `${text.slice(0, maxChars - 14)}…[truncated]`
}
