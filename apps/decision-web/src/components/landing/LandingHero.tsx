"use client";

import { ArrowUpRight } from "lucide-react";
import { useLocale } from "next-intl";
import styles from "./LandingHero.module.css";

const COPY = {
  en: {
    eyebrow: "Aurict Decision / On-device Decision Engine",
    titleLead: "Every signal.",
    titleAccent: "One decision.",
    body: "Aurict Decision is a privacy-native Decision Engine that turns live, first-party behavior into one governed next-best action — before the next screen renders.",
    primary: "Start building",
    secondary: "Explore the engine",
    live: "Engine live",
    field: "live decision field",
    signals: [
      ["intent", "0.86"],
      ["propensity", "0.72"],
      ["affinity", "0.91"],
      ["context", "checkout"],
    ],
    outputLabel: "selected action",
    output: "recover_cart",
    confidence: "94.2% confidence",
    trace: [
      ["01", "capture", "first-party signals"],
      ["02", "score", "intent vector"],
      ["03", "govern", "policy + consent"],
      ["04", "decide", "one action"],
    ],
    metrics: [
      ["<10ms", "decision latency"],
      ["100%", "on-device inference"],
      ["01", "action per session"],
      ["0 B", "raw data exported"],
    ],
  },
  tr: {
    eyebrow: "Aurict Decision / Cihaz İçi Decision Engine",
    titleLead: "Her sinyal.",
    titleAccent: "Tek karar.",
    body: "Aurict Decision; canlı, birinci taraf davranışlarını bir sonraki ekran çizilmeden önce tek ve kontrollü bir sonraki en iyi eyleme dönüştüren gizlilik odaklı bir Decision Engine'dir.",
    primary: "Hemen başla",
    secondary: "Motoru keşfet",
    live: "Motor canlı",
    field: "canlı karar alanı",
    signals: [
      ["niyet", "0.86"],
      ["eğilim", "0.72"],
      ["ilgi", "0.91"],
      ["bağlam", "ödeme"],
    ],
    outputLabel: "seçilen eylem",
    output: "sepeti_kurtar",
    confidence: "%94.2 güven",
    trace: [
      ["01", "yakala", "birinci taraf sinyal"],
      ["02", "skorla", "niyet vektörü"],
      ["03", "yönet", "politika + rıza"],
      ["04", "karar ver", "tek eylem"],
    ],
    metrics: [
      ["<10ms", "karar gecikmesi"],
      ["%100", "cihaz içi çıkarım"],
      ["01", "oturum başına eylem"],
      ["0 B", "dışa çıkan ham veri"],
    ],
  },
} as const;

export function LandingHero() {
  const locale = useLocale();
  const copy = locale === "tr" ? COPY.tr : COPY.en;

  return (
    <section className={styles.hero} aria-labelledby="hero-title">
      <div className={styles.frame}>
        <header className={styles.metaBar}>
          <span className={styles.live}>
            <i />
            {copy.live}
          </span>
          <span>{copy.eyebrow}</span>
          <a href="https://aurict.com" rel="noopener noreferrer" target="_blank">
            by Aurict <span aria-hidden="true">↗</span>
          </a>
        </header>

        <div className={styles.field}>
          <div className={styles.fieldGrid} aria-hidden="true" />

          <svg
            aria-hidden="true"
            className={styles.network}
            preserveAspectRatio="none"
            viewBox="0 0 1400 660"
          >
            <path d="M85 122 C340 122 535 330 905 330" />
            <path d="M330 64 C540 64 610 330 905 330" />
            <path d="M225 575 C500 575 615 330 905 330" />
            <path d="M650 600 C740 515 765 330 905 330" />
            <path className={styles.outputPath} d="M905 330 C1080 330 1185 330 1340 330" />
            <circle cx="905" cy="330" r="4" />
          </svg>

          <div className={styles.lens} aria-hidden="true">
            <span className={styles.lensRing} />
            <span className={styles.lensRing} />
            <span className={styles.lensRing} />
            <div className={styles.lensCore}>
              <small>decision</small>
              <strong>01</strong>
              <i>7.4ms</i>
            </div>
          </div>

          <div className={styles.titleBlock}>
            <p>
              <span>↳</span>
              {copy.field}
            </p>
            <h1 id="hero-title">
              <span>{copy.titleLead}</span>
              <em>{copy.titleAccent}</em>
            </h1>
          </div>

          <div className={styles.signalCloud} aria-label={locale === "tr" ? "Canlı oturum sinyalleri" : "Live session signals"}>
            {copy.signals.map(([label, value], index) => (
              <div className={styles[`signal${index + 1}`]} key={label}>
                <span>{label}</span>
                <strong>{value}</strong>
              </div>
            ))}
          </div>

          <div className={styles.output}>
            <span>{copy.outputLabel}</span>
            <strong>{copy.output}</strong>
            <small>{copy.confidence}</small>
          </div>

          <div className={styles.axis} aria-hidden="true">
            <span>context / now</span>
            <i />
            <span>action / next</span>
          </div>
        </div>

        <div className={styles.lower}>
          <div className={styles.intro}>
            <p>{copy.body}</p>
            <div className={styles.actions}>
              <a className={styles.primaryAction} href="https://decision.aurict.com/register">
                {copy.primary}
                <ArrowUpRight aria-hidden="true" size={16} strokeWidth={1.8} />
              </a>
              <a className={styles.secondaryAction} href="#decision-lab">
                <span aria-hidden="true">↳</span>
                {copy.secondary}
              </a>
            </div>
          </div>

          <ol className={styles.trace}>
            {copy.trace.map(([index, label, detail], step) => (
              <li className={step === 3 ? styles.traceActive : ""} key={index}>
                <span>{index}</span>
                <div>
                  <strong>{label}</strong>
                  <small>{detail}</small>
                </div>
              </li>
            ))}
          </ol>
        </div>

        <div className={styles.metrics}>
          {copy.metrics.map(([value, label], index) => (
            <div key={label}>
              <span>0{index + 1}</span>
              <strong>{value}</strong>
              <p>{label}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
