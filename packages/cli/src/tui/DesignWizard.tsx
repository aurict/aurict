import React, { useState, useMemo } from "react"
import { Box, Text, useInput } from "ink"
import { useTheme } from "../utils/theme.js"
import { DesignLoader, matchDesign, loadDesignPrefs } from "@aurict/core"
import type { DesignSystem, Skill, MatchResult } from "@aurict/core"

// ── Types ─────────────────────────────────────────────────────────────────────

export interface DesignWizardResult {
  brief:    string
  systemId: string
  skillId:  string
}

interface Props {
  workdir: string
  initialBrief?: string | undefined
  onLaunch: (result: DesignWizardResult) => void
  onClose:  () => void
}

type Step = "brief" | "skill" | "system" | "confirm"

// ── Helpers ───────────────────────────────────────────────────────────────────

function fuzzyFilter<T>(items: T[], getText: (item: T) => string, query: string): T[] {
  if (!query) return items
  const q = query.toLowerCase()
  return items.filter(item => getText(item).toLowerCase().includes(q))
}

function truncate(text: string, max: number): string {
  if (text.length <= max) return text
  return text.slice(0, Math.max(0, max - 1)) + "…"
}

function assetBadges(skill: Skill): string {
  const badges: string[] = []
  if (skill.hasTemplate) badges.push("template")
  if (skill.hasLayouts) badges.push("layouts")
  return badges.join(" · ")
}

function WizardHeader({ step, title, detail }: { step: number; title: string; detail?: string }) {
  const theme = useTheme()
  const marks = [1, 2, 3, 4].map(i => i < step ? "●" : i === step ? "◆" : "·").join(" ")
  return (
    <Box flexDirection="column" gap={0}>
      <Box justifyContent="space-between">
        <Text color={theme.accent} bold>✦ Design Wizard</Text>
        <Text color={theme.textDim} dimColor>{marks}  {step}/4</Text>
      </Box>
      <Text color={theme.textPrimary} bold>{title}</Text>
      {detail && <Text color={theme.textDim} dimColor>{truncate(detail, 76)}</Text>}
    </Box>
  )
}

// ── Step components ────────────────────────────────────────────────────────────

function BriefStep({ initialBrief, onNext, onClose }: { initialBrief?: string; onNext: (brief: string) => void; onClose: () => void }) {
  const theme   = useTheme()
  const [text, setText] = useState(initialBrief ?? "")
  const [cursor, setCursor] = useState((initialBrief ?? "").length)

  useInput((input, key) => {
    if (key.escape)  { onClose(); return }
    if (key.return && text.trim()) { onNext(text.trim()); return }
    if (key.backspace || key.delete) {
      if (cursor > 0) { setText(t => t.slice(0, cursor - 1) + t.slice(cursor)); setCursor(c => c - 1) }
      return
    }
    if (key.leftArrow)  { setCursor(c => Math.max(0, c - 1)); return }
    if (key.rightArrow) { setCursor(c => Math.min(text.length, c + 1)); return }
    if (input && !key.ctrl && !key.meta) {
      setText(t => t.slice(0, cursor) + input + t.slice(cursor))
      setCursor(c => c + input.length)
    }
  })

  const before = text.slice(0, cursor)
  const at     = text[cursor] ?? " "
  const after  = text.slice(cursor + 1)

  return (
    <Box flexDirection="column" gap={1}>
      <WizardHeader step={1} title="Describe the UI you want" />
      <Text color={theme.textSecondary}>Write the outcome, product type, mood, and key screens.</Text>
      <Box borderStyle="single" borderColor={theme.accent} paddingX={1} width={68}>
        <Text>
          {before}
          <Text backgroundColor={theme.accent} color="black">{at}</Text>
          {after}
        </Text>
      </Box>
      <Text color={theme.textDim} dimColor>Enter to continue · Esc to cancel</Text>
      <Text color={theme.textDim} dimColor italic>
        e.g. "Linear-style SaaS app dashboard" · "Stripe-style pricing" · "Mobile onboarding"
      </Text>
    </Box>
  )
}

