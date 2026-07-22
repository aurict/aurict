export const TERMINAL_SCENARIOS = [
  {
    label: "Inspect",
    lines: [
      { delay: 0, type: "input", text: "❯ find the source of the auth regression" },
      { delay: 700, type: "tool", text: "┌ activity" },
      { delay: 1050, type: "tool", text: "│ read      6 files" },
      { delay: 1350, type: "tool", text: "│ search    14 matches" },
      { delay: 1700, type: "tool", text: "│ git       3 commits inspected" },
      { delay: 2150, type: "tool", text: "└ completed                         1.4s" },
      { delay: 2700, type: "output", text: "│ Found the regression in token refresh handling." },
    ],
  },
  {
    label: "Change",
    lines: [
      { delay: 0, type: "input", text: "❯ fix it and keep the token contract intact" },
      { delay: 650, type: "tool", text: "┌ activity" },
      { delay: 1000, type: "tool", text: "│ change    src/auth/refresh.ts  +14 −6" },
      { delay: 1350, type: "tool", text: "│ change    src/auth/refresh.test.ts  +8 −0" },
      { delay: 1750, type: "tool", text: "└ completed                         0.9s" },
      { delay: 2250, type: "output", text: "│ diff ready · 2 files changed · reviewable inline" },
    ],
  },
  {
    label: "Verify",
    lines: [
      { delay: 0, type: "input", text: "❯ verify the change before calling it complete" },
      { delay: 650, type: "tool", text: "┌ activity" },
      { delay: 1000, type: "tool", text: "│ verify    340 tests passed" },
      { delay: 1350, type: "tool", text: "│ browser   settings flow checked" },
      { delay: 1750, type: "tool", text: "└ completed                         3.2s" },
      { delay: 2250, type: "output", text: "│ proof saved · evidence attached · no open work" },
    ],
  },
]
