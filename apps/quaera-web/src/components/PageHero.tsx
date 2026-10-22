import styles from "./PageHero.module.css";

export function PageHero({ eyebrow, title, lead }: { eyebrow: string; title: string; lead: string }) {
  return (
    <section className={styles.hero}>
      <div className={styles.panel}>
        <div className={`wrap ${styles.inner}`}>
          <p className={styles.eyebrow}>{eyebrow}</p>
          <h1>{title}</h1>
          <p className={styles.lead}>{lead}</p>
        </div>
      </div>
    </section>
  );
}
