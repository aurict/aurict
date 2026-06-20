import { describe, it, expect } from "bun:test"
import { computeOptimalWorkers, adjustForComplexity, getPoolSizingReport } from "../src/agent/pool-sizing.js"

describe("Dynamic Worker Pool Sizing", () => {
  describe("computeOptimalWorkers", () => {
    it("small project → 2 workers", () => {
      expect(computeOptimalWorkers(10)).toBe(2)
      expect(computeOptimalWorkers(19)).toBe(2)
    })

    it("medium project → 4 workers", () => {
      expect(computeOptimalWorkers(20)).toBe(4)
      expect(computeOptimalWorkers(99)).toBe(4)
    })

    it("large project → 6 workers", () => {
      expect(computeOptimalWorkers(100)).toBe(6)
      expect(computeOptimalWorkers(499)).toBe(6)
    })

    it("huge project → 8 workers", () => {
      expect(computeOptimalWorkers(500)).toBe(8)
      expect(computeOptimalWorkers(1000)).toBe(8)
    })

    it("respects maxWorkers config", () => {
      expect(computeOptimalWorkers(1000, { maxWorkers: 4 })).toBe(4)
    })

    it("custom thresholds", () => {
      const config = {
        smallThreshold: 10,
        mediumThreshold: 50,
        largeThreshold: 200,
        smallWorkers: 1,
        mediumWorkers: 3,
        largeWorkers: 5,
        hugeWorkers: 7,
      }
      
      expect(computeOptimalWorkers(5, config)).toBe(1)
      expect(computeOptimalWorkers(30, config)).toBe(3)
      expect(computeOptimalWorkers(100, config)).toBe(5)
      expect(computeOptimalWorkers(300, config)).toBe(7)
    })
  })

  describe("adjustForComplexity", () => {
    it("simple task → half workers", () => {
      expect(adjustForComplexity(4, "simple")).toBe(2)
    })

    it("moderate task → same workers", () => {
      expect(adjustForComplexity(4, "moderate")).toBe(4)
    })

    it("complex task → double workers", () => {
      expect(adjustForComplexity(4, "complex")).toBe(8)
    })

    it("respects max limit of 12", () => {
      expect(adjustForComplexity(8, "complex")).toBe(12)
    })

    it("simple task minimum is 1", () => {
      expect(adjustForComplexity(1, "simple")).toBe(1)
    })
  })

  describe("getPoolSizingReport", () => {
    it("small project report", () => {
      const report = getPoolSizingReport(15)
      expect(report.category).toBe("small")
      expect(report.recommendedWorkers).toBe(2)
    })

    it("medium project report", () => {
      const report = getPoolSizingReport(50)
      expect(report.category).toBe("medium")
      expect(report.recommendedWorkers).toBe(4)
    })

    it("large project report", () => {
      const report = getPoolSizingReport(200)
      expect(report.category).toBe("large")
      expect(report.recommendedWorkers).toBe(6)
    })

    it("huge project report", () => {
      const report = getPoolSizingReport(600)
      expect(report.category).toBe("huge")
      expect(report.recommendedWorkers).toBe(8)
    })
  })
})
