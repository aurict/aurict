"use client";

import { type ReactNode } from "react";
import { motion } from "framer-motion";
import { useLanguage } from "@/contexts/LanguageContext";
import AmbientBackground from "@/components/AmbientBackground";
import PageHeader from "@/components/PageHeader";

const itemVariants = {
  hidden: { opacity: 0, y: 14 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: [0.16, 0.8, 0.2, 1] as const } },
};

function Section({ title, color = "var(--accent)", children }: { title: string; color?: string; children: ReactNode }) {
  return (
    <motion.div variants={itemVariants} className="aur-card p-8 mb-6">
      <h2 className="text-2xl font-semibold mb-4" style={{ color }}>{title}</h2>
      {children}
    </motion.div>
  );
}

const COLLECT_KEYS = ["a", "b", "c", "d", "e", "f"] as const;
const USE_KEYS = ["a", "b", "c", "d", "e"] as const;
const SHARE_KEYS = ["a", "b", "c"] as const;
const RIGHTS_KEYS = ["a", "b", "c", "d"] as const;
const SECURITY_KEYS = ["a", "b", "c"] as const;

export default function CCPAPolicyPage() {
  const { t } = useLanguage();

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { staggerChildren: 0.08, delayChildren: 0.1 } },
  };

  return (
    <div className="min-h-screen overflow-x-hidden" style={{ background: "var(--bg)", color: "var(--text)" }}>
      <AmbientBackground />
      <PageHeader backLabel={t("ccpa.backButton") || "Back"} />

      <motion.main variants={containerVariants} initial="hidden" animate="visible" className="relative z-10 py-16 px-6">
        <div className="max-w-4xl mx-auto">
          <motion.div variants={itemVariants} className="text-center mb-16">
            <h1 className="text-4xl sm:text-5xl md:text-6xl hyphens-auto font-extrabold tracking-tight mb-4" style={{ color: "var(--text)" }}>
              {t("ccpa.title")}
            </h1>
            <p className="text-lg mb-2" style={{ color: "var(--text-dim)" }}>{t("ccpa.subtitle")}</p>
            <p className="text-xs mt-2" style={{ color: "var(--text-muted)" }}>{t("ccpa.lastUpdated")}</p>
          </motion.div>

          <Section title={t("ccpa.sec1Title")}>
            <p className="leading-relaxed mb-4 text-sm" style={{ color: "var(--text-dim)" }}>
              {t("ccpa.sec1Body1")}
            </p>
            <p className="leading-relaxed text-sm" style={{ color: "var(--text-dim)" }}>
              {t("ccpa.sec1Body2")}
            </p>
          </Section>

          <Section title={t("ccpa.sec2Title")} color="var(--accent-alt)">
            <h3 className="text-lg font-semibold mb-2" style={{ color: "var(--text)" }}>{t("ccpa.sec2PiTitle")}</h3>
            <ul className="space-y-2 ml-5 text-sm mb-4" style={{ color: "var(--text-dim)" }}>
              {COLLECT_KEYS.map((k) => (
                <li key={k}>• {t(`ccpa.sec2Pi${k.toUpperCase()}`)}</li>
              ))}
            </ul>
            <h3 className="text-lg font-semibold mb-2" style={{ color: "var(--text)" }}>{t("ccpa.sec2SaleTitle")}</h3>
            <p className="leading-relaxed text-sm" style={{ color: "var(--text-dim)" }}>
              {t("ccpa.sec2SaleBody")}
            </p>
          </Section>

          <Section title={t("ccpa.sec3Title")} color="var(--error)">
            <p className="leading-relaxed text-sm mb-4" style={{ color: "var(--text-dim)" }}>
              {t("ccpa.sec3Body")}
            </p>
            <div className="space-y-4">
              {COLLECT_KEYS.map((k) => (
                <div key={k} className="pl-4" style={{ borderLeft: "2px solid var(--accent)" }}>
                  <h3 className="text-base font-semibold mb-1" style={{ color: "var(--text)" }}>{t(`ccpa.sec3${k.toUpperCase()}Label`)}</h3>
                  <p className="text-sm" style={{ color: "var(--text-dim)" }}>{t(`ccpa.sec3${k.toUpperCase()}Desc`)}</p>
                </div>
              ))}
            </div>
          </Section>

          <Section title={t("ccpa.sec4Title")}>
            <ul className="space-y-3 ml-5 text-sm" style={{ color: "var(--text-dim)" }}>
              {USE_KEYS.map((k) => (
                <li key={k}>• <strong style={{ color: "var(--text)" }}>{t(`ccpa.sec4${k.toUpperCase()}Label`)}</strong> {t(`ccpa.sec4${k.toUpperCase()}Desc`)}</li>
              ))}
            </ul>
          </Section>

          <Section title={t("ccpa.sec5Title")} color="var(--accent-alt)">
            <div className="space-y-4 mb-6">
              {SHARE_KEYS.map((k) => (
                <div key={k} className="pl-4" style={{ borderLeft: "2px solid var(--error)" }}>
                  <h3 className="text-base font-semibold mb-1" style={{ color: "var(--text)" }}>{t(`ccpa.sec5${k.toUpperCase()}Label`)}</h3>
                  <p className="text-sm" style={{ color: "var(--text-dim)" }}>{t(`ccpa.sec5${k.toUpperCase()}Desc`)}</p>
                </div>
              ))}
            </div>
            <div className="p-4" style={{ border: "1px solid var(--warning)", background: "color-mix(in oklch, var(--warning) 10%, transparent)" }}>
              <p className="font-semibold mb-2 text-sm" style={{ color: "var(--warning)" }}>{t("ccpa.sec5ImportantTitle")}</p>
              <p className="leading-relaxed text-sm" style={{ color: "var(--text-dim)" }}>
                {t("ccpa.sec5ImportantBody")}
              </p>
            </div>
          </Section>

          <Section title={t("ccpa.sec6Title")}>
            <div className="space-y-4">
              {RIGHTS_KEYS.map((k) => (
                <div key={k} className="pl-4" style={{ borderLeft: "2px solid var(--accent)" }}>
                  <h3 className="text-base font-semibold mb-1" style={{ color: "var(--text)" }}>{t(`ccpa.sec6${k.toUpperCase()}Label`)}</h3>
                  <p className="text-sm" style={{ color: "var(--text-dim)" }}>{t(`ccpa.sec6${k.toUpperCase()}Desc`)}</p>
                </div>
              ))}
            </div>
          </Section>

          <Section title={t("ccpa.sec7Title")} color="var(--accent-alt)">
            <p className="text-sm mb-2" style={{ color: "var(--text-dim)" }}>{t("ccpa.sec7Body1")}</p>
            <p className="text-sm"><a href="mailto:contact@aurict.com" style={{ color: "var(--accent)" }}>contact@aurict.com</a></p>
            <p className="text-sm mt-4" style={{ color: "var(--text-dim)" }}>
              {t("ccpa.sec7Body2")}
            </p>
          </Section>

          <Section title={t("ccpa.sec8Title")}>
            <p className="leading-relaxed text-sm" style={{ color: "var(--text-dim)" }}>
              {t("ccpa.sec8Body")}
            </p>
          </Section>

          <Section title={t("ccpa.sec9Title")} color="var(--accent)">
            <ul className="space-y-2 ml-5 text-sm" style={{ color: "var(--text-dim)" }}>
              {SECURITY_KEYS.map((k) => (
                <li key={k}>• {t(`ccpa.sec9${k.toUpperCase()}`)}</li>
              ))}
            </ul>
          </Section>

          <Section title={t("ccpa.sec10Title")} color="var(--accent-alt)">
            <div className="space-y-2 text-sm">
              <p style={{ color: "var(--text-dim)" }}>{t("ccpa.sec10Label")} <a href="mailto:contact@aurict.com" style={{ color: "var(--accent)" }}>contact@aurict.com</a></p>
            </div>
          </Section>

          <motion.div variants={itemVariants} className="aur-card p-6 text-center">
            <p className="text-xs" style={{ color: "var(--text-muted)" }}>
              {t("ccpa.effective")}
            </p>
          </motion.div>
        </div>
      </motion.main>
    </div>
  );
}
