import { describe, it, expect, beforeEach, afterEach, beforeAll, afterAll } from "bun:test"
import { mkdtempSync, rmSync, existsSync } from "node:fs"
import { tmpdir } from "node:os"
import { join } from "node:path"
import { memoryStore } from "../src/memory/store.js"
import type { Memory } from "../src/memory/types.js"

// ─── test-scoped workdir ──────────────────────────────────────────────────────
// Every test gets a fresh tmpDir used as `project`. afterEach deletes only
// project-scoped memories for that dir — global memories are tracked and
// removed explicitly within the tests that create them.

let workdir: string

beforeEach(() => {
  workdir = mkdtempSync(join(tmpdir(), "aurict-mem-"))
})

afterEach(() => {
  // Scoped cleanup — only removes project memories for this test's workdir.
  // Does NOT wipe global scope (avoids stomping parallel test files).
  memoryStore.clear("project", workdir)
  rmSync(workdir, { recursive: true, force: true })
})

// ─── helpers ─────────────────────────────────────────────────────────────────

function addProject(content: string, category: Memory["category"] = "fact"): Memory {
  return memoryStore.add({ content, category, scope: "project", project: workdir, source: "manual" })
}

function addGlobal(content: string, category: Memory["category"] = "fact"): Memory {
  return memoryStore.add({ content, category, scope: "global", source: "manual" })
}

// ─── add + list ──────────────────────────────────────────────────────────────

describe("memoryStore.add + list", () => {
  it("added memory appears in list", () => {
    addProject("user prefers bun over npm")
    const all = memoryStore.list(workdir)
    expect(all.some((m) => m.content === "user prefers bun over npm")).toBe(true)
  })

  it("returned memory has a UUID id", () => {
    const m = addProject("some fact")
    expect(m.id).toMatch(/^[0-9a-f-]{36}$/)
  })

  it("content is trimmed (leading / trailing whitespace)", () => {
    const m = addProject("  trimmed fact  ")
    expect(m.content).toBe("trimmed fact")
  })

  it("category and scope are persisted", () => {
    const m = addProject("decision made", "decision")
    const found = memoryStore.list(workdir).find((x) => x.id === m.id)
    expect(found?.category).toBe("decision")
    expect(found?.scope).toBe("project")
  })

  it("tags are persisted and returned as an array", () => {
    const m = memoryStore.add({
      content: "tagged memory",
      category: "fact",
      scope: "project",
      project: workdir,
      source: "manual",
      tags: ["alpha", "beta"],
    })
    const found = memoryStore.list(workdir).find((x) => x.id === m.id)
    expect(found?.tags).toEqual(["alpha", "beta"])
  })

  it("list returns memories newest-first (DESC timestamp)", async () => {
    const m1 = addProject("first")
    await Bun.sleep(2) // guarantee distinct timestamps
    const m2 = addProject("second")
    const ids = memoryStore.list(workdir).map((m) => m.id)
    // m2 was added later → higher timestamp → must appear before m1
    expect(ids.indexOf(m2.id)).toBeLessThan(ids.indexOf(m1.id))
  })

  it("multiple memories accumulate correctly", () => {
    addProject("a")
    addProject("b")
    addProject("c")
    const count = memoryStore.list(workdir).filter((m) => m.project === workdir).length
    expect(count).toBe(3)
  })
})

// ─── remove ──────────────────────────────────────────────────────────────────

describe("memoryStore.remove", () => {
  it("remove returns true and memory disappears", () => {
    const m = addProject("to be removed")
    const result = memoryStore.remove(m.id)
    expect(result).toBe(true)
    expect(memoryStore.list(workdir).some((x) => x.id === m.id)).toBe(false)
  })

  it("removing one memory does not affect others", () => {
    const keep = addProject("keep this")
    const del  = addProject("delete this")
    memoryStore.remove(del.id)
    expect(memoryStore.list(workdir).some((x) => x.id === keep.id)).toBe(true)
  })
})

// ─── search ──────────────────────────────────────────────────────────────────

describe("memoryStore.search", () => {
  it("returns memories containing the search keyword", () => {
    addProject("user prefers dark mode")
    addProject("project uses postgres")
    const results = memoryStore.search("postgres", workdir)
    expect(results.some((m) => m.content.includes("postgres"))).toBe(true)
  })

  it("does not return memories that do not match", () => {
    addProject("typescript is strict")
    const results = memoryStore.search("postgres", workdir)
    expect(results.some((m) => m.content.includes("typescript"))).toBe(false)
  })

  it("returns empty array when no memories match", () => {
    addProject("some random fact")
    const results = memoryStore.search("zzznomatch", workdir)
    expect(results).toHaveLength(0)
  })

  it("empty query returns all memories (no filter)", () => {
    addProject("memory one")
    addProject("memory two")
    const allList    = memoryStore.list(workdir)
    const searchAll  = memoryStore.search("", workdir)
    expect(searchAll.length).toBe(allList.length)
  })

  it("multi-keyword: higher overlap ranked first", () => {
    addProject("bun is fast and cool")         // matches "bun" + "fast" = 2
    addProject("bun is a runtime")             // matches "bun" only = 1
    const results = memoryStore.search("bun fast", workdir)
    expect(results[0]!.content).toContain("fast")
  })

  it("search is case-insensitive", () => {
    addProject("User prefers TypeScript")
    const results = memoryStore.search("typescript", workdir)
    expect(results.length).toBeGreaterThan(0)
  })

  it("matches on tags as well as content", () => {
    memoryStore.add({
      content: "some fact",
      category: "fact",
      scope: "project",
      project: workdir,
      source: "manual",
      tags: ["searchable-tag"],
    })
    const results = memoryStore.search("searchable-tag", workdir)
    expect(results.length).toBeGreaterThan(0)
  })
})

