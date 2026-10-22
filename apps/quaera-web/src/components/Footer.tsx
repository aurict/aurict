import Link from "next/link";
import { NAV, REPO_URL } from "@/content/site";
import { BrandMark } from "./BrandMark";
import styles from "./Footer.module.css";

export function Footer() {
  return (
    <footer className={styles.footer}>
      <div className={`wrap ${styles.grid}`}>
        <div className={styles.about}>
          <BrandMark tone="light" />
          <p>
            Open-source, non-profit AI research for mathematics and machine learning. Code under Apache-2.0, reports under CC BY 4.0.
          </p>
        </div>
        <nav aria-label="Footer">
          <h2 className={styles.head}>Product</h2>
          <ul>
            {NAV.map((item) => (
              <li key={item.href}>
                <Link href={item.href}>{item.label}</Link>
              </li>
            ))}
          </ul>
        </nav>
        <div>
          <h2 className={styles.head}>Project</h2>
          <ul>
            <li><a href={REPO_URL} rel="noopener">Source code</a></li>
            <li><a href={`${REPO_URL}/tree/main/docs`} rel="noopener">Documentation</a></li>
            <li><a href={`${REPO_URL}/tree/main/evals`} rel="noopener">Evaluation sets</a></li>
            <li><a href={`${REPO_URL}/blob/main/CONTRIBUTING.md`} rel="noopener">Contributing</a></li>
          </ul>
        </div>
        <div>
          <h2 className={styles.head}>Aurict</h2>
          <ul>
            <li><a href="https://aurict.com">aurict.com</a></li>
            <li><a href="https://decision.aurict.com">Aurict Decision</a></li>
            <li><a href="https://mobile.aurict.com">Aurict Mobile</a></li>
          </ul>
        </div>
      </div>
      <div className={`wrap ${styles.base}`}>
        <span>© 2026 Aurict. QuaeraLabs is open source.</span>
        <span>Every report carries the QuaeraLabs AI label.</span>
      </div>
    </footer>
  );
}
