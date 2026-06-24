import React, { useLayoutEffect } from "react"

const ENTER_ALT_SCREEN = "\x1b[?1049h\x1b[2J\x1b[H"
const EXIT_ALT_SCREEN = "\x1b[?1049l"

export function AlternateScreen({ children }: { children: React.ReactNode }) {
  useLayoutEffect(() => {
    if (!process.stdout.isTTY) return
    process.stdout.write(ENTER_ALT_SCREEN)

    return () => {
      if (!process.stdout.isTTY) return
      process.stdout.write(EXIT_ALT_SCREEN)
    }
  }, [])

  return <>{children}</>
}
