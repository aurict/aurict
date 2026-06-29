import type { SecurityDistilledFinding } from "./distiller.js"

export type SecurityGraphNodeKind =
  | "asset"
  | "service"
  | "technology"
  | "exposure"
  | "vulnerability"
  | "trust-boundary"
  | "credential-boundary"
  | "auth-boundary"
  | "control"
  | "cve"

export type SecurityGraphEdgeStatus = "hypothesis" | "supported" | "confirmed"

export interface SecurityGraphNode {
  id: string
  kind: SecurityGraphNodeKind
  label: string
  evidence: string[]
}

export interface SecurityGraphEdge {
  from: string
  to: string
  relation: string
  status: SecurityGraphEdgeStatus
  evidence: string[]
  requirement?: string | undefined
}

export interface SecurityAttackGraph {
  nodes: SecurityGraphNode[]
  edges: SecurityGraphEdge[]
}

export function buildAttackGraphFromFindings(findings: SecurityDistilledFinding[]): SecurityAttackGraph {
  const nodes = new Map<string, SecurityGraphNode>()
  const edges: SecurityGraphEdge[] = []

  for (const finding of findings) {
    const assetId = nodeId("asset", finding.affectedAsset)
    const vulnId = nodeId("vulnerability", finding.id)
    const exposureId = nodeId("exposure", `${finding.affectedAsset}:${finding.sourceTool}`)
    const status = edgeStatus(finding)
    const evidence = finding.evidence.slice(0, 4)
    putNode(nodes, { id: assetId, kind: "asset", label: finding.affectedAsset, evidence: [] })
    putNode(nodes, { id: exposureId, kind: "exposure", label: `${finding.sourceTool} exposure`, evidence })
    putNode(nodes, { id: vulnId, kind: "vulnerability", label: finding.title, evidence })
    pushEdge(edges, {
      from: assetId,
      to: exposureId,
      relation: "has_exposure",
      status,
      evidence,
    })
    pushEdge(edges, {
      from: exposureId,
      to: vulnId,
      relation: "may_enable",
      status,
      evidence,
      requirement: status === "hypothesis" ? "add evidence before treating this as a confirmed attack path" : undefined,
    })

    const service = inferService(finding)
    if (service) {
      const serviceId = nodeId("service", `${finding.affectedAsset}:${service}`)
      putNode(nodes, { id: serviceId, kind: "service", label: service, evidence })
      pushEdge(edges, { from: assetId, to: serviceId, relation: "exposes_service", status, evidence })
      pushEdge(edges, { from: serviceId, to: exposureId, relation: "creates_exposure", status, evidence })
    }

    for (const technology of inferTechnologies(finding)) {
      const techId = nodeId("technology", technology)
      putNode(nodes, { id: techId, kind: "technology", label: technology, evidence })
      pushEdge(edges, { from: exposureId, to: techId, relation: "uses_technology", status, evidence })
    }

    for (const cve of inferCves(finding)) {
      const cveId = nodeId("cve", cve)
      putNode(nodes, { id: cveId, kind: "cve", label: cve.toUpperCase(), evidence })
      pushEdge(edges, { from: vulnId, to: cveId, relation: "maps_to", status, evidence })
    }

    const boundaries = inferBoundaries(finding)
    for (const boundary of boundaries) {
      const boundaryId = nodeId(boundary.kind, `${finding.affectedAsset}:${boundary.label}`)
      putNode(nodes, { id: boundaryId, kind: boundary.kind, label: boundary.label, evidence })
      pushEdge(edges, {
        from: exposureId,
        to: boundaryId,
        relation: boundary.relation,
        status,
        evidence,
        requirement: boundary.requirement,
      })
    }

    for (const control of inferControls(finding)) {
      const controlId = nodeId("control", control)
      putNode(nodes, { id: controlId, kind: "control", label: control, evidence })
      pushEdge(edges, { from: controlId, to: vulnId, relation: "mitigates_or_detects", status: "hypothesis", evidence, requirement: "verify this control exists and is effective" })
    }
  }

  return { nodes: [...nodes.values()], edges }
}

export function formatAttackGraph(graph: SecurityAttackGraph, maxEdges = 20): string {
  const lines = [
    "[Security Attack Path Graph]",
    `Nodes: ${graph.nodes.length}`,
    `Edges: ${graph.edges.length}`,
    "",
    "Edges:",
  ]
  for (const edge of graph.edges.slice(0, maxEdges)) {
    const from = graph.nodes.find((node) => node.id === edge.from)?.label ?? edge.from
    const to = graph.nodes.find((node) => node.id === edge.to)?.label ?? edge.to
    lines.push(`- ${from} --${edge.relation}/${edge.status}--> ${to}`)
    if (edge.evidence.length > 0) lines.push(`  evidence: ${edge.evidence[0]}`)
    if (edge.requirement) lines.push(`  requirement: ${edge.requirement}`)
    else if (edge.status === "hypothesis") lines.push("  requirement: add evidence before treating this as a confirmed attack path")
  }
  return lines.join("\n")
}

