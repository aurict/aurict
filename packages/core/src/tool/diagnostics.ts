import type { ExecuteResult, ToolDiagnostic } from "./types.js"

export function appendToolDiagnostic(result: ExecuteResult, diagnostic: ToolDiagnostic): ExecuteResult {
  const line = `[Diagnostic:${diagnostic.source}] ${diagnostic.message}`
  return {
    ...result,
    output: result.output ? `${result.output}\n${line}` : line,
    metadata: {
      ...result.metadata,
      diagnostics: [...(result.metadata?.diagnostics ?? []), diagnostic],
    },
  }
}

export function diagnosticMessage(error: unknown): string {
  return error instanceof Error ? error.message : String(error)
}
