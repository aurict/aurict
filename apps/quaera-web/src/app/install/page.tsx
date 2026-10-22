import type { Metadata } from "next";
import { BreadcrumbJsonLd } from "@/components/Breadcrumbs";
import { CodeBlock } from "@/components/CodeBlock";
import { JsonLd } from "@/components/JsonLd";
import { PageHero } from "@/components/PageHero";
import { COMMANDS, INSTALL_STEPS, REPO_URL, SITE_URL } from "@/content/site";
import styles from "../subpage.module.css";

export const metadata: Metadata = {
  title: "Install QuaeraLabs on Linux, WSL2 or macOS",
  description:
    "Install QuaeraLabs with one script: sandbox, Lean 4 with Mathlib and the ML environment. Requirements, quaera doctor and your first Lean-checked proof.",
  alternates: { canonical: "/install" },
};

const howTo = {
  "@context": "https://schema.org",
  "@type": "HowTo",
  name: "Install QuaeraLabs",
  url: `${SITE_URL}/install`,
  step: INSTALL_STEPS.map((s, i) => ({ "@type": "HowToStep", position: i + 1, name: s.title, text: s.code })),
};

const REQUIREMENTS = [
  { title: "Operating system", body: "Linux or Windows with WSL2. macOS runs Lean and the ML environment in containers; not yet tested on a Mac." },
  { title: "Python and uv", body: "Python 3.12 or newer. The installer sets up the environment with uv." },
  { title: "A sandbox", body: "bubblewrap, or Docker or Podman where bubblewrap cannot run." },
  { title: "A model", body: "A logged-in Claude, Codex or OpenCode CLI, an API key for a provider, or a local model." },
  { title: "For mathematics", body: "Lean 4 with Mathlib, installed by the script or pulled as a prebuilt image. The Mathlib REPL needs about 4 to 5 GB of memory." },
  { title: "For machine learning", body: "A Python ML environment with NumPy, SciPy, scikit-learn and PyTorch, on the host or as an image." },
];

export default function InstallPage() {
  return (
    <>
      <BreadcrumbJsonLd name="Install" path="/install" />
      <JsonLd data={howTo} />
      <PageHero
        eyebrow="Install"
        title="From clone to first proof in one sitting."
        lead="One script installs the sandbox, Lean with Mathlib and the ML environment. quaera doctor then tells you exactly what works."
      />
      <div className={`wrap ${styles.body}`}>
        <section className={styles.block} aria-labelledby="steps">
          <h2 id="steps">Three steps</h2>
          <ol className={styles.steps}>
            {INSTALL_STEPS.map((s) => (
              <li key={s.title} className="card">
                <h3>{s.title}</h3>
                <CodeBlock code={s.code} />
                {s.note ? <p>{s.note}</p> : null}
              </li>
            ))}
          </ol>
        </section>

        <section className={styles.block} aria-labelledby="first">
          <h2 id="first">Then try one command</h2>
          <div className={styles.cards}>
            {COMMANDS.map((c) => (
              <article key={c.name} className="card">
                <h3>{c.title}</h3>
                <p>{c.body}</p>
                <div style={{ marginTop: 16 }}>
                  <CodeBlock code={c.code} />
                </div>
              </article>
            ))}
            <article className="card">
              <h3>Run the whole research loop</h3>
              <p>Ask a question, set a budget and approve the expensive steps as they come.</p>
              <div style={{ marginTop: 16 }}>
                <CodeBlock code={'quaera ask "Is n³ - n divisible by 6 for every natural n?" --budget 3'} />
              </div>
            </article>
          </div>
        </section>

        <section className={styles.block} aria-labelledby="req">
          <h2 id="req">Requirements</h2>
          <div className={styles.cards}>
            {REQUIREMENTS.map((r) => (
              <article key={r.title} className="card">
                <h3>{r.title}</h3>
                <p>{r.body}</p>
              </article>
            ))}
          </div>
          <p className={styles.note}>
            Full guide, flags and troubleshooting:{" "}
            <a className="text-link" href={`${REPO_URL}/blob/main/docs/installation.md`} rel="noopener">docs/installation.md</a>.
          </p>
        </section>
      </div>
    </>
  );
}
