export type ComplexitySignalId =
  | "concurrency"
  | "security"
  | "intermittent_failure"
  | "resource_leak"
  | "data_integrity"
  | "distributed_system"
  | "production_performance"

export interface DetectedComplexitySignals {
  ids: ComplexitySignalId[]
  scoreBoost: number
  actionableFloor: number
}

interface SignalDefinition {
  id: ComplexitySignalId
  pattern: RegExp
  weight: number
  actionableFloor: number
}

function phrase(source: string): RegExp {
  return new RegExp(`(?:^|[^\\p{L}\\p{N}_])(?:${source})(?=$|[^\\p{L}\\p{N}_])`, "iu")
}

const SIGNALS: SignalDefinition[] = [
  {
    id: "concurrency",
    pattern: phrase("race condition|deadlock|livelock|atomicity|concurren(?:cy|t)|thread[\\s-]?safe|mutex|semaphore|eşzamanlı(?:lık)?|yarış durumu|kilitlenme"),
    weight: 26,
    actionableFloor: 68,
  },
  {
    id: "security",
    pattern: phrase("security audit|vulnerab(?:ility|le)|exploit|privilege escalation|authorization bypass|authentication bypass|(?:sql|command|code|prompt) injection|secret leak|güvenlik denetimi|güvenlik açığ[ıi](?:n[ıi])?|yetki atlama|zafiyet"),
    weight: 26,
    actionableFloor: 68,
  },
  {
    id: "intermittent_failure",
    pattern: phrase("intermittent|flaky|nondeterministic|non-deterministic|heisenbug|sporadic|aralıklı|rastlantısal|kararsız test"),
    weight: 18,
    actionableFloor: 65,
  },
  {
    id: "resource_leak",
    pattern: phrase("memory leak|resource leak|handle leak|file descriptor leak|out of memory|oom|resource exhaustion|bellek sızıntıs[ıi](?:n[ıi])?|kaynak sızıntıs[ıi](?:n[ıi])?"),
    weight: 24,
    actionableFloor: 68,
  },
  {
    id: "data_integrity",
    pattern: phrase("data corruption|data loss|silent corruption|schema migration|zero[\\s-]?downtime migration|veri bozulmas[ıi](?:n[ıi])?|veri kayb[ıi](?:n[ıi])?|şema geçişi|şema migrasyonu"),
    weight: 24,
    actionableFloor: 68,
  },
  {
    id: "distributed_system",
    pattern: phrase("distributed system|eventual consistency|consensus|split[\\s-]?brain|replication lag|distributed transaction|dağıtık sistem|nihai tutarlılık|replikasyon gecikmesi"),
    weight: 22,
    actionableFloor: 65,
  },
  {
    id: "production_performance",
    pattern: phrase("production incident|latency regression|performance regression|p(?:95|99)|throughput collapse|prod incident|üretim olay[ıi](?:n(?:da|daki))?|gecikme regresyonu|performans gerilemesi"),
    weight: 20,
    actionableFloor: 65,
  },
]

const ACTIONABLE_RE = /\b(fix|implement|build|create|add|update|refactor|debug|test|run|verify|make|change|edit|write|generate|complete|finish|continue|audit|review|investigate|analy[sz]e|resolve|mitigate|devam|tamamla|d[uü]zelt|ekle|olu[sş]tur|g[uü]ncelle|test et|do[gğ]rula|bitir|yap|incele|ara[sş]t[ıi]r|denetle|analiz et|çöz)\b/i
const EXPLANATION_RE = /^\s*(what is|what are|explain|describe|how does|why does|nedir|ne demek|açıkla|nasıl çalışır|neden)\b/i

export function detectComplexitySignals(text: string): DetectedComplexitySignals {
  const matches = SIGNALS.filter(signal => signal.pattern.test(text))
  return {
    ids: matches.map(signal => signal.id),
    scoreBoost: Math.min(40, matches.reduce((total, signal) => total + signal.weight, 0)),
    actionableFloor: matches.reduce((floor, signal) => Math.max(floor, signal.actionableFloor), 0),
  }
}

export function isActionableTask(text: string): boolean {
  return ACTIONABLE_RE.test(text)
}

export function isExplanationRequest(text: string): boolean {
  return EXPLANATION_RE.test(text)
    || /^\s*(?:can you |could you )?(?:tell me|help me understand)\b/i.test(text)
    || /\b(nedir|ne demek|açıklar mısın|anlatır mısın)\??\s*$/i.test(text)
}