// ─── getRelevant ─────────────────────────────────────────────────────────────

describe("memoryStore.getRelevant", () => {
  it("returns memories within the default budget", () => {
    addProject("fact one")
    addProject("fact two")
    const results = memoryStore.getRelevant(workdir)
    expect(results.length).toBeGreaterThanOrEqual(1)
  })

  it("maxEntries cap is respected", () => {
    for (let i = 0; i < 5; i++) addProject(`fact ${i}`)
    const results = memoryStore.getRelevant(workdir, 2, 99_999)
    expect(results.length).toBeLessThanOrEqual(2)
  })

  it("maxTokens cap stops inclusion early", () => {
    // "hello" ≈ 1 token + 10 overhead = ~11 tokens per memory.
    // With maxTokens=5, even the first memory won't fit.
    addProject("hello")
    const results = memoryStore.getRelevant(workdir, 15, 5)
    expect(results).toHaveLength(0)
  })

  it("more than one memory fits when budget is generous", () => {
    addProject("short a")
    addProject("short b")
    const results = memoryStore.getRelevant(workdir, 15, 99_999)
    expect(results.length).toBeGreaterThanOrEqual(2)
  })
})

// ─── clear ───────────────────────────────────────────────────────────────────

describe("memoryStore.clear", () => {
  it("clear('project', workdir) removes only project memories for that dir", () => {
    addProject("project specific")
    const deleted = memoryStore.clear("project", workdir)
    expect(deleted).toBeGreaterThanOrEqual(1)
    const remaining = memoryStore.list(workdir).filter((m) => m.scope === "project" && m.project === workdir)
    expect(remaining).toHaveLength(0)
  })

  it("clear('project', workdir) does not touch global memories", () => {
    const global = addGlobal("global untouched fact")
    try {
      addProject("project fact")
      memoryStore.clear("project", workdir)
      const list = memoryStore.list(workdir)
      expect(list.some((m) => m.id === global.id)).toBe(true)
    } finally {
      memoryStore.remove(global.id)
    }
  })

  it("clear returns count of deleted memories", () => {
    addProject("one")
    addProject("two")
    const deleted = memoryStore.clear("project", workdir)
    expect(deleted).toBe(2)
  })

  it("clear('global') removes only global memories", () => {
    const g1 = addGlobal("global one")
    const g2 = addGlobal("global two")
    const projectMem = addProject("stays")
    try {
      memoryStore.clear("global")
      // Global memories are gone
      const allGlobal = memoryStore.list().filter((m) => m.id === g1.id || m.id === g2.id)
      expect(allGlobal).toHaveLength(0)
      // Project memory survives
      const projectList = memoryStore.list(workdir).filter((m) => m.id === projectMem.id)
      expect(projectList).toHaveLength(1)
    } finally {
      memoryStore.remove(g1.id)
      memoryStore.remove(g2.id)
    }
  })
})

// ─── toMarkdown ───────────────────────────────────────────────────────────────

describe("memoryStore.toMarkdown", () => {
  it("returns '_(empty)_' when no memories exist for workdir", () => {
    const md = memoryStore.toMarkdown(workdir)
    expect(md).toContain("_(empty)_")
  })

  it("includes '## Project' section for project-scoped memories", () => {
    addProject("project decision")
    const md = memoryStore.toMarkdown(workdir)
    expect(md).toContain("## Project")
    expect(md).toContain("project decision")
  })

  it("includes '## Global' section for global memories", () => {
    const g = addGlobal("global preference")
    try {
      const md = memoryStore.toMarkdown(workdir)
      expect(md).toContain("## Global")
      expect(md).toContain("global preference")
    } finally {
      memoryStore.remove(g.id)
    }
  })

  it("includes category and source metadata", () => {
    addProject("coded decision")
    const md = memoryStore.toMarkdown(workdir)
    expect(md).toContain("[fact]")
    expect(md).toContain("manual")
  })
})

// ─── exportToFile ─────────────────────────────────────────────────────────────

describe("memoryStore.exportToFile", () => {
  it("creates .aurict/memory.md in workdir", () => {
    addProject("exported memory")
    memoryStore.exportToFile(workdir)
    expect(existsSync(join(workdir, ".aurict", "memory.md"))).toBe(true)
  })

  it("exported file contains memory content", () => {
    addProject("export test content")
    memoryStore.exportToFile(workdir)
    const content = require("node:fs").readFileSync(join(workdir, ".aurict", "memory.md"), "utf8")
    expect(content).toContain("export test content")
  })
})
