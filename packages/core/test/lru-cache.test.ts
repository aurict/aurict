import { describe, it, expect } from "bun:test"
import { LRUCache } from "../src/util/lru-cache.js"

describe("LRUCache", () => {
  describe("basic operations", () => {
    it("set and get", () => {
      const cache = new LRUCache<string, number>(10)
      cache.set("a", 1)
      expect(cache.get("a")).toBe(1)
    })

    it("returns null for missing key", () => {
      const cache = new LRUCache<string, number>(10)
      expect(cache.get("missing")).toBeNull()
    })

    it("has returns true for existing key", () => {
      const cache = new LRUCache<string, number>(10)
      cache.set("a", 1)
      expect(cache.has("a")).toBe(true)
      expect(cache.has("b")).toBe(false)
    })

    it("delete removes entry", () => {
      const cache = new LRUCache<string, number>(10)
      cache.set("a", 1)
      expect(cache.delete("a")).toBe(true)
      expect(cache.get("a")).toBeNull()
    })

    it("delete returns false for missing key", () => {
      const cache = new LRUCache<string, number>(10)
      expect(cache.delete("missing")).toBe(false)
    })
  })

  describe("LRU eviction", () => {
    it("evicts oldest entry when maxSize exceeded", () => {
      const cache = new LRUCache<string, number>(3)
      cache.set("a", 1)
      cache.set("b", 2)
      cache.set("c", 3)
      cache.set("d", 4)  // should evict "a"

      expect(cache.get("a")).toBeNull()
      expect(cache.get("b")).toBe(2)
      expect(cache.get("c")).toBe(3)
      expect(cache.get("d")).toBe(4)
    })

    it("accessing entry moves it to end (most recent)", () => {
      const cache = new LRUCache<string, number>(3)
      cache.set("a", 1)
      cache.set("b", 2)
      cache.set("c", 3)

      // Access "a" — moves it to most recent
      cache.get("a")

      // Add "d" — should evict "b" (now oldest)
      cache.set("d", 4)

      expect(cache.get("a")).toBe(1)  // still present
      expect(cache.get("b")).toBeNull()  // evicted
      expect(cache.get("c")).toBe(3)
      expect(cache.get("d")).toBe(4)
    })

    it("updating existing key moves it to end", () => {
      const cache = new LRUCache<string, number>(3)
      cache.set("a", 1)
      cache.set("b", 2)
      cache.set("c", 3)

      // Update "a" — moves to most recent
      cache.set("a", 10)

      // Add "d" — should evict "b" (now oldest)
      cache.set("d", 4)

      expect(cache.get("a")).toBe(10)
      expect(cache.get("b")).toBeNull()
    })
  })

  describe("TTL", () => {
    it("entry expires after TTL", async () => {
      const cache = new LRUCache<string, number>(10, 50)  // 50ms TTL
      cache.set("a", 1)
      expect(cache.get("a")).toBe(1)

      await new Promise(r => setTimeout(r, 80))
      expect(cache.get("a")).toBeNull()
    })

    it("per-set TTL override", async () => {
      const cache = new LRUCache<string, number>(10, 1000)  // default 1s
      cache.set("short", 1, 50)   // 50ms TTL
      cache.set("long", 2)         // 1s TTL

      await new Promise(r => setTimeout(r, 80))
      expect(cache.get("short")).toBeNull()
      expect(cache.get("long")).toBe(2)
    })

    it("has respects TTL", async () => {
      const cache = new LRUCache<string, number>(10, 50)
      cache.set("a", 1)
      expect(cache.has("a")).toBe(true)

      await new Promise(r => setTimeout(r, 80))
      expect(cache.has("a")).toBe(false)
    })

    it("zero TTL means no expiry", async () => {
      const cache = new LRUCache<string, number>(10, 0)
      cache.set("a", 1)

      await new Promise(r => setTimeout(r, 50))
      expect(cache.get("a")).toBe(1)
    })
  })

  describe("invalidate", () => {
    it("removes entries matching predicate", () => {
      const cache = new LRUCache<string, number>(10)
      cache.set("prefix:a", 1)
      cache.set("prefix:b", 2)
      cache.set("other:c", 3)

      cache.invalidate(k => k.startsWith("prefix:"))

      expect(cache.get("prefix:a")).toBeNull()
      expect(cache.get("prefix:b")).toBeNull()
      expect(cache.get("other:c")).toBe(3)
    })
  })

  describe("clear and size", () => {
    it("clear removes all entries", () => {
      const cache = new LRUCache<string, number>(10)
      cache.set("a", 1)
      cache.set("b", 2)
      cache.clear()
      expect(cache.size()).toBe(0)
    })

    it("size returns current count", () => {
      const cache = new LRUCache<string, number>(10)
      expect(cache.size()).toBe(0)
      cache.set("a", 1)
      expect(cache.size()).toBe(1)
      cache.set("b", 2)
      expect(cache.size()).toBe(2)
    })
  })

  describe("prune", () => {
    it("removes expired entries", async () => {
      const cache = new LRUCache<string, number>(10, 50)
      cache.set("a", 1)
      cache.set("b", 2)

      await new Promise(r => setTimeout(r, 80))

      cache.set("c", 3)  // fresh entry
      const remaining = cache.prune()
      expect(remaining).toBe(1)
      expect(cache.get("c")).toBe(3)
    })
  })

  describe("iteration", () => {
    it("keys returns all keys", () => {
      const cache = new LRUCache<string, number>(10)
      cache.set("a", 1)
      cache.set("b", 2)
      cache.set("c", 3)

      const keys = [...cache.keys()]
      expect(keys).toContain("a")
      expect(keys).toContain("b")
      expect(keys).toContain("c")
    })

    it("entries returns key-value pairs", () => {
      const cache = new LRUCache<string, number>(10)
      cache.set("x", 10)
      cache.set("y", 20)

      const entries = cache.entries()
      expect(entries.length).toBe(2)
      expect(entries).toContainEqual(["x", 10])
      expect(entries).toContainEqual(["y", 20])
    })
  })

  describe("stats", () => {
    it("returns cache configuration", () => {
      const cache = new LRUCache<string, number>(50, 1000)
      cache.set("a", 1)

      const stats = cache.stats()
      expect(stats.size).toBe(1)
      expect(stats.maxSize).toBe(50)
      expect(stats.ttlMs).toBe(1000)
    })
  })

  describe("constructor validation", () => {
    it("throws for maxSize < 1", () => {
      expect(() => new LRUCache(0)).toThrow("maxSize must be >= 1")
      expect(() => new LRUCache(-1)).toThrow("maxSize must be >= 1")
    })
  })
})
