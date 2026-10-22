import type { Metric } from "@/content/site";
import styles from "./MetricGrid.module.css";

export function MetricGrid({ metrics }: { metrics: Metric[] }) {
  return (
    <ul className={styles.grid}>
      {metrics.map((m) => (
        <li key={m.label} className={`card ${styles.metric}`}>
          <p className={styles.value}>{m.value}</p>
          <h3 className={styles.label}>{m.label}</h3>
          <p className={styles.detail}>{m.detail}</p>
          <p className={styles.source}>
            <time dateTime={m.date}>{m.date}</time> · {m.source}
          </p>
        </li>
      ))}
    </ul>
  );
}
