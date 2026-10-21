"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { useLanguage } from "@/contexts/LanguageContext";
import SectionHeading from "./SectionHeading";

const EASE = [0.16, 0.8, 0.2, 1] as const;

const ITEMS = [
  { key: "deleteDuckley", href: "/duckley/delete-account", color: "var(--duck)", soft: "var(--duck-soft)" },
  { key: "deleteMindGrid", href: "/mindgrid/delete-account", color: "var(--grid)", soft: "var(--grid-soft)" },
  { key: "privacy", href: "/privacy-policy", color: "var(--jelly)", soft: "var(--jelly-soft)" },
  { key: "duckleyPrivacy", href: "/duckley/privacy-policy", color: "var(--duck)", soft: "var(--duck-soft)" },
  { key: "duckleyTerms", href: "/duckley/terms-of-service", color: "var(--duck)", soft: "var(--duck-soft)" },
  { key: "deleteJelly", href: "/jelly-paradox/delete-account", color: "var(--jelly)", soft: "var(--jelly-soft)" },
  { key: "jellyPrivacy", href: "/jelly-paradox/privacy-policy", color: "var(--jelly)", soft: "var(--jelly-soft)" },
  { key: "terms", href: "/terms-of-service", color: "var(--accent-alt)", soft: "#fff0e2" },
  { key: "contact", href: "mailto:contact@aurict.com", color: "var(--jelly)", soft: "var(--jelly-soft)" },
];

export default function SupportHub() {
  const { t } = useLanguage();

  return (
    <section id="support" className="relative z-10 pb-28" style={{ scrollMarginTop: 88 }}>
      <div className="section-shell">
        <SectionHeading eyebrow={t("hub.eyebrow")} title={t("hub.title")} subtitle={t("hub.subtitle")} />

        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-80px" }}
          variants={{ hidden: {}, visible: { transition: { staggerChildren: 0.06 } } }}
          className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3"
        >
          {ITEMS.map((item) => {
            const body = (
              <>
                <span className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl" style={{ background: item.soft, color: item.color }}>
                  <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.4} aria-hidden="true">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 12h14m-6-6 6 6-6 6" />
                  </svg>
                </span>
                <span>
                  <span className="block text-lg font-extrabold tracking-tight mb-1" style={{ color: "var(--text)" }}>
                    {t(`hub.${item.key}.title`)}
                  </span>
                  <span className="block leading-relaxed" style={{ color: "var(--text-dim)" }}>
                    {t(`hub.${item.key}.body`)}
                  </span>
                </span>
              </>
            );
            const className = "aur-card aur-card-lift flex h-full items-start gap-4 p-6";

            return (
              <motion.div
                key={item.key}
                variants={{ hidden: { opacity: 0, y: 16 }, visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: EASE } } }}
              >
                {item.href.startsWith("/") ? (
                  <Link href={item.href} className={className}>
                    {body}
                  </Link>
                ) : (
                  <a href={item.href} className={className}>
                    {body}
                  </a>
                )}
              </motion.div>
            );
          })}
        </motion.div>
      </div>
    </section>
  );
}
