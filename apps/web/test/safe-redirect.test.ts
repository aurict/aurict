import { describe, expect, it } from "bun:test"
import { sanitizeNextPath } from "../src/lib/auth/safe-redirect"

const origin = "https://aurict.com"

describe("sanitizeNextPath", () => {
  it("keeps same-origin paths with their query and hash", () => {
    expect(sanitizeNextPath("/auth/device?user_code=AB12", origin)).toBe("/auth/device?user_code=AB12")
    expect(sanitizeNextPath("/docs#install", origin)).toBe("/docs#install")
  })

  it("rejects every way of naming another host", () => {
    for (const value of ["//evil.com", "/\\evil.com", "/\t/evil.com", "\\\\evil.com", "https://evil.com/x", "javascript:alert(1)", "//aurict.com.evil.com"]) {
      expect(sanitizeNextPath(value, origin)).toBe("/")
    }
  })

  it("falls back to the home page when empty", () => {
    expect(sanitizeNextPath(null, origin)).toBe("/")
    expect(sanitizeNextPath("", origin)).toBe("/")
  })
})
