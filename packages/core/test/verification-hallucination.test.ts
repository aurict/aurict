import { describe, it, expect } from "bun:test"
import { detectHallucinations, formatHallucinationWarnings } from "../src/verification/hallucination.js"
import { createTempDir } from "./helpers.js"

describe("detectHallucinations", () => {
  it("detects missing module", async () => {
    const { dir, cleanup, createFile } = createTempDir()
    try {
      createFile("test.ts", `import { foo } from './nonexistent'`)
      
      const warnings = await detectHallucinations(
        `import { foo } from './nonexistent'`,
        "test.ts",
        dir
      )
      
      expect(warnings.length).toBeGreaterThan(0)
      expect(warnings[0]!.type).toBe("missing-module")
      expect(warnings[0]!.message).toContain("nonexistent")
    } finally {
      cleanup()
    }
  })

  it("does not warn for existing module", async () => {
    const { dir, cleanup, createFile } = createTempDir()
    try {
      createFile("existing.ts", `export const foo = 5`)
      createFile("test.ts", `import { foo } from './existing'`)
      
      const warnings = await detectHallucinations(
        `import { foo } from './existing'`,
        "test.ts",
        dir
      )
      
      // existing.ts var, yani missing-module warning olmamalı
      const moduleWarnings = warnings.filter(w => w.type === "missing-module")
      expect(moduleWarnings.length).toBe(0)
    } finally {
      cleanup()
    }
  })

  it("ignores external imports", async () => {
    const { dir, cleanup } = createTempDir()
    try {
      const warnings = await detectHallucinations(
        `import React from 'react'`,
        "test.ts",
        dir
      )
      
      // External import'lar kontrol edilmez
      expect(warnings.length).toBe(0)
    } finally {
      cleanup()
    }
  })

  it("handles multiple imports", async () => {
    const { dir, cleanup, createFile } = createTempDir()
    try {
      createFile("a.ts", `export const a = 1`)
      createFile("test.ts", `
import { a } from './a'
import { b } from './b'
import { c } from './c'
      `)
      
      const warnings = await detectHallucinations(
        `
import { a } from './a'
import { b } from './b'
import { c } from './c'
        `,
        "test.ts",
        dir
      )
      
      // a.ts var, b.ts ve c.ts yok
      const moduleWarnings = warnings.filter(w => w.type === "missing-module")
      expect(moduleWarnings.length).toBe(2)
    } finally {
      cleanup()
    }
  })

  it("handles default imports", async () => {
    const { dir, cleanup } = createTempDir()
    try {
      const warnings = await detectHallucinations(
        `import foo from './missing'`,
        "test.ts",
        dir
      )
      
      expect(warnings.length).toBeGreaterThan(0)
      expect(warnings[0]!.type).toBe("missing-module")
    } finally {
      cleanup()
    }
  })

  it("handles namespace imports", async () => {
    const { dir, cleanup } = createTempDir()
    try {
      const warnings = await detectHallucinations(
        `import * as utils from './missing'`,
        "test.ts",
        dir
      )
      
      expect(warnings.length).toBeGreaterThan(0)
      expect(warnings[0]!.type).toBe("missing-module")
    } finally {
      cleanup()
    }
  })

  it("returns empty array for no imports", async () => {
    const { dir, cleanup } = createTempDir()
    try {
      const warnings = await detectHallucinations(
        `const x = 5`,
        "test.ts",
        dir
      )
      
      expect(warnings.length).toBe(0)
    } finally {
      cleanup()
    }
  })
})

describe("formatHallucinationWarnings", () => {
  it("returns empty string for no warnings", () => {
    expect(formatHallucinationWarnings([])).toBe("")
  })

  it("formats single warning", () => {
    const warnings = [{
      type: "missing-module" as const,
      message: "Module not found: ./foo",
      file: "test.ts",
    }]
    
    const formatted = formatHallucinationWarnings(warnings)
    expect(formatted).toContain("[HALLUCINATION DETECTION")
    expect(formatted).toContain("Module not found")
    expect(formatted).toContain("test.ts")
  })

  it("formats multiple warnings", () => {
    const warnings = [
      {
        type: "missing-module" as const,
        message: "Module not found: ./foo",
        file: "test.ts",
      },
      {
        type: "missing-export" as const,
        message: "'bar' is not exported from './baz'",
        file: "test.ts",
      },
    ]
    
    const formatted = formatHallucinationWarnings(warnings)
    expect(formatted).toContain("1.")
    expect(formatted).toContain("2.")
    expect(formatted).toContain("missing-module")
    expect(formatted).toContain("missing-export")
  })

  it("includes line number when provided", () => {
    const warnings = [{
      type: "missing-module" as const,
      message: "Module not found",
      file: "test.ts",
      line: 42,
    }]
    
    const formatted = formatHallucinationWarnings(warnings)
    expect(formatted).toContain("test.ts:42")
  })
})
