export type UseCase = {
  slug: string
  title: string
  description: string
  agent: string
  icon: string
  updatedAt: string
  problem: string
  solution: string
  steps: string[]
  benefits: string[]
  beforeCode?: string
  afterCode?: string
}

export const USE_CASES: UseCase[] = [
  {
    slug: "refactoring",
    title: "AI-Powered Code Refactoring",
    description:
      "Refactor complex code safely with Aurict's code agent. Identify issues, plan changes, and execute refactoring with confidence.",
    agent: "Code Agent",
    icon: "01",
    updatedAt: "2026-07-03",
    problem:
      "Legacy code is hard to refactor. You need to understand dependencies, avoid breaking changes, and ensure tests still pass. Manual refactoring is slow and error-prone.",
    solution:
      "Aurict analyzes your codebase, maps dependencies, and uses specialist agents to plan and execute targeted changes with context awareness.",
    steps: [
      "Ask Aurict to refactor a specific module or pattern",
      "The Explore Agent maps dependencies and usages",
      "The Code Agent plans the refactoring approach",
      "Changes are made with project context",
      "Tests are run or recommended to verify correctness",
    ],
    benefits: [
      "Dependency-aware refactoring",
      "Test-oriented verification",
      "Complex multi-file changes",
      "Project style preservation",
      "Framework-aware guidance",
    ],
    beforeCode: `// Before: Scattered auth logic
function login(user, pass) {
  const token = btoa(user + ":" + pass)
  localStorage.setItem("token", token)
  return fetch("/api/login", {
    headers: { Authorization: "Basic " + token }
  })
}`,
    afterCode: `// After: Central auth module
import { createAuthModule } from "./auth"

const auth = createAuthModule({
  storage: "secure",
  tokenType: "jwt",
})

async function login(credentials) {
  return auth.authenticate(credentials)
}`,
  },
  {
    slug: "code-review",
    title: "Automated Code Review with AI",
    description:
      "Catch bugs, security issues, and style violations before they reach production. Aurict's Review Agent provides structured code review.",
    agent: "Review Agent",
    icon: "02",
    updatedAt: "2026-07-03",
    problem:
      "Code reviews are time-consuming. Reviewers can miss subtle bugs, security issues, and consistency problems when changes are large or context is fragmented.",
    solution:
      "Aurict's Review Agent analyzes code changes for bugs, security risk, performance issues, and style drift, then reports actionable findings with clear severity.",
    steps: [
      "Point Aurict at a PR, branch, or file",
      "The Review Agent analyzes the change",
      "Issues are grouped by severity",
      "Suggestions include concrete fixes",
      "Security-sensitive findings are called out clearly",
    ],
    benefits: [
      "Bug-focused review",
      "Security issue detection",
      "Consistent review structure",
      "Performance risk identification",
      "Scales to larger changes",
    ],
  },
  {
    slug: "testing",
    title: "AI-Generated Tests That Work",
    description:
      "Generate meaningful tests with Aurict's Test Agent. Improve coverage with tests that target real paths, edge cases, and failure modes.",
    agent: "Test Agent",
    icon: "03",
    updatedAt: "2026-07-03",
    problem:
      "Writing tests is easy to delay. Low coverage lets bugs reach production, and shallow generated tests often miss real edge cases.",
    solution:
      "Aurict's Test Agent reads code structure, identifies important paths, and drafts unit or integration tests in the project's existing framework.",
    steps: [
      "Ask Aurict to generate tests for a module",
      "The Test Agent analyzes code paths",
      "Edge cases and error cases are selected",
      "Tests are written in the local framework",
      "The result is verified or marked with next test commands",
    ],
    benefits: [
      "Edge case coverage",
      "Framework-aware test structure",
      "Readable test names",
      "Dependency mock guidance",
      "Better regression safety",
    ],
  },
  {
    slug: "documentation",
    title: "Auto-Generate Documentation",
    description:
      "Generate useful documentation from your code. Aurict's Docs Agent can draft READMEs, API notes, inline comments, and usage examples.",
    agent: "Docs Agent",
    icon: "04",
    updatedAt: "2026-07-03",
    problem:
      "Documentation drifts when the code moves faster than the docs. New contributors lose time reconstructing intent from source files.",
    solution:
      "Aurict's Docs Agent analyzes structure, public APIs, commands, and usage patterns, then drafts documentation aligned with the codebase.",
    steps: [
      "Ask Aurict to document a module or project",
      "The Docs Agent reads the relevant files",
      "Public APIs and commands are extracted",
      "Documentation is drafted with examples",
      "Gaps and assumptions are highlighted",
    ],
    benefits: [
      "README generation",
      "API documentation",
      "Usage examples",
      "Contributor onboarding",
      "Reduced documentation drift",
    ],
  },
]
