import { describe, it, expect } from "bun:test"
import { Timer, measure, measureSync, globalTimer } from "../src/util/timing.js"

describe("Timer", () => {
  it("measures elapsed time", async () => {
    const timer = new Timer()
    timer.start("test")
    await new Promise(r => setTimeout(r, 50))
    const ms = timer.stop("test")
    expect(ms).toBeGreaterThanOrEqual(40)
    expect(ms).toBeLessThan(200)
  })

  it("returns 0 for unknown label", () => {
    const timer = new Timer()
    expect(timer.stop("nonexistent")).toBe(0)
  })

  it("accumulates multiple start/stop cycles", async () => {
    const timer = new Timer()

    timer.start("test")
    await new Promise(r => setTimeout(r, 20))
    timer.stop("test")

    timer.start("test")
    await new Promise(r => setTimeout(r, 20))
    timer.stop("test")

    expect(timer.getCount("test")).toBe(2)
    expect(timer.getTotal("test")).toBeGreaterThanOrEqual(30)
  })

  it("calculates average correctly", async () => {
    const timer = new Timer()

    for (let i = 0; i < 3; i++) {
      timer.start("avg")
      await new Promise(r => setTimeout(r, 10))
      timer.stop("avg")
    }

    const avg = timer.getAverage("avg")
    expect(avg).toBeGreaterThanOrEqual(5)
    expect(avg).toBeLessThan(100)
    expect(timer.getCount("avg")).toBe(3)
  })

  it("getMeasurements returns all labels", async () => {
    const timer = new Timer()

    timer.start("a")
    timer.stop("a")
    timer.start("b")
    timer.stop("b")

    const measurements = timer.getMeasurements()
    expect(Object.keys(measurements)).toContain("a")
    expect(Object.keys(measurements)).toContain("b")
  })

  it("getDetailed returns full info", async () => {
    const timer = new Timer()
    timer.start("x")
    await new Promise(r => setTimeout(r, 10))
    timer.stop("x")

    const detailed = timer.getDetailed()
    expect(detailed["x"]).toBeDefined()
    expect(detailed["x"]!.count).toBe(1)
    expect(detailed["x"]!.totalMs).toBeGreaterThanOrEqual(5)
    expect(detailed["x"]!.avgMs).toBeGreaterThan(0)
  })

  it("reset clears a single label", () => {
    const timer = new Timer()
    timer.start("a")
    timer.stop("a")
    timer.start("b")
    timer.stop("b")

    timer.reset("a")
    expect(timer.getCount("a")).toBe(0)
    expect(timer.getCount("b")).toBe(1)
  })

  it("resetAll clears everything", () => {
    const timer = new Timer()
    timer.start("a")
    timer.stop("a")
    timer.start("b")
    timer.stop("b")

    timer.resetAll()
    expect(timer.labels().length).toBe(0)
  })

  it("labels returns all tracked labels", () => {
    const timer = new Timer()
    timer.start("x")
    timer.stop("x")
    timer.start("y")
    timer.stop("y")

    const labels = timer.labels()
    expect(labels).toContain("x")
    expect(labels).toContain("y")
    expect(labels.length).toBe(2)
  })
})

describe("measure", () => {
  it("measures async function duration", async () => {
    const { result, ms } = await measure("test", async () => {
      await new Promise(r => setTimeout(r, 30))
      return 42
    })
    expect(result).toBe(42)
    expect(ms).toBeGreaterThanOrEqual(20)
  })
})

describe("measureSync", () => {
  it("measures sync function duration", () => {
    const { result, ms } = measureSync("test", () => {
      let sum = 0
      for (let i = 0; i < 1000000; i++) sum += i
      return sum
    })
    expect(result).toBeGreaterThan(0)
    expect(ms).toBeGreaterThanOrEqual(0)
  })
})

describe("globalTimer", () => {
  it("is a Timer instance", () => {
    expect(globalTimer).toBeInstanceOf(Timer)
  })
})
