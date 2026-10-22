import type { Metadata } from "next";
import { BreadcrumbJsonLd } from "@/components/Breadcrumbs";
import { CompareTable } from "@/components/CompareTable";
import { CtaPanel } from "@/components/CtaPanel";
import { PageHero } from "@/components/PageHero";
import styles from "../subpage.module.css";

export const metadata: Metadata = {
  title: "QuaeraLabs vs AI theorem provers and AI scientist tools",
  description:
    "QuaeraLabs compared with Claude Code plus Lean MCP, DeepSeek-Prover, Kimina-Prover, AI Scientist and Agent Laboratory: proof checking, citations, evidence.",
  alternates: { canonical: "/compare" },
};

const NOTES = [
  {
    title: "Claude Code with a Lean MCP server",
    body: "A strong general coding agent that can call Lean. Whether a proof is accepted, which sources are real and what gets recorded is left to you. Choose it for open-ended Lean work in your editor.",
  },
  {
    title: "DeepSeek-Prover and Kimina-Prover",
    body: "Models trained for formal proofs, and far stronger than QuaeraLabs on hard competition problems. They prove statements; they do not search literature, run experiments or produce a report. Choose them for raw proving power.",
  },
  {
    title: "AI Scientist and Agent Laboratory",
    body: "End-to-end systems that generate ideas, run experiments and write papers. They are not formal provers and do not document a fabrication audit for citations. Choose them to explore many ideas quickly.",
  },
  {
    title: "QuaeraLabs",
    body: "Slower and more cautious by design. Choose it when a result needs to survive review: proofs checked by Lean, sources checked by registries, experiments pre-registered and every run signed.",
  },
];

export default function ComparePage() {
  return (
    <>
      <BreadcrumbJsonLd name="Compare" path="/compare" />
      <PageHero
        eyebrow="Compare"
        title="Pick the right tool for the job."
        lead="Based on each project's public documentation as of October 2026. If something here is out of date, tell us and we will fix it."
      />
      <div className={`wrap ${styles.body}`}>
        <section className={styles.block} aria-labelledby="table">
          <h2 id="table">Side by side</h2>
          <CompareTable />
        </section>
        <section className={styles.block} aria-labelledby="when">
          <h2 id="when">When to use which</h2>
          <div className={styles.cards}>
            {NOTES.map((n) => (
              <article key={n.title} className="card">
                <h3>{n.title}</h3>
                <p>{n.body}</p>
              </article>
            ))}
          </div>
        </section>
      </div>
      <div style={{ marginTop: "clamp(64px, 9vw, 112px)" }}>
        <CtaPanel />
      </div>
    </>
  );
}
