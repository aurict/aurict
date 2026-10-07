type AgentPreparationPhase =
  | "preparing_context"
  | "resolving_model"
  | "compacting"
  | "waiting_for_provider";

export type RunActivity =
  | AgentPreparationPhase
  | "thinking"
  | "responding"
  | "using_tool";

const ACTIVITY_LABELS: Record<RunActivity, string> = {
  preparing_context: "assembling context",
  resolving_model: "resolving model",
  compacting: "compacting context",
  waiting_for_provider: "waiting for provider",
  thinking: "thinking",
  responding: "responding",
  using_tool: "running tool",
};

export function activityLabel(activity: RunActivity | undefined): string {
  return activity ? (ACTIVITY_LABELS[activity] ?? "working") : "working";
}

export function formatElapsed(ms: number): string {
  const seconds = Math.max(0, Math.floor(ms / 1000));
  if (seconds < 60) return `${seconds}s`;
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ${String(seconds % 60).padStart(2, "0")}s`;
  return `${Math.floor(minutes / 60)}h ${String(minutes % 60).padStart(2, "0")}m`;
}

export function formatTokenCount(tokens: number): string {
  if (tokens < 1000) return String(tokens);
  if (tokens < 1_000_000) return `${(tokens / 1000).toFixed(tokens < 10_000 ? 1 : 0)}k`;
  return `${(tokens / 1_000_000).toFixed(1)}M`;
}
