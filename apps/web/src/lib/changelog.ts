const REPO_OWNER = process.env.AURICT_GITHUB_OWNER ?? "aurict"
const REPO_NAME = process.env.AURICT_GITHUB_REPO ?? "aurict"
const FALLBACK_VERSION = process.env.AURICT_VERSION ?? "current"
const RELEASE_LIMIT = 20
const GENERATED_CHANGE_LIMIT = 10
const GITHUB_REQUEST_TIMEOUT_MS = 8_000

export type ChangelogChange = {
  type: "new" | "fix" | "break" | "perf"
  text: string
}

export type ChangelogRelease = {
  version: string
  date: string
  tag: string
  tagColor: string
  url?: string
  changes: ChangelogChange[]
}

type GitHubRelease = {
  html_url: string
  name: string | null
  tag_name: string
  published_at: string | null
  created_at: string
  body: string | null
  draft: boolean
  prerelease: boolean
}

type GitHubTag = {
  name: string
  commit: {
    sha: string
    url: string
  }
  zipball_url: string
  tarball_url: string
}

type GitHubCommit = {
  html_url: string
  sha: string
  commit: {
    message: string
    author?: { date?: string | null }
    committer?: { date?: string | null }
  }
}

type GitHubCompare = {
  commits: GitHubCommit[]
}

const FALLBACK_RELEASES: ChangelogRelease[] = [
  {
    version: FALLBACK_VERSION,
    date: new Date().toISOString().slice(0, 10),
    tag: "Latest release",
    tagColor: "#818cf8",
    changes: [
      {
        type: "new",
        text: "Release notes are synced automatically from GitHub Releases.",
      },
    ],
  },
]

function githubHeaders(): HeadersInit {
  const headers: HeadersInit = {
    accept: "application/vnd.github+json",
    "x-github-api-version": "2022-11-28",
  }

  if (process.env.AURICT_GITHUB_TOKEN) {
    headers.authorization = `Bearer ${process.env.AURICT_GITHUB_TOKEN}`
  }

  return headers
}

function fetchGitHub(url: string, headers: HeadersInit) {
  return fetch(url, {
    headers,
    next: { revalidate: 60 * 30 },
    signal: AbortSignal.timeout(GITHUB_REQUEST_TIMEOUT_MS),
  })
}

export async function getChangelog(): Promise<ChangelogRelease[]> {
  const headers = githubHeaders()

  try {
    const response = await fetchGitHub(`https://api.github.com/repos/${REPO_OWNER}/${REPO_NAME}/releases?per_page=${RELEASE_LIMIT}`, headers)

    if (!response.ok) return await getTagGeneratedChangelog(headers)

    const releases = await response.json() as GitHubRelease[]
    const visibleReleases = releases.filter((release) => !release.draft)
    if (visibleReleases.length === 0) return await getTagGeneratedChangelog(headers)

    const changelog = await Promise.all(visibleReleases
      .filter((release) => !release.draft)
      .map((release, index) => normalizeRelease(release, visibleReleases[index + 1]?.tag_name, headers)))

    return changelog.length > 0 ? changelog : FALLBACK_RELEASES
  } catch {
    return FALLBACK_RELEASES
  }
}

async function getTagGeneratedChangelog(headers: HeadersInit): Promise<ChangelogRelease[]> {
  const response = await fetchGitHub(`https://api.github.com/repos/${REPO_OWNER}/${REPO_NAME}/tags?per_page=${Math.min(RELEASE_LIMIT, 10)}`, headers)

  if (!response.ok) return FALLBACK_RELEASES

  const tags = await response.json() as GitHubTag[]
  if (tags.length === 0) return FALLBACK_RELEASES

  const releases = await Promise.all(tags.slice(0, 8).map(async (tag, index) => {
    const olderTag = tags[index + 1]?.name
    const changes = await getGeneratedChanges(olderTag, tag.name, headers)
    const version = tag.name.replace(/^v/i, "")

    return {
      version,
      date: await getTagDate(tag.name, headers),
      tag: inferReleaseTag(changes),
      tagColor: colorForVersion(version),
      url: `https://github.com/${REPO_OWNER}/${REPO_NAME}/releases/tag/${tag.name}`,
      changes: changes.length > 0 ? changes : [{ type: "new" as const, text: `Release ${tag.name}` }],
    }
  }))

  return releases
}

