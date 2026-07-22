import { afterEach, describe, expect, it } from "bun:test"
import { mkdir, mkdtemp, rm, writeFile } from "node:fs/promises"
import { join } from "node:path"
import { tmpdir } from "node:os"
import { searchHybridIndex } from "../src/tool/search/hybrid-index.js"

const dirs: string[] = []
afterEach(async () => Promise.all(dirs.splice(0).map(dir => rm(dir, { recursive: true, force: true }))))

describe("hybrid semantic search", () => {
  it("finds conceptually related code and invalidates on mtime changes", async () => {
    const workdir = await mkdtemp(join(tmpdir(), "aurict-search-")); dirs.push(workdir)
    await mkdir(join(workdir, "src"))
    await writeFile(join(workdir, "src", "credentials.ts"), "export async function renewCredentials(session: Session) { return rotateBearer(session) }\n")
    await writeFile(join(workdir, "src", "unrelated.ts"), "export const renderDashboard = () => 'ok'\n")
    const first = await searchHybridIndex(workdir, "refresh auth token", 5)
    expect(first.results[0]?.path).toBe("src/credentials.ts")
    const fingerprint = first.index.fingerprint
    await Bun.sleep(5)
    await writeFile(join(workdir, "src", "unrelated.ts"), "export const refreshToken = () => true\n")
    const second = await searchHybridIndex(workdir, "refresh auth token", 5)
    expect(second.index.fingerprint).not.toBe(fingerprint)
  })
})
