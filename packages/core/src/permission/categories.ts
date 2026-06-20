import type { ToolCategory } from "../tool/types.js"

/** Her built-in tool'un hangi kategoriye ait olduğunu eşler */
export const TOOL_CATEGORIES: Record<string, ToolCategory> = {
  // read
  read:         "read",
  glob:         "read",
  grep:         "read",
  lsp:          "read",

  // write
  write:        "write",
  edit:         "write",
  apply_patch:  "write",
  notebook:     "write",

  // execute (shell)
  bash:         "execute",
  git:          "execute",
  svn:          "execute",
  perforce:     "execute",

  // network
  websearch:    "network",
  webfetch:     "network",

  // system / agent
  subagent:     "system",
  task_create:  "system",
  task_update:  "system",
  task_complete:"system",
  coordinate:   "system",
  plan_enter:   "system",
  plan_verify:  "system",
  worktree:     "system",
  memory:       "system",
  todo:         "system",
  question:     "system",
  send_message: "system",
}

/** Tool adından kategorisini döner; bilinmiyorsa "system" */
export function getToolCategory(toolName: string): ToolCategory {
  return TOOL_CATEGORIES[toolName] ?? "system"
}
