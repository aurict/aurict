import type { Task } from "@aurict/core";
import type { TaskSummary } from "./app-screen-types.js";

export function summarizeTasks(tasks: readonly Task[]): TaskSummary {
  return {
    pending: tasks.filter((t) => t.status === "pending" || t.status === "ready" || t.status === "blocked").length,
    inProgress: tasks.filter((t) => t.status === "in_progress" || t.status === "verifying").length,
    done: tasks.filter((t) => t.status === "done" || t.status === "cancelled").length,
    error: tasks.filter((t) => t.status === "error").length,
  };
}
