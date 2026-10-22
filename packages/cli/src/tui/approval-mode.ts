import type { PermissionRequest } from "@aurict/core";

/**
 * How tool requests are approved in the interactive session.
 *
 * - `ask`  every request waits for an explicit decision.
 * - `auto` Project Auto: bounded typed file changes inside the project are
 *          approved; shell and sensitive operations still ask.
 * - `full` everything except operations the gate rates as dangerous runs
 *          without asking. Dangerous requests always ask.
 */
export type ApprovalMode = "ask" | "auto" | "full";

/** The Codex permission presets, in Codex's order, mapped onto Aurict's modes. */
export const APPROVAL_MODES: ReadonlyArray<{ id: ApprovalMode; label: string; description: string }> = [
  { id: "auto", label: "Ask for approval", description: "Read and edit workspace files, with approval required for commands, internet access, or edits outside the workspace" },
  { id: "full", label: "Full Access", description: "Use with caution: Aurict can edit files outside this workspace and access the internet without approval" },
  { id: "ask", label: "Read Only", description: "Read workspace files, with approval required for edits or internet access" },
];

export function parseApprovalMode(value: string | undefined): ApprovalMode | undefined {
  const normalized = value?.trim().toLowerCase();
  if (normalized === "ask" || normalized === "manual" || normalized === "read-only") return "ask";
  if (normalized === "auto" || normalized === "project" || normalized === "project-auto") return "auto";
  if (normalized === "full" || normalized === "full-access") return "full";
  return undefined;
}

export function approvalModeFrom(projectAuto: boolean, fullAccess: boolean): ApprovalMode {
  return fullAccess ? "full" : projectAuto ? "auto" : "ask";
}

export function approvalModeLabel(mode: ApprovalMode): string {
  return mode === "full" ? "full access" : mode === "auto" ? "auto" : "ask";
}

/** Full access never waives an explicit danger rating. */
export function fullAccessApproves(request: Pick<PermissionRequest, "level">): boolean {
  return request.level !== "danger";
}
