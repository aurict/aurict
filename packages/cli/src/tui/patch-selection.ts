/**
 * Selection model for approving part of an `apply_patch`.
 *
 * Files with two or more `@@` chunks expose one row per chunk; every other
 * file (adds, deletes, single-chunk updates) is selected as a whole. The
 * response names approved files and, for partially selected updates, the
 * chunk indices to keep.
 */
import type { PermissionRequest } from "@aurict/core"

export type PatchFile = NonNullable<PermissionRequest["files"]>[number]

export interface PatchSelectionRow {
  kind: "file" | "hunk"
  fileIndex: number
  hunkIndex?: number
}

export type RowState = "all" | "some" | "none"

export function hunkCount(file: PatchFile): number {
  return file.hunks && file.hunks.length > 1 ? file.hunks.length : 0
}

export function patchFileKeys(file: PatchFile): string[] {
  return file.action === "move" && file.targetPath ? [file.path, file.targetPath] : [file.path]
}

export function patchSelectionRows(files: readonly PatchFile[]): PatchSelectionRow[] {
  return files.flatMap((file, fileIndex) => [
    { kind: "file" as const, fileIndex },
    ...Array.from({ length: hunkCount(file) }, (_, hunkIndex) => ({ kind: "hunk" as const, fileIndex, hunkIndex })),
  ])
}

const fileKey = (fileIndex: number) => `f${fileIndex}`
const hunkKey = (fileIndex: number, hunkIndex: number) => `h${fileIndex}:${hunkIndex}`

export function initialPatchSelection(files: readonly PatchFile[]): Set<string> {
  const selection = new Set<string>()
  files.forEach((file, fileIndex) => {
    const hunks = hunkCount(file)
    if (hunks === 0) selection.add(fileKey(fileIndex))
    for (let hunk = 0; hunk < hunks; hunk++) selection.add(hunkKey(fileIndex, hunk))
  })
  return selection
}

export function rowState(selection: ReadonlySet<string>, files: readonly PatchFile[], row: PatchSelectionRow): RowState {
  if (row.kind === "hunk") return selection.has(hunkKey(row.fileIndex, row.hunkIndex!)) ? "all" : "none"
  const hunks = hunkCount(files[row.fileIndex]!)
  if (hunks === 0) return selection.has(fileKey(row.fileIndex)) ? "all" : "none"
  let chosen = 0
  for (let hunk = 0; hunk < hunks; hunk++) if (selection.has(hunkKey(row.fileIndex, hunk))) chosen++
  return chosen === 0 ? "none" : chosen === hunks ? "all" : "some"
}

/** Toggling a file selects all of its chunks unless every chunk is already selected. */
export function togglePatchRow(selection: ReadonlySet<string>, files: readonly PatchFile[], row: PatchSelectionRow): Set<string> {
  const next = new Set(selection)
  if (row.kind === "hunk") {
    const key = hunkKey(row.fileIndex, row.hunkIndex!)
    if (next.has(key)) next.delete(key)
    else next.add(key)
    return next
  }
  const hunks = hunkCount(files[row.fileIndex]!)
  if (hunks === 0) {
    const key = fileKey(row.fileIndex)
    if (next.has(key)) next.delete(key)
    else next.add(key)
    return next
  }
  const selectAll = rowState(selection, files, row) !== "all"
  for (let hunk = 0; hunk < hunks; hunk++) {
    if (selectAll) next.add(hunkKey(row.fileIndex, hunk))
    else next.delete(hunkKey(row.fileIndex, hunk))
  }
  return next
}

export function patchSelectionResponse(
  selection: ReadonlySet<string>,
  files: readonly PatchFile[],
): { approvedFiles: string[]; approvedHunks: Record<string, number[]> } | null {
  const approvedFiles: string[] = []
  const approvedHunks: Record<string, number[]> = {}
  files.forEach((file, fileIndex) => {
    const state = rowState(selection, files, { kind: "file", fileIndex })
    if (state === "none") return
    approvedFiles.push(...patchFileKeys(file))
    if (state === "some") {
      approvedHunks[file.path] = Array.from({ length: hunkCount(file) }, (_, hunk) => hunk)
        .filter((hunk) => selection.has(hunkKey(fileIndex, hunk)))
    }
  })
  return approvedFiles.length > 0 ? { approvedFiles, approvedHunks } : null
}

export function selectedFileCount(selection: ReadonlySet<string>, files: readonly PatchFile[]): number {
  return files.filter((_, fileIndex) => rowState(selection, files, { kind: "file", fileIndex }) !== "none").length
}
