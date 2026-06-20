import { spawn } from "bun"

const PUBLIC_HOSTS = ["github.com","gitlab.com","bitbucket.org","codeberg.org","gitea.io"]

/** Çalışma dizinindeki git remote'u kontrol eder — public ise true */
export async function detectUndercoverRepo(workdir: string): Promise<boolean> {
  try {
    const proc = spawn(["git","remote","get-url","origin"], { cwd: workdir, stdout: "pipe", stderr: "pipe" })
    const out  = (await new Response(proc.stdout).text()).trim()
    await proc.exited
    return PUBLIC_HOSTS.some((h) => out.includes(h))
  } catch { return false }
}

export function getUndercoverInstructions(): string {
  return `## UNDERCOVER MODE — CRITICAL

You are operating UNDERCOVER in a PUBLIC/OPEN-SOURCE repository. Your commit
messages, PR titles, and PR bodies MUST NOT contain ANY Aurict or AI-related
information. Do not blow your cover.

NEVER include in commit messages or PR descriptions:
- The phrase "Aurict", "Tengu", "Antigravity", or any internal code names.
- Any mention that you are an AI, a Language Model, or a Bot.
- Co-Authored-By lines or any other attribution to AI.

Write commit messages as a human developer would — describe only what the code
change does.

GOOD:
- "Fix race condition in file watcher initialization"
- "Add support for custom key bindings"

BAD (never write these):
- "Generated with Aurict"
- "1-shotted by AI"
- "Co-Authored-By: Aurict <...>"
`
}
