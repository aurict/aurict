import type { TaskComplexity } from "../provider/router.js"
import {
  detectComplexitySignals,
  isActionableTask,
  isExplanationRequest,
  type ComplexitySignalId,
} from "./complexity-signals.js"

/**
 * Faz 2 — Karmaşıklık Sinyali Merkezileştirme
 *
 * Önceden loop.ts:computeAdaptiveMaxSteps (sadece metin uzunluğu + regex) ve
 * router.ts:ModelRouter.detectComplexity (mesaj/tool sayısı, hiç çağrılmıyordu)
 * ayrı ayrı vardı. Bu modül tek kaynak: adaptif step limit VE adaptif reasoning
 * effort aynı skordan türetilir.
 *
 * Felsefe: "downgrade değil escalate" — ek sinyaller (değişen dosya sayısı,
 * tekrarlayan başarısızlık) skoru sadece YÜKSELTİR, asla düşürmez. Zorlaşan bir
 * görevde model daha çok düşünsün / daha çok adım hakkı alsın; kolay bir görevde
 * gereksiz maliyet yaratmayalım.
 */

export interface ComplexitySignal {
  /** Son user mesajının metni (extractText ile çıkarılmış — multimodal içerik dahil). */
  text: string
  /** Continuation turn'lerinde kısa son mesajın önceki görev zorluğunu silmesini önler. */
  objective?: string
  hasAttachments: boolean
  /** Bu session'da daha önce (önceki turn'lerde) tetiklenmiş tool/working-set öğe sayısı. */
  priorToolCalls?: number
  /** Bu session'da şu ana kadar değişen dosya sayısı (working-set'ten). */
  changedFiles?: number
  /** Aktif (strategyShiftRequired) failure-cooldown kaydı sayısı. */
  priorFailures?: number
}

export interface ComplexityAssessment {
  level: TaskComplexity
  /** 0-100 — level'dan daha ince taneli, effort türetmek için kullanılır. */
  score: number
  /** Skoru yükselten alan-zorluğu sinyalleri; telemetry/debug amaçlıdır. */
  signals: ComplexitySignalId[]
}

/**
 * Bir turn'ün karmaşıklığını 0-100 skor + 4 seviyeli bir level'a indirger.
 * Her zaman bir sonuç döner (never throws, never undefined).
 */
export function assessComplexity(signal: ComplexitySignal): ComplexityAssessment {
  const text = signal.text ?? ""
  const objective = signal.objective?.trim() ?? ""
  const taskText = objective || text
  const combinedText = objective && objective !== text ? `${objective}\n${text}` : taskText
  const difficulty = detectComplexitySignals(combinedText)
  const explicitAction = isActionableTask(combinedText)
  const explanationOnly = isExplanationRequest(text) && !isActionableTask(text) && !objective
  // Coding-agent prompts frequently use terse issue titles ("intermittent memory leak")
  // as imperatives. Treat those as actionable unless they are clearly explanatory.
  const looksActionable = explicitAction || (difficulty.ids.length > 0 && !explanationOnly)
  const priorToolCalls = Math.max(0, signal.priorToolCalls ?? 0)
  const changedFiles = Math.max(0, signal.changedFiles ?? 0)
  const priorFailures = Math.max(0, signal.priorFailures ?? 0)

  // --- Temel skor: metin uzunluğu + eyleme geçirilebilirlik (eski
  // computeAdaptiveMaxSteps eşikleriyle aynı basamaklar) ---
  let score: number
  if (signal.hasAttachments) {
    score = 55
  } else if (taskText.length < 100 && !looksActionable) {
    score = 5
  } else if (taskText.length < 500) {
    score = looksActionable ? 40 : 25
  } else if (taskText.length < 2000) {
    score = 65
  } else {
    score = 80
  }

  // --- Ek sinyaller: mevcut çalışma zaten zorlaştığını gösteriyorsa YÜKSELT ---
  score += Math.min(15, priorToolCalls * 1.5)
  score += Math.min(15, changedFiles * 3)
  score += Math.min(25, priorFailures * 12)   // tekrarlayan başarısızlık en güçlü sinyal
  score += difficulty.scoreBoost
  if (difficulty.ids.length > 0) {
    score = Math.max(score, looksActionable ? difficulty.actionableFloor : 40)
  }

  score = Math.max(0, Math.min(100, Math.round(score)))

  let level: TaskComplexity
  if (score < 15)      level = "trivial"
  else if (score < 40) level = "simple"
  else if (score < 65) level = "moderate"
  else                 level = "complex"

  return { level, score, signals: difficulty.ids }
}

// Eski computeAdaptiveMaxSteps'in 5 basamağını (20/40/80/100/120) 4 seviyeye
// indirger — "500-2000 karakter → 100 step" ara basamağı complex'e katlanır.
// Bu, planın "tek kaynak" konsolidasyonunun kasıtlı bir sadeleştirmesidir.
const STEPS_BY_LEVEL: Record<TaskComplexity, number> = {
  trivial:  20,
  simple:   40,
  moderate: 80,
  complex:  120,
}

export function stepsForComplexity(level: TaskComplexity): number {
  return STEPS_BY_LEVEL[level]
}

// /model effort picker'ındaki Off/Low/Medium/High/Max ölçeğiyle aynı token
// bütçeleri (bkz. cli/src/commands/registry.ts) — kullanıcının elle seçtiği
// değerlerle aynı birimde, tutarlı bir otomatik tahmin üretir.
export function deriveReasoningEffort(score: number, cap?: number): number {
  let budget: number
  if (score < 15)      budget = 0
  else if (score < 40) budget = 4_000
  else if (score < 65) budget = 10_000
  else if (score < 85) budget = 20_000
  else                 budget = 32_000
  if (cap === undefined) return budget
  return Math.min(budget, Math.max(0, cap))
}
