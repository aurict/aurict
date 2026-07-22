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
import { orchestrateTool } from "./built-in/orchestrate.js"
import { envInspectTool }  from "./built-in/env-inspect.js"
import { checkpointTool }  from "./built-in/checkpoint.js"
import { diffViewTool }    from "./built-in/diff-view.js"
import { fileStatTool }    from "./built-in/file-stat.js"
import { processMonitorTool } from "./built-in/process-monitor.js"
import { patchTestTool }   from "./built-in/patch-test.js"
import { trackVariableTaintTool } from "./built-in/track-variable-taint.js"
import { atomicPatchAndTestTool } from "./built-in/atomic-patch-test.js"
import { inspectLiveProcessTool } from "./built-in/inspect-live-process.js"
import { blastRadiusTool }        from "./built-in/blast-radius.js"
import { gitContextTool }         from "./built-in/git-context.js"
import { uiInspectTool }          from "./built-in/ui-inspect.js"
import { securityReconTool }      from "./built-in/security-recon.js"
import { securityScanTool }       from "./built-in/security-scan.js"
import { securityReportTool }     from "./built-in/security-report.js"
import { securityVerifyTool }     from "./built-in/security-verify.js"
import { securityAttackGraphTool } from "./built-in/security-attack-graph.js"
import { securityLogAnalyzeTool }  from "./built-in/security-log-analyze.js"
import { securityThreatModelTool } from "./built-in/security-threat-model.js"
import { financeCalculateTool } from "./built-in/finance.js"
import { marketDataTool } from "./built-in/market-data.js"
import { legalSearchTool } from "./built-in/legal-search.js"
import { documentExtractTool } from "./built-in/document-extract.js"
import { structuredDataTool } from "./built-in/structured-data.js"
import { readToolOutputTool } from "./built-in/read-tool-output.js"
import { requestToolsTool } from "./built-in/request-tools.js"
import { readImageTool } from "./built-in/read-image.js"
import { depDocsTool } from "./built-in/dep-docs.js"
import { browserTool } from "./built-in/browser.js"
import { evalTool } from "./built-in/eval.js"
import { astEditTool } from "./built-in/ast-edit.js"
import { semanticSearchTool } from "./built-in/semantic-search.js"

const tools = new Map<string, ToolDef>()

for (const t of [
  bashTool, evalTool, readTool, readImageTool, readToolOutputTool, requestToolsTool, depDocsTool, writeTool, editTool, globTool, grepTool,
  webfetchTool, todoTool,
  applyPatchTool, astEditTool, questionTool, websearchTool, undoTool,
  taskCreateTool, taskUpdateTool, taskCompleteTool,
  planEnterTool, planVerifyTool,
  lspTool, notebookEditTool, subagentTool, worktreeTool, memoryTool, gitTool,
  svnTool, perforceTool,
  sendMessageTool,
  symbolsTool, codeMapTool, semanticSearchTool,
  loadSkillTool,
  httpRequestTool, jwtDecodeTool, regexTestTool, jqTool,
  pptxTool, renderPdfTool, chartTool, mermaidTool,
  verifyTool, scratchpadTool, critiqueTool, orchestrateTool,
  envInspectTool, checkpointTool, diffViewTool, fileStatTool, processMonitorTool, patchTestTool,
  trackVariableTaintTool, atomicPatchAndTestTool, inspectLiveProcessTool,
  blastRadiusTool,
  gitContextTool,
  uiInspectTool, browserTool,
  securityReconTool, securityScanTool, securityReportTool, securityVerifyTool,
  securityAttackGraphTool, securityLogAnalyzeTool, securityThreatModelTool,
  financeCalculateTool,
  marketDataTool,
  legalSearchTool,
  documentExtractTool,
  structuredDataTool,
]) {
  tools.set(t.id, t)

}

export const ToolRegistry = {
  register(tool: ToolDef): void { tools.set(tool.id, tool) },
  unregister(id: string): boolean { return tools.delete(id) },
  get(id: string): ToolDef | undefined { return tools.get(id) },
  list(): ToolDef[] { return [...tools.values()] },
  has(id: string): boolean { return tools.has(id) },
}
