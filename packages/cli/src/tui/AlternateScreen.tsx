import React, { useLayoutEffect, useRef } from "react"
import { useStdout } from "./design-system/renderer.js"
import { setAlternateScreenActive } from "./alternate-screen-state.js"

const ENTER_ALT_SCREEN = "\x1b[?1049h\x1b[2J\x1b[H"
const EXIT_ALT_SCREEN = "\x1b[?1049l"

export function AlternateScreen({ children, exitTranscript = "" }: {
  children: React.ReactNode
  exitTranscript?: string | undefined
}) {
  const transcriptRef = useRef(exitTranscript)
  transcriptRef.current = exitTranscript
  // Ink's final frame may still be queued on its (synchronized) stdout; the
  // exit sequence and transcript go through the same stream so they land after it.
  const { stdout } = useStdout()
  const stdoutRef = useRef(stdout)
  stdoutRef.current = stdout

  useLayoutEffect(() => {
    if (!process.stdout.isTTY) return
    process.stdout.write(ENTER_ALT_SCREEN)
    setAlternateScreenActive(true)

    return () => {
      if (!process.stdout.isTTY) return
      stdoutRef.current.write(EXIT_ALT_SCREEN)
      setAlternateScreenActive(false)
      if (transcriptRef.current) stdoutRef.current.write(`\n${transcriptRef.current}\n`)
    }
  }, [])

  return <>{children}</>
}
