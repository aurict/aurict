import { mkdirSync, mkdtempSync, rmSync } from "node:fs"
import { tmpdir } from "node:os"
import { join } from "node:path"
import { spawnSync } from "node:child_process"

type SuiteName = "core" | "cli" | "desktop" | "integration"

const SUITES: Record<SuiteName, string[]> = {
  core: ["packages/core/test/"],
  cli: ["packages/cli/test/", "packages/backend-contract/test/"],
  desktop: ["apps/desktop/test/"],
  integration: ["packages/cli/test/remote-webrtc-transport.test.ts"],
}

function requestedSuites(value: string | undefined): SuiteName[] {
  if (!value || value === "all") return ["core", "cli", "desktop"]
  if (value in SUITES) return [value as SuiteName]
  throw new Error(`Unknown test suite: ${value}. Use core, cli, desktop, integration, or all.`)
}

function runSuite(suite: SuiteName, extraArgs: string[]): boolean {
  if (suite === "integration" && (process.env.AURICT_RUN_WEBRTC_INTEGRATION !== "1" || !process.env.AURICT_WEBRTC_TEST_STUN_URL)) {
    throw new Error("Integration tests require AURICT_RUN_WEBRTC_INTEGRATION=1 and AURICT_WEBRTC_TEST_STUN_URL.")
  }

  const testRoot = mkdtempSync(join(tmpdir(), `aurict-${suite}-tests-`))
  const stateDir = join(testRoot, "state")
  const remoteDir = join(testRoot, "remote")
  const snapshotDir = join(testRoot, "snapshots")
  const configDir = join(testRoot, "config")
  for (const directory of [stateDir, remoteDir, snapshotDir, configDir]) mkdirSync(directory, { recursive: true })

  let passed = false
  let cleanupFailed = false
  try {
    process.stdout.write(`\n[test:${suite}] isolated state: ${testRoot}\n`)
    const result = spawnSync(process.execPath, ["test", ...SUITES[suite], "--timeout", "30000", ...extraArgs], {
      cwd: join(import.meta.dir, ".."),
      env: {
        ...process.env,
        AURICT_STATE_DIR: stateDir,
        AURICT_HOME: stateDir,
        AURICT_REMOTE_STATE_DIR: remoteDir,
        AURICT_SNAPSHOT_DIR: snapshotDir,
        XDG_CONFIG_HOME: configDir,
      },
      stdio: "inherit",
    })
    if (result.error) throw new Error(`Could not start ${suite} tests: ${result.error.message}`)
    if (result.signal) throw new Error(`${suite} tests terminated by signal ${result.signal}`)
    passed = result.status === 0
  } finally {
    if (process.env.AURICT_KEEP_TEST_STATE === "1") {
      process.stdout.write(`[test:${suite}] preserved state: ${testRoot}\n`)
    } else {
      try {
        rmSync(testRoot, { recursive: true, force: true })
      } catch (error) {
        cleanupFailed = true
        process.stderr.write(`[test:${suite}] cleanup failed for ${testRoot}: ${error instanceof Error ? error.message : String(error)}\n`)
      }
    }
  }
  return passed && !cleanupFailed
}

let success = true
try {
  const [suiteArg, ...extraArgs] = process.argv.slice(2)
  for (const suite of requestedSuites(suiteArg)) {
    if (!runSuite(suite, extraArgs)) success = false
  }
} catch (error) {
  success = false
  process.stderr.write(`[test] ${error instanceof Error ? error.message : String(error)}\n`)
}

process.exitCode = success ? 0 : 1
