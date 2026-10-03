/**
 * Fuzzy path ranking for `@` mentions.
 *
 * Characters of the query must appear in order. Matches score higher when they
 * are consecutive, start a path segment (after `/`, `.`, `_`, `-`), or fall in
 * the basename; a contiguous basename (or extensionless name) hit dominates,
 * files beat directories, and shorter paths win ties.
 */
export interface FuzzyMatch {
  path: string
  score: number
}

const SEGMENT_STARTS = new Set(["/", ".", "_", "-", " "])

function isBoundary(path: string, index: number): boolean {
  if (index === 0) return true
  const previous = path[index - 1]!
  if (SEGMENT_STARTS.has(previous)) return true
  const current = path[index]!
  // camelCase / PascalCase: `MultilineInput` starts a word at `I`.
  return current !== current.toLowerCase() && previous === previous.toLowerCase() && previous !== previous.toUpperCase()
}

/**
 * Leftmost match end, then a backward pass from that end: the backward pass
 * picks the tightest window, so `mlinput` aligns with `Multiline·Input`
 * instead of scattering across `mult·i·l·i·n·e`.
 */
function matchPositions(needle: string, haystack: string): number[] | null {
  let cursor = 0
  let end = -1
  for (const char of needle) {
    end = haystack.indexOf(char, cursor)
    if (end === -1) return null
    cursor = end + 1
  }
  const positions = new Array<number>(needle.length)
  let index = end
  for (let char = needle.length - 1; char >= 0; char--) {
    index = haystack.lastIndexOf(needle[char]!, index)
    positions[char] = index
    index--
  }
  return positions
}

export function fuzzyPathScore(query: string, path: string): number | null {
  const needle = query.toLowerCase()
  const haystack = path.toLowerCase()
  if (!needle) return 0
  const positions = matchPositions(needle, haystack)
  if (!positions) return null
  const trimmed = haystack.endsWith("/") ? haystack.slice(0, -1) : haystack
  const basenameStart = trimmed.lastIndexOf("/") + 1
  let score = 0
  let previous = -2
  for (const found of positions) {
    let gain = 1
    if (found === previous + 1) gain += 5
    if (isBoundary(path, found)) gain += 8
    if (found >= basenameStart) gain += 2
    score += gain
    previous = found
  }
  const basename = trimmed.slice(basenameStart)
  const extension = basename.lastIndexOf(".")
  const stem = extension > 0 ? basename.slice(0, extension) : basename
  if (basename === needle || stem === needle) score += 60
  else if (basename.startsWith(needle)) score += 30
  else if (basename.includes(needle)) score += 15
  else if (haystack.includes(needle)) score += 8
  // Mentions usually name files; a directory only wins with a better match.
  const directoryPenalty = path.endsWith("/") ? 5 : 0
  return score - directoryPenalty - path.length * 0.05
}

export function rankPaths(query: string, paths: readonly string[], limit: number): FuzzyMatch[] {
  const matches: FuzzyMatch[] = []
  for (const path of paths) {
    const score = fuzzyPathScore(query, path)
    if (score !== null) matches.push({ path, score })
  }
  matches.sort((left, right) => right.score - left.score || left.path.localeCompare(right.path))
  return matches.slice(0, limit)
}
