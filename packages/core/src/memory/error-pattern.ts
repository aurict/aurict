import { memoryStore } from "./store.js"
import type { Category, Scope } from "./types.js"

/**
 * Error Pattern Memory
 * 
 * Agent'ın yaptığı hataları hafızaya kaydeder.
 * Aynı hatayı tekrar yapmadan ÖNCE ilgili pattern'ı kontrol eder.
 */

export interface ErrorPattern {
  pattern: string     // "Importing X from wrong path"
  context: string     // "When editing files in src/tool/"
  solution: string    // "Check tsconfig paths first"
  frequency: number
  lastSeen: number
}

// In-memory cache for quick lookup
const patternCache = new Map<string, ErrorPattern>()
let cacheLoaded = false

/**
 * Load error patterns from memory store.
 */
function loadPatterns(): void {
  if (cacheLoaded) return
  
  try {
    const memories = memoryStore.list()
    for (const m of memories) {
      if (m.category === "pattern" && m.tags?.includes("error-pattern")) {
        // Parse pattern from content
        const match = m.content.match(/^Pattern: (.+?) \| Context: (.+?) \| Solution: (.+?) \| Freq: (\d+)$/)
        if (match) {
          const pattern: ErrorPattern = {
            pattern: match[1]!,
            context: match[2]!,
            solution: match[3]!,
            frequency: parseInt(match[4]!, 10),
            lastSeen: m.timestamp,
          }
          patternCache.set(pattern.pattern, pattern)
        }
      }
    }
  } catch {
    // Memory store may not be initialized yet
  }
  
  cacheLoaded = true
}

/**
 * Record an error pattern.
 * Called when agent makes a mistake and learns from it.
 */
export function recordErrorPattern(
  error: string,
  context: string,
  solution: string,
): void {
  loadPatterns()
  
  // Normalize error message (first 100 chars, lowercase)
  const normalizedError = error.slice(0, 100).toLowerCase().trim()
  const normalizedContext = context.slice(0, 100).toLowerCase().trim()
  const key = `${normalizedError}|${normalizedContext}`
  
  const existing = patternCache.get(key)
  
  if (existing) {
    // Update frequency
    existing.frequency++
    existing.lastSeen = Date.now()
    
    // Update in memory store
    try {
      const memories = memoryStore.list()
      for (const m of memories) {
        if (m.category === "pattern" && m.tags?.includes("error-pattern")) {
          if (m.content.includes(existing.pattern.slice(0, 50))) {
            // Update existing memory
            memoryStore.remove(m.id)
            break
          }
        }
      }
    } catch { /* ignore */ }
  }
  
  // Save to memory store
  const content = `Pattern: ${error.slice(0, 100)} | Context: ${context.slice(0, 100)} | Solution: ${solution.slice(0, 100)} | Freq: ${existing ? existing.frequency : 1}`
  
  try {
    memoryStore.add({
      content,
      category: "pattern" as Category,
      scope: "project" as Scope,
      source: "auto",
      tags: ["error-pattern"],
    })
    
    // Update cache
    patternCache.set(key, {
      pattern: error.slice(0, 100),
      context: context.slice(0, 100),
      solution: solution.slice(0, 100),
      frequency: existing ? existing.frequency : 1,
      lastSeen: Date.now(),
    })
  } catch { /* ignore */ }
}

/**
 * Get relevant error patterns for a given context.
 * Called before agent makes a decision to warn about past mistakes.
 */
export function getRelevantErrorPatterns(context: string): ErrorPattern[] {
  loadPatterns()
  
  const normalizedContext = context.toLowerCase()
  const relevant: ErrorPattern[] = []
  
  for (const pattern of patternCache.values()) {
    // Check if context matches
    if (normalizedContext.includes(pattern.context.toLowerCase())) {
      // Only return patterns seen at least twice
      if (pattern.frequency >= 2) {
        relevant.push(pattern)
      }
    }
  }
  
  // Sort by frequency (most common first)
  return relevant.sort((a, b) => b.frequency - a.frequency).slice(0, 3)
}

/**
 * Format error patterns for injection into prompt.
 */
export function formatErrorPatterns(patterns: ErrorPattern[]): string {
  if (patterns.length === 0) return ""
  
  const lines = [
    "\n[RECURRING ERROR PATTERNS — AVOID THESE MISTAKES]",
    ...patterns.map((p, i) => `${i + 1}. ${p.pattern} → ${p.solution} (seen ${p.frequency}x)`),
  ]
  
  return lines.join("\n")
}

/**
 * Clear the pattern cache (for testing).
 */
export function clearPatternCache(): void {
  patternCache.clear()
  cacheLoaded = false
}
