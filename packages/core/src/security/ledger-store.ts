import { existsSync, mkdirSync, readFileSync, rmSync, writeFileSync } from "node:fs"
import { join } from "node:path"
import { buildSecurityAssessmentLedger, type BuildSecurityLedgerInput, type SecurityAssessmentLedger } from "./assessment-ledger.js"

const LEDGER_VERSION = 1

interface PersistedSecurityLedger {
  version: number
  ledger: SecurityAssessmentLedger
}

export function getSecurityLedgerPath(workdir: string): string {
  return join(workdir, ".aurict", "security", "ledger.json")
}

export function readSecurityAssessmentLedger(workdir: string): SecurityAssessmentLedger | undefined {
  const path = getSecurityLedgerPath(workdir)
  if (!existsSync(path)) return undefined
  try {
    const parsed = JSON.parse(readFileSync(path, "utf8")) as PersistedSecurityLedger | SecurityAssessmentLedger
    const ledger = "ledger" in parsed ? parsed.ledger : parsed
    return isLedger(ledger) ? ledger : undefined
  } catch {
    return undefined
  }
}

export function writeSecurityAssessmentLedger(workdir: string, ledger: SecurityAssessmentLedger): SecurityAssessmentLedger {
  const path = getSecurityLedgerPath(workdir)
  mkdirSync(join(workdir, ".aurict", "security"), { recursive: true })
  writeFileSync(path, JSON.stringify({ version: LEDGER_VERSION, ledger }, null, 2) + "\n", "utf8")
  return ledger
}

export function updateSecurityAssessmentLedger(workdir: string, input: BuildSecurityLedgerInput): SecurityAssessmentLedger {
  const previous = readSecurityAssessmentLedger(workdir)
  const ledger = buildSecurityAssessmentLedger({ ...input, previous })
  return writeSecurityAssessmentLedger(workdir, ledger)
}

export function resetSecurityAssessmentLedger(workdir: string): void {
  rmSync(getSecurityLedgerPath(workdir), { force: true })
}

function isLedger(value: unknown): value is SecurityAssessmentLedger {
  return Boolean(
    value &&
    typeof value === "object" &&
    typeof (value as SecurityAssessmentLedger).objective === "string" &&
    Array.isArray((value as SecurityAssessmentLedger).scope) &&
    Array.isArray((value as SecurityAssessmentLedger).findings),
  )
}
