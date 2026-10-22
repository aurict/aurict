export const SITE_URL = "https://quaera.aurict.com";
export const SITE_NAME = "Quaera";
export const REPO_URL = "https://github.com/mikailustuner/quaeralabs";
export const LAST_UPDATED = "2026-10-21";

export const TAGLINE = "Models write. Code decides.";
export const DESCRIPTION =
  "Open-source AI research for math and ML. Proofs count only if Lean 4 accepts them, sources only if a registry confirms them, results only if they reproduce.";

export const NAV = [
  { href: "/how-it-works", label: "How it works" },
  { href: "/benchmarks", label: "Benchmarks" },
  { href: "/compare", label: "Compare" },
  { href: "/install", label: "Install" },
];

export const INSTALL_STEPS = [
  {
    title: "Get the code",
    code: "git clone https://github.com/mikailustuner/quaeralabs.git\ncd quaeralabs",
  },
  {
    title: "Install",
    code: "./install.sh --all",
    note: "Linux and Windows with WSL2. On macOS Lean and the ML environment run in containers; that path is not yet tested on a Mac.",
  },
  {
    title: "Check what works",
    code: "quaera doctor",
    note: "Reports each tier on its own: core, AI/ML, mathematics and extras.",
  },
];

export const COMMANDS = [
  {
    name: "prove",
    code: "quaera prove Foo.lean --decl my_lemma --budget 1",
    title: "Close a sorry in your own Lean project",
    body: "Prints a diff that Lean has already checked. Your file stays as it is unless you confirm the write.",
  },
  {
    name: "critique",
    code: "quaera critique experiments/run-12 --budget 0.5",
    title: "Review an experiment you ran",
    body: "The measured Critic reads your code and results and lists flaws by severity. Nothing is executed.",
  },
  {
    name: "verify-package",
    code: "quaera verify-package results.zip",
    title: "Check someone else's evidence",
    body: "Verifies the signature, file hashes and citations of a result package. Also runs in the browser.",
  },
];

export const GATES = [
  {
    kicker: "Proof",
    title: "Counts only if Lean 4 accepts it",
    body: "Every proof is compiled against a pinned Mathlib in a sandbox. A model saying a proof works changes nothing.",
  },
  {
    kicker: "Source",
    title: "Counts only if a registry confirms it",
    body: "Each citation is looked up on arXiv, Crossref or DataCite. A reference that does not resolve is flagged, never quietly kept.",
  },
  {
    kicker: "Result",
    title: "Counts only if it reproduces",
    body: "Experiments run in a sandbox against a locked pre-registration, and every run leaves a signed evidence package.",
  },
];

export const ROLES = [
  { name: "Literature", body: "Searches arXiv, OpenAlex and Crossref and decides whether the question is already answered." },
  { name: "Hypothesis", body: "Turns the question into ranked, testable claims with explicit criteria." },
  { name: "Experiment design", body: "Writes the pre-registration before any result is seen, then locks it." },
  { name: "Engineering", body: "Writes the Lean proof or the experiment code inside the sandbox." },
  { name: "Critique", body: "Looks for leakage, confounds, overclaims and statistical errors." },
  { name: "Analysis", body: "Reads the results against the pre-registered plan, including negative results." },
  { name: "Verification", body: "Recompiles proofs and replays experiments in a clean environment." },
  { name: "Writing", body: "Drafts the report; every claim must point to evidence in the event log." },
  { name: "Direction", body: "Decides what to try next and when to stop, within the budget you set." },
];

export type Metric = {
  value: string;
  label: string;
  detail: string;
  source: string;
  date: string;
};

