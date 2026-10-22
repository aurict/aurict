import Link from "next/link";
import { NAV, REPO_URL } from "@/content/site";
import { BrandMark } from "./BrandMark";
import styles from "./Nav.module.css";

export function Nav() {
  return (
    <header className={styles.header}>
      <nav className={`wrap ${styles.nav}`} aria-label="Main">
        <BrandMark />
        <ul className={styles.links}>
          {NAV.map((item) => (
            <li key={item.href}>
              <Link href={item.href}>{item.label}</Link>
            </li>
          ))}
          <li>
            <a href={REPO_URL} rel="noopener">GitHub</a>
          </li>
        </ul>
        <Link href="/install" className={`btn btn-violet ${styles.cta}`}>
          Get started
        </Link>
        <details className={styles.mobile}>
          <summary aria-label="Open menu">
            <span aria-hidden="true" />
            <span aria-hidden="true" />
          </summary>
          <ul>
            {NAV.map((item) => (
              <li key={item.href}>
                <Link href={item.href}>{item.label}</Link>
              </li>
            ))}
            <li>
              <a href={REPO_URL} rel="noopener">GitHub</a>
            </li>
          </ul>
        </details>
      </nav>
    </header>
  );
}
