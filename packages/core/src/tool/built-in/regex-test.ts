import { z } from "zod"
import type { ToolDef, ExecuteResult } from "../types.js"

export const regexTestTool: ToolDef = {
  id: "regex_test",
  description: `Test a regular expression against input strings. Shows all matches, capture groups, and named groups.

USE FOR:
- Validating regex patterns before embedding in code
- Debugging why a regex does/doesn't match
- Extracting data from strings using capture groups
- Testing multiple inputs at once`,

  parameters: z.object({
    pattern: z.string().describe("Regex pattern (without slashes, e.g. '^\\\\d{4}-\\\\d{2}$')"),
    flags:   z.string().default("g").describe("Regex flags: g=global, i=case-insensitive, m=multiline, s=dotAll, etc."),
    inputs:  z.union([z.string(), z.array(z.string())]).describe("String or array of strings to test against"),
    mode:    z.enum(["match", "test", "replace"]).default("match").describe("match=show all matches, test=true/false only, replace=show substitution"),
    replace_with: z.string().optional().describe("Replacement string for replace mode (supports $1, $2, named groups)"),
  }),

  async execute(args): Promise<ExecuteResult> {
    const pattern = String(args["pattern"])
    const flags   = String(args["flags"] ?? "g")
    const mode    = String(args["mode"] ?? "match")
    const replaceWith = args["replace_with"] as string | undefined

    // Validate pattern
    let re: RegExp
    try {
      re = new RegExp(pattern, flags)
    } catch (err) {
      return { output: "", error: `Invalid regex: ${err instanceof Error ? err.message : String(err)}` }
    }

    const raw = args["inputs"]
    const inputs: string[] = Array.isArray(raw) ? raw.map(String) : [String(raw)]

    const results = inputs.map((input) => {
      if (mode === "test") {
        return { input, matches: re.test(input) }
      }

      if (mode === "replace") {
        const replaced = input.replace(re, replaceWith ?? "")
        return { input, result: replaced }
      }

      // match mode
      const matches: Array<{
        match: string
        index: number
        groups?: Record<string, string | undefined>
        captures?: string[]
      }> = []

      // Reset lastIndex for global flag
      re.lastIndex = 0

      if (flags.includes("g")) {
        let m: RegExpExecArray | null
        while ((m = re.exec(input)) !== null) {
          matches.push({
            match:    m[0],
            index:    m.index,
            ...(m.length > 1        ? { captures: [...m].slice(1) } : {}),
            ...(m.groups            ? { groups:   m.groups }        : {}),
          })
          // Prevent infinite loop on zero-length match
          if (m[0].length === 0) re.lastIndex++
        }
      } else {
        const m = re.exec(input)
        if (m) {
          matches.push({
            match:    m[0],
            index:    m.index,
            ...(m.length > 1        ? { captures: [...m].slice(1) } : {}),
            ...(m.groups            ? { groups:   m.groups }        : {}),
          })
        }
      }

      return {
        input,
        matched:      matches.length > 0,
        match_count:  matches.length,
        matches,
      }
    })

    const out = {
      pattern,
      flags,
      mode,
      results: inputs.length === 1 ? results[0] : results,
    }

    return { output: JSON.stringify(out, null, 2) }
  },
}
