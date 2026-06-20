import { readFileSync, writeFileSync, mkdirSync } from "node:fs"
import { join } from "node:path"
import { homedir } from "node:os"
import type { CompanionState } from "./types.js"
import { SPECIES } from "./species.js"
import { HATS } from "./hats.js"

const CONFIG_DIR  = join(homedir(), ".aurict")
const STATE_FILE  = join(CONFIG_DIR, "companion.json")

const DEFAULT_STATE: CompanionState = {
  speciesId:       "cat",
  xp:              0,
  unlockedSpecies: ["cat"],
  unlockedHats:    ["none"],
  totalToolCalls:  0,
  totalMessages:   0,
}

export function loadCompanion(): CompanionState {
  try {
    const raw = readFileSync(STATE_FILE, "utf8")
    const parsed = JSON.parse(raw) as Partial<CompanionState>
    return { ...DEFAULT_STATE, ...parsed }
  } catch {
    return { ...DEFAULT_STATE }
  }
}

export function saveCompanion(state: CompanionState): void {
  try {
    mkdirSync(CONFIG_DIR, { recursive: true })
    writeFileSync(STATE_FILE, JSON.stringify(state, null, 2), "utf8")
  } catch {
    // non-fatal — companion state loss is acceptable
  }
}

export interface XPResult {
  newXp:            number
  newlyUnlocked:    Array<{ type: "species" | "hat"; id: string; name: string }>
}

export function addXP(state: CompanionState, amount: number): { state: CompanionState; result: XPResult } {
  const newXp = state.xp + amount
  const newlyUnlocked: XPResult["newlyUnlocked"] = []

  const newUnlockedSpecies = [...state.unlockedSpecies]
  for (const sp of SPECIES) {
    if (!newUnlockedSpecies.includes(sp.id) && newXp >= sp.xpRequired) {
      newUnlockedSpecies.push(sp.id)
      newlyUnlocked.push({ type: "species", id: sp.id, name: sp.name })
    }
  }

  const newUnlockedHats = [...state.unlockedHats]
  for (const hat of HATS) {
    if (hat.id === "none") continue
    if (!newUnlockedHats.includes(hat.id) && newXp >= hat.xpRequired) {
      newUnlockedHats.push(hat.id)
      newlyUnlocked.push({ type: "hat", id: hat.id, name: hat.name })
    }
  }

  const newState: CompanionState = {
    ...state,
    xp:              newXp,
    unlockedSpecies: newUnlockedSpecies,
    unlockedHats:    newUnlockedHats,
  }

  return { state: newState, result: { newXp, newlyUnlocked } }
}

export function setSpecies(state: CompanionState, speciesId: string): CompanionState | null {
  if (!state.unlockedSpecies.includes(speciesId)) return null
  return { ...state, speciesId }
}

export function setHat(state: CompanionState, hatId: string): CompanionState | null {
  if (!state.unlockedHats.includes(hatId)) return null
  return { ...state, hatId }
}

export function setCustomName(state: CompanionState, name: string): CompanionState {
  const trimmed = name.trim().slice(0, 20)
  if (!trimmed) {
    const { customName: _removed, ...rest } = state
    return rest
  }
  return { ...state, customName: trimmed }
}
