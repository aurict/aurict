import { describe, it, expect, afterEach } from "bun:test"
import { gateGuard } from "../src/permission/gateguard.js"

afterEach(() => {
  gateGuard.clearCustomRules()
})

// ─── default protected patterns ─────────────────────────────────────────────

describe("gateGuard.check — allow (normal files)", () => {
  it("source file → allow", () => {
    expect(gateGuard.check("src/components/Button.tsx")).toBe("allow")
  })

  it("README.md → allow", () => {
    expect(gateGuard.check("README.md")).toBe("allow")
  })

  it("deep nested source file → allow", () => {
    expect(gateGuard.check("/home/user/project/src/util/helper.ts")).toBe("allow")
  })

  it("dist output file → allow", () => {
    expect(gateGuard.check("dist/index.js")).toBe("allow")
  })
})

describe("gateGuard.check — ask (protected patterns)", () => {
  it(".env exact match → ask", () => {
    expect(gateGuard.check(".env")).toBe("ask")
  })

  it(".env.production → ask (.env.* wildcard)", () => {
    expect(gateGuard.check(".env.production")).toBe("ask")
  })

  it(".env.local → ask", () => {
    expect(gateGuard.check(".env.local")).toBe("ask")
  })

  it(".env.test → ask", () => {
    expect(gateGuard.check(".env.test")).toBe("ask")
  })

  it("yarn.lock → ask (*.lock matches .lock extension)", () => {
    expect(gateGuard.check("yarn.lock")).toBe("ask")
  })

  it("bun.lock → ask", () => {
    expect(gateGuard.check("bun.lock")).toBe("ask")
  })

  it("tsconfig.json → ask", () => {
    expect(gateGuard.check("tsconfig.json")).toBe("ask")
  })

  it("tsconfig.build.json → ask (tsconfig.*.json)", () => {
    expect(gateGuard.check("tsconfig.build.json")).toBe("ask")
  })

  it("tsconfig.base.json → ask", () => {
    expect(gateGuard.check("tsconfig.base.json")).toBe("ask")
  })

  it("package.json → ask", () => {
    expect(gateGuard.check("package.json")).toBe("ask")
  })
})

describe("gateGuard.check — deny (.git/* and .aurict/*)", () => {
  it("/project/.git/config → deny", () => {
    expect(gateGuard.check("/project/.git/config")).toBe("deny")
  })

  it("/project/.git/HEAD → deny", () => {
    expect(gateGuard.check("/project/.git/HEAD")).toBe("deny")
  })

  it("/project/.git/COMMIT_EDITMSG → deny", () => {
    expect(gateGuard.check("/project/.git/COMMIT_EDITMSG")).toBe("deny")
  })

  it("/project/.git/refs/heads/main → deny", () => {
    expect(gateGuard.check("/project/.git/refs/heads/main")).toBe("deny")
  })

  it("/project/.aurict/aurict.db → deny", () => {
    expect(gateGuard.check("/project/.aurict/aurict.db")).toBe("deny")
  })

  it("/project/.aurict/config.json → deny", () => {
    expect(gateGuard.check("/project/.aurict/config.json")).toBe("deny")
  })

  it("/project/.aurict/audit.log → deny", () => {
    expect(gateGuard.check("/project/.aurict/audit.log")).toBe("deny")
  })
})

// ─── custom rules ────────────────────────────────────────────────────────────

describe("gateGuard — addRule", () => {
  it("addRule deny blocks a previously-allowed file", () => {
    gateGuard.addRule({ pattern: "secret.txt", action: "deny" })
    expect(gateGuard.check("secret.txt")).toBe("deny")
  })

  it("addRule allow overrides a default ask (.env)", () => {
    gateGuard.addRule({ pattern: ".env", action: "allow" })
    expect(gateGuard.check(".env")).toBe("allow")
  })

  it("addRule ask on an allowed file → ask", () => {
    gateGuard.addRule({ pattern: "README.md", action: "ask" })
    expect(gateGuard.check("README.md")).toBe("ask")
  })

  it("adding same pattern twice updates the rule (no duplicate)", () => {
    gateGuard.addRule({ pattern: "custom.txt", action: "ask" })
    gateGuard.addRule({ pattern: "custom.txt", action: "deny" })
    expect(gateGuard.check("custom.txt")).toBe("deny")
  })
})

describe("gateGuard — removePattern and clearCustomRules", () => {
  it("removePattern removes the custom rule → reverts to default", () => {
    gateGuard.addRule({ pattern: "temp.txt", action: "deny" })
    gateGuard.removePattern("temp.txt")
    expect(gateGuard.check("temp.txt")).toBe("allow")
  })

  it("removePattern on non-existent pattern does nothing", () => {
    gateGuard.removePattern("ghost.txt")
    expect(gateGuard.check(".env")).toBe("ask") // defaults unchanged
  })

  it("clearCustomRules restores .env to ask", () => {
    gateGuard.addRule({ pattern: ".env", action: "allow" })
    gateGuard.clearCustomRules()
    expect(gateGuard.check(".env")).toBe("ask")
  })

  it("clearCustomRules removes all custom rules at once", () => {
    gateGuard.addRule({ pattern: "a.txt", action: "deny" })
    gateGuard.addRule({ pattern: "b.txt", action: "deny" })
    gateGuard.clearCustomRules()
    expect(gateGuard.check("a.txt")).toBe("allow")
    expect(gateGuard.check("b.txt")).toBe("allow")
  })
})

// ─── listRules ───────────────────────────────────────────────────────────────

describe("gateGuard.listRules", () => {
  it("returns 8 default rules when no custom rules are set", () => {
    expect(gateGuard.listRules()).toHaveLength(8)
  })

  it("includes default + custom rules", () => {
    gateGuard.addRule({ pattern: "extra.txt", action: "deny" })
    const rules = gateGuard.listRules()
    expect(rules).toHaveLength(9)
    expect(rules.some((r) => r.pattern === "extra.txt")).toBe(true)
  })

  it("listRules returns a copy — mutation does not affect internal state", () => {
    const rules = gateGuard.listRules()
    rules.push({ pattern: "injected.txt", action: "deny" })
    expect(gateGuard.listRules()).toHaveLength(8) // unchanged
  })
})
