import React, { useLayoutEffect, useRef } from "react"

const ENTER_ALT_SCREEN = "\x1b[?1049h\x1b[2J\x1b[H"
const EXIT_ALT_SCREEN = "\x1b[?1049l"

export function AlternateScreen({ children, exitTranscript = "" }: {
  children: React.ReactNode
  exitTranscript?: string | undefined
}) {
  const transcriptRef = useRef(exitTranscript)
  transcriptRef.current = exitTranscript

  useLayoutEffect(() => {
    if (!process.stdout.isTTY) return
    process.stdout.write(ENTER_ALT_SCREEN)

    return () => {
      if (!process.stdout.isTTY) return
      process.stdout.write(EXIT_ALT_SCREEN)
      if (transcriptRef.current) process.stdout.write(`\n${transcriptRef.current}\n`)
    }
  }, [])

  return <>{children}</>
}
