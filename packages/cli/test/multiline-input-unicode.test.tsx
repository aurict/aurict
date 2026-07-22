import React from "react"
import { afterEach, describe, expect, it } from "bun:test"
import { cleanup, render } from "ink-testing-library"
import { MultilineInput } from "../src/tui/MultilineInput.js"

afterEach(() => cleanup())

const flush = () => new Promise((resolve) => setTimeout(resolve, 0))

async function edit(keys: string[]): Promise<string> {
  let current = ""
  const { stdin } = render(
    <MultilineInput value="" onChange={(value) => { current = value }} onSubmit={() => {}} disabled={false} history={[]} />,
  )
  await flush()
  for (const key of keys) {
    stdin.write(key)
    await flush()
  }
  return current
}

describe("MultilineInput Unicode editing", () => {
  it("moves left over an emoji as one visible character", async () => {
    expect(await edit(["🙂a", "\x1b[D", "X"])).toBe("🙂Xa")
  })

  it("backspace removes a complete ZWJ family cluster", async () => {
    expect(await edit(["👨‍👩‍👧‍👦", "\x7f"])).toBe("")
  })

  it("backspace removes a base letter and combining mark together", async () => {
    expect(await edit(["e\u0301", "\x7f"])).toBe("")
  })
})
