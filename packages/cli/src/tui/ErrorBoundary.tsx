/**
 * ErrorBoundary — TUI crash koruması
 *
 * React component tree'de bir hata oluştuğunda tüm uygulamanın çökmesini
 * engeller. Kullanıcıya anlamlı bir hata mesajı gösterir ve kurtarma
 * seçenekleri sunar.
 *
 * Kullanım:
 *   <ErrorBoundary>
 *     <App />
 *   </ErrorBoundary>
 */

import React from "react"
import { Box, Text } from "ink"

interface Props {
  children: React.ReactNode
  /** Hata oluştuğunda çağrılır (crash report yazma vb.) */
  onError?: (error: Error, errorInfo: React.ErrorInfo) => void
}

interface State {
  hasError: boolean
  error: Error | null
  phase: string
}

export class ErrorBoundary extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props)
    this.state = { hasError: false, error: null, phase: "" }
  }

  static getDerivedStateFromError(error: Error): Partial<State> {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo): void {
    this.setState({ phase: errorInfo.componentStack?.split("\n")[1]?.trim() ?? "unknown" })
    this.props.onError?.(error, errorInfo)
  }

  render(): React.ReactNode {
    if (this.state.hasError && this.state.error) {
      const err = this.state.error
      return (
        <Box flexDirection="column" padding={2} borderStyle="round" borderColor="#ff5555">
          <Box gap={1} marginBottom={1}>
            <Text color="#ff5555" bold>✗ TUI Error</Text>
            <Text color="#6272a4">— a component crashed</Text>
          </Box>

          <Box flexDirection="column" paddingLeft={2} gap={0}>
            <Text color="#ff6b6b">{err.message}</Text>
            {this.state.phase && (
              <Text color="#6272a4" dimColor>in: {this.state.phase}</Text>
            )}
          </Box>

          <Box marginTop={1} flexDirection="column" gap={0}>
            <Text color="#6272a4">────────────────────────────────────</Text>
            <Text color="#f8f8f2" dimColor>
              Stack: {err.stack?.split("\n")[1]?.trim() ?? "unavailable"}
            </Text>
          </Box>

          <Box marginTop={1} gap={1}>
            <Text color="#50fa7b">Suggestions:</Text>
            <Text color="#f8f8f2">• Press Ctrl+C twice to exit</Text>
            <Text color="#f8f8f2">• Report: aurict crash</Text>
            <Text color="#f8f8f2">• Try: terminal resize or restart</Text>
          </Box>
        </Box>
      )
    }

    return this.props.children
  }
}

/**
 * Crash report writer — ErrorBoundary onError callback'i olarak kullanılır
 */
export function writeTUIcrashReport(error: Error, errorInfo: React.ErrorInfo): void {
  try {
    const { writeCrashReport } = require("../util/draft.js")
    const report = [
      `# TUI Crash Report`,
      `Date: ${new Date().toISOString()}`,
      `Terminal: ${process.env["TERM_PROGRAM"] ?? process.env["TERM"] ?? "unknown"}`,
      `Node: ${process.version}`,
      ``,
      `## Error`,
      `${error.message}`,
      ``,
      `## Stack`,
      `\`\`\``,
      error.stack ?? "no stack",
      `\`\``,
      ``,
      `## Component Stack`,
      `\`\`\``,
      errorInfo.componentStack ?? "no component stack",
      `\`\``,
    ].join("\n")
    writeCrashReport(report)
  } catch {
    // non-fatal — crash report yazılamazsa sessizce geç
  }
}
