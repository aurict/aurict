import { expect, test } from "bun:test"
import { readFileSync } from "node:fs"

const doc = readFileSync("docs/security.md", "utf8")

test("security docs describe policy sandbox honestly", () => {
  expect(doc).toContain("policy sandbox")
  expect(doc).toContain("not container isolation")
  expect(doc).toContain("Docker")
})
