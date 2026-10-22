import type { Metadata } from "next";
import { BreadcrumbJsonLd } from "@/components/Breadcrumbs";
import { CtaPanel } from "@/components/CtaPanel";
import { MetricGrid } from "@/components/MetricGrid";
import { PageHero } from "@/components/PageHero";
import { HEADLINE_METRICS, LAST_UPDATED, PROOF_RUNS, REPO_URL } from "@/content/site";
import styles from "../subpage.module.css";

export const metadata: Metadata = {
  title: "Benchmarks: miniF2F, PutnamBench, citations and Critic results",
  description:
    "QuaeraLabs results on miniF2F and PutnamBench in Lean 4, citation fabrication tests, literature verdicts and the Critic, with every failure included.",
  alternates: { canonical: "/benchmarks" },
};

export default function BenchmarksPage() {
  return (
    <>
      <BreadcrumbJsonLd name="Benchmarks" path="/benchmarks" />
      <PageHero
        eyebrow="Benchmarks"
        title="What we measured, and where we fall short."
        lead={`Every number here comes from a result file or a recorded run, with its date. Last updated ${LAST_UPDATED}.`}
      />
      <div className={`wrap ${styles.body}`}>
        <section className={styles.block} aria-labelledby="integrity">
          <h2 id="integrity">Integrity and reviewing</h2>
          <p>These measure whether the system refuses to fool you: fabricated sources, wrong novelty verdicts and missed flaws.</p>
          <MetricGrid metrics={HEADLINE_METRICS} />
        </section>

        <section className={styles.block} aria-labelledby="proofs">
          <h2 id="proofs">Formal proof search in Lean 4</h2>
          <p>
            Solved means Lean accepted the whole file with no sorry. Runs use the same per-task budget on both search versions where a
            comparison was made.
          </p>
          <div className="table-scroll" style={{ marginTop: 40 }} tabIndex={0} role="region" aria-label="Proof search results">
            <table className="data-table">
              <thead>
                <tr>
                  <th scope="col">Set</th>
                  <th scope="col">Problems</th>
                  <th scope="col">Model</th>
                  <th scope="col">Solved</th>
                  <th scope="col">Spent</th>
                  <th scope="col">Date</th>
                </tr>
              </thead>
              <tbody>
                {PROOF_RUNS.map((r) => (
                  <tr key={`${r.set}-${r.model}-${r.date}`}>
                    <th scope="row">{r.set}</th>
                    <td>{r.n}</td>
                    <td>{r.model}</td>
                    <td>{r.solved}</td>
                    <td>{r.spent}</td>
                    <td><time dateTime={r.date}>{r.date}</time></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className={styles.note}>
            The newer search spends the budget differently, with up to about three times more attempts per dollar, but did not solve more
            tasks on these sets. The stronger model is what moved the solve rate. PutnamBench at this budget solved nothing: 7 of 10 tasks
            ran out of money first.
          </p>
        </section>

        <section className={styles.block} aria-labelledby="contamination">
          <h2 id="contamination">Contamination, stated up front</h2>
          <div className={styles.cards}>
            <article className="card">
              <h3>miniF2F is a ceiling</h3>
              <p>It has been public since 2021, so models may have seen it. A good score there is an upper bound, not evidence of skill.</p>
            </article>
            <article className="card">
              <h3>PutnamBench is harder to game</h3>
              <p>Its formal proofs are mostly unpublished. We use the 326 problems with no answer to guess and remove answer comments.</p>
            </article>
            <article className="card">
              <h3>A hidden split for releases</h3>
              <p>Twelve synthetic statements are frozen and run only on release tags, so they cannot leak into development.</p>
            </article>
            <article className="card">
              <h3>Fresh problems</h3>
              <p>A set of problems published after the models&apos; knowledge cutoff is prepared and will be reported once it is filled.</p>
            </article>
          </div>
        </section>

        <section className={styles.block} aria-labelledby="reproduce">
          <h2 id="reproduce">Run them yourself</h2>
          <p>
            The sets, the scripts and the raw result files are in the repository under{" "}
            <a className="text-link" href={`${REPO_URL}/tree/main/evals`} rel="noopener">evals/</a>. A citation test that ever accepts a
            fabricated source exits with an error.
          </p>
        </section>
      </div>
      <div style={{ marginTop: "clamp(64px, 9vw, 112px)" }}>
        <CtaPanel />
      </div>
    </>
  );
}