function SkillStep({
  match, skills, onSelect, onBack,
}: {
  match: MatchResult; skills: Skill[]
  onSelect: (skillId: string) => void; onBack: () => void
}) {
  const theme = useTheme()
  const [query,  setQuery]  = useState("")
  const [cursor, setCursor] = useState(0)

  const filtered = useMemo(() =>
    fuzzyFilter(skills, s => `${s.id} ${s.name} ${s.description} ${s.triggers.join(" ")}`, query),
    [skills, query]
  )
  const total = filtered.length

  useInput((input, key) => {
    if (key.escape)   { onBack(); return }
    if (key.tab)      { onSelect(match.skill.id); return }
    if (key.return)   { const s = filtered[cursor]; if (s) onSelect(s.id); return }
    if (key.upArrow)  { setCursor(c => Math.max(0, c - 1)); return }
    if (key.downArrow){ setCursor(c => Math.min(Math.max(0, total - 1), c + 1)); return }
    if (key.backspace || key.delete) { setQuery(q => q.slice(0, -1)); setCursor(0); return }
    if (input && !key.ctrl && !key.meta) { setQuery(q => q + input); setCursor(0); return }
  })

  const shown   = filtered.slice(0, 10)
  const safeCur = Math.max(0, Math.min(cursor, Math.max(0, shown.length - 1)))
  const current = shown[safeCur]

  return (
    <Box flexDirection="column" gap={1}>
      <WizardHeader step={2} title="Choose the design workflow" detail={`Matched from brief · skill score ${match.skillScore}`} />
      <Box>
        <Text color={theme.textDim}>Suggested: </Text>
        <Text color={theme.accent} bold>{match.skill.name}</Text>
        <Text color={theme.textDim}> — Tab accepts suggestion</Text>
      </Box>
      <Box borderStyle="single" borderColor={theme.borderDim} paddingX={1} width={50}>
        <Text color={theme.textDim}>/ </Text>
        <Text>{query}{" "}</Text>
      </Box>
      <Box flexDirection="column">
        {shown.map((s, i) => {
          const selected = i === safeCur
          return (
            <Box key={s.id} gap={1}>
              <Text color={selected ? theme.accent : theme.borderDim}>{selected ? "▶" : " "}</Text>
              <Text color={selected ? theme.textPrimary : theme.textSecondary} bold={selected}>
                {s.name || s.id}
              </Text>
              <Text color={theme.textDim} dimColor>{s.mode}</Text>
              {assetBadges(s) && <Text color={theme.borderBright} dimColor>{assetBadges(s)}</Text>}
              {s.id === match.skill.id && <Text color={theme.accent} dimColor>★</Text>}
            </Box>
          )
        })}
        {total === 0 && <Text color={theme.textDim} dimColor>  No workflow matched this filter.</Text>}
        {total > 10 && <Text color={theme.textDim} dimColor>  …{total - 10} more ({total} total)</Text>}
      </Box>
      {current && (
        <Box flexDirection="column" borderStyle="single" borderColor={theme.borderDim} paddingX={1}>
          <Text color={theme.textPrimary} bold>{current.name}</Text>
          <Text color={theme.textDim}>{truncate(current.description || "No description provided.", 88)}</Text>
          <Text color={theme.borderBright} dimColor>
            mode: {current.mode}{assetBadges(current) ? ` · ${assetBadges(current)}` : ""}
          </Text>
        </Box>
      )}
      <Text color={theme.textDim} dimColor>↑↓ navigate · type to filter · Tab suggestion · Enter select · Esc back</Text>
    </Box>
  )
}