export const HEADLINE_METRICS: Metric[] = [
  {
    value: "0",
    label: "fabricated citations accepted",
    detail: "14 of 14 real and fabricated identifiers classified correctly; the integrity audit of 24 projects found no fabricated citation and no fake verification.",
    source: "evals/results/baseline-2026-10-03.json, audit-2026-10-04.json",
    date: "2026-10-04",
  },
  {
    value: "97.9%",
    label: "correct literature verdicts",
    detail: "48 runs (16 questions, 3 repeats). No open problem was marked as solved and no classical result as new.",
    source: "evals/results/literature-2026-10-20.json",
    date: "2026-10-20",
  },
  {
    value: "25/25",
    label: "planted flaws caught by the Critic",
    detail: "With 0 false alarms on 12 clean reports. A small, team-written set: a floor, not a proof of general reviewing skill.",
    source: "evals/results/critic-v0.2-2026-10-04.json",
    date: "2026-10-04",
  },
  {
    value: "0/10",
    label: "PutnamBench problems solved",
    detail: "Cheap profile at $0.18 per problem; 7 of 10 stopped on budget. We publish the misses too.",
    source: "PutnamBench a635813f, seed 1, cheap profile",
    date: "2026-10-21",
  },
];

export const PROOF_RUNS = [
  { set: "miniF2F valid", n: 12, model: "Claude Haiku", solved: "7/12", spent: "$3.33", date: "2026-10-10" },
  { set: "miniF2F valid", n: 8, model: "Claude Sonnet", solved: "6/8", spent: "$4.01", date: "2026-10-10" },
  { set: "Putnam sample", n: 8, model: "Claude Haiku", solved: "0/8", spent: "$2.74", date: "2026-10-10" },
  { set: "PutnamBench (seed 1)", n: 10, model: "Claude Haiku", solved: "0/10", spent: "$1.75", date: "2026-10-21" },
];

export const COMPARE_COLUMNS = [
  "QuaeraLabs",
  "Claude Code + a Lean MCP server",
  "DeepSeek-Prover, Kimina-Prover",
  "AI Scientist, Agent Laboratory",
];

export const COMPARE_ROWS: { label: string; cells: string[] }[] = [
  {
    label: "A proof counts only if Lean accepts it",
    cells: ["Yes, enforced in code", "Up to the user", "Yes", "No, not a formal prover"],
  },
  {
    label: "Every cited source checked against the official registry",
    cells: ["Yes, with a fabrication audit", "Not built in", "No citations", "Literature search; no fabrication audit documented"],
  },
  {
    label: "Signed evidence package, replay without an API key",
    cells: ["Yes", "No", "No", "No"],
  },
  {
    label: "Pre-registration and a Critic measured on planted flaws",
    cells: ["Yes", "No", "Not applicable", "An automated reviewer"],
  },
  {
    label: "Model choice",
    cells: ["Any, including local models", "Claude", "Their own models", "Several API models"],
  },
];

export const FAQ = [
  {
    q: "What is QuaeraLabs?",
    a: "An open-source, non-profit AI research team that runs on your machine. Nine research roles take a question from the literature to a report in mathematics (Lean 4 and Mathlib) or machine learning, and code checks every proof, citation and result before it counts.",
  },
  {
    q: "Is it free?",
    a: "Yes. The code is Apache-2.0 and published reports are CC BY 4.0. You pay only for the model calls you choose to make, and every run has a budget cap that no agent can raise.",
  },
  {
    q: "Which models does it work with?",
    a: "Any. It uses the Claude, Codex and OpenCode command-line tools when they are installed, API providers through LiteLLM, and local models. A different model family can be used to cross-check the Critic and the Verifier.",
  },
  {
    q: "Can it prove theorems in my own Lean project?",
    a: "Yes. quaera prove closes a sorry in a declaration you name, inside your project and its Lake dependencies. It prints a Lean-checked diff and writes it only after you confirm.",
  },
  {
    q: "How good is it at competition mathematics?",
    a: "Not good yet at the hardest level. It solved 7 of 12 miniF2F validation problems with Claude Haiku and 6 of 8 with Sonnet, and 0 of 10 PutnamBench problems at a small budget. Every run, including the failures, is on the benchmarks page.",
  },
  {
    q: "Does my data leave my machine?",
    a: "Only what you send to the model provider you choose. The web interface listens on 127.0.0.1 and rejects requests from other sites, and experiments run in a sandbox without network access unless a role is allowed to use it.",
  },
  {
    q: "What is an evidence package?",
    a: "A signed archive of a run: the event log, files, citations and proofs, with hashes for each. Anyone can check it with quaera verify-package or in the browser, without an API key.",
  },
];
