"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { useLanguage } from "@/contexts/LanguageContext";
import AmbientBackground from "@/components/AmbientBackground";
import PageHeader from "@/components/PageHeader";

type SectionDef = {
  title: string;
  body: string[];
  list?: string[];
  email?: boolean;
};

const SECTIONS: SectionDef[] = [
  { title: "tos.sec1Title", body: ["tos.sec1Body1", "tos.sec1Body2"] },
  { title: "tos.sec2Title", body: ["tos.sec2Body1"] },
  { title: "tos.sec3Title", body: ["tos.sec3Body1"], list: ["tos.sec3List1", "tos.sec3List2", "tos.sec3List3", "tos.sec3List4", "tos.sec3List5", "tos.sec3List6", "tos.sec3List7"] },
  { title: "tos.sec4Title", body: ["tos.sec4Body1", "tos.sec4Body2"], list: ["tos.sec4List1", "tos.sec4List2", "tos.sec4List3", "tos.sec4List4"] },
  { title: "tos.sec5Title", body: ["tos.sec5Body1", "tos.sec5Body2"] },
  { title: "tos.sec6Title", body: ["tos.sec6Body1", "tos.sec6Body2"] },
  { title: "tos.sec7Title", body: ["tos.sec7Body1"] },
  { title: "tos.sec8Title", body: ["tos.sec8Body1"] },
  { title: "tos.sec9Title", body: ["tos.sec9Body1"], email: true },
];

export default function TermsOfServicePage() {
  const { t } = useLanguage();

  return (
    <div className="min-h-screen overflow-x-hidden" style={{ background: "var(--bg)", color: "var(--text)" }}>
      <AmbientBackground />
      <PageHeader backLabel={t("aboutUs.backButton") || "Back"} />

      <motion.main
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: [0.16, 0.8, 0.2, 1] as const }}
        className="relative z-10 py-16 px-6"
      >
        <div className="max-w-3xl mx-auto">
          <h1 className="text-4xl sm:text-5xl md:text-6xl hyphens-auto font-extrabold tracking-tight mb-4" style={{ color: "var(--text)" }}>{t("tos.title")}</h1>
          <p className="text-xs mb-12 pb-8" style={{ color: "var(--text-muted)", borderBottom: "1px solid var(--border)" }}>
            {t("tos.lastUpdated")}
          </p>

          <div className="space-y-6">
            {SECTIONS.map((section) => (
              <div key={section.title} className="aur-card p-8">
                <h2 className="text-xl font-semibold mb-4" style={{ color: "var(--text)" }}>{t(section.title)}</h2>
                {section.body.map((key) => (
                  <p key={key} className="leading-relaxed mb-4 text-sm" style={{ color: "var(--text-dim)" }}>{t(key)}</p>
                ))}
                {section.list && (
                  <ul className="list-disc pl-5 space-y-2 text-sm" style={{ color: "var(--text-dim)" }}>
                    {section.list.map((key) => <li key={key}>{t(key)}</li>)}
                  </ul>
                )}
                {section.email && <p className="text-sm" style={{ color: "var(--accent)" }}>{t("tos.sec9Email")}</p>}
              </div>
            ))}
          </div>

          <div className="mt-14 pt-8 text-center" style={{ borderTop: "1px solid var(--border)" }}>
            <Link href="/" className="inline-flex items-center text-xs" style={{ color: "var(--accent)" }}>
              <svg className="w-4 h-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
              {t("tos.returnHome")}
            </Link>
          </div>
        </div>
      </motion.main>
    </div>
  );
}
