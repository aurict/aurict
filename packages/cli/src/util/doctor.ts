import { access, mkdir, unlink, writeFile } from "node:fs/promises"
import { constants } from "node:fs"
import { homedir, platform, arch } from "node:os"
import { join } from "node:path"
import { createRequire } from "node:module"

type Status = "ok" | "warn" | "fail"

interface Check {
  status: Status
  label: string
  detail: string
}

const require = createRequire(import.meta.url)

const ARCH_MAP: Record<string, string> = {
  x64: "x64",
  arm64: "arm64",
  aarch64: "arm64",
}

function line(check: Check): string {
  const marker = check.status === "ok" ? "ok" : check.status === "warn" ? "warn" : "fail"
  return `[${marker}] ${check.label}: ${check.detail}`
}

async function canWriteAurictHome(): Promise<Check> {
  const dir = join(homedir(), ".aurict")
  const probe = join(dir, `.doctor-${process.pid}`)
  try {
    await mkdir(dir, { recursive: true })
    await writeFile(probe, "ok", "utf8")
    await unlink(probe)
    return { status: "ok", label: "home", detail: `${dir} is writable` }
  } catch (err) {
    return { status: "fail", label: "home", detail: `cannot write ${dir}: ${err instanceof Error ? err.message : String(err)}` }
  }
}

async function canReadConfig(): Promise<Check> {
  const config = join(homedir(), ".aurict", "config.json")
  try {
    await access(config, constants.R_OK)
    return { status: "ok", label: "config", detail: `${config} is readable` }
  } catch {
    return { status: "warn", label: "config", detail: `${config} not found; first-run setup will create it` }
  }
}

function providerEnv(): Check {
  const vars = [
    "ANTHROPIC_API_KEY",
    "OPENAI_API_KEY",
    "OPENROUTER_API_KEY",
    "GOOGLE_GENERATIVE_AI_API_KEY",
    "OPENCODE_API_KEY",
    "XAI_API_KEY",
    "AZURE_OPENAI_API_KEY",
    "AWS_ACCESS_KEY_ID",
  ]
  const configured = vars.filter((name) => Boolean(process.env[name]))
  if (configured.length > 0) {
    return { status: "ok", label: "providers", detail: `${configured.length} provider env var(s) detected` }
  }
  return { status: "warn", label: "providers", detail: "no provider env vars detected; Ollama may still work locally" }
}

function platformPackage(): Check {
  const currentPlatform = platform()
  const currentArch = arch()
  const mappedArch = ARCH_MAP[currentArch]
  const supported = currentPlatform === "linux" || currentPlatform === "darwin" || currentPlatform === "win32"

  if (!mappedArch || !supported) {
    return {
      status: "fail",
      label: "platform",
      detail: `${currentPlatform}/${currentArch} is unsupported`,
    }
  }

  const pkg = `@aurict/cli-${currentPlatform}-${mappedArch}`
  try {
    const pkgJson = require.resolve(`${pkg}/package.json`)
    return { status: "ok", label: "platform", detail: `${pkg} resolved at ${pkgJson}` }
  } catch {
    return {
      status: "warn",
      label: "platform",
      detail: `${pkg} is not resolvable from this checkout; packaged installs should include it as an optional dependency`,
    }
  }
}

function bunRuntime(): Check {
  return { status: "ok", label: "runtime", detail: `Bun ${Bun.version}` }
}

function serverPort(port = 7777): Check {
  try {
    const server = Bun.serve({
      hostname: "127.0.0.1",
      port,
      fetch: () => new Response("ok"),
    })
    server.stop(true)
    return { status: "ok", label: "server", detail: `127.0.0.1:${port} is available` }
  } catch (err) {
    const code = err && typeof err === "object" ? (err as { code?: unknown }).code : undefined
    if (code === "EADDRINUSE") {
      return { status: "warn", label: "server", detail: `127.0.0.1:${port} is already in use; Aurict will reuse/continue without starting another local API server` }
    }
    return { status: "fail", label: "server", detail: `port check failed: ${err instanceof Error ? err.message : String(err)}` }
  }
}

export async function runDoctor(workdir: string): Promise<number> {
  const checks: Check[] = [
    bunRuntime(),
    platformPackage(),
    await canWriteAurictHome(),
    await canReadConfig(),
    providerEnv(),
    serverPort(),
  ]

  const failures = checks.filter((check) => check.status === "fail")
  const warnings = checks.filter((check) => check.status === "warn")

  console.log("Aurict doctor")
  console.log(`workdir: ${workdir}`)
  console.log("")
  for (const check of checks) console.log(line(check))
  console.log("")
  console.log(`${checks.length - failures.length - warnings.length} ok, ${warnings.length} warning(s), ${failures.length} failure(s)`)

  return failures.length > 0 ? 1 : 0
}
