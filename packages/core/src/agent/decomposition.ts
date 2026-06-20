import type { AgentType } from "./protocol.js"

/**
 * Hierarchical Task Decomposition
 * 
 * Karmaşık görevleri 3 seviyede ayrıştırır:
 * - Level 1: Global (proje genelinde)
 * - Level 2: Domain (modül bazında)
 * - Level 3: File (dosya bazında)
 */

export type DecompositionLevel = "global" | "domain" | "file"

export interface TaskNode {
  id: string
  level: DecompositionLevel
  description: string
  scope: string        // project / module / file path
  agentType?: AgentType
  children: TaskNode[]
  status: "pending" | "running" | "done" | "error"
  result?: string
}

export interface DecompositionRequest {
  task: string
  projectStructure?: string[]  // Dosya listesi
  complexity: "simple" | "moderate" | "complex"
}

/**
 * Görevi hiyerarşik olarak ayrıştırır.
 * 
 * Basit görevler → tek agent
 * Orta görevler → 2-3 agent
 * Karmaşık görevler → 3 seviyeli hiyerarşi
 */
export function decomposeTask(request: DecompositionRequest): TaskNode {
  const { task, projectStructure, complexity } = request

  // Basit görev → tek agent
  if (complexity === "simple") {
    return {
      id: crypto.randomUUID(),
      level: "file",
      description: task,
      scope: "project",
      agentType: inferAgentType(task),
      children: [],
      status: "pending",
    }
  }

  // Orta görev → 2-3 paralel agent
  if (complexity === "moderate") {
    const dimensions = extractDimensions(task)
    if (dimensions.length <= 1) {
      return {
        id: crypto.randomUUID(),
        level: "domain",
        description: task,
        scope: "project",
        agentType: inferAgentType(task),
        children: [],
        status: "pending",
      }
    }

    return {
      id: crypto.randomUUID(),
      level: "global",
      description: task,
      scope: "project",
      children: dimensions.map(dim => ({
        id: crypto.randomUUID(),
        level: "domain" as DecompositionLevel,
        description: dim,
        scope: "project",
        agentType: inferAgentType(dim),
        children: [],
        status: "pending" as const,
      })),
      status: "pending",
    }
  }

  // Karmaşık görev → 3 seviyeli hiyerarşi
  const domains = extractDomains(task, projectStructure ?? [])
  
  return {
    id: crypto.randomUUID(),
    level: "global",
    description: task,
    scope: "project",
    children: domains.map(domain => ({
      id: crypto.randomUUID(),
      level: "domain" as DecompositionLevel,
      description: domain.name,
      scope: domain.path,
      agentType: inferAgentType(domain.name),
      children: domain.files.map(file => ({
        id: crypto.randomUUID(),
        level: "file" as DecompositionLevel,
        description: `Process ${file}`,
        scope: file,
        agentType: inferAgentType(domain.name),
        children: [],
        status: "pending" as const,
      })),
      status: "pending" as const,
    })),
    status: "pending",
  }
}

/**
 * Görev metninden dimension'ları çıkarır.
 * "security, performance, and architecture" → ["security", "performance", "architecture"]
 */
function extractDimensions(task: string): string[] {
  const dimensions: string[] = []
  
  // Dimension keyword'leri
  const keywords = [
    "security", "performance", "architecture", "testing", "documentation",
    "refactor", "debug", "review", "analysis", "optimization"
  ]
  
  const lower = task.toLowerCase()
  for (const keyword of keywords) {
    if (lower.includes(keyword)) {
      dimensions.push(keyword)
    }
  }
  
  return dimensions.length > 0 ? dimensions : [task]
}

/**
 * Proje yapısından domain'leri çıkarır.
 */
function extractDomains(task: string, files: string[]): Array<{ name: string; path: string; files: string[] }> {
  // Domain klasörlerini tespit et
  const domainMap = new Map<string, string[]>()
  
  for (const file of files) {
    const parts = file.split("/")
    if (parts.length >= 2) {
      const domain = parts[0]!
      if (!domainMap.has(domain)) {
        domainMap.set(domain, [])
      }
      domainMap.get(domain)!.push(file)
    }
  }
  
  // En büyük 3 domain'i seç
  const sorted = [...domainMap.entries()]
    .sort((a, b) => b[1].length - a[1].length)
    .slice(0, 3)
  
  return sorted.map(([path, files]) => ({
    name: `${path} module`,
    path,
    files: files.slice(0, 5), // Her domain'den max 5 dosya
  }))
}

/**
 * Görev metninden uygun agent tipini tahmin eder.
 */
function inferAgentType(task: string): AgentType {
  const lower = task.toLowerCase()
  
  if (/security|auth|vulnerability|cve/i.test(lower)) return "security"
  if (/performance|optim|speed|slow|bundle/i.test(lower)) return "performance"
  if (/test|spec|coverage/i.test(lower)) return "test"
  if (/doc|readme|comment/i.test(lower)) return "docs"
  if (/refactor|clean|restructur/i.test(lower)) return "refactor"
  if (/debug|fix|bug|error/i.test(lower)) return "debug"
  if (/review|audit|check/i.test(lower)) return "review"
  if (/explor|find|search|scan/i.test(lower)) return "explore"
  if (/design|ui|ux|component/i.test(lower)) return "design"
  if (/data|migrat|transform/i.test(lower)) return "data"
  if (/devops|deploy|docker|ci/i.test(lower)) return "devops"
  
  return "code" // Default
}

/**
 * Task tree'yi düz listeye çevirir (execution için).
 */
export function flattenTaskTree(root: TaskNode): TaskNode[] {
  const result: TaskNode[] = []
  
  function walk(node: TaskNode) {
    if (node.children.length === 0) {
      result.push(node)
    } else {
      for (const child of node.children) {
        walk(child)
      }
    }
  }
  
  walk(root)
  return result
}

/**
 * Task tree'nin ilerleme durumunu özetler.
 */
export function getTaskProgress(root: TaskNode): {
  total: number
  done: number
  running: number
  pending: number
  error: number
} {
  const all = flattenTaskTree(root)
  return {
    total: all.length,
    done: all.filter(t => t.status === "done").length,
    running: all.filter(t => t.status === "running").length,
    pending: all.filter(t => t.status === "pending").length,
    error: all.filter(t => t.status === "error").length,
  }
}
