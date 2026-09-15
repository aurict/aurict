#!/usr/bin/env bun
/**
 * Aurict build script
 * Çıktı: dist/aurict (tek çalıştırılabilir binary, --compile ile gömülü Bun runtime)
 */

import { join } from "node:path"
import { mkdirSync, existsSync } from "node:fs"
import { buildDefineArgs, resolveBuildMetadata } from "./build-metadata.js"
import { cliBuildEntrypoints, verifyAgentWorkerBundled, verifyBlastRadiusWorkerBundled } from "./agent-build-entrypoints.js"

const ROOT    = join(import.meta.dir, "..")
const ENTRIES = cliBuildEntrypoints(ROOT)
const OUTDIR  = join(ROOT, "dist")
const OUTFILE = join(OUTDIR, "aurict")

console.log("Building Aurict…")
const metadata = resolveBuildMetadata(ROOT)

if (!existsSync(OUTDIR)) mkdirSync(OUTDIR, { recursive: true })

const result = Bun.spawnSync([
  "bun", "build", ...ENTRIES,
  "--compile",
  "--outfile", OUTFILE,
  "--target", "bun",
  "--minify",
  "--external", "fsevents",
  ...buildDefineArgs(metadata),
], {
  cwd:    ROOT,
  stdout: "inherit",
  stderr: "inherit",
})

if (result.exitCode !== 0) {
  console.error("Build failed!")
  process.exit(1)
}

await verifyAgentWorkerBundled(OUTFILE)
await verifyBlastRadiusWorkerBundled(OUTFILE)

// Make executable
Bun.spawnSync(["chmod", "+x", OUTFILE])

const stat = Bun.file(OUTFILE)
const size = ((await stat.arrayBuffer()).byteLength / 1024 / 1024).toFixed(1)
console.log(`\nBuild successful!`)
console.log(`  Output : ${OUTFILE}`)
console.log(`  Size   : ${size} MB`)
console.log(`  Usage  : ./dist/aurict`)
