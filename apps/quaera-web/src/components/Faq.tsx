import { FAQ } from "@/content/site";
import styles from "./Faq.module.css";

export function Faq() {
  return (
    <div className={styles.list}>
      {FAQ.map((item) => (
        <details key={item.q} className={styles.item}>
          <summary>
            <h3>{item.q}</h3>
            <span className={styles.sign} aria-hidden="true" />
          </summary>
          <p>{item.a}</p>
        </details>
      ))}
    </div>
  );
}

export function faqJsonLd() {
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: FAQ.map((item) => ({
      "@type": "Question",
      name: item.q,
      acceptedAnswer: { "@type": "Answer", text: item.a },
    })),
  };
}
