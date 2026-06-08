#!/usr/bin/env bun
/**
 * Publish all OmniCod packages to npm.
 *
 * Usage:
 *   NPM_TOKEN=npm_xxx bun run scripts/publish.ts
 *   NPM_TOKEN=npm_xxx bun run scripts/publish.ts --dry-run
 */

import { join }                              from "node:path"
import { writeFileSync, existsSync, copyFileSync } from "node:fs"
import { homedir }                           from "node:os"

const ROOT    = join(import.meta.dir, "..")
const DRY_RUN = process.argv.includes("--dry-run")
const TOKEN   = process.env["NPM_TOKEN"]

if (!TOKEN && !DRY_RUN) {
  console.error("NPM_TOKEN environment variable is required.\nUsage: NPM_TOKEN=npm_xxx bun run publish:all")
  process.exit(1)
}

// Write token to ~/.npmrc (space format — works across npm versions)
if (TOKEN) {
  const NPMRC_PATH = join(homedir(), ".npmrc")
  const NPMRC_LINE = `//registry.npmjs.org/:_authToken=${TOKEN}`
  let existing = existsSync(NPMRC_PATH) ? await Bun.file(NPMRC_PATH).text() : ""

  // Replace existing auth line or append
  if (existing.includes("registry.npmjs.org/:_authToken")) {
    existing = existing.replace(/\/\/registry\.npmjs\.org\/:_authToken[= ].*/g, NPMRC_LINE)
  } else {
    existing += (existing.endsWith("\n") ? "" : "\n") + NPMRC_LINE + "\n"
  }
  writeFileSync(NPMRC_PATH, existing)
}

// Copy root README into packages that expose it to npm
const README_SRC = join(ROOT, "README.md")
for (const pkg of ["cli", "omnicod"]) {
  copyFileSync(README_SRC, join(ROOT, "packages", pkg, "README.md"))
}

// Platform packages first, then wrappers last
const PLATFORM_PACKAGES = [
  "cli-linux-x64",
  "cli-linux-arm64",
  "cli-darwin-x64",
  "cli-darwin-arm64",
  "cli-win32-x64",
  "cli",        // @omnicod/cli
]
const MAIN_PACKAGE = "omnicod"

function npm(args: string[], cwd: string): boolean {
  const cmd = ["npm", ...args, ...(DRY_RUN ? ["--dry-run"] : [])]
  console.log(`\n▶ ${cmd.join(" ")}  (${cwd})`)

  const result = Bun.spawnSync(cmd, {
    cwd,
    stdout: "inherit",
    stderr: "inherit",
  })

  return result.exitCode === 0
}

function sleep(ms: number): Promise<void> {
  return new Promise((r) => setTimeout(r, ms))
}

async function publishWithRetry(pkg: string, retries = 3, delayMs = 30_000): Promise<boolean> {
  const dir = join(ROOT, "packages", pkg)
  for (let attempt = 1; attempt <= retries; attempt++) {
    const ok = npm(["publish", "--access", "public"], dir)
    if (ok) return true
    if (attempt < retries) {
      console.error(`✗ Attempt ${attempt} failed, retrying in ${delayMs / 1000}s...`)
      await sleep(delayMs)
    }
  }
  return false
}

let allOk = true

// Publish platform packages with a short gap between each
for (const pkg of PLATFORM_PACKAGES) {
  const ok = npm(["publish", "--access", "public"], join(ROOT, "packages", pkg))
  if (!ok) {
    console.error(`✗ Failed to publish ${pkg}`)
    allOk = false
  } else {
    const name = pkg === "omnicod" ? "omnicod" : `@omnicod/${pkg}`
    console.log(`✓ Published ${name}`)
  }
  if (!DRY_RUN) await sleep(5_000)
}

// Wait for npm registry to fully process platform packages
if (!DRY_RUN) {
  console.log("\nWaiting 30s for npm registry to index platform packages...")
  await sleep(30_000)
}

// Publish main package with retry
const mainOk = await publishWithRetry(MAIN_PACKAGE)
if (!mainOk) {
  console.error(`✗ Failed to publish ${MAIN_PACKAGE} after retries`)
  allOk = false
} else {
  console.log(`✓ Published ${MAIN_PACKAGE}`)
}

if (!allOk) {
  console.error("\nSome packages failed to publish.")
  process.exit(1)
}

console.log(DRY_RUN ? "\nDry run complete." : "\nAll packages published.")
