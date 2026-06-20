import { describe, it, expect } from "bun:test"
import {
  escapeHtml,
  escapeSql,
  sanitizePath,
  sanitizeInput,
  validateLength,
  validateEmail,
  validateUrl,
  validateFilePath,
  validateJsonInput,
  escapeShellArg,
  validateRegex,
  comprehensiveSanitize,
} from "../src/security/validation.js"

describe("Input Validation & Sanitization", () => {
  describe("escapeHtml", () => {
    it("escapes HTML special characters", () => {
      expect(escapeHtml("<script>alert('xss')</script>")).toBe(
        "&lt;script&gt;alert(&#x27;xss&#x27;)&lt;&#x2F;script&gt;"
      )
    })

    it("escapes quotes", () => {
      expect(escapeHtml('He said "hello"')).toBe("He said &quot;hello&quot;")
    })

    it("escapes ampersand", () => {
      expect(escapeHtml("foo & bar")).toBe("foo &amp; bar")
    })
  })

  describe("escapeSql", () => {
    it("escapes single quotes", () => {
      expect(escapeSql("O'Brien")).toBe("O''Brien")
    })

    it("escapes backslashes", () => {
      expect(escapeSql("path\\to\\file")).toBe("path\\\\to\\\\file")
    })

    it("escapes null bytes", () => {
      expect(escapeSql("test\0value")).toBe("test\\0value")
    })
  })

  describe("sanitizePath", () => {
    it("removes path traversal", () => {
      expect(sanitizePath("../../etc/passwd")).toBe("etc/passwd")
    })

    it("normalizes slashes", () => {
      expect(sanitizePath("foo//bar\\baz")).toBe("foo/bar/baz")
    })

    it("removes leading slash", () => {
      expect(sanitizePath("/absolute/path")).toBe("absolute/path")
    })
  })

  describe("sanitizeInput", () => {
    it("trims whitespace", () => {
      expect(sanitizeInput("  hello  ")).toBe("hello")
    })

    it("removes control characters", () => {
      expect(sanitizeInput("test\x00value")).toBe("testvalue")
    })

    it("collapses multiple spaces", () => {
      expect(sanitizeInput("foo   bar")).toBe("foo bar")
    })
  })

  describe("validateLength", () => {
    it("accepts valid length", () => {
      const result = validateLength("hello", 10)
      expect(result.valid).toBe(true)
      expect(result.sanitized).toBe("hello")
    })

    it("rejects too long input", () => {
      const result = validateLength("hello world", 5)
      expect(result.valid).toBe(false)
      expect(result.error).toContain("exceeds maximum length")
    })
  })

  describe("validateEmail", () => {
    it("accepts valid email", () => {
      const result = validateEmail("user@example.com")
      expect(result.valid).toBe(true)
      expect(result.sanitized).toBe("user@example.com")
    })

    it("rejects invalid email", () => {
      const result = validateEmail("not-an-email")
      expect(result.valid).toBe(false)
      expect(result.error).toContain("Invalid email")
    })

    it("lowercases email", () => {
      const result = validateEmail("User@Example.COM")
      expect(result.sanitized).toBe("user@example.com")
    })
  })

  describe("validateUrl", () => {
    it("accepts valid URL", () => {
      const result = validateUrl("https://example.com")
      expect(result.valid).toBe(true)
    })

    it("rejects invalid URL", () => {
      const result = validateUrl("not-a-url")
      expect(result.valid).toBe(false)
      expect(result.error).toContain("Invalid URL")
    })
  })

  describe("validateFilePath", () => {
    it("accepts safe path", () => {
      const result = validateFilePath("src/app.ts")
      expect(result.valid).toBe(true)
    })

    it("rejects path traversal", () => {
      const result = validateFilePath("../../etc/passwd")
      expect(result.valid).toBe(false)
      expect(result.error).toContain("Dangerous path")
    })

    it("rejects system files", () => {
      const result = validateFilePath("/etc/shadow")
      expect(result.valid).toBe(false)
    })

    it("rejects .env files", () => {
      const result = validateFilePath(".env")
      expect(result.valid).toBe(false)
    })
  })

  describe("validateJsonInput", () => {
    it("accepts valid JSON", () => {
      const result = validateJsonInput({ foo: "bar" })
      expect(result.valid).toBe(true)
    })

    it("rejects too large JSON", () => {
      const large = { data: "x".repeat(2_000_000) }
      const result = validateJsonInput(large, 1_000_000)
      expect(result.valid).toBe(false)
      expect(result.error).toContain("exceeds maximum size")
    })
  })

  describe("escapeShellArg", () => {
    it("escapes single quotes", () => {
      expect(escapeShellArg("it's")).toBe("'it'\\''s'")
    })

    it("wraps in single quotes", () => {
      expect(escapeShellArg("hello")).toBe("'hello'")
    })
  })

  describe("validateRegex", () => {
    it("accepts valid regex", () => {
      const result = validateRegex("^foo.*bar$")
      expect(result.valid).toBe(true)
    })

    it("rejects invalid regex", () => {
      const result = validateRegex("[invalid")
      expect(result.valid).toBe(false)
      expect(result.error).toContain("Invalid regex")
    })
  })

  describe("comprehensiveSanitize", () => {
    it("applies all sanitization rules", () => {
      const result = comprehensiveSanitize(
        "  <script>alert('xss')</script>  ",
        {
          escapeHtml: true,
          trimWhitespace: true,
          maxLength: 100,
        }
      )
      expect(result.valid).toBe(true)
      expect(result.sanitized).not.toContain("<script>")
    })

    it("respects maxLength", () => {
      const result = comprehensiveSanitize("x".repeat(200), {
        maxLength: 100,
      })
      expect(result.valid).toBe(false)
    })
  })
})
