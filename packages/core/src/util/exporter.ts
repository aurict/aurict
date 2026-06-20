export interface ExportMessage {
  role:          string
  content:       string
  tool?:         string
  pending?:      boolean
  resultContent?: string
}

function pad2(n: number): string { return n.toString().padStart(2, "0") }

function timestamp(): string {
  const d  = new Date()
  return `${d.getFullYear()}${pad2(d.getMonth()+1)}${pad2(d.getDate())}-${pad2(d.getHours())}${pad2(d.getMinutes())}`
}

export function defaultExportFilename(ext: "md" | "html"): string {
  return `aurict-export-${timestamp()}.${ext}`
}

// ── Markdown ──────────────────────────────────────────────────────────────────

export function exportToMarkdown(messages: ExportMessage[], title = "Aurict Session"): string {
  const lines: string[] = [
    `# ${title}`,
    `> Exported ${new Date().toLocaleString()}`,
    "",
  ]

  for (const m of messages) {
    if (m.pending) continue

    if (m.role === "user") {
      lines.push(`## You\n\n${m.content}\n`)
    } else if (m.role === "assistant") {
      lines.push(`## Assistant\n\n${m.content}\n`)
    } else if (m.role === "tool_call") {
      const icon = "›"
      lines.push(`### ${icon} ${m.tool ?? "tool"}\n\n\`\`\`\n${m.content}\n\`\`\``)
      if (m.resultContent) {
        lines.push(`**Result:**\n\n\`\`\`\n${m.resultContent.slice(0, 2000)}${m.resultContent.length > 2000 ? "\n… (truncated)" : ""}\n\`\`\`\n`)
      }
    } else if (m.role === "system") {
      lines.push(`> ◆ *${m.content}*\n`)
    } else if (m.role === "error") {
      lines.push(`> ✗ **Error:** ${m.content}\n`)
    }
  }

  return lines.join("\n")
}

// ── HTML ──────────────────────────────────────────────────────────────────────

const CSS = `
  *{box-sizing:border-box;margin:0;padding:0}
  body{background:#0d1117;color:#c9d1d9;font-family:'SF Mono',Consolas,monospace;font-size:14px;line-height:1.6;padding:2rem}
  h1{color:#58a6ff;font-size:1.4rem;margin-bottom:.5rem}
  .meta{color:#8b949e;font-size:.8rem;margin-bottom:2rem}
  .msg{margin-bottom:1.5rem;border-radius:6px;overflow:hidden}
  .msg-user{border-left:3px solid #58a6ff;padding:.75rem 1rem;background:#161b22}
  .msg-assistant{padding:.75rem 1rem}
  .msg-system{padding:.4rem 1rem;color:#8b949e;font-size:.85rem;border-left:3px solid #30363d}
  .msg-error{padding:.4rem 1rem;color:#f85149;border-left:3px solid #f85149}
  .role{font-size:.75rem;font-weight:700;text-transform:uppercase;letter-spacing:.05em;margin-bottom:.4rem}
  .role-user{color:#58a6ff}
  .role-assistant{color:#3fb950}
  .content pre{background:#161b22;border:1px solid #30363d;border-radius:4px;padding:.75rem;overflow-x:auto;white-space:pre-wrap;word-break:break-all}
  .content p{margin-bottom:.5rem}
  .content code{background:#161b22;border-radius:3px;padding:.1em .3em}
  details{background:#161b22;border:1px solid #30363d;border-radius:6px;margin-bottom:.75rem}
  summary{padding:.5rem .75rem;cursor:pointer;color:#8b949e;font-size:.85rem}
  summary:hover{color:#c9d1d9}
  .tool-result{padding:.5rem .75rem;border-top:1px solid #30363d;white-space:pre-wrap;word-break:break-all;font-size:.82rem;color:#8b949e;max-height:300px;overflow-y:auto}
`.trim()

function escapeHtml(s: string): string {
  return s.replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;")
}

function mdToHtml(text: string): string {
  return text
    .replace(/```([\s\S]*?)```/g, (_,c) => `<pre><code>${escapeHtml(c)}</code></pre>`)
    .replace(/`([^`]+)`/g, (_,c) => `<code>${escapeHtml(c)}</code>`)
    .replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>")
    .replace(/\*(.+?)\*/g, "<em>$1</em>")
    .replace(/^### (.+)$/gm, "<h3>$1</h3>")
    .replace(/^## (.+)$/gm, "<h2>$1</h2>")
    .replace(/^# (.+)$/gm, "<h1>$1</h1>")
    .replace(/\n/g, "<br>")
}

export function exportToHtml(messages: ExportMessage[], title = "Aurict Session"): string {
  const parts: string[] = []

  for (const m of messages) {
    if (m.pending) continue

    if (m.role === "user") {
      parts.push(`<div class="msg msg-user"><div class="role role-user">You</div><div class="content">${mdToHtml(escapeHtml(m.content))}</div></div>`)
    } else if (m.role === "assistant") {
      parts.push(`<div class="msg msg-assistant"><div class="role role-assistant">Assistant</div><div class="content">${mdToHtml(escapeHtml(m.content))}</div></div>`)
    } else if (m.role === "tool_call") {
      const resultHtml = m.resultContent
        ? `<div class="tool-result">${escapeHtml(m.resultContent.slice(0, 3000))}${m.resultContent.length > 3000 ? "\n… (truncated)" : ""}</div>`
        : ""
      parts.push(`<details><summary>› ${escapeHtml(m.tool ?? "tool")} — ${escapeHtml(m.content.slice(0, 80))}</summary>${resultHtml}</details>`)
    } else if (m.role === "system") {
      parts.push(`<div class="msg msg-system">◆ ${escapeHtml(m.content)}</div>`)
    } else if (m.role === "error") {
      parts.push(`<div class="msg msg-error">✗ ${escapeHtml(m.content)}</div>`)
    }
  }

  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>${escapeHtml(title)}</title>
<style>${CSS}</style>
</head>
<body>
<h1>${escapeHtml(title)}</h1>
<div class="meta">Exported ${new Date().toLocaleString()}</div>
${parts.join("\n")}
</body>
</html>`
}
