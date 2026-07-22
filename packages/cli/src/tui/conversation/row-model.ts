export type TranscriptTone =
  | "user" | "assistant" | "tool" | "error" | "muted"
  | "heading" | "code" | "quote" | "thinking" | "success" | "bullet"
  | "diff-add" | "diff-remove" | "diff-context" | "diff-hunk"

export interface TranscriptSegment {
  text: string
  tone?: TranscriptTone
  bold?: boolean
  italic?: boolean
  underline?: boolean
  strikethrough?: boolean
  dim?: boolean
}

export interface TranscriptRow {
  id: string
  segments: TranscriptSegment[]
  detailId?: string
  surface?: "user" | "diff-add" | "diff-remove" | "diff-hunk"
}

export interface TranscriptLine {
  id: string
  text: string
  tone: TranscriptTone
  bold?: boolean
  italic?: boolean
  detailId?: string
}
