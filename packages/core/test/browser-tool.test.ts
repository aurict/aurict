import { describe, expect, it } from "bun:test"
import { isLocalBrowserUrl, validateBrowserUrl } from "../src/tool/browser/session.js"

describe("browser safety boundary", () => {
  it("recognizes local browser targets", () => {
    expect(isLocalBrowserUrl("http://localhost:3000/app")).toBe(true)
    expect(isLocalBrowserUrl("http://127.0.0.1:5173")).toBe(true)
    expect(isLocalBrowserUrl("https://example.com")).toBe(false)
  })

  it("rejects unsafe protocols and credential-bearing URLs", () => {
    expect(() => validateBrowserUrl("file:///etc/passwd")).toThrow()
    expect(() => validateBrowserUrl("https://user:pass@example.com")).toThrow()
    expect(validateBrowserUrl("https://example.com/path")).toBe("https://example.com/path")
  })
})
