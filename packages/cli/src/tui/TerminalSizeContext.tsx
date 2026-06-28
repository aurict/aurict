import { createContext, useContext } from "react"

export interface TerminalSize {
  columns: number
  rows:    number
}

export const TerminalSizeContext = createContext<TerminalSize | null>(null)

function fallbackTerminalSize(): TerminalSize {
  const columns = Number(process.stdout.columns)
  const rows    = Number(process.stdout.rows)
  return {
    columns: Number.isFinite(columns) && columns > 0 ? columns : 80,
    rows:    Number.isFinite(rows)    && rows    > 0 ? rows    : 24,
  }
}

export function useTerminalSize(): TerminalSize {
  const size = useContext(TerminalSizeContext)
  return size ?? fallbackTerminalSize()
}
