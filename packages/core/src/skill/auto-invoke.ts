export type AutoTrigger = "url" | "file-edit" | "dep-change" | "keyword" | "intent" | "error"

export interface AutoInvokeRule {
  trigger:  AutoTrigger
  match:    string | RegExp
  skillIds: string[]
  priority: number
}

const DEFAULT_RULES: AutoInvokeRule[] = [
  { trigger: "url",       match: /https?:\/\//,         skillIds: ["llm-integration"],                             priority: 10 },
  { trigger: "file-edit", match: /\.(tsx|jsx)$/,        skillIds: ["react-expert"],                                priority: 20 },
  { trigger: "file-edit", match: /auth/i,               skillIds: ["authentication-patterns", "security-review"],  priority: 30 },
  { trigger: "file-edit", match: /\.test\.[tj]sx?$/,   skillIds: ["testing-patterns"],                            priority: 20 },
  { trigger: "file-edit", match: /\.sql$/,              skillIds: ["sql-optimization"],                            priority: 20 },
  { trigger: "file-edit", match: /schema\.[tj]s$/,      skillIds: ["drizzle-orm"],                                 priority: 25 },
  { trigger: "file-edit", match: /Dockerfile$/,         skillIds: ["docker-patterns"],                             priority: 20 },
  { trigger: "file-edit", match: /\.css$/,              skillIds: ["css-architecture"],                            priority: 15 },
  { trigger: "keyword",   match: /security|xss|sql.?inject/i, skillIds: ["security-review"],                      priority: 40 },
]

// ─── Intent rules — user message'dan skill tetikle ────────────────────────────
interface IntentRule { match: RegExp; skillIds: string[]; priority: number }

const INTENT_RULES: IntentRule[] = [
  { match: /\bauth\b|log.?in|log.?out|register|sign.?in|sign.?up|session|jwt|oauth|token.?refresh|passw|credential/i,
    skillIds: ["authentication-patterns", "security-review"], priority: 70 },
  { match: /security|xss|csrf|sql.?inject|vulnerabilit|exploit|sanitiz|escape.?html/i,
    skillIds: ["security-review"], priority: 80 },
  { match: /payment|checkout|subscription|billing|stripe|invoice|pric/i,
    skillIds: ["stripe-integration", "webhook-handling"], priority: 65 },
  { match: /\btest\b|spec\b|e2e|unit.?test|integration.?test|coverage|vitest|jest|playwright|cypress/i,
    skillIds: ["testing-patterns"], priority: 65 },
  { match: /performance|slow|optim|latenc|bundle.?size|lighthouse|core.?web.?vital|memory.?leak|profil/i,
    skillIds: ["web-performance", "bundle-optimization"], priority: 60 },
  { match: /ai\b|llm|gpt|claude|gemini|embedding|vector.?db|semantic.?search|rag\b|fine.?tun/i,
    skillIds: ["llm-integration"], priority: 60 },
  { match: /database|migration|schema\b|orm\b|prisma|drizzle|sequel|postgres|mysql|sqlite/i,
    skillIds: ["sql-optimization", "drizzle-orm"], priority: 60 },
  { match: /real.?time|websocket|socket\.io|sse\b|server.?sent|live.?update/i,
    skillIds: ["real-time-patterns"], priority: 55 },
  { match: /cache\b|cach|redis|memcach|invalidat|stale\b|ttl\b|cdn\b/i,
    skillIds: ["redis-patterns", "caching-patterns"], priority: 55 },
  { match: /api.?design|rest.?api|endpoint|route\b|middleware|controller|openapi|swagger/i,
    skillIds: ["rest-api-patterns"], priority: 55 },
  { match: /graph.?ql|apollo|urql|relay\b|mutation\b|subscription\b/i,
    skillIds: ["graphql-patterns"], priority: 55 },
  { match: /state.?manag|global.?state|zustand|redux|jotai|recoil|mobx/i,
    skillIds: ["state-management"], priority: 55 },
  { match: /deploy|ci.?cd|pipeline|docker\b|kubernetes|k8s\b|helm\b/i,
    skillIds: ["docker-patterns", "ci-cd-patterns"], priority: 50 },
  { match: /email\b|smtp|sendgrid|mailgun|nodemailer|newsletter|transactional.?email/i,
    skillIds: ["email-patterns"], priority: 50 },
  { match: /refactor|clean.?up|restructur|technical.?debt|spaghetti|legacy/i,
    skillIds: ["clean-architecture"], priority: 50 },
  { match: /form\b|form.?validat|react.?hook.?form|formik|input.?validat|submit.?handler/i,
    skillIds: ["forms-patterns"], priority: 50 },
  { match: /upload\b|file.?upload|s3\b|object.?storage|blob\b|presigned/i,
    skillIds: ["webhook-handling"], priority: 50 },
  { match: /search\b|full.?text|algolia|elasticsearch|meilisearch|typesense/i,
    skillIds: ["search-patterns"], priority: 50 },
  { match: /monorepo|turborepo|nx\b|workspace\b/i,
    skillIds: ["turborepo-patterns"], priority: 45 },
  { match: /mobile\b|react.?native|expo\b|ios\b|android\b/i,
    skillIds: ["react-native"], priority: 55 },
  { match: /animation|transition|framer.?motion|gsap\b|spring\b/i,
    skillIds: ["animations-patterns"], priority: 45 },
  { match: /accessib|a11y\b|aria\b|wcag\b|screen.?reader/i,
    skillIds: ["accessibility-basics"], priority: 45 },
  { match: /i18n|internationaliz|locale\b|translat|l10n\b|multi.?language/i,
    skillIds: ["internationalization"], priority: 45 },
  { match: /monitor|observ|tracing|opentelemetry|sentry\b|alert\b/i,
    skillIds: ["monitoring-patterns"], priority: 45 },
  // composite stack triggers
  { match: /trpc\b|t3.stack|@trpc\b/i,
    skillIds: ["t3-stack"], priority: 75 },
  { match: /next.?js.*fullstack|server.?action|app.?router|next.?auth|better.?auth/i,
    skillIds: ["next-fullstack"], priority: 72 },
  // new singles
  { match: /vercel.?ai.?sdk|streamText|generateText|streamObject|useChat\b/i,
    skillIds: ["ai-sdk-patterns"], priority: 68 },
  { match: /cloudflare.?worker|wrangler\b|d1.?database|kv.?namespace|durable.?object|r2.?bucket/i,
    skillIds: ["cloudflare-workers"], priority: 65 },
  { match: /db.?migration|schema.?migration|alter.?table|prisma.?migrate|drizzle.?kit/i,
    skillIds: ["database-migrations"], priority: 65 },
  { match: /error.?boundary|componentDidCatch|getDerivedStateFromError|error\.tsx/i,
    skillIds: ["error-boundaries"], priority: 60 },
  { match: /bun\.serve|bun\.file|bun\.write|bun:sqlite|bun.?shell/i,
    skillIds: ["bun-fullstack"], priority: 60 },
  { match: /mock\b|msw\b|nock\b|stub.*(api|request|fetch)|intercept.*(request|http)|fake.*(api|server)/i,
    skillIds: ["api-mocking"], priority: 65 },
  { match: /rate.?limit|throttl|429\b|too many request|ddos.?protect|brute.?force.?protect/i,
    skillIds: ["rate-limiting"], priority: 65 },
  { match: /\bpdf\b|rapor\b|\breport\b|döküman|doküman|\bdocument\b|infographic|brochure|executive.*summar|data.*visualiz|visualiz.*data/i,
    skillIds: ["professional-report-design", "html-to-pdf"], priority: 70 },

  // ── Content-ops: HR & Recruiting ──────────────────────────────────────────
  { match: /\bresume\b|\bcv\b|curriculum.?vitae|job.?descript|job.?posting|interview.?prep|interview.?question|performance.?review|employee.?review|360.?review|onboard(?:ing)?\b|hr.?policy|employee.?handbook|training.?module|culture.?fit|compensation.?bench|salary.?bench|employee.?engagement|culture.?assess/i,
    skillIds: ["resume-builder","resume-screener","job-description-writer","interview-prep","performance-review-generator","onboarding-planner","hr-policy-drafter","training-module-creator","culture-fit-assessor","compensation-analyzer","employee-engagement-analyzer"],
    priority: 60 },

  // ── Content-ops: Sales & Marketing ────────────────────────────────────────
  { match: /\bad.?campaign|advertising.?copy|marketing.?campaign|cold.?email|outreach.?email|email.?sequence|drip.?campaign|sales.?script|sales.?pitch|objection.?handl|sales.?objection|lead.?scor|lead.?qualif|brand.?voice|brand.?tone|copywriting|aida.?formula|social.?media.?post|press.?release|pr.?release|newsletter.?content|proposal.?writ|b2b.?proposal|sales.?proposal/i,
    skillIds: ["ad-campaign-generator","cold-email-writer","email-sequence-builder","sales-script-generator","objection-handler","lead-scorer","brand-voice-analyzer","copywriting-frameworks","newsletter-curator","pr-release-writer","social-media-manager","proposal-writer"],
    priority: 60 },

  // ── Content-ops: Finance & Business ───────────────────────────────────────
  { match: /\bbudget.?plan|expense.?track|expense.?analyz|financial.?forecast|revenue.?forecast|cash.?flow.?model|\binvoic\b|payroll\b|salary.?process|portfolio.?track|tax.?calculat|tax.?estimat|sales.?forecast|crypto.?analyz|receipt.?scan|property.?valuat|real.?estate.?valuat|supply.?chain|crm.?data|crm.?clean/i,
    skillIds: ["budget-planner","expense-analyzer","financial-forecaster","invoice-generator","payroll-processor","sales-forecaster","portfolio-tracker","tax-calculator","crypto-analyzer","receipt-scanner","property-valuation-estimator","supply-chain-analyzer","crm-data-cleaner"],
    priority: 58 },

  // ── Content-ops: Legal & Compliance ───────────────────────────────────────
  { match: /\bcontract.?analyz|contract.?review|compliance.?check|regulatory.?compliance|\bgdpr\b|data.?protection.?audit|\bnda\b|non.?disclosure|privacy.?policy|terms.?of.?service|\btos\b|legal.?research|legal.?translat|trademark.?search|intellectual.?property|lawsuit.?summar/i,
    skillIds: ["contract-analyzer","compliance-checker","gdpr-auditor","nda-drafter","privacy-policy-generator","terms-of-service-generator","legal-researcher","legal-translation","ip-trademark-search","lawsuit-summarizer"],
    priority: 65 },

  // ── Content-ops: Content Writing & Creative ───────────────────────────────
  { match: /\bspeech.?writ|keynote.?speech|story.?plot|plot.?generat|story.?outlin|essay.?grad|thesis.?struct|dissertation.?struct|literature.?review|podcast.?script|apolog.*?email|meditation.?script|\bjoke.?writ|stand.?up.?comedy|negotiat.?simulat|real.?estate.?listing/i,
    skillIds: ["speech-writer","story-plot-generator","podcast-script-writer","thesis-structurer","literature-reviewer","apology-email-writer","meditation-script-writer","joke-writer","negotiation-simulator","real-estate-listing-writer"],
    priority: 55 },

  // ── Content-ops: Education & Learning ────────────────────────────────────
  { match: /\bflashcard|flash.?card|quiz.?generat|quiz.?creat|study.?guide|syllabus\b|lesson.?plan|language.?tutor|knowledge.?base.?articl|course.?outlin|essay.?grad/i,
    skillIds: ["flashcard-maker","quiz-generator","study-guide-creator","syllabus-designer","lesson-planner","language-tutor","knowledge-base-writer","essay-grader"],
    priority: 55 },

  // ── Content-ops: Research & Analytics ────────────────────────────────────
  { match: /\bmarket.?research|seo.?keyword|keyword.?research|sentiment.?analyz|feedback.?analyz|support.?metric|competitor.?price|price.?track|churn.?predict|customer.?churn|customer.?profile|user.?persona\b|citation.?format|bibliography/i,
    skillIds: ["market-researcher","seo-keyword-researcher","feedback-sentiment-analyzer","support-metrics-analyzer","competitor-price-tracker","churn-predictor","customer-profile-builder","citation-formatter"],
    priority: 60 },

  // ── Content-ops: Project Management ──────────────────────────────────────
  { match: /\bgantt\b|\bokr\b|objective.?key.?result|sprint.?plan|workflow.?optim|capacity.?plan|process.?map|business.?process.?map|risk.?assess|risk.?register|vendor.?evaluat|supplier.?evaluat/i,
    skillIds: ["gantt-creator","okr-tracker","sprint-planner","workflow-optimizer","capacity-planner","process-mapper","risk-assessor","risk-register-builder","vendor-evaluator"],
    priority: 55 },

  // ── Content-ops: Customer & Support ──────────────────────────────────────
  { match: /\bmeeting.?summar|meeting.?note|satisfaction.?survey|\bnps.?survey|faq.?generat|frequently.?asked|ticket.?categor|support.?ticket|live.?chat.?template|refund.?process/i,
    skillIds: ["meeting-summarizer","satisfaction-survey-creator","faq-generator","ticket-categorizer","live-chat-responder","refund-processor"],
    priority: 55 },

  // ── Content-ops: Lifestyle & Productivity ─────────────────────────────────
  { match: /\bworkout.?plan|fitness.?plan|nutrition.?analyz|travel.?plan|trip.?plan|event.?plan|habit.?track|diy.?project/i,
    skillIds: ["workout-planner","nutrition-analyzer","travel-planner","event-planner","habit-tracker","diy-project-planner"],
    priority: 50 },

  // ── Content-ops: Pitch & Investor ─────────────────────────────────────────
  { match: /\bpitch.?deck|investor.?deck|startup.?pitch/i,
    skillIds: ["pitch-deck-creator"],
    priority: 65 },

  // ── PPTX generation ───────────────────────────────────────────────────────
  { match: /\bpowerpoint|pptx\b|pptxgenjs|slide.?deck|presentation.*generat/i,
    skillIds: ["pptx-generation"],
    priority: 65 },

  // ── Flutter game ──────────────────────────────────────────────────────────
  { match: /\bflutter.?game|\bflame.?engine|flutter.*\bgame\b/i,
    skillIds: ["flutter-game-expert"],
    priority: 55 },
]

// ─── Error rules — hata mesajından skill tetikle ──────────────────────────────
interface ErrorRule { match: RegExp; skillIds: string[] }

const ERROR_RULES: ErrorRule[] = [
  { match: /TS\d{4}|typescript.?error|type.?error|property.*does not exist|cannot.*type|is not assignable/i,
    skillIds: ["typescript-expert"] },
  { match: /cannot find module|module not found|failed to resolve|esm.*(error|import)/i,
    skillIds: ["nodejs-expert"] },
  { match: /cors|cross.?origin|access.?control.?allow/i,
    skillIds: ["rest-api-patterns"] },
  { match: /hydrat|client.?server.?mismatch|useEffect.*warning|react.*warning/i,
    skillIds: ["nextjs-expert", "react-expert"] },
  { match: /prisma.*error|unique constraint|foreign key|P\d{4}|drizzle/i,
    skillIds: ["drizzle-orm", "sql-optimization"] },
  { match: /econnrefused|connection refused|ENOTFOUND|timeout.*network/i,
    skillIds: ["rest-api-patterns", "nodejs-expert"] },
  { match: /heap.*(out|exceeded)|maximum.*stack|out of memory|memory.?leak/i,
    skillIds: ["web-performance"] },
  { match: /infinite.*(loop|render)|too many re.?render|maximum update depth/i,
    skillIds: ["react-expert"] },
  { match: /undefined.*null|cannot read.*propert|is not a function|of undefined/i,
    skillIds: ["typescript-expert"] },
  { match: /permission denied|EACCES|EPERM|unauthorized|403\b/i,
    skillIds: ["security-review", "authentication-patterns"] },
]

function testMatch(match: string | RegExp, value: string): boolean {
  if (typeof match === "string") return value.includes(match)
  return match.test(value)
}

class AutoInvoker {
  private customRules: AutoInvokeRule[] = []

  check(trigger: AutoTrigger, value: string): string[] {
    const allRules = [...DEFAULT_RULES, ...this.customRules]
      .filter((r) => r.trigger === trigger)
      .sort((a, b) => b.priority - a.priority)

    const ids = new Set<string>()
    for (const rule of allRules) {
      if (testMatch(rule.match, value)) {
        for (const id of rule.skillIds) ids.add(id)
      }
    }
    return [...ids]
  }

  /** User mesajından intent-based skill ID'leri döndür */
  checkMessage(text: string): string[] {
    const sorted = [...INTENT_RULES].sort((a, b) => b.priority - a.priority)
    const ids = new Set<string>()
    for (const rule of sorted) {
      if (rule.match.test(text)) {
        for (const id of rule.skillIds) ids.add(id)
      }
    }
    return [...ids]
  }

  /** Hata mesajından skill ID'leri döndür */
  checkError(errorText: string): string[] {
    const ids = new Set<string>()
    for (const rule of ERROR_RULES) {
      if (rule.match.test(errorText)) {
        for (const id of rule.skillIds) ids.add(id)
      }
    }
    return [...ids]
  }

  addRule(rule: AutoInvokeRule): void {
    this.customRules.push(rule)
  }

  listRules(): AutoInvokeRule[] {
    return [...DEFAULT_RULES, ...this.customRules]
  }
}

export const autoInvoker = new AutoInvoker()
