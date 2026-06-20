import { describe, it, expect } from "bun:test"
import { decomposeTask, flattenTaskTree, getTaskProgress } from "../src/agent/decomposition.js"

describe("Hierarchical Task Decomposition", () => {
  describe("decomposeTask", () => {
    it("simple task → single agent", () => {
      const result = decomposeTask({
        task: "Fix the login bug",
        complexity: "simple",
      })

      expect(result.level).toBe("file")
      expect(result.children.length).toBe(0)
      expect(result.agentType).toBe("debug")
    })

    it("moderate task with single dimension → single agent", () => {
      const result = decomposeTask({
        task: "Optimize the database queries",
        complexity: "moderate",
      })

      expect(result.level).toBe("domain")
      expect(result.children.length).toBe(0)
      expect(result.agentType).toBe("performance")
    })

    it("moderate task with multiple dimensions → parallel agents", () => {
      const result = decomposeTask({
        task: "Review security, performance, and architecture",
        complexity: "moderate",
      })

      expect(result.level).toBe("global")
      expect(result.children.length).toBeGreaterThan(1)
      expect(result.children.every(c => c.level === "domain")).toBe(true)
    })

    it("complex task → 3-level hierarchy", () => {
      const result = decomposeTask({
        task: "Refactor the entire codebase",
        projectStructure: [
          "src/auth/login.ts",
          "src/auth/register.ts",
          "src/api/users.ts",
          "src/api/posts.ts",
          "src/db/models.ts",
        ],
        complexity: "complex",
      })

      expect(result.level).toBe("global")
      expect(result.children.length).toBeGreaterThan(0)
      
      // Domain level
      for (const domain of result.children) {
        expect(domain.level).toBe("domain")
        // File level
        for (const file of domain.children) {
          expect(file.level).toBe("file")
        }
      }
    })

    it("infers correct agent type for security tasks", () => {
      const result = decomposeTask({
        task: "Check for security vulnerabilities",
        complexity: "simple",
      })

      expect(result.agentType).toBe("security")
    })

    it("infers correct agent type for test tasks", () => {
      const result = decomposeTask({
        task: "Write unit tests for the module",
        complexity: "simple",
      })

      expect(result.agentType).toBe("test")
    })

    it("defaults to code agent for generic tasks", () => {
      const result = decomposeTask({
        task: "Implement a new feature",
        complexity: "simple",
      })

      expect(result.agentType).toBe("code")
    })
  })

  describe("flattenTaskTree", () => {
    it("flattens nested tree to leaf nodes", () => {
      const tree = decomposeTask({
        task: "Complex task",
        projectStructure: ["src/a.ts", "src/b.ts", "lib/c.ts"],
        complexity: "complex",
      })

      const flat = flattenTaskTree(tree)
      
      // Sadece leaf node'lar (file level)
      expect(flat.every(node => node.children.length === 0)).toBe(true)
      expect(flat.length).toBeGreaterThan(0)
    })

    it("simple task → single node", () => {
      const tree = decomposeTask({
        task: "Simple task",
        complexity: "simple",
      })

      const flat = flattenTaskTree(tree)
      expect(flat.length).toBe(1)
    })
  })

  describe("getTaskProgress", () => {
    it("all pending initially", () => {
      const tree = decomposeTask({
        task: "Test task",
        complexity: "simple",
      })

      const progress = getTaskProgress(tree)
      expect(progress.total).toBe(1)
      expect(progress.pending).toBe(1)
      expect(progress.done).toBe(0)
    })

    it("tracks status changes", () => {
      const tree = decomposeTask({
        task: "Test task",
        complexity: "simple",
      })

      tree.status = "running"
      let progress = getTaskProgress(tree)
      expect(progress.running).toBe(1)

      tree.status = "done"
      progress = getTaskProgress(tree)
      expect(progress.done).toBe(1)
    })
  })
})
