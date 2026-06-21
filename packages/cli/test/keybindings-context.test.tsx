import { describe, it, expect, afterEach } from "bun:test"
import React from "react"
import { Text } from "ink"
import { render, cleanup } from "ink-testing-library"
import { KeybindingsProvider, useKeybindings } from "../src/keybindings/index.js"
import type { Context } from "../src/keybindings/index.js"

afterEach(() => { cleanup() })

function ContextProbe() {
  const { currentContext } = useKeybindings()
  return <Text>{currentContext}</Text>
}

function Harness({ context }: { context: Context }) {
  return (
    <KeybindingsProvider initialContext={context} overrides={{}}>
      <ContextProbe />
    </KeybindingsProvider>
  )
}

describe("KeybindingsProvider", () => {
  it("updates current context when initialContext changes", async () => {
    const view = render(<Harness context="ready" />)
    expect(view.lastFrame()).toContain("ready")

    view.rerender(<Harness context="modal" />)
    await new Promise((resolve) => setTimeout(resolve, 0))

    expect(view.lastFrame()).toContain("modal")
  })
})
