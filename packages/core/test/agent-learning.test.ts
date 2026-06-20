import { describe, it, expect, beforeEach } from "bun:test"
import { createAgentLearner } from "../src/agent/learning.js"

describe("Agent Specialization Learning", () => {
  describe("recordTask", () => {
    it("records successful task", () => {
      const learner = createAgentLearner()
      learner.recordTask("code", true, 10, 5000)

      const perf = learner.getPerformance("code")
      expect(perf).not.toBeNull()
      expect(perf!.totalTasks).toBe(1)
      expect(perf!.successfulTasks).toBe(1)
      expect(perf!.failedTasks).toBe(0)
    })

    it("records failed task", () => {
      const learner = createAgentLearner()
      learner.recordTask("code", false, 5, 3000)

      const perf = learner.getPerformance("code")
      expect(perf!.failedTasks).toBe(1)
    })

    it("calculates moving average", () => {
      const learner = createAgentLearner()
      learner.recordTask("code", true, 10, 5000)
      learner.recordTask("code", true, 20, 10000)

      const perf = learner.getPerformance("code")
      expect(perf!.avgToolCalls).toBe(15)
      expect(perf!.avgDuration).toBe(7500)
    })

    it("calculates effectiveness score", () => {
      const learner = createAgentLearner()
      learner.recordTask("code", true, 10, 5000)
      learner.recordTask("code", true, 10, 5000)
      learner.recordTask("code", false, 10, 5000)

      const perf = learner.getPerformance("code")
      // 2/3 success = 67%
      expect(perf!.effectivenessScore).toBe(67)
    })
  })

  describe("getSuggestions", () => {
    it("returns empty for insufficient data", () => {
      const learner = createAgentLearner({ minTasksForAnalysis: 5 })
      learner.recordTask("code", false, 10, 5000)

      const suggestions = learner.getSuggestions("code")
      expect(suggestions.length).toBe(0)
    })

    it("returns suggestions for low performers", () => {
      const learner = createAgentLearner({
        minTasksForAnalysis: 3,
        lowPerformanceThreshold: 60,
      })

      // 3 başarısız görev
      learner.recordTask("code", false, 10, 5000)
      learner.recordTask("code", false, 10, 5000)
      learner.recordTask("code", false, 10, 5000)

      const suggestions = learner.getSuggestions("code")
      expect(suggestions.length).toBeGreaterThan(0)
      expect(suggestions).toContain("testing-patterns")
    })

    it("returns empty for high performers", () => {
      const learner = createAgentLearner({
        minTasksForAnalysis: 3,
        lowPerformanceThreshold: 60,
      })

      // 3 başarılı görev
      learner.recordTask("code", true, 10, 5000)
      learner.recordTask("code", true, 10, 5000)
      learner.recordTask("code", true, 10, 5000)

      const suggestions = learner.getSuggestions("code")
      expect(suggestions.length).toBe(0)
    })
  })

  describe("getLowPerformers", () => {
    it("identifies low performers", () => {
      const learner = createAgentLearner({
        minTasksForAnalysis: 3,
        lowPerformanceThreshold: 60,
      })

      learner.recordTask("code", false, 10, 5000)
      learner.recordTask("code", false, 10, 5000)
      learner.recordTask("code", false, 10, 5000)

      learner.recordTask("test", true, 10, 5000)
      learner.recordTask("test", true, 10, 5000)
      learner.recordTask("test", true, 10, 5000)

      const lowPerformers = learner.getLowPerformers()
      expect(lowPerformers.length).toBe(1)
      expect(lowPerformers[0]!.agentType).toBe("code")
    })
  })

  describe("getReport", () => {
    it("generates markdown report", () => {
      const learner = createAgentLearner()
      learner.recordTask("code", true, 10, 5000)
      learner.recordTask("test", false, 5, 3000)

      const report = learner.getReport()
      expect(report).toContain("Agent Performance Report")
      expect(report).toContain("code")
      expect(report).toContain("test")
    })

    it("shows no data message when empty", () => {
      const learner = createAgentLearner()
      const report = learner.getReport()
      expect(report).toContain("No agent performance data yet")
    })
  })

  describe("reset", () => {
    it("clears all data", () => {
      const learner = createAgentLearner()
      learner.recordTask("code", true, 10, 5000)
      learner.reset()

      const perf = learner.getPerformance("code")
      expect(perf).toBeNull()
    })
  })
})
