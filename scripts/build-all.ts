#!/usr/bin/env bun
/**
 * Cross-compile Aurict for all supported platforms.
 *
 * Outputs:
 *   dist/aurict-linux-x64
 *   dist/aurict-linux-arm64
 *   dist/aurict-darwin-x64
 *   dist/aurict-darwin-arm64
 *
 * Then copies each binary into its platform package directory so
 * `bun run publish` can publish them directly.
 *
 * Usage:
 *   bun run scripts/build-all.ts            # all platforms
 *   bun run scripts/build-all.ts linux-x64  # single target
 */

import { join } from "node:path"
import { mkdirSync, copyFileSync, chmodSync, writeFileSync } from "node:fs"

const ROOT  = join(import.meta.dir, "..")
const ENTRY = join(ROOT, "packages/cli/src/index.ts")
const DIST  = join(ROOT, "dist")

mkdirSync(DIST, { recursive: true })

// Patch ink's devtools.js to a no-op so react-devtools-core is never imported.
// ink loads devtools only when process.env.DEV === 'true'; Bun 1.3.x doesn't
// tree-shake dynamic imports even when the guard is statically false, so we
// stub the file directly instead of relying on --define.
const { stdout: findOut } = Bun.spawnSync(
  ["find", "node_modules", "-path", "*/ink/build/devtools.js"],
  { cwd: ROOT, stderr: "pipe" },
)
const devtoolsPaths = findOut.toString().trim().split("\n").filter(Boolean)
for (const p of devtoolsPaths) {
  writeFileSync(join(ROOT, p), "// production no-op — react-devtools-core not needed\n")
}
if (devtoolsPaths.length > 0) {
  console.log(`Patched ink devtools (${devtoolsPaths.length} file(s))`)
}

const TARGETS = [
  { id: "linux-x64",    bunTarget: "bun-linux-x64",    exe: false },
  { id: "linux-arm64",  bunTarget: "bun-linux-arm64",  exe: false },
  { id: "darwin-x64",   bunTarget: "bun-darwin-x64",   exe: false },
  { id: "darwin-arm64", bunTarget: "bun-darwin-arm64", exe: false },
  { id: "win32-x64",    bunTarget: "bun-windows-x64",  exe: true  },
]

const filter = process.argv[2]
const targets = filter ? TARGETS.filter(t => t.id === filter) : TARGETS

if (targets.length === 0) {
  console.error(`Unknown target: ${filter}`)
  console.error(`Available: ${TARGETS.map(t => t.id).join(", ")}`)
  process.exit(1)
}

let allOk = true

for (const { id, bunTarget, exe } of targets) {
  const outSuffix = exe ? `aurict-${id}.exe` : `aurict-${id}`
  const outFile   = join(DIST, outSuffix)
  console.log(`\n▶ Building ${id}…`)

  const result = Bun.spawnSync([
    "bun", "build", ENTRY,
    "--compile",
    "--target",  bunTarget,
    "--outfile", outFile,
    "--minify",
    "--external", "fsevents",
  ], {
    cwd:    ROOT,
    stdout: "inherit",
    stderr: "inherit",
  })

  if (result.exitCode !== 0) {
    console.error(`✗ Build failed for ${id}`)
    allOk = false
    continue
  }

  // chmod is a no-op on Windows binaries but harmless to attempt on Linux/macOS host
  try { chmodSync(outFile, 0o755) } catch { /* Windows .exe doesn't need chmod */ }

  // Copy into platform package so `npm publish` picks it up
  const pkgBin  = join(ROOT, `packages/cli-${id}/bin`)
  const binName = exe ? "aurict.exe" : "aurict"
  mkdirSync(pkgBin, { recursive: true })
  copyFileSync(outFile, join(pkgBin, binName))
  try { chmodSync(join(pkgBin, binName), 0o755) } catch { /* Windows .exe */ }

  const size = ((await Bun.file(outFile).arrayBuffer()).byteLength / 1024 / 1024).toFixed(1)
  console.log(`✓ ${id}  →  dist/${outSuffix}  (${size} MB)`)
}

if (!allOk) process.exit(1)
console.log("\nAll builds complete.")
