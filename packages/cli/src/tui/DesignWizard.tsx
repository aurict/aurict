import React, { useState, useEffect, useMemo } from "react"
import { Box, Text, useInput } from "ink"
import { useTheme } from "../utils/theme.js"
import { DesignLoader, matchDesign, loadDesignPrefs } from "@omnicod/core"
import type { DesignSystem, Skill, MatchResult } from "@omnicod/core"

// ── Types ─────────────────────────────────────────────────────────────────────

export interface DesignWizardResult {
  brief:    string
  systemId: string
  skillId:  string
}

interface Props {
  workdir: string
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

// ── Step components ────────────────────────────────────────────────────────────

function BriefStep({ onNext, onClose }: { onNext: (brief: string) => void; onClose: () => void }) {
  const theme   = useTheme()
  const [text, setText] = useState("")
  const [cursor, setCursor] = useState(0)

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
      <Text color={theme.accent} bold>✦ Design Wizard  <Text color={theme.textDim} bold={false}>1/4 — Brief</Text></Text>
      <Text color={theme.textSecondary}>What do you want to design? Write a brief description:</Text>
      <Box borderStyle="single" borderColor={theme.accent} paddingX={1} width={70}>
        <Text>
          {before}
          <Text backgroundColor={theme.accent} color="black">{at}</Text>
          {after}
        </Text>
      </Box>
      <Text color={theme.textDim} dimColor>Enter to continue · Esc to cancel</Text>
      <Text color={theme.textDim} dimColor italic>
        e.g. "Linear-style SaaS landing page"  ·  "Dark dashboard, analytics"  ·  "Stripe-style pricing"
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
    if (key.return)   { const s = filtered[cursor]; if (s) onSelect(s.id); return }
    if (key.upArrow)  { setCursor(c => Math.max(0, c - 1)); return }
    if (key.downArrow){ setCursor(c => Math.min(total - 1, c + 1)); return }
    if (key.backspace || key.delete) { setQuery(q => q.slice(0, -1)); setCursor(0); return }
    if (input && !key.ctrl && !key.meta) { setQuery(q => q + input); setCursor(0); return }
  })

  const shown   = filtered.slice(0, 10)
  const safeCur = Math.min(cursor, shown.length - 1)

  return (
    <Box flexDirection="column" gap={1}>
      <Text color={theme.accent} bold>✦ Design Wizard  <Text color={theme.textDim} bold={false}>2/4 — Skill (template type)</Text></Text>
      <Box>
        <Text color={theme.textDim}>Suggested: </Text>
        <Text color={theme.accent} bold>{match.skill.name}</Text>
        <Text color={theme.textDim}> — Enter to accept, or pick another below</Text>
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
              {s.id === match.skill.id && <Text color={theme.accent} dimColor>★</Text>}
            </Box>
          )
        })}
        {total > 10 && <Text color={theme.textDim} dimColor>  …{total - 10} more ({total} total)</Text>}
      </Box>
      <Text color={theme.textDim} dimColor>↑↓ navigate · / filter · Enter select · Esc back</Text>
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
    if (key.return)    { const s = shown[safeCur]; if (s) onSelect(s.id); return }
    if (key.upArrow)   { setCursor(c => Math.max(0, c - 1)); return }
    if (key.downArrow) { setCursor(c => Math.min(shown.length - 1, c + 1)); return }
    if (key.backspace || key.delete) { setQuery(q => q.slice(0, -1)); setCursor(0); return }
    if (input && !key.ctrl && !key.meta) { setQuery(q => q + input); setCursor(0); return }
  })

  const cur = shown[safeCur]

  return (
    <Box flexDirection="column" gap={1}>
      <Text color={theme.accent} bold>✦ Design Wizard  <Text color={theme.textDim} bold={false}>3/4 — Design System (brand)</Text></Text>
      <Box>
        <Text color={theme.textDim}>Suggested: </Text>
        <Text color={theme.accent} bold>{match.system.name}</Text>
        <Text color={theme.textDim}> · {match.system.category}</Text>
      </Box>
      <Box borderStyle="single" borderColor={theme.borderDim} paddingX={1} width={50}>
        <Text color={theme.textDim}>/ </Text>
        <Text>{query}{" "}</Text>
      </Box>
      <Box flexDirection="row" gap={2} alignItems="flex-start">
        {/* Liste */}
        <Box flexDirection="column" width={30}>
          {shown.map((s, i) => {
            const selected = i === safeCur
            const isMatch  = s.id === match.system.id
            const isRecent = prefs.recentSystemIds.includes(s.id)
            return (
              <Box key={s.id} gap={1}>
                <Text color={selected ? theme.accent : theme.borderDim}>{selected ? "▶" : " "}</Text>
                <Text color={selected ? theme.textPrimary : theme.textSecondary} bold={selected}>
                  {s.name}
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
          <Box flexDirection="column" width={32} borderStyle="single" borderColor={theme.borderDim} paddingX={1}>
            <Text color={theme.accent} bold>{cur.name}</Text>
            <Text color={theme.textDim} dimColor>{cur.category}</Text>
            {cur.tagline && <Text color={theme.textSecondary} italic dimColor>{cur.tagline.slice(0, 60)}</Text>}
          </Box>
        )}
      </Box>
      <Text color={theme.textDim} dimColor>↑↓ navigate · / filter · Enter select · Esc back</Text>
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
      <Text color={theme.accent} bold>✦ Design Wizard  <Text color={theme.textDim} bold={false}>4/4 — Confirm</Text></Text>
      <Box flexDirection="column" borderStyle="round" borderColor={theme.accent} paddingX={2} paddingY={1} gap={0}>
        <Box gap={2}>
          <Text color={theme.textDim} dimColor>{"Brief      "}</Text>
          <Text color={theme.textPrimary} bold>{brief}</Text>
        </Box>
        <Box gap={2}>
          <Text color={theme.textDim} dimColor>{"Skill      "}</Text>
          <Text color={theme.textPrimary}>{skill?.name ?? skillId}</Text>
          <Text color={theme.textDim} dimColor>{skill?.mode}</Text>
        </Box>
        <Box gap={2}>
          <Text color={theme.textDim} dimColor>{"Design sys "}</Text>
          <Text color={theme.textPrimary}>{system?.name ?? systemId}</Text>
          <Text color={theme.textDim} dimColor>{system?.category}</Text>
        </Box>
        <Box gap={2}>
          <Text color={theme.textDim} dimColor>{"Output     "}</Text>
          <Text color={theme.textSecondary}>~/.omnicod/designs/…/index.html</Text>
        </Box>
      </Box>
      <Box gap={2}>
        <Text color={theme.success} bold>Enter</Text><Text color={theme.textSecondary}>— launch</Text>
        <Text color={theme.textDim} bold>Esc</Text><Text color={theme.textDim} dimColor>— back</Text>
      </Box>
    </Box>
  )
}

// ── Main Wizard ───────────────────────────────────────────────────────────────

export function DesignWizard({ workdir, onLaunch, onClose }: Props) {
  const [step,     setStep]     = useState<Step>("brief")
  const [brief,    setBrief]    = useState("")
  const [skillId,  setSkillId]  = useState("")
  const [systemId, setSystemId] = useState("")
  const [match,    setMatch]    = useState<MatchResult | null>(null)

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
      borderColor={useTheme().accent}
      paddingX={2}
      paddingY={1}
      width={72}
    >
      {step === "brief" && (
        <BriefStep onNext={handleBrief} onClose={onClose} />
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
