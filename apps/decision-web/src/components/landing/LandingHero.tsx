"use client";

import { ArrowRight, Cpu } from "lucide-react";
import { useLocale } from "next-intl";
import Image from "next/image";
import { TightPeriods } from "@/components/ui/TightPeriods";
import styles from "./LandingHero.module.css";

const COPY = {
  en: {
    eyebrow: "The on-device decision engine",
    titleLead: "Every signal.",
    titleAccent: "One decision.",
    body: "Live behavior. One governed next-best action. All on-device.",
    primary: "Get started",
    privacyTitle: "Private by design",
    privacyValue: "0 B exported",
    latencyValue: "<10 ms",
    latencyLabel: "Decision latency",
    pipelineTitle: "Governed from signal to action",
    pipelineSub: "Consent · Budget · Safety",
    actionTitle: "One next-best action",
    actionValue: "recover_cart · 94%",
    sdkTitle: "Build where your users are.",
    sdkSub: "SDKs & commerce connectors",
    onDevice: "100% on-device inference",
    ecosystem: "Part of the Aurict ecosystem",
  },
  tr: {
    eyebrow: "Cihaz içi karar motoru",
    titleLead: "Her sinyal.",
    titleAccent: "Tek karar.",
    body: "Canlı davranış. Tek ve kontrollü bir sonraki en iyi eylem. Tamamı cihazda.",
    primary: "Hemen başla",
    privacyTitle: "Tasarım gereği gizli",
    privacyValue: "0 B dışa çıkış",
    latencyValue: "<10 ms",
    latencyLabel: "Karar gecikmesi",
    pipelineTitle: "Sinyalden eyleme kontrollü",
    pipelineSub: "Rıza · Bütçe · Güvenlik",
    actionTitle: "Tek sonraki en iyi eylem",
    actionValue: "sepeti_kurtar · %94",
    sdkTitle: "Kullanıcılarınız neredeyse orada çalışın.",
    sdkSub: "SDK'lar ve e-ticaret bağlayıcıları",
    onDevice: "%100 cihaz içi çıkarım",
    ecosystem: "Aurict ekosisteminin parçası",
  },
} as const;

const SDKS = [
  { name: "Web", icon: <GlobeIcon /> },
  { name: "iOS", icon: <AppleIcon /> },
  { name: "Android", icon: <AndroidIcon /> },
  { name: "React Native", icon: <ReactIcon /> },
];

export function LandingHero() {
  const locale = useLocale();
  const copy = locale === "tr" ? COPY.tr : COPY.en;

  return (
    <section className={styles.hero} aria-labelledby="hero-title">
      <div className={styles.bento}>
        <article className={`${styles.tile} ${styles.main}`}>
          <div className={styles.mainCopy}>
            <p className={styles.eyebrow}>{copy.eyebrow}</p>
            <h1 id="hero-title">
              <span><TightPeriods text={copy.titleLead} /></span>
              <em><TightPeriods text={copy.titleAccent} /></em>
            </h1>
            <p className={styles.lead}>{copy.body}</p>
            <a className={styles.primary} href="https://decision.aurict.com/register">
              {copy.primary}
              <ArrowRight aria-hidden="true" size={20} strokeWidth={2.4} />
            </a>
          </div>
          <Image alt="" aria-hidden="true" className={styles.phone} height={760} priority src="/bento/phone.webp" width={589} />
        </article>

        <article className={`${styles.tile} ${styles.privacy}`}>
          <h2>{copy.privacyTitle}</h2>
          <p className={styles.value}>{copy.privacyValue}</p>
          <Image alt="" aria-hidden="true" className={styles.shield} height={760} src="/bento/shield.webp" width={635} />
        </article>

        <article className={`${styles.tile} ${styles.latency}`}>
          <Image alt="" aria-hidden="true" className={styles.stopwatch} height={760} src="/bento/stopwatch.webp" width={614} />
          <div>
            <p className={styles.bigValue}>{copy.latencyValue}</p>
            <p className={styles.label}>{copy.latencyLabel}</p>
          </div>
        </article>

        <article className={`${styles.tile} ${styles.pipeline}`}>
          <h2>{copy.pipelineTitle}</h2>
          <p className={styles.label}>{copy.pipelineSub}</p>
          <Image alt="capture → score → govern → decide" className={styles.pipelineArt} height={230} src="/bento/pipeline.webp" width={976} />
        </article>

        <article className={`${styles.tile} ${styles.action}`}>
          <h2>{copy.actionTitle}</h2>
          <p className={styles.value}>{copy.actionValue}</p>
          <Image alt="" aria-hidden="true" className={styles.arrow} height={607} src="/bento/arrow.webp" width={897} />
        </article>

        <article className={`${styles.tile} ${styles.sdk}`}>
          <div>
            <h2><TightPeriods text={copy.sdkTitle} /></h2>
            <p className={styles.label}>{copy.sdkSub}</p>
          </div>
          <ul className={styles.sdkList}>
            {SDKS.map((sdk) => (
              <li key={sdk.name}>
                {sdk.icon}
                {sdk.name}
              </li>
            ))}
          </ul>
        </article>
      </div>

      <div className={styles.strip}>
        <span>
          <Cpu aria-hidden="true" size={18} strokeWidth={2} />
          {copy.onDevice}
        </span>
        <a href="https://aurict.com" rel="noopener noreferrer" target="_blank">
          {copy.ecosystem}
          <span aria-hidden="true" className={styles.aurictDot} />
        </a>
      </div>
    </section>
  );
}