function putNode(nodes: Map<string, SecurityGraphNode>, node: SecurityGraphNode): void {
  const existing = nodes.get(node.id)
  if (!existing) {
    nodes.set(node.id, node)
    return
  }
  nodes.set(node.id, {
    ...existing,
    evidence: [...new Set([...existing.evidence, ...node.evidence])].slice(0, 8),
  })
}

function edgeStatus(finding: SecurityDistilledFinding): SecurityGraphEdgeStatus {
  if (finding.status === "confirmed") return "confirmed"
  if (finding.evidence.length > 0 && finding.confidence !== "low") return "supported"
  return "hypothesis"
}

function pushEdge(edges: SecurityGraphEdge[], edge: SecurityGraphEdge): void {
  const key = `${edge.from}:${edge.relation}:${edge.to}`
  const existing = edges.find((candidate) => `${candidate.from}:${candidate.relation}:${candidate.to}` === key)
  if (!existing) {
    edges.push(edge)
    return
  }
  existing.evidence = [...new Set([...existing.evidence, ...edge.evidence])].slice(0, 8)
  if (rankStatus(edge.status) < rankStatus(existing.status)) existing.status = edge.status
  existing.requirement = existing.requirement ?? edge.requirement
}

function rankStatus(status: SecurityGraphEdgeStatus): number {
  if (status === "confirmed") return 0
  if (status === "supported") return 1
  return 2
}

function inferService(finding: SecurityDistilledFinding): string | undefined {
  const text = findingText(finding)
  const port = finding.affectedAsset.match(/:(\d{1,5})(?:\/|$)?/)?.[1]
  const service = text.match(/\b(open|service)\s+([a-z0-9_.-]+)\b/i)?.[2]
    ?? text.match(/\b(ssh|https?|rdp|telnet|ftp|smb|mysql|postgres(?:ql)?|redis|mongodb|ldap|smtp|imap)\b/i)?.[1]
  if (!service && !port) return undefined
  return [service?.toLowerCase(), port ? `port ${port}` : ""].filter(Boolean).join(" ")
}

function inferTechnologies(finding: SecurityDistilledFinding): string[] {
  const text = findingText(finding)
  const technologies = [
    ...text.matchAll(/\b(nginx|apache|iis|openssl|openssh|wordpress|phpmyadmin|tomcat|node\.js|express|next\.js|react|django|rails|spring|redis|mongodb|postgresql|mysql)\b/ig),
  ].map((match) => match[1]!.toLowerCase())
  return [...new Set(technologies)].slice(0, 8)
}

function inferCves(finding: SecurityDistilledFinding): string[] {
  return [...new Set(findingText(finding).match(/\bCVE-\d{4}-\d{4,}\b/ig) ?? [])].slice(0, 8)
}

function inferBoundaries(finding: SecurityDistilledFinding): Array<{
  kind: "trust-boundary" | "credential-boundary" | "auth-boundary"
  label: string
  relation: string
  requirement: string
}> {
  const text = findingText(finding)
  const boundaries: Array<{
    kind: "trust-boundary" | "credential-boundary" | "auth-boundary"
    label: string
    relation: string
    requirement: string
  }> = []
  if (/https?:\/\/|external|internet|public/i.test(text)) {
    boundaries.push({ kind: "trust-boundary", label: "internet-to-target", relation: "crosses_trust_boundary", requirement: "confirm exposure is reachable from the assessed trust boundary" })
  }
  if (/\b(login|admin|401|403|auth|session|token|jwt|cookie|credential)\b/i.test(text)) {
    boundaries.push({ kind: "auth-boundary", label: "authentication-required", relation: "touches_auth_boundary", requirement: "verify authentication and authorization behavior manually" })
  }
  if (/\b(password|secret|key|token|hash|credential)\b/i.test(text)) {
    boundaries.push({ kind: "credential-boundary", label: "credential-material", relation: "may_expose_credentials", requirement: "verify sensitive material exists and is not a scanner artifact" })
  }
  return boundaries
}

function inferControls(finding: SecurityDistilledFinding): string[] {
  const text = findingText(finding)
  const controls: string[] = []
  if (/content-security-policy|x-frame-options|permissions-policy|referrer-policy|x-content-type-options/i.test(text)) controls.push("browser security headers")
  if (/strict-transport-security|tls|ssl|certificate/i.test(text)) controls.push("transport security configuration")
  if (/rate|ffuf|gobuster|404|401|403/i.test(text)) controls.push("rate limiting and access control")
  if (/sql injection|sqlmap|injectable/i.test(text)) controls.push("input validation and parameterized queries")
  return [...new Set(controls)].slice(0, 6)
}

function findingText(finding: SecurityDistilledFinding): string {
  return [finding.id, finding.title, finding.affectedAsset, finding.sourceTool, ...finding.evidence].join("\n")
}

function nodeId(kind: string, label: string): string {
  return `${kind}:${label.toLowerCase().replace(/[^a-z0-9_.:-]+/g, "-").replace(/^-+|-+$/g, "") || "node"}`
}
