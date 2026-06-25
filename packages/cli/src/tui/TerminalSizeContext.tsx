import { createContext, useContext } from "react"

export interface TerminalSize {
  columns: number
  rows:    number
}

export const TerminalSizeContext = createContext<TerminalSize | null>(null)

export function useTerminalSize(): TerminalSize {
  const size = useContext(TerminalSizeContext)
  if (!size) throw new Error("useTerminalSize must be used inside TerminalSizeContext.Provider")
  return size
}
