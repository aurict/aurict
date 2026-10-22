import Image from "next/image";
import Link from "next/link";
import { REPO_URL } from "@/content/site";
import styles from "./Hero.module.css";

export function Hero() {
  return (
    <section className={styles.hero} aria-labelledby="hero-title">
      <div className={styles.panel}>
        <p className={styles.eyebrow}>Open-source AI research team</p>
        <h1 id="hero-title" className={styles.title}>
          Models write. <span>Code decides.</span>
        </h1>
        <p className={styles.lead}>
          Nine AI research roles take your question from the literature to a report. A proof counts only if Lean 4 accepts it, a
          source only if a registry confirms it, a result only if it reproduces.
        </p>
        <div className={styles.actions}>
          <Link href="/install" className="btn btn-white">
            Install
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
              <path d="M5 12h14M13 6l6 6-6 6" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </Link>
          <a href={REPO_URL} className="btn btn-ghost-light" rel="noopener">
            View on GitHub
          </a>
        </div>
      </div>
      <div className={styles.art}>
        <Image
          src="/art/knot.webp"
          alt="A knot of white porcelain and violet glass, the Quaera emblem"
          width={1903}
          height={2000}
          priority
          quality={95}
          sizes="(max-width: 900px) 92vw, 760px"
          className={styles.sculpture}
        />
        <p className={styles.caption}>
          <strong>Mathematics and machine learning.</strong>
          <br />
          Lean 4 proofs. ML experiments.
          <br />
          <span>Verified by code, signed for anyone to check.</span>
        </p>
      </div>
    </section>
  );
}
