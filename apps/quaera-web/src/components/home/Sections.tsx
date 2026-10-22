import Image from "next/image";
import Link from "next/link";
import { CodeBlock } from "@/components/CodeBlock";
import { Faq } from "@/components/Faq";
import { MetricGrid } from "@/components/MetricGrid";
import { CompareTable } from "@/components/CompareTable";
import { COMMANDS, GATES, HEADLINE_METRICS, REPO_URL, ROLES } from "@/content/site";
import styles from "./Sections.module.css";

export function Gates() {
  return (
    <section className="section" aria-labelledby="gates-title">
      <div className="wrap">
        <p className="eyebrow">Three gates</p>
        <h2 id="gates-title" className="section-title">Nothing counts on a model&apos;s word.</h2>
        <p className="section-lead">
          Language models are good at proposing proofs, citations and experiments, and bad at knowing when they are wrong. QuaeraLabs
          lets them write, then hands every claim to a checker that cannot be talked into anything.
        </p>
        <ol className={styles.gates}>
          {GATES.map((gate, i) => (
            <li key={gate.kicker} className={`card ${styles.gate}`}>
              <span className={styles.gateNo} data-n={`0${i + 1}`} aria-hidden="true" />
              <p className={styles.gateKicker}>{gate.kicker}</p>
              <h3>{gate.title}</h3>
              <p>{gate.body}</p>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}

export function Commands() {
  return (
    <section className={`section ${styles.commandsSection}`} aria-labelledby="commands-title">
      <div className="wrap">
        <p className="eyebrow">Useful in minutes</p>
        <h2 id="commands-title" className="section-title">Three commands that work on their own.</h2>
        <p className="section-lead">You do not need the whole research loop to get value. Each command has its own budget and touches nothing without asking.</p>
        <div className={styles.commands}>
          {COMMANDS.map((cmd) => (
            <article key={cmd.name} className={`card ${styles.command}`}>
              <h3>{cmd.title}</h3>
              <p>{cmd.body}</p>
              <CodeBlock code={cmd.code} label={`quaera ${cmd.name}`} />
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}

export function Pipeline() {
  return (
    <section className="section" aria-labelledby="pipeline-title">
      <div className={`wrap ${styles.split}`}>
        <div>
          <p className="eyebrow">The research loop</p>
          <h2 id="pipeline-title" className="section-title">One question, nine roles, one report.</h2>
          <p className="section-lead">
            <code>quaera ask</code> runs the whole loop. You approve the costly and critical steps; a budget cap stops everything else.
          </p>
          <Link href="/how-it-works" className={`btn btn-violet ${styles.splitCta}`}>See how it works</Link>
        </div>
        <Image
          src="/art/pipeline.webp"
          alt="Five connected blocks: literature, hypothesis, proof, experiment and report"
          width={1400}
          height={788}
          sizes="(max-width: 900px) 100vw, 50vw"
          className={styles.pipelineArt}
        />
      </div>
      <div className="wrap">
        <ul className={styles.roles}>
          {ROLES.map((role) => (
            <li key={role.name}>
              <strong>{role.name}</strong>
              <span>{role.body}</span>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}

export function Evidence() {
  return (
    <section className={`section ${styles.evidenceSection}`} aria-labelledby="evidence-title">
      <div className={`wrap ${styles.split} ${styles.splitReverse}`}>
        <Image
          src="/art/glass-cards.webp"
          alt="Three glass cards: a proof tree, mathematical symbols and a results chart"
          width={900}
          height={900}
          sizes="(max-width: 900px) 80vw, 40vw"
          className={styles.evidenceArt}
        />
        <div>
          <p className="eyebrow">Evidence package</p>
          <h2 id="evidence-title" className="section-title">Every run leaves receipts.</h2>
          <p className="section-lead">
            The event log, files, citations, proofs and pre-registration go into a signed RO-Crate package with a hash for every file.
            Anyone can replay it without an API key, or check it in the browser with nothing uploaded.
          </p>
          <ul className={styles.ticks}>
            <li>Ed25519 signature and SHA-256 hashes</li>
            <li>Citations re-checked against arXiv, Crossref and DataCite</li>
            <li>Lean proofs recompiled in a clean environment</li>
          </ul>
        </div>
      </div>
    </section>
  );
}

export function Numbers() {
  return (
    <section className="section" aria-labelledby="numbers-title">
      <div className="wrap">
        <p className="eyebrow">Measured, not claimed</p>
        <h2 id="numbers-title" className="section-title">The numbers, including the bad ones.</h2>
        <p className="section-lead">Every figure links to a result file in the repository. When something fails, it stays on this page.</p>
        <MetricGrid metrics={HEADLINE_METRICS} />
        <Link href="/benchmarks" className={`text-link ${styles.more}`}>All benchmark runs and how they were measured</Link>
      </div>
    </section>
  );
}

export function ComparePreview() {
  return (
    <section className="section" aria-labelledby="compare-title">
      <div className="wrap">
        <p className="eyebrow">Where it fits</p>
        <h2 id="compare-title" className="section-title">Not a prover. Not a paper generator.</h2>
        <p className="section-lead">
          Dedicated provers are better at hard competition problems. Paper generators write more. QuaeraLabs is for when the result has to
          hold up.
        </p>
        <CompareTable />
        <Link href="/compare" className={`text-link ${styles.more}`}>Read the full comparison</Link>
      </div>
    </section>
  );
}

export function FaqSection() {
  return (
    <section className="section" aria-labelledby="faq-title">
      <div className={`wrap ${styles.faq}`}>
        <div>
          <p className="eyebrow">FAQ</p>
          <h2 id="faq-title" className="section-title">Questions researchers ask.</h2>
          <p className="section-lead">
            Something missing? <a className="text-link" href={`${REPO_URL}/issues`} rel="noopener">Open an issue</a>.
          </p>
        </div>
        <Faq />
      </div>
    </section>
  );
}
