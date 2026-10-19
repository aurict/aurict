"use client";

import { motion } from "framer-motion";
import { useLanguage } from "@/contexts/LanguageContext";
import AmbientBackground from "@/components/AmbientBackground";
import PageHeader from "@/components/PageHeader";

const SECURITY_KEYS = [
  "accountAuth",
  "tokenStorage",
  "trustedDevice",
  "localKeys",
  "encryptedChannel",
  "onboarding",
] as const;

export default function SecurityPage() {
  const { t } = useLanguage();

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { staggerChildren: 0.12, delayChildren: 0.1 } },
  };
  const itemVariants = {
    hidden: { opacity: 0, y: 16 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: [0.16, 0.8, 0.2, 1] as const } },
  };

  return (
    <div className="min-h-screen overflow-x-hidden" style={{ background: "var(--bg)", color: "var(--text)" }}>
      <AmbientBackground />
      <PageHeader backLabel={t("aboutUs.backButton") || "Back"} />

      <motion.main variants={containerVariants} initial="hidden" animate="visible" className="relative z-10 py-16 px-6">
        <div className="max-w-3xl mx-auto">
          <motion.div variants={itemVariants} className="text-center mb-16">
            <h1 className="text-4xl sm:text-5xl md:text-6xl hyphens-auto font-extrabold tracking-tight mb-4" style={{ color: "var(--text)" }}>
              {t("security.title")}
            </h1>
            <p className="text-xl md:text-2xl leading-relaxed max-w-2xl mx-auto" style={{ color: "var(--text-dim)" }}>
              {t("security.subtitle")}
            </p>
          </motion.div>

          {SECURITY_KEYS.map((key) => (
            <motion.div key={key} variants={itemVariants} className="aur-card p-8 mb-6">
              <h2 className="eyebrow mb-4" style={{ color: "var(--accent)" }}>{t(`security.${key}.title`)}</h2>
              <p className="text-lg leading-relaxed" style={{ color: "var(--text-dim)" }}>{t(`security.${key}.body`)}</p>
            </motion.div>
          ))}

          <motion.p variants={itemVariants} className="text-center mt-10 text-base" style={{ color: "var(--text-muted)" }}>
            {t("security.more")}
            <a className="dim-link" href="/privacy-policy">{t("security.privacyLink")}</a>
            {" · "}
            <a className="dim-link" href="/terms-of-service">{t("security.termsLink")}</a>
          </motion.p>
        </div>
      </motion.main>
    </div>
  );
}
