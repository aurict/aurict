import Link from "next/link";
import { REPO_URL } from "@/content/site";
import styles from "./CtaPanel.module.css";

export function CtaPanel() {
  return (
    <section className="wrap" aria-labelledby="cta-title">
      <div className={styles.panel}>
        <h2 id="cta-title">Run your first verified result today.</h2>
        <p>Install it, point it at a Lean file or an experiment, and set a budget. Nothing counts until code has checked it.</p>
        <div className={styles.actions}>
          <Link href="/install" className="btn btn-white">Install Quaera</Link>
          <a href={REPO_URL} className="btn btn-ghost-light" rel="noopener">Read the source</a>
        </div>
      </div>
    </section>
  );
}