function GlobeIcon() {
  return (
    <svg aria-hidden="true" fill="none" height="26" stroke="#0b7b86" strokeLinecap="round" strokeWidth="2" viewBox="0 0 24 24" width="26">
      <circle cx="12" cy="12" r="9" />
      <path d="M3 12h18M12 3a14 14 0 0 1 0 18 14 14 0 0 1 0-18" />
    </svg>
  );
}

function AppleIcon() {
  return (
    <svg aria-hidden="true" fill="#1f9e74" height="26" viewBox="0 0 24 24" width="26">
      <path d="M16.4 12.6c0-2.3 1.9-3.4 2-3.5-1.1-1.6-2.8-1.8-3.4-1.8-1.4-.1-2.8.9-3.5.9-.7 0-1.8-.9-3-.8-1.5 0-3 .9-3.8 2.3-1.6 2.8-.4 7 1.2 9.3.8 1.1 1.7 2.4 2.9 2.3 1.2 0 1.6-.7 3-.7s1.8.7 3 .7c1.3 0 2.1-1.1 2.8-2.3.9-1.3 1.3-2.6 1.3-2.6s-2.5-1-2.5-3.8ZM14.1 5.8c.6-.8 1.1-1.9 1-3-.9 0-2.1.6-2.8 1.4-.6.7-1.1 1.8-1 2.9 1.1.1 2.1-.5 2.8-1.3Z" />
    </svg>
  );
}

function AndroidIcon() {
  return (
    <svg aria-hidden="true" fill="#3ddc84" height="26" viewBox="0 0 24 24" width="26">
      <path d="M6 9h12v8a1.5 1.5 0 0 1-1.5 1.5H16V21a1.25 1.25 0 0 1-2.5 0v-2.5h-3V21A1.25 1.25 0 0 1 8 21v-2.5h-.5A1.5 1.5 0 0 1 6 17V9Zm-2.5 0A1.25 1.25 0 0 1 4.75 10.25v5a1.25 1.25 0 0 1-2.5 0v-5A1.25 1.25 0 0 1 3.5 9Zm17 0a1.25 1.25 0 0 1 1.25 1.25v5a1.25 1.25 0 0 1-2.5 0v-5A1.25 1.25 0 0 1 20.5 9ZM8.2 3.3l1 1.7A6 6 0 0 1 12 4.4c1 0 2 .2 2.8.6l1-1.7a.4.4 0 1 1 .7.4l-1 1.7A5.6 5.6 0 0 1 18 8H6a5.6 5.6 0 0 1 2.5-4.6l-1-1.7a.4.4 0 1 1 .7-.4ZM9.5 6.2a.6.6 0 1 0 0 1.2.6.6 0 0 0 0-1.2Zm5 0a.6.6 0 1 0 0 1.2.6.6 0 0 0 0-1.2Z" />
    </svg>
  );
}

function ReactIcon() {
  return (
    <svg aria-hidden="true" fill="none" height="26" stroke="#0b7b86" strokeWidth="1.6" viewBox="0 0 24 24" width="26">
      <circle cx="12" cy="12" fill="#0b7b86" r="1.8" stroke="none" />
      <ellipse cx="12" cy="12" rx="10" ry="4" />
      <ellipse cx="12" cy="12" rx="10" ry="4" transform="rotate(60 12 12)" />
      <ellipse cx="12" cy="12" rx="10" ry="4" transform="rotate(120 12 12)" />
    </svg>
  );
}
