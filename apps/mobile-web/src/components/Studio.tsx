"use client";

import { motion } from "framer-motion";
import { useLanguage } from "@/contexts/LanguageContext";
import SectionHeading from "./SectionHeading";

const EASE = [0.16, 0.8, 0.2, 1] as const;

const VALUES = [
  { key: "v1", color: "var(--grid)", soft: "var(--grid-soft)", icon: "M12 6v6l4 2m5-2a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" },
  { key: "v2", color: "var(--jelly)", soft: "var(--jelly-soft)", icon: "M12 3l2.6 5.3 5.9.9-4.3 4.1 1 5.8L12 16.4 6.8 19.1l1-5.8L3.5 9.2l5.9-.9L12 3Z" },
  { key: "v3", color: "var(--duck)", soft: "var(--duck-soft)", icon: "M12 3l7 3v6c0 4.4-3 7.7-7 9-4-1.3-7-4.6-7-9V6l7-3Zm-3 9 2 2 4-4" },
  { key: "v4", color: "var(--accent-alt)", soft: "#fff0e2", icon: "m8 9-4 3 4 3m8-6 4 3-4 3m-2-9-4 12" },
];

export default function Studio() {
  const { t } = useLanguage();

  return (
    <section id="studio" className="relative z-10 pb-28">
      <div className="section-shell">
        <SectionHeading eyebrow={t("studio.eyebrow")} title={t("studio.title")} subtitle={t("studio.body")} />

        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-80px" }}
          variants={{ hidden: {}, visible: { transition: { staggerChildren: 0.08 } } }}
          className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4"
        >
          {VALUES.map((value) => (
            <motion.div
              key={value.key}
              variants={{ hidden: { opacity: 0, y: 16 }, visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: EASE } } }}
              className="aur-card p-7"
            >
              <span className="mb-6 inline-flex h-12 w-12 items-center justify-center rounded-2xl" style={{ background: value.soft, color: value.color }}>
                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <path d={value.icon} />
                </svg>
              </span>
              <h3 className="text-xl font-extrabold tracking-tight mb-2" style={{ color: "var(--text)" }}>
                {t(`studio.${value.key}.title`)}
              </h3>
              <p className="leading-relaxed" style={{ color: "var(--text-dim)" }}>
                {t(`studio.${value.key}.body`)}
              </p>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}
