export interface SecurityLogEvent {
  timestamp?: string | undefined
  sourceIp?: string | undefined
  method?: string | undefined
  path?: string | undefined
  status?: number | undefined
  bytes?: number | undefined
  raw: string
}

export interface SecurityLogCluster {
  key: string
  count: number
  examples: string[]
}

export interface SecurityLogAnalysis {
  totalEvents: number
  parsedEvents: number
  statusCodeDistribution: Record<string, number>
  topPaths: SecurityLogCluster[]
  sourceIps: SecurityLogCluster[]
  anomalies: string[]
  suspiciousSequences: string[]
}

const COMBINED_LOG_RE = /^(?<ip>\S+) \S+ \S+ \[(?<time>[^\]]+)] "(?<method>[A-Z]+) (?<path>\S+) [^"]*" (?<status>\d{3}) (?<bytes>\d+|-)/

export function analyzeSecurityLogs(text: string, maxLines = 10_000): SecurityLogAnalysis {
  const lines = text.split(/\r?\n/).slice(0, maxLines).filter((line) => line.trim())
  const events = lines.map(parseLogLine)
  const parsed = events.filter((event) => event.status !== undefined)
  const statusCodeDistribution: Record<string, number> = {}
  for (const event of parsed) {
    const bucket = event.status ? `${Math.floor(event.status / 100)}xx` : "unknown"
    statusCodeDistribution[bucket] = (statusCodeDistribution[bucket] ?? 0) + 1
  }
  const topPaths = clusters(parsed.map((event) => event.path).filter(Boolean) as string[], parsed)
  const sourceIps = clusters(parsed.map((event) => event.sourceIp).filter(Boolean) as string[], parsed)
  return {
    totalEvents: lines.length,
    parsedEvents: parsed.length,
    statusCodeDistribution,
    topPaths: topPaths.slice(0, 10),
    sourceIps: sourceIps.slice(0, 10),
    anomalies: detectAnomalies(parsed, statusCodeDistribution),
    suspiciousSequences: detectSuspiciousSequences(parsed),
  }
}

export function formatSecurityLogAnalysis(analysis: SecurityLogAnalysis): string {
  return [
    "[Security Log Analysis]",
    `Events: ${analysis.parsedEvents}/${analysis.totalEvents} parsed`,
    `Status codes: ${Object.entries(analysis.statusCodeDistribution).map(([k, v]) => `${k}=${v}`).join(", ") || "(none)"}`,
    "Top paths:",
    ...analysis.topPaths.slice(0, 6).map((cluster) => `- ${cluster.key}: ${cluster.count}`),
    "Top source IPs:",
    ...analysis.sourceIps.slice(0, 6).map((cluster) => `- ${cluster.key}: ${cluster.count}`),
    "Anomalies:",
    ...(analysis.anomalies.length ? analysis.anomalies.map((item) => `- ${item}`) : ["- (none)"]),
    "Suspicious sequences:",
    ...(analysis.suspiciousSequences.length ? analysis.suspiciousSequences.map((item) => `- ${item}`) : ["- (none)"]),
  ].join("\n")
}

function parseLogLine(line: string): SecurityLogEvent {
  const match = line.match(COMBINED_LOG_RE)
  if (!match?.groups) return { raw: line }
  const bytesRaw = match.groups["bytes"]
  return {
    raw: line,
    sourceIp: match.groups["ip"],
    timestamp: match.groups["time"],
    method: match.groups["method"],
    path: match.groups["path"],
    status: Number(match.groups["status"]),
    ...(bytesRaw && bytesRaw !== "-" ? { bytes: Number(bytesRaw) } : {}),
  }
}

function clusters(values: string[], events: SecurityLogEvent[]): SecurityLogCluster[] {
  const map = new Map<string, SecurityLogCluster>()
  for (const value of values) {
    const existing = map.get(value) ?? { key: value, count: 0, examples: [] }
    existing.count++
    if (existing.examples.length < 3) {
      const example = events.find((event) => event.path === value || event.sourceIp === value)?.raw
      if (example) existing.examples.push(example)
    }
    map.set(value, existing)
  }
  return [...map.values()].sort((a, b) => b.count - a.count)
}

function detectAnomalies(events: SecurityLogEvent[], statusCodes: Record<string, number>): string[] {
  const anomalies: string[] = []
  const total = Math.max(1, events.length)
  const errors = (statusCodes["4xx"] ?? 0) + (statusCodes["5xx"] ?? 0)
  if (errors / total > 0.35) anomalies.push("High error-rate cluster: more than 35% of parsed events are 4xx/5xx.")
  const largeResponses = events.filter((event) => (event.bytes ?? 0) > 5_000_000).length
  if (largeResponses > 0) anomalies.push(`${largeResponses} unusually large response(s) over 5 MB.`)
  return anomalies
}

function detectSuspiciousSequences(events: SecurityLogEvent[]): string[] {
  const sequences: string[] = []
  const byIp = new Map<string, SecurityLogEvent[]>()
  for (const event of events) {
    if (!event.sourceIp) continue
    const list = byIp.get(event.sourceIp) ?? []
    list.push(event)
    byIp.set(event.sourceIp, list)
  }
  for (const [ip, list] of byIp) {
    const notFound = list.filter((event) => event.status === 404).length
    const authErrors = list.filter((event) => event.status === 401 || event.status === 403).length
    const probes = list.filter((event) => /(\.\.|wp-admin|phpmyadmin|\.env|admin|login|debug|shell|cmd=)/i.test(event.path ?? "")).length
    if (notFound >= 10) sequences.push(`${ip}: repeated 404 probing (${notFound} events).`)
    if (authErrors >= 5) sequences.push(`${ip}: repeated auth failures (${authErrors} events).`)
    if (probes > 0) sequences.push(`${ip}: suspicious probe paths observed (${probes} events).`)
  }
  return sequences.slice(0, 20)
}
