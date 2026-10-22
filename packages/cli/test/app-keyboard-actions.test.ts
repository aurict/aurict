import { afterEach, describe, expect, test } from "bun:test"
import { PermissionGate } from "@aurict/core"
import type { PermissionRequest } from "@aurict/core"
import { closeFocusedLayer } from "../src/tui/app/app-keyboard-actions.js"
import type { AppKeyboardParams } from "../src/tui/app/app-keyboard-types.js"

afterEach(() => PermissionGate.cancelPending())

function keyboardParams(request: PermissionRequest, queue: { current: PermissionRequest[] }, messages: string[]) {
  return {
    focusLayer: "permission",
    permission: request,
    loadingRef: { current: false },
    abortControllerRef: { current: null },
    setPermissionQueue: (update: PermissionRequest[] | ((current: PermissionRequest[]) => PermissionRequest[])) => {
      queue.current = typeof update === "function" ? update(queue.current) : update
    },
    addSystemMsg: (message: string) => messages.push(message),
    overlay: {},
  } as unknown as AppKeyboardParams
}

describe("terminal permission keyboard handling", () => {
  test("esc on a command request cancels it and clears the queue, as Codex does", async () => {
    const request: PermissionRequest = { id: "permission-escape-shell", tool: "bash", pattern: "example" }
    const other: PermissionRequest = { id: "permission-escape-queued", tool: "bash", pattern: "later" }
    const queue = { current: [request, other] }
    const messages: string[] = []
    const wait = PermissionGate.wait(request.id, { timeoutMs: 1_000 })

    expect(closeFocusedLayer(keyboardParams(request, queue, messages))).toBe(true)
    expect((await wait).decision).toBe("deny")
    expect(queue.current).toEqual([])
    expect(messages).toEqual(["You canceled the request to run example"])
  })

  test("esc on a permission grant only declines that request", async () => {
    const request: PermissionRequest = { id: "permission-escape-grant", tool: "mcp", pattern: "github.search" }
    const other: PermissionRequest = { id: "permission-escape-next", tool: "bash", pattern: "later" }
    const queue = { current: [request, other] }
    const messages: string[] = []
    const wait = PermissionGate.wait(request.id, { timeoutMs: 1_000 })

    expect(closeFocusedLayer(keyboardParams(request, queue, messages))).toBe(true)
    expect((await wait).decision).toBe("deny")
    expect(queue.current).toEqual([other])
    expect(messages).toEqual(["You did not grant additional permissions"])
  })
})
