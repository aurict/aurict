import { describe, expect, it } from "bun:test"
import { isSessionInProject } from "../src/session/recall.js"

describe("session recall project boundary", () => {
  it("only accepts sessions explicitly associated with the current workdir", () => {
    expect(isSessionInProject({ config: JSON.stringify({ provider: "x", model: "y", workdir: "/repo/a" }) }, "/repo/a")).toBe(true)
    expect(isSessionInProject({ config: JSON.stringify({ provider: "x", model: "y", workdir: "/repo/b" }) }, "/repo/a")).toBe(false)
    expect(isSessionInProject({ config: JSON.stringify({ provider: "x", model: "y" }) }, "/repo/a")).toBe(false)
    expect(isSessionInProject({ config: "broken" }, "/repo/a")).toBe(false)
  })
})
