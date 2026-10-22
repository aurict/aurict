import type { Metadata } from "next";
import Image from "next/image";
import { BreadcrumbJsonLd } from "@/components/Breadcrumbs";
import { CtaPanel } from "@/components/CtaPanel";
import { PageHero } from "@/components/PageHero";
import { ROLES } from "@/content/site";
import styles from "../subpage.module.css";

export const metadata: Metadata = {
  title: "How it works: nine AI research roles, checked by code",
  description:
    "How QuaeraLabs turns a question into a signed report: nine AI roles, Lean 4 proof checking, sandboxed experiments, pre-registration and budget caps.",
  alternates: { canonical: "/how-it-works" },
};

const SAFEGUARDS = [
  {
    title: "Pre-registration before results",
    body: "The experiment design is written and locked before any result is seen. Analysis that drifts from it is flagged in the report.",
  },
  {
    title: "A sandbox for every run",
    body: "Proofs and experiments run in bubblewrap, or in Docker or Podman where bubblewrap cannot run, with memory and CPU limits and no network unless a role needs it.",
  },
  {
    title: "Budgets no agent can raise",
    body: "You set the budget. Steps above your approval threshold wait for you, and no role can publish or increase the cap.",
  },
  {
    title: "A second model family",
    body: "When Codex or OpenCode is installed, a different model family cross-checks the Critic and the Verifier, so one model does not grade its own work.",
  },
];

export default function HowItWorksPage() {
  return (
    <>
      <BreadcrumbJsonLd name="How it works" path="/how-it-works" />
      <PageHero
        eyebrow="How it works"
        title="A research team where code has the last word."
        lead="You ask a question in mathematics or machine learning. Nine roles do the research. Lean, the citation registries and a clean replay decide what is true."
      />
      <div className={`wrap ${styles.body}`}>
        <section className={styles.block} aria-labelledby="loop">
          <h2 id="loop">From question to report</h2>
          <p>
            A single command, <code>quaera ask</code>, starts the loop. Each stage writes to an append-only event log, so a run can be
            paused, resumed, branched from any point and replayed later without calling a model.
          </p>
          <Image
            src="/art/pipeline.webp"
            alt="Literature, hypothesis, proof, experiment and report as connected blocks"
            width={1400}
            height={788}
            sizes="(max-width: 1240px) 100vw, 1180px"
            className={styles.art}
          />
        </section>

        <section className={styles.block} aria-labelledby="roles">
          <h2 id="roles">The nine roles</h2>
          <p>Each role has its own card, tools and permissions in the repository. None of them can mark its own work as verified.</p>
          <ol className={styles.steps}>
            {ROLES.map((role) => (
              <li key={role.name} className="card">
                <h3>{role.name}</h3>
                <p>{role.body}</p>
              </li>
            ))}
          </ol>
        </section>

        <section className={styles.block} aria-labelledby="math">
          <h2 id="math">Mathematics: Verify and Discover</h2>
          <div className={styles.cards}>
            <article className="card">
              <h3>Verify a claim</h3>
              <p>
                The team searches the literature, writes a Lean 4 statement and proof against a pinned Mathlib, and the proof counts only
                when Lean compiles it. Proof search mixes automation tactics, whole-proof attempts and interactive steps through the Lean REPL.
              </p>
            </article>
            <article className="card">
              <h3>Attack an open problem</h3>
              <p>
                Discover mode gathers ideas from several models, has them review each other and builds a program of lemmas. Only lemmas
                Lean verifies count as progress; refuted ones and dead strategies are recorded too.
              </p>
            </article>
          </div>
        </section>

        <section className={styles.block} aria-labelledby="ml">
          <h2 id="ml">Machine learning: experiments that reproduce</h2>
          <p>
            For an ML question the team designs the experiment, writes and runs the code in the sandbox against your data, and the Critic
            looks for leakage, confounds and overclaims. Negative results are reported as results.
          </p>
        </section>

        <section className={styles.block} aria-labelledby="safeguards">
          <h2 id="safeguards">Safeguards built in</h2>
          <div className={styles.cards}>
            {SAFEGUARDS.map((s) => (
              <article key={s.title} className="card">
                <h3>{s.title}</h3>
                <p>{s.body}</p>
              </article>
            ))}
          </div>
        </section>

        <section className={styles.block} aria-labelledby="ui">
          <h2 id="ui">A local lab you can watch</h2>
          <p>
            <code>quaera serve</code> opens a web interface on your own machine. You see the code an agent is compiling, approve cards,
            message a role, branch from a finished stage and read the report, the Lean proof and the evidence graph in one place. It
            listens only on 127.0.0.1.
          </p>
        </section>
      </div>
      <div style={{ marginTop: "clamp(64px, 9vw, 112px)" }}>
        <CtaPanel />
      </div>
    </>
  );
}
