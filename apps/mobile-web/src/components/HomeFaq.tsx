"use client";

import { useLanguage } from "@/contexts/LanguageContext";
import SectionHeading from "./SectionHeading";

const HOME_FAQ_KEYS = ["q1", "q2", "q3", "q4", "q5"] as const;

export default function HomeFaq() {
  const { t } = useLanguage();

  return (
    <section id="faq" className="relative z-10 pb-28">
      <div className="section-shell max-w-4xl">
        <SectionHeading eyebrow={t("homeFaq.eyebrow")} title={t("homeFaq.title")} center />

        <div className="space-y-3">
          {HOME_FAQ_KEYS.map((key) => (
            <details key={key} className="aur-card group px-6 py-1 open:pb-5">
              <summary className="flex min-h-[64px] cursor-pointer list-none items-center justify-between gap-4 text-lg font-bold [&::-webkit-details-marker]:hidden" style={{ color: "var(--text)" }}>
                {t(`homeFaq.${key}.q`)}
                <span
                  className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full transition-transform duration-200 group-open:rotate-45"
                  style={{ background: "var(--accent-soft)", color: "var(--accent)" }}
                  aria-hidden="true"
                >
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.6}>
                    <path strokeLinecap="round" d="M12 5v14M5 12h14" />
                  </svg>
                </span>
              </summary>
              <p className="pr-12 text-base md:text-lg leading-relaxed" style={{ color: "var(--text-dim)" }}>
                {t(`homeFaq.${key}.a`)}
              </p>
            </details>
          ))}
        </div>
      </div>
    </section>
  );
}
