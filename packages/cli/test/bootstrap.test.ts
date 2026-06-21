import { describe, it, expect, spyOn, afterEach } from "bun:test"
import { startLocalServer } from "../src/bootstrap.js"

afterEach(() => {
  ;(console.error as unknown as { mockRestore?: () => void }).mockRestore?.()
})

describe("bootstrap local server", () => {
  it("continues when the configured port is already in use", () => {
    const err = Object.assign(new Error("port in use"), { code: "EADDRINUSE" })
    const log = spyOn(console, "error").mockImplementation(() => {})

    const started = startLocalServer(7777, () => {
      throw err
    })

    expect(started).toBe(false)
    expect(log).toHaveBeenCalledWith(
      "[aurict] Server: port 7777 is already in use; continuing without local API server",
    )
  })

  it("rethrows non-port server startup errors", () => {
    const err = Object.assign(new Error("boom"), { code: "EACCES" })
    spyOn(console, "error").mockImplementation(() => {})

    expect(() => startLocalServer(7777, () => {
      throw err
    })).toThrow("boom")
  })
})
