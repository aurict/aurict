#!/usr/bin/env bun
import { compareAgentPolicies, runAgentPolicyEval, type AgentPolicyProfile } from "../packages/core/src/eval/agent-policy-eval.js"

const args = new Set(process.argv.slice(2))
const json = args.has("--json")
const requested = process.argv.find(argument => argument.startsWith("--profile="))?.split("=")[1]

if (requested && requested !== "legacy" && requested !== "current" && requested !== "both") {
  throw new Error(`Unknown policy profile '${requested}'. Use legacy, current, or both.`)
}

const result = requested === "legacy" || requested === "current"
  ? runAgentPolicyEval(requested as AgentPolicyProfile)
  : compareAgentPolicies()

if (json) {
  console.log(JSON.stringify(result, null, 2))
} else if ("delta" in result) {
  printProfile(result.legacy)
  printProfile(result.current)
  console.log(`delta score=${result.delta.score.toFixed(2)} promptChars=${result.delta.promptChars}`)
} else {
  printProfile(result)
}

function printProfile(profile: ReturnType<typeof runAgentPolicyEval>): void {
  console.log(`${profile.profile}: ${profile.passed}/${profile.total} (${(profile.score * 100).toFixed(0)}%)`)
  for (const testCase of profile.cases) {
    console.log(`  ${testCase.ok ? "PASS" : "FAIL"} ${testCase.id} — ${testCase.detail}`)
  }
}

const current = "current" in result ? result.current : result.profile === "current" ? result : null
if (current && current.passed !== current.total) process.exitCode = 1
