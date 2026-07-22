import { generateText } from "ai"
import type { CoreMessage } from "ai"
import { ProviderRegistry } from "../provider/registry.js"
import type { UtilityModelSelection } from "../provider/utility-model.js"
import { memoryStore } from "./store.js"
import type { Category, Scope } from "./types.js"

interface ExtractedFact {
  category: Category
  scope: Scope
  content: string
}

const VALID_CATEGORIES = new Set<Category>(["preference", "project", "fact", "decision", "pattern"])
const VALID_SCOPES = new Set<Scope>(["global", "project"])

const EXTRACTION_PROMPT = `Review this conversation and identify 1-5 genuinely useful facts worth remembering for FUTURE sessions.
Focus on user preferences, durable project facts, recurring workflows, key discoveries, and decisions.
Return a JSON array of { "category": "preference|project|fact|decision|pattern", "scope": "global|project", "content": "one clear sentence" }.
Return exactly NONE if there is nothing durable to remember. Do not store trivial or session-specific details.`

const PER_TURN_EXTRACTION_PROMPT = `Review only these recent messages for durable preferences, project facts, decisions, or user corrections.
Return JSON: { "memories": [{ "category": "preference|project|fact|decision|pattern", "scope": "global|project", "content": "one clear sentence" }] }.
Return { "memories": [] } when nothing will help a FUTURE session. Be very selective.`

export async function extractPerTurnMemories(
  provider: string,
  model: string,
  messages: CoreMessage[],
  workdir: string,
  utility?: UtilityModelSelection,
): Promise<void> {
  const recent = messages.slice(-5)
  if (recent.length < 2) return

  const route = utility ?? primaryRoute(provider, model, 400)
  const result = await generateText({
    model: ProviderRegistry.get(route.provider).getModel(route.model),
    system: PER_TURN_EXTRACTION_PROMPT,
    messages: recent,
    maxTokens: Math.min(route.maxOutputTokens, 400),
  })
  const facts = parsePerTurnFacts(result.text)
  storeFacts(facts.slice(0, 3), workdir)
}

export async function extractAndStoreMemories(
  provider: string,
  model: string,
  messages: CoreMessage[],
  workdir: string,
  utility?: UtilityModelSelection,
): Promise<void> {
  if (messages.length < 4) return

  const route = utility ?? primaryRoute(provider, model, 800)
  const result = await generateText({
    model: ProviderRegistry.get(route.provider).getModel(route.model),
    system: EXTRACTION_PROMPT,
    messages: messages.slice(-30),
    maxTokens: Math.min(route.maxOutputTokens, 800),
  })
  const facts = parseSessionFacts(result.text)
  storeFacts(facts.slice(0, 5), workdir)
  if (facts.length > 0) memoryStore.exportToFile(workdir)
}

export function parsePerTurnFacts(rawOutput: string): ExtractedFact[] {
  const raw = rawOutput.trim()
  if (!raw) return []
  const json = raw.match(/\{[\s\S]*"memories"[\s\S]*\}/)?.[0]
  if (!json) throw new Error("Memory extractor returned no memories JSON object")
  const parsed = JSON.parse(json) as { memories?: unknown }
  return validateFacts(parsed.memories)
}

export function parseSessionFacts(rawOutput: string): ExtractedFact[] {
  const raw = rawOutput.trim()
  if (!raw || raw === "NONE") return []
  const json = raw.match(/\[[\s\S]*\]/)?.[0]
  if (!json) throw new Error("Memory extractor returned neither exact NONE nor a JSON array")
  return validateFacts(JSON.parse(json))
}

function validateFacts(value: unknown): ExtractedFact[] {
  if (!Array.isArray(value)) throw new Error("Memory extractor JSON payload is not an array")
  return value.flatMap((candidate): ExtractedFact[] => {
    if (!candidate || typeof candidate !== "object") return []
    const fact = candidate as Record<string, unknown>
    if (typeof fact["content"] !== "string" || !fact["content"].trim()) return []
    if (!VALID_CATEGORIES.has(fact["category"] as Category)) return []
    if (!VALID_SCOPES.has(fact["scope"] as Scope)) return []
    return [{
      content: fact["content"].trim(),
      category: fact["category"] as Category,
      scope: fact["scope"] as Scope,
    }]
  })
}

function storeFacts(facts: ExtractedFact[], workdir: string): void {
  for (const fact of facts) {
    memoryStore.add({
      ...fact,
      source: "auto",
      ...(fact.scope === "project" ? { project: workdir } : {}),
    })
  }
}

function primaryRoute(provider: string, model: string, maxOutputTokens: number): UtilityModelSelection {
  return {
    provider,
    model,
    maxInputTokens: 24_000,
    maxOutputTokens,
    source: "primary-visible-fallback",
  }
}