async function normalizeRelease(
  release: GitHubRelease,
  previousTag: string | undefined,
  headers: HeadersInit,
): Promise<ChangelogRelease> {
  const version = release.tag_name.replace(/^v/i, "")
  const bodyChanges = parseReleaseBody(release.body)
  const generatedChanges = bodyChanges.length > 0 ? [] : await getGeneratedChanges(previousTag, release.tag_name, headers)
  const changes = bodyChanges.length > 0 ? bodyChanges : generatedChanges
  const tag = release.prerelease ? "Pre-release" : inferReleaseTag(changes)

  return {
    version,
    date: (release.published_at ?? release.created_at).slice(0, 10),
    tag,
    tagColor: colorForVersion(version),
    url: release.html_url,
    changes: changes.length > 0 ? changes : [{ type: "new", text: release.name ?? `Release ${release.tag_name}` }],
  }
}

async function getGeneratedChanges(
  previousTag: string | undefined,
  currentTag: string,
  headers: HeadersInit,
): Promise<ChangelogChange[]> {
  if (!previousTag) return []

  const response = await fetchGitHub(`https://api.github.com/repos/${REPO_OWNER}/${REPO_NAME}/compare/${previousTag}...${currentTag}`, headers)

  if (!response.ok) return []

  const comparison = await response.json() as GitHubCompare
  return commitsToChanges(comparison.commits)
}

async function getTagDate(tag: string, headers: HeadersInit) {
  const response = await fetchGitHub(`https://api.github.com/repos/${REPO_OWNER}/${REPO_NAME}/commits/${tag}`, headers)

  if (!response.ok) return new Date().toISOString().slice(0, 10)

  const commit = await response.json() as GitHubCommit
  return (commit.commit.author?.date ?? commit.commit.committer?.date ?? new Date().toISOString()).slice(0, 10)
}

function commitsToChanges(commits: GitHubCommit[]): ChangelogChange[] {
  const seen = new Set<string>()

  return commits
    .map((commit) => commit.commit.message.split("\n")[0]?.trim() ?? "")
    .map(cleanupMarkdown)
    .filter((message) => message.length > 0)
    .filter((message) => !/^merge\b/i.test(message))
    .filter((message) => !/^chore:\s*bump version/i.test(message))
    .filter((message) => {
      const key = message.toLowerCase()
      if (seen.has(key)) return false
      seen.add(key)
      return true
    })
    .slice(0, GENERATED_CHANGE_LIMIT)
    .map((text) => ({ type: inferChangeType(text), text: humanizeCommitMessage(text) }))
}

function parseReleaseBody(body: string | null): ChangelogChange[] {
  if (!body) return []

  return body
    .split("\n")
    .map((line) => line.trim())
    .filter((line) => line.startsWith("- ") || line.startsWith("* "))
    .map((line) => line.replace(/^[-*]\s+/, ""))
    .filter((line) => !/^full changelog/i.test(line))
    .map((line) => cleanupMarkdown(line))
    .filter(Boolean)
    .slice(0, 12)
    .map((text) => ({ type: inferChangeType(text), text }))
}

function cleanupMarkdown(input: string) {
  return input
    .replace(/\*\*/g, "")
    .replace(/`([^`]+)`/g, "$1")
    .replace(/\[([^\]]+)\]\(([^)]+)\)/g, "$1")
    .replace(/\s+by\s+@\w+(?:\s+in\s+https?:\/\/\S+)?$/i, "")
    .replace(/\s+\(#\d+\)$/i, "")
    .trim()
}

function humanizeCommitMessage(input: string) {
  return input
    .replace(/^(feat|fix|perf|docs|refactor|style|test|chore|ci|build)(\([^)]+\))?!?:\s*/i, "")
    .replace(/^[a-z]/, (match) => match.toUpperCase())
}

function inferChangeType(text: string): ChangelogChange["type"] {
  const lower = text.toLowerCase()
  if (/\bbreaking\b|migration|required action/.test(lower)) return "break"
  if (/\bfix(?:ed|es)?\b|bug|crash|regression|error/.test(lower)) return "fix"
  if (/\bperf(?:ormance)?\b|speed|faster|cache|optimi[sz]e/.test(lower)) return "perf"
  return "new"
}

function inferReleaseTag(changes: ChangelogChange[]) {
  if (changes.some((change) => change.type === "break")) return "Breaking changes"
  if (changes.length > 0 && changes.every((change) => change.type === "fix")) return "Bug fixes"
  if (changes.some((change) => change.type === "perf")) return "Performance"
  return "Release"
}

function colorForVersion(version: string) {
  const colors = ["#818cf8", "#a78bfa", "#06b6d4", "#4eba65", "#f59e0b"]
  const sum = version.split("").reduce((total, char) => total + char.charCodeAt(0), 0)
  return colors[sum % colors.length]
}
