#!/usr/bin/env bun
/**
 * Bump version across all packages and source files.
 * Usage: bun run scripts/bump-version.ts <version>
 * Example: bun run scripts/bump-version.ts 1.0.2
 */

import { join } from "node:path"
import { readFileSync, writeFileSync } from "node:fs"

const ROOT = join(import.meta.dir, "..")
const version = process.argv[2]

if (!version || !/^\d+\.\d+\.\d+$/.test(version)) {
  console.error("Usage: bun run scripts/bump-version.ts <version>")
  console.error("Example: bun run scripts/bump-version.ts 1.0.2")
  process.exit(1)
}

// package.json files to update (version field)
const PACKAGES = [
  "package.json",
  "packages/aurict/package.json",
  "packages/cli/package.json",
  "packages/core/package.json",
  "packages/sdk/package.json",
  "packages/cli-linux-x64/package.json",
  "packages/cli-linux-arm64/package.json",
  "packages/cli-darwin-x64/package.json",
  "packages/cli-darwin-arm64/package.json",
  "packages/cli-win32-x64/package.json",
]

// Source files with hardcoded version strings
const SOURCE_FILES: Array<{ path: string; pattern: RegExp; replace: string }> = [
  {
    path: "packages/cli/src/index.ts",
    pattern: /Aurict v\d+\.\d+\.\d+/g,
    replace: `Aurict v${version}`,
  },
  {
    path: "packages/cli/src/util/update-check.ts",
    pattern: /CURRENT_VERSION = "\d+\.\d+\.\d+"/,
    replace: `CURRENT_VERSION = "${version}"`,
  },
]

let changed = 0

for (const rel of PACKAGES) {
  const file = join(ROOT, rel)
  const pkg = JSON.parse(readFileSync(file, "utf8"))
  const old = pkg.version

  pkg.version = version

  // Also update optionalDependencies if present (packages/aurict)
  if (pkg.optionalDependencies) {
    for (const k of Object.keys(pkg.optionalDependencies)) {
      pkg.optionalDependencies[k] = version
    }
  }

  writeFileSync(file, JSON.stringify(pkg, null, 2) + "\n")
  console.log(`✓ ${rel}  ${old} → ${version}`)
  changed++
}

for (const { path: rel, pattern, replace } of SOURCE_FILES) {
  const file = join(ROOT, rel)
  const src = readFileSync(file, "utf8")
  const next = src.replace(pattern, replace)
  if (next !== src) {
    writeFileSync(file, next)
    console.log(`✓ ${rel}  (version string updated)`)
    changed++
  }
}

console.log(`\nDone — ${changed} file(s) updated to v${version}`)
console.log(`Next: git add -A && git commit -m "chore: bump version to ${version}" && git tag v${version} && git push origin main v${version}`)
