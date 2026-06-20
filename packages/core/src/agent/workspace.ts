import { mkdirSync, existsSync } from "fs"
import { join } from "path"

/**
 * Multi-agent shared workspace.
 *
 * Her parent session için bir dizin açılır.
 * Aynı session'dan spawn edilen tüm subagentlar bu dizini okuyup yazabilir.
 *
 * Dizin: {workdir}/.aurict/sessions/{parentId}/workspace/
 */

export function getWorkspaceDir(workdir: string, parentSessionId: string): string {
  // İlk 8 karakter — kısa ama yeterince benzersiz
  return join(workdir, ".aurict", "sessions", parentSessionId.slice(0, 8), "workspace")
}

export function ensureWorkspace(workdir: string, parentSessionId: string): string {
  const dir = getWorkspaceDir(workdir, parentSessionId)
  if (!existsSync(dir)) mkdirSync(dir, { recursive: true })
  return dir
}

/**
 * Bir agent'ın findings dosyasının tam yolu.
 * Deterministik — agent type'a göre: security.md, performance.md, ...
 */
export function agentFindingsPath(workspaceDir: string, agentType: string): string {
  return join(workspaceDir, `${agentType}.md`)
}

/**
 * Workspace'deki tüm findings dosyalarını okur ve birleştirir.
 * Coordinator agent sentez aşamasında bunu kullanır.
 */
export async function readWorkspaceFindings(
  workdir:         string,
  parentSessionId: string,
): Promise<{ agentType: string; content: string }[]> {
  const dir = getWorkspaceDir(workdir, parentSessionId)
  try {
    const { readdir, readFile } = await import("node:fs/promises")
    const files = await readdir(dir).catch(() => [] as string[])
    const mdFiles = files.filter(f => f.endsWith(".md"))
    return Promise.all(
      mdFiles.map(async (f) => ({
        agentType: f.replace(/\.md$/, ""),
        content:   (await readFile(join(dir, f), "utf8")).trim(),
      }))
    )
  } catch {
    return []
  }
}

/**
 * Agent'a workspace kullanımını anlatan prompt eki.
 * Worker system prompt'una inject edilir.
 */
export function workspacePrompt(workspaceDir: string, agentType: string): string {
  const findingsFile = agentFindingsPath(workspaceDir, agentType)
  return `## Shared Workspace

All agents working on this task share a workspace directory:
  ${workspaceDir}

Your findings file: ${findingsFile}

Instructions:
1. When you complete your analysis, write your findings to ${findingsFile} using the write tool.
2. You can also READ other agents' findings from the same directory (glob("${workspaceDir}/*.md")).
3. Format your findings clearly — they will be read by the coordinator and possibly other agents.
4. Use this structure for your findings file:

\`\`\`markdown
# [Your Agent Type] Findings

## Summary
One paragraph overview.

## Findings
- [CRITICAL/HIGH/MEDIUM/LOW] Description — location — recommendation
...

## Conclusion
What the coordinator should know.
\`\`\`
`
}