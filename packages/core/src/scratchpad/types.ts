export interface ScratchpadHistoryEntry {
  ts:    number
  field: string
  prev:  unknown
  next:  unknown
}

export interface ScratchpadState {
  sessionId:  string
  updatedAt:  number
  hypothesis: string
  evidence: {
    for:     string[]
    against: string[]
  }
  confidence:  "low" | "medium" | "high"
  assumptions: string[]
  blockers:    string[]
  nextStep:    string
  history:     ScratchpadHistoryEntry[]
}

export const EMPTY_SCRATCHPAD: Omit<ScratchpadState, "sessionId"> = {
  updatedAt:   0,
  hypothesis:  "",
  evidence:    { for: [], against: [] },
  confidence:  "low",
  assumptions: [],
  blockers:    [],
  nextStep:    "",
  history:     [],
}
