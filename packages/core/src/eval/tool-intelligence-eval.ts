import { selectTools } from "../tool/capability-router.js"

export interface ToolIntelligenceEvalResult {
  passed: number
  total: number
  cases: Array<{ id: string; ok: boolean; selected: string[] }>
}

const CATALOG = [
  "read", "read_image", "read_tool_output", "grep", "glob", "request_tools",
  "edit", "apply_patch", "ast_edit", "bash", "eval", "verify", "lsp",
  "dep_docs", "semantic_search", "git_context", "browser", "memory", "critique",
]

export function runToolIntelligenceEval(): ToolIntelligenceEvalResult {
  const fixtures: Array<{ id: string; text: string; expected: string }> = [
    { id: "visual_repo_asset", text: "inspect the repository UI screenshot", expected: "read_image" },
    { id: "installed_dependency_api", text: "fix this code using the installed package API", expected: "dep_docs" },
    { id: "conceptual_code_discovery", text: "find where authentication credentials are refreshed", expected: "semantic_search" },
    { id: "web_ui_verification", text: "verify the web UI by clicking the form and running tests", expected: "browser" },
    { id: "structural_refactor", text: "refactor API calls across files and verify the build", expected: "ast_edit" },
    { id: "runtime_hypothesis", text: "run a small command to test this regex", expected: "eval" },
  ]
  const cases = fixtures.map(fixture => {
    const selected = selectTools({ text: fixture.text, availableToolIds: CATALOG, maxVisible: 16 }).selectedToolIds
    return { id: fixture.id, ok: selected.includes(fixture.expected), selected }
  })
  return { passed: cases.filter(item => item.ok).length, total: cases.length, cases }
}
