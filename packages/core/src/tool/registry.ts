import type { ToolDef }        from "./types.js"
import { readTool }            from "./built-in/read.js"
import { writeTool }           from "./built-in/write.js"
import { editTool }            from "./built-in/edit.js"
import { globTool }            from "./built-in/glob.js"
import { grepTool }            from "./built-in/grep.js"
import { webfetchTool }        from "./built-in/webfetch.js"
import { todoTool }            from "./built-in/todo.js"
import { lspTool }                   from "./built-in/lsp.js"
import { applyPatchTool }            from "./built-in/apply-patch.js"
import { questionTool }              from "./built-in/question.js"
import { websearchTool }             from "./built-in/websearch.js"
import { notebookEditTool }          from "./built-in/notebook.js"
import { bashTool }                  from "./built-in/bash.js"
import { undoTool }                  from "./built-in/undo.js"
import { taskCreateTool, taskUpdateTool, taskCompleteTool } from "./built-in/dag-tasks.js"
import { planEnterTool, planVerifyTool } from "./built-in/plan.js"
import { subagentTool }    from "./built-in/subagent.js"
import { worktreeTool }    from "./built-in/worktree.js"
import { memoryTool }      from "./built-in/memory-tool.js"
import { gitTool }         from "./built-in/git.js"
import { svnTool }         from "./built-in/svn.js"
import { perforceTool }    from "./built-in/perforce.js"
import { sendMessageTool } from "./built-in/send_message.js"
import { symbolsTool }     from "./built-in/symbols.js"
import { codeMapTool }     from "./built-in/code_map.js"
import { loadSkillTool }   from "./built-in/load-skill.js"
import { httpRequestTool } from "./built-in/http-request.js"
import { jwtDecodeTool }   from "./built-in/jwt-decode.js"
import { regexTestTool }   from "./built-in/regex-test.js"
import { jqTool }          from "./built-in/jq.js"
import { pptxTool }        from "./built-in/pptx.js"
import { renderPdfTool }   from "./built-in/render-pdf.js"
import { chartTool }       from "./built-in/chart.js"
import { mermaidTool }     from "./built-in/mermaid-tool.js"
import { verifyTool }      from "./built-in/verify.js"
import { scratchpadTool }  from "./built-in/scratchpad.js"
import { critiqueTool }    from "./built-in/critique.js"
import { envInspectTool }  from "./built-in/env-inspect.js"
import { checkpointTool }  from "./built-in/checkpoint.js"
import { diffViewTool }    from "./built-in/diff-view.js"
import { fileStatTool }    from "./built-in/file-stat.js"
import { processMonitorTool } from "./built-in/process-monitor.js"
import { patchTestTool }   from "./built-in/patch-test.js"

const tools = new Map<string, ToolDef>()

for (const t of [
  bashTool, readTool, writeTool, editTool, globTool, grepTool,
  webfetchTool, todoTool,
  applyPatchTool, questionTool, websearchTool, undoTool,
  taskCreateTool, taskUpdateTool, taskCompleteTool,
  planEnterTool, planVerifyTool,
  lspTool, notebookEditTool, subagentTool, worktreeTool, memoryTool, gitTool,
  svnTool, perforceTool,
  sendMessageTool,
  symbolsTool, codeMapTool,
  loadSkillTool,
  httpRequestTool, jwtDecodeTool, regexTestTool, jqTool,
  pptxTool, renderPdfTool, chartTool, mermaidTool,
  verifyTool, scratchpadTool, critiqueTool,
  envInspectTool, checkpointTool, diffViewTool, fileStatTool, processMonitorTool, patchTestTool,
]) {
  tools.set(t.id, t)

}

export const ToolRegistry = {
  register(tool: ToolDef): void { tools.set(tool.id, tool) },
  get(id: string): ToolDef | undefined { return tools.get(id) },
  list(): ToolDef[] { return [...tools.values()] },
  has(id: string): boolean { return tools.has(id) },
}