function SystemStep({
  match, systems, onSelect, onBack,
}: {
  match: MatchResult; systems: DesignSystem[]
  onSelect: (systemId: string) => void; onBack: () => void
}) {
  const theme  = useTheme()
  const prefs  = useMemo(() => loadDesignPrefs(), [])
  const [query,  setQuery]  = useState("")
  const [cursor, setCursor] = useState(0)

  const sorted = useMemo(() => {
    const base = fuzzyFilter(systems, s => `${s.id} ${s.name} ${s.category} ${s.tagline}`, query)
    if (query) return base
    // Pin recently used + match suggestion to top
    const recent = prefs.recentSystemIds.filter(id => base.some(s => s.id === id))
    const pinned = [match.system.id, ...recent].filter((id, i, a) => a.indexOf(id) === i)
    const pinnedItems = pinned.map(id => base.find(s => s.id === id)).filter(Boolean) as DesignSystem[]
    const rest        = base.filter(s => !pinned.includes(s.id))
    return [...pinnedItems, ...rest]
  }, [systems, query, prefs, match.system.id])

  const total   = sorted.length
  const shown   = sorted.slice(0, 12)
  const safeCur = Math.min(cursor, shown.length - 1)

  useInput((input, key) => {
    if (key.escape)    { onBack(); return }
    if (key.tab)       { onSelect(match.system.id); return }
    if (key.return)    { const s = shown[safeCur]; if (s) onSelect(s.id); return }
    if (key.upArrow)   { setCursor(c => Math.max(0, c - 1)); return }
    if (key.downArrow) { setCursor(c => Math.min(Math.max(0, shown.length - 1), c + 1)); return }
    if (key.backspace || key.delete) { setQuery(q => q.slice(0, -1)); setCursor(0); return }
    if (input && !key.ctrl && !key.meta) { setQuery(q => q + input); setCursor(0); return }
  })

  const cur = shown[safeCur]

  return (
    <Box flexDirection="column" gap={1}>
      <WizardHeader step={3} title="Choose the visual system" detail={`Matched from brief · system score ${match.systemScore}`} />
      <Box>
        <Text color={theme.textDim}>Suggested: </Text>
        <Text color={theme.accent} bold>{match.system.name}</Text>
        <Text color={theme.textDim}> · {match.system.category}</Text>
        <Text color={theme.textDim}> · Tab accepts</Text>
      </Box>
      <Box borderStyle="single" borderColor={theme.borderDim} paddingX={1} width={50}>
        <Text color={theme.textDim}>/ </Text>
        <Text>{query}{" "}</Text>
      </Box>
      <Box flexDirection="row" gap={2} alignItems="flex-start">
        {/* Liste */}
        <Box flexDirection="column" width={34}>
          {shown.map((s, i) => {
            const selected = i === safeCur
            const isMatch  = s.id === match.system.id
            const isRecent = prefs.recentSystemIds.includes(s.id)
            return (
              <Box key={s.id} gap={1}>
                <Text color={selected ? theme.accent : theme.borderDim}>{selected ? "▶" : " "}</Text>
                <Text color={selected ? theme.textPrimary : theme.textSecondary} bold={selected}>
                  {truncate(s.name, 22)}
                </Text>
                {isMatch  && <Text color={theme.accent} dimColor>★</Text>}
                {isRecent && !isMatch && <Text color={theme.textDim} dimColor>↺</Text>}
              </Box>
            )
          })}
          {total > 12 && <Text color={theme.textDim} dimColor>  …{total - 12} more</Text>}
        </Box>

        {/* Önizleme */}
        {cur && (
          <Box flexDirection="column" width={34} borderStyle="single" borderColor={theme.borderDim} paddingX={1}>
            <Text color={theme.accent} bold>{cur.name}</Text>
            <Text color={theme.textDim} dimColor>{cur.category}</Text>
            {cur.tagline && <Text color={theme.textSecondary} italic dimColor>{truncate(cur.tagline, 72)}</Text>}
            {match.alternatives.length > 0 && (
              <Text color={theme.borderBright} dimColor>
                alternatives: {match.alternatives.slice(0, 3).map(s => s.name).join(", ")}
              </Text>
            )}
          </Box>
        )}
      </Box>
      <Text color={theme.textDim} dimColor>↑↓ navigate · type to filter · Tab suggestion · Enter select · Esc back</Text>
    </Box>
  )
}

