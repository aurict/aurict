import { homedir } from "node:os"
import { join } from "node:path"
import { mkdirSync } from "node:fs"
import { DesignLoader } from "./loader.js"
import { extractProjectBrand, brandToContext } from "./auto-brand.js"

export interface DesignJobSpec {
  brief:       string    // user's request
  systemId:    string    // selected design system ID
  skillId:     string    // selected skill ID
  workdir:     string    // project directory
  outputSlug:  string    // output folder name under ~/.aurict/designs/
}

export function buildDesignOutputDir(slug: string): string {
  const dir = join(homedir(), ".aurict", "designs", slug)
  mkdirSync(dir, { recursive: true })
  return dir
}

export function buildDesignPrompt(spec: DesignJobSpec): string {
  const { brief, systemId, skillId, workdir, outputSlug } = spec

  const system = DesignLoader.getSystem(systemId)
  const skill  = DesignLoader.getSkill(skillId)
  const brand  = extractProjectBrand(workdir)
  const outDir = buildDesignOutputDir(outputSlug)

  const parts: string[] = []

  parts.push(`## Design Task\n${brief}`)
  parts.push(`## Output Directory\nWrite the final artifact to: ${outDir}/index.html\nThis is a single self-contained HTML file. All CSS and JS must be inlined.`)

  if (skill) {
    parts.push(`## Skill Instructions\n${skill.content}`)

    const template = DesignLoader.getTemplateHtml(skillId)
    if (template) {
      parts.push(`## Seed Template (use as base)\n\`\`\`html\n${template}\n\`\`\``)
    }

    const layouts = DesignLoader.getLayouts(skillId)
    if (layouts) {
      parts.push(`## Layout Reference\n${layouts}`)
    }
  }

  if (system) {
    parts.push(`## Design System (apply these tokens to every element)\n${system.content}`)
  }

  if (brand.colors.length > 0 || brand.fonts.length > 0 || brand.name) {
    parts.push(brandToContext(brand))
  }

  parts.push(`## Delivery Checklist
- [ ] Single self-contained index.html written to ${outDir}/index.html
- [ ] All CSS inlined (no external stylesheets except Google Fonts CDN)
- [ ] Design system colors and typography applied throughout
- [ ] Responsive layout (mobile + desktop)
- [ ] Final summary: what was built, key design decisions made`)

  return parts.join("\n\n---\n\n")
}

export function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 40)
    + "-" + Date.now().toString(36)
}
