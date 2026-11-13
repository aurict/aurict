import { readdirSync, readFileSync, statSync } from "node:fs"
import { join, relative } from "node:path"

const ROOT = join(import.meta.dir, "..")
const SOURCE_ROOTS = ["packages/core/src", "packages/cli/src", "apps/desktop/src", "apps/backend/src", "scripts"]
const CODE_EXTENSIONS = new Set([".ts", ".tsx", ".js", ".mjs", ".cjs", ".yml", ".yaml"])

function extension(path: string): string {
  const match = /\.[^.]+$/.exec(path)
  return match?.[0] ?? ""
}

function files(directory: string): string[] {
  const result: string[] = []
  for (const entry of readdirSync(directory)) {
    const path = join(directory, entry)
    const stat = statSync(path)
    if (stat.isDirectory()) result.push(...files(path))
    else if (CODE_EXTENSIONS.has(extension(path))) result.push(path)
  }
  return result
}

const failures: string[] = []
const emptyCatch = /catch\s*(?:\([^)]*\))?\s*\{\s*\}/g
const emptyPromiseCatch = /\.catch\(\s*(?:\([^)]*\)|[A-Za-z_$][\w$]*)?\s*=>\s*\{\s*\}\s*\)/g

for (const sourceRoot of SOURCE_ROOTS) {
  for (const path of files(join(ROOT, sourceRoot))) {
    const source = readFileSync(path, "utf8")
    if (emptyCatch.test(source) || emptyPromiseCatch.test(source)) {
      failures.push(`${relative(ROOT, path)} contains an empty catch handler`)
    }
    emptyCatch.lastIndex = 0
    emptyPromiseCatch.lastIndex = 0
  }
}

const packageJson = JSON.parse(readFileSync(join(ROOT, "package.json"), "utf8")) as { scripts?: Record<string, string> }
for (const script of ["test:core", "test:cli", "test:desktop", "test:integration", "test:coverage", "test:stability"]) {
  if (!packageJson.scripts?.[script]) failures.push(`package.json is missing ${script}`)
}
if (/packages\/cli\/test\/\*\.test\.tsx/.test(packageJson.scripts?.test ?? "")) {
  failures.push("package.json test script uses the incomplete CLI TSX-only glob")
}

for (const workflow of files(join(ROOT, ".github/workflows")).filter((path) => /\.ya?ml$/.test(path))) {
  if (/bun-version:\s*latest\b/.test(readFileSync(workflow, "utf8"))) {
    failures.push(`${relative(ROOT, workflow)} uses an unpinned Bun version`)
  }
}

if (failures.length > 0) {
  for (const failure of failures) process.stderr.write(`[quality] ${failure}\n`)
  process.exitCode = 1
} else {
  process.stdout.write("Quality contracts passed.\n")
}