function ConfirmStep({
  brief, systemId, skillId, systems, skills, onConfirm, onBack,
}: {
  brief: string; systemId: string; skillId: string
  systems: DesignSystem[]; skills: Skill[]
  onConfirm: () => void; onBack: () => void
}) {
  const theme  = useTheme()
  const system = systems.find(s => s.id === systemId)
  const skill  = skills.find(s => s.id === skillId)

  useInput((_input, key) => {
    if (key.escape) { onBack(); return }
    if (key.return) { onConfirm(); return }
  })

  return (
    <Box flexDirection="column" gap={1}>
      <WizardHeader step={4} title="Review and launch" detail="Aurict will turn this selection into an implementation prompt." />
      <Box flexDirection="column" borderStyle="round" borderColor={theme.accent} paddingX={2} paddingY={1} gap={0}>
        <Box gap={2}>
          <Text color={theme.textDim} dimColor>{"Brief      "}</Text>
          <Text color={theme.textPrimary} bold>{truncate(brief, 76)}</Text>
        </Box>
        <Box gap={2}>
          <Text color={theme.textDim} dimColor>{"Skill      "}</Text>
          <Text color={theme.textPrimary}>{skill?.name ?? skillId}</Text>
          <Text color={theme.textDim} dimColor>{skill?.mode}</Text>
          {skill && assetBadges(skill) && <Text color={theme.borderBright} dimColor>{assetBadges(skill)}</Text>}
        </Box>
        <Box gap={2}>
          <Text color={theme.textDim} dimColor>{"Design sys "}</Text>
          <Text color={theme.textPrimary}>{system?.name ?? systemId}</Text>
          <Text color={theme.textDim} dimColor>{system?.category}</Text>
        </Box>
        <Box gap={2}>
          <Text color={theme.textDim} dimColor>{"Output     "}</Text>
          <Text color={theme.textSecondary}>~/.aurict/designs/…/index.html</Text>
        </Box>
      </Box>
      <Box gap={2}>
        <Text color={theme.success} bold>Enter</Text><Text color={theme.textSecondary}>— launch</Text>
        <Text color={theme.textDim} bold>Esc</Text><Text color={theme.textDim} dimColor>— back</Text>
      </Box>
      <Text color={theme.textDim} dimColor>The generated prompt will be sent as the next user message.</Text>
    </Box>
  )
}

// ── Main Wizard ───────────────────────────────────────────────────────────────

export function DesignWizard({ workdir, initialBrief, onLaunch, onClose }: Props) {
  const theme = useTheme()
  const initial = initialBrief?.trim() ?? ""
  const initialMatch = useMemo(() => initial ? matchDesign(initial) : null, [initial])
  const [step,     setStep]     = useState<Step>(initialMatch ? "skill" : "brief")
  const [brief,    setBrief]    = useState(initial)
  const [skillId,  setSkillId]  = useState(initialMatch?.skill.id ?? "")
  const [systemId, setSystemId] = useState(initialMatch?.system.id ?? "")
  const [match,    setMatch]    = useState<MatchResult | null>(initialMatch)

  const systems = useMemo(() => DesignLoader.listSystems(), [])
  const skills  = useMemo(() => DesignLoader.listSkills(),  [])

  function handleBrief(b: string) {
    setBrief(b)
    const m = matchDesign(b)
    setMatch(m)
    setSkillId(m.skill.id)
    setSystemId(m.system.id)
    setStep("skill")
  }

  if (!match && step !== "brief") return null

  return (
    <Box
      flexDirection="column"
      borderStyle="round"
      borderColor={theme.accent}
      paddingX={2}
      paddingY={1}
      width={72}
    >
      {step === "brief" && (
        <BriefStep initialBrief={brief} onNext={handleBrief} onClose={onClose} />
      )}
      {step === "skill" && match && (
        <SkillStep
          match={match} skills={skills}
          onSelect={id => { setSkillId(id); setStep("system") }}
          onBack={() => setStep("brief")}
        />
      )}
      {step === "system" && match && (
        <SystemStep
          match={match} systems={systems}
          onSelect={id => { setSystemId(id); setStep("confirm") }}
          onBack={() => setStep("skill")}
        />
      )}
      {step === "confirm" && match && (
        <ConfirmStep
          brief={brief} systemId={systemId} skillId={skillId}
          systems={systems} skills={skills}
          onConfirm={() => onLaunch({ brief, systemId, skillId })}
          onBack={() => setStep("system")}
        />
      )}
    </Box>
  )
}
