export type ThreatFramework = "STRIDE" | "LINDDUN"
export type ThreatSeverity = "low" | "medium" | "high"

export interface SecurityDataFlow {
  id: string
  source: string
  destination: string
  data: string
  trustBoundary?: string | undefined
}

export interface SecurityThreat {
  id: string
  framework: ThreatFramework
  category: string
  asset: string
  actor: string
  entrypoint: string
  dataflow?: string | undefined
  trustBoundary?: string | undefined
  existingControl?: string | undefined
  missingControl: string
  mitigation: string
  residualRisk: ThreatSeverity
}

export interface SecurityThreatModel {
  assets: string[]
  actors: string[]
  entrypoints: string[]
  dataflows: SecurityDataFlow[]
  threats: SecurityThreat[]
}

export function buildStrideThreatModel(input: {
  assets: string[]
  actors?: string[] | undefined
  entrypoints?: string[] | undefined
  dataflows?: SecurityDataFlow[] | undefined
  existingControls?: string[] | undefined
}): SecurityThreatModel {
  const actors = input.actors?.length ? input.actors : ["external user"]
  const entrypoints = input.entrypoints?.length ? input.entrypoints : input.assets
  const controls = input.existingControls ?? []
  const threats: SecurityThreat[] = []
  for (const asset of input.assets) {
    for (const category of ["Spoofing", "Tampering", "Repudiation", "Information Disclosure", "Denial of Service", "Elevation of Privilege"]) {
      threats.push({
        id: threatId(category, asset),
        framework: "STRIDE",
        category,
        asset,
        actor: actors[0] ?? "external user",
        entrypoint: entrypoints[0] ?? asset,
        dataflow: input.dataflows?.[0]?.id,
        trustBoundary: input.dataflows?.[0]?.trustBoundary,
        existingControl: controls.find((control) => control.toLowerCase().includes(category.toLowerCase().split(" ")[0] ?? "")),
        missingControl: missingControlFor(category),
        mitigation: mitigationFor(category),
        residualRisk: category === "Elevation of Privilege" || category === "Information Disclosure" ? "high" : "medium",
      })
    }
  }
  return {
    assets: input.assets,
    actors,
    entrypoints,
    dataflows: input.dataflows ?? [],
    threats,
  }
}

export function formatThreatModel(model: SecurityThreatModel, maxThreats = 18): string {
  return [
    "[Security Threat Model]",
    `Assets: ${model.assets.join(", ") || "(none)"}`,
    `Actors: ${model.actors.join(", ") || "(none)"}`,
    `Entrypoints: ${model.entrypoints.join(", ") || "(none)"}`,
    `Dataflows: ${model.dataflows.length}`,
    "",
    "Threats:",
    ...model.threats.slice(0, maxThreats).map((threat) =>
      `- ${threat.framework}/${threat.category} on ${threat.asset}: missing=${threat.missingControl}; mitigation=${threat.mitigation}; residualRisk=${threat.residualRisk}`
    ),
  ].join("\n")
}

function missingControlFor(category: string): string {
  switch (category) {
    case "Spoofing": return "strong authentication and identity binding"
    case "Tampering": return "integrity validation and authorization on writes"
    case "Repudiation": return "audit logging with actor and timestamp"
    case "Information Disclosure": return "least-privilege access control and data minimization"
    case "Denial of Service": return "rate limiting, quotas, and backpressure"
    case "Elevation of Privilege": return "role boundary checks and privilege separation"
    default: return "documented security control"
  }
}

function mitigationFor(category: string): string {
  switch (category) {
    case "Spoofing": return "enforce MFA/session validation where appropriate"
    case "Tampering": return "validate input and enforce object-level authorization"
    case "Repudiation": return "add tamper-resistant audit events"
    case "Information Disclosure": return "restrict sensitive fields and review logs"
    case "Denial of Service": return "add rate limits and resource ceilings"
    case "Elevation of Privilege": return "test privilege boundaries and deny-by-default"
    default: return "define and test the control"
  }
}

function threatId(category: string, asset: string): string {
  return `${category}:${asset}`.toLowerCase().replace(/[^a-z0-9_.:-]+/g, "-").replace(/^-+|-+$/g, "")
}
