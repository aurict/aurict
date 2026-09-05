import { afterEach, describe, expect, it } from "bun:test"
import { chmodSync, cpSync, mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs"
import { tmpdir } from "node:os"
import { join } from "node:path"

const repositoryRoot = join(import.meta.dir, "../../..")
const launchers = [
  join(repositoryRoot, "packages/aurict/bin/aurict"),
  join(repositoryRoot, "packages/cli/bin/aurict"),
]
const tempDirs: string[] = []

afterEach(() => {
  for (const dir of tempDirs.splice(0)) rmSync(dir, { recursive: true, force: true })
})

describe.skipIf(process.platform === "win32")("npm launcher", () => {
  for (const sourceLauncher of launchers) {
    const packageName = sourceLauncher.includes("packages/aurict/") ? "aurict" : "@aurict/cli"

    it(`${packageName} reports platform binary launch failures`, () => {
      const fixture = createFixture(sourceLauncher, "process.kill(process.pid, 'SIGKILL')")
      const result = Bun.spawnSync([process.execPath, fixture.launcher, "--version"], {
        stdout: "pipe",
        stderr: "pipe",
      })

      expect(result.exitCode).toBe(1)
      expect(result.stderr.toString()).toContain("platform binary terminated by SIGKILL")
    })

    it(`${packageName} preserves platform binary output and exit status`, () => {
      const fixture = createFixture(sourceLauncher, "console.log(process.argv.slice(2).join(',')); process.exit(7)")
      const result = Bun.spawnSync([process.execPath, fixture.launcher, "alpha", "beta"], {
        stdout: "pipe",
        stderr: "pipe",
      })

      expect(result.exitCode).toBe(7)
      expect(result.stdout.toString().trim()).toBe("alpha,beta")
      expect(result.stderr.toString()).toBe("")
    })
  }
})

function createFixture(sourceLauncher: string, platformScript: string): { launcher: string } {
  const root = mkdtempSync(join(tmpdir(), "aurict-npm-launcher-"))
  tempDirs.push(root)

  const wrapperDir = join(root, "node_modules", "aurict", "bin")
  const platformPackage = `cli-${process.platform}-${process.arch}`
  const platformDir = join(root, "node_modules", "aurict", "node_modules", "@aurict", platformPackage)
  const platformBinDir = join(platformDir, "bin")
  const launcher = join(wrapperDir, "aurict")
  const platformBin = join(platformBinDir, "aurict")

  mkdirSync(wrapperDir, { recursive: true })
  mkdirSync(platformBinDir, { recursive: true })
  cpSync(sourceLauncher, launcher)
  writeFileSync(join(platformDir, "package.json"), JSON.stringify({ name: `@aurict/${platformPackage}` }))
  writeFileSync(platformBin, `#!/usr/bin/env node\n${platformScript}\n`)
  chmodSync(platformBin, 0o755)

  return { launcher }
}
