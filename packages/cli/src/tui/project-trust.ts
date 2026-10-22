import { existsSync, mkdirSync, readFileSync, writeFileSync } from "fs";
import { dirname, join, resolve } from "path";
import { getConfigPath } from "@aurict/core";

/** Trusted folders persist next to the global config, as Codex saves its trust decision. */
function trustFile(): string {
  return join(dirname(getConfigPath()), "trusted-projects.json");
}

/** Inside a Git checkout, trust applies to the repository root (Codex behaviour). */
export function trustTarget(workdir: string): string {
  let dir = resolve(workdir);
  for (;;) {
    if (existsSync(join(dir, ".git"))) return dir;
    const parent = dirname(dir);
    if (parent === dir) return resolve(workdir);
    dir = parent;
  }
}

function readTrusted(): string[] {
  try {
    const parsed: unknown = JSON.parse(readFileSync(trustFile(), "utf8"));
    return Array.isArray(parsed) ? parsed.filter((entry): entry is string => typeof entry === "string") : [];
  } catch {
    return [];
  }
}

export function isTrusted(workdir: string): boolean {
  return readTrusted().includes(trustTarget(workdir));
}

export function trustProject(workdir: string): void {
  const target = trustTarget(workdir);
  const trusted = readTrusted();
  if (trusted.includes(target)) return;
  mkdirSync(dirname(trustFile()), { recursive: true });
  writeFileSync(trustFile(), `${JSON.stringify([...trusted, target], null, 2)}\n`);
}
