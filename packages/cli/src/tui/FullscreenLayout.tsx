import React, { useRef, useLayoutEffect } from "react"
import { Box, measureElement } from "ink"
import type { DOMElement } from "ink"

interface FullscreenLayoutProps {
  rows:                number
  header?:             React.ReactNode  // fixed top (banner, update notice, session title)
  scrollable:          React.ReactNode  // grows to fill space (ConversationViewport)
  overlay?:            React.ReactNode  // modals rendered between scrollable and bottom
  bottom:              React.ReactNode  // fixed bottom (input area + status bar)
  onScrollableHeight?: (rows: number) => void  // fires when scrollable slot height changes
}

export function FullscreenLayout({
  rows,
  header,
  scrollable,
  overlay,
  bottom,
  onScrollableHeight,
}: FullscreenLayoutProps) {
  const scrollableRef  = useRef<DOMElement>(null)
  const lastHeightRef  = useRef<number>(-1)

  useLayoutEffect(() => {
    if (!scrollableRef.current || !onScrollableHeight) return
    const { height } = measureElement(scrollableRef.current)
    if (height > 0 && height !== lastHeightRef.current) {
      lastHeightRef.current = height
      onScrollableHeight(height)
    }
  })

  return (
    <Box flexDirection="column" height={rows} overflow="hidden">
      {header && (
        <Box flexDirection="column" flexShrink={0}>
          {header}
        </Box>
      )}
      <Box ref={scrollableRef} flexGrow={1} flexShrink={1} flexDirection="column" overflow="hidden">
        {scrollable}
      </Box>
      {overlay && (
        <Box flexDirection="column" flexShrink={1} overflow="hidden">
          {overlay}
        </Box>
      )}
      <Box flexDirection="column" flexShrink={0} overflow="hidden">
        {bottom}
      </Box>
    </Box>
  )
}
