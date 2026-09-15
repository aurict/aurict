export type BlastRadiusMode = "references" | "breaks" | "both"
export type RefKind = "call" | "import" | "re-export" | "type"

export interface RefSite {
  file: string
  line: number
  col: number
  container: string
  snippet: string
  kind: RefKind
}

export interface AnalysisScope {
  configured: boolean
  configFiles: string[]
  analyzedFiles: number
}

export interface BlastResult {
  symbol: string
  declFile: string
  declLine: number
  refs: RefSite[]
  packages: string[]
  scope: AnalysisScope
}

export interface BreakSite {
  file: string
  line: number
  col: number
  message: string
  code: number
}

export interface BreakResult {
  from: string
  to: string
  declFile: string
  breaks: BreakSite[]
  clean: boolean
  applied: boolean
  scope: AnalysisScope
}

export interface BlastRadiusRequest {
  workdir: string
  symbol: string
  hintFile?: string
  mode: BlastRadiusMode
  from?: string
  to?: string
}

export interface BlastRadiusAnalysis {
  references?: BlastResult
  breaks?: BreakResult
  warnings: string[]
}

export type BlastRadiusWorkerResponse =
  | { ok: true; analysis: BlastRadiusAnalysis }
  | { ok: false; error: string }
