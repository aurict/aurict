"use client";

import { motion } from "framer-motion";
import { useLanguage } from "@/contexts/LanguageContext";
import AmbientBackground from "@/components/AmbientBackground";
import PageHeader from "@/components/PageHeader";

const ROADMAP_KEYS = ["1", "2", "3", "4", "5"] as const;
const ITEM_KEYS = ["mindgrid", "aurictmobile", "account", "support"] as const;

export default function AboutUsPage() {
  const { t } = useLanguage();

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { staggerChildren: 0.15, delayChildren: 0.1 } },
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
              {t("aboutUs.title")}
            </h1>
            <p className="text-xl md:text-2xl leading-relaxed max-w-2xl mx-auto" style={{ color: "var(--text-dim)" }}>
              {t("aboutUs.intro")}
            </p>
          </motion.div>

          <motion.div variants={itemVariants} className="aur-card p-8 mb-6">
            <h2 className="eyebrow mb-4" style={{ color: "var(--accent)" }}>
              {t("aboutUs.vision")}
            </h2>
            <p className="text-lg leading-relaxed" style={{ color: "var(--text-dim)" }}>
              {t("aboutUs.visionBody")}
            </p>
          </motion.div>

          <motion.div variants={itemVariants} className="aur-card p-8 mb-6">
            <h2 className="eyebrow mb-4" style={{ color: "var(--accent)" }}>
              {t("aboutUs.aligned")}
            </h2>
            <p className="text-lg leading-relaxed" style={{ color: "var(--text-dim)" }}>
              {t("aboutUs.alignedBody")}
            </p>
          </motion.div>

          <motion.div variants={itemVariants} className="aur-card p-8 mb-6">
            <h2 className="eyebrow mb-6" style={{ color: "var(--accent)" }}>
              {t("aboutUs.roadmapTitle")}
            </h2>
            <div className="grid md:grid-cols-2 gap-6">
              {ROADMAP_KEYS.map((key, i) => (
                <div key={key}>
                  <span className="text-xs mb-2 block" style={{ color: "var(--accent)" }}>
                    {String(i + 1).padStart(2, "0")}
                  </span>
                  <h3 className="text-lg font-semibold mb-2" style={{ color: "var(--text)" }}>
                    {t(`aboutUs.roadmap.${key}.title`)}
                  </h3>
                  <p className="text-sm" style={{ color: "var(--text-dim)" }}>
                    {t(`aboutUs.roadmap.${key}.body`)}
                  </p>
                </div>
              ))}
            </div>
          </motion.div>

          <motion.div variants={itemVariants} className="aur-card p-8 mb-6">
            <h2 className="eyebrow mb-6" style={{ color: "var(--accent)" }}>{t("aboutUs.whatWeDo")}</h2>
            <div className="grid md:grid-cols-2 gap-6">
              {ITEM_KEYS.map((key) => (
                <div key={key}>
                  <h3 className="text-lg font-semibold mb-2" style={{ color: "var(--text)" }}>
                    {t(`aboutUs.items.${key}.title`)}
                  </h3>
                  <p className="text-sm" style={{ color: "var(--text-dim)" }}>
                    {t(`aboutUs.items.${key}.desc`)}
                  </p>
                </div>
              ))}
            </div>
          </motion.div>

          <motion.div variants={itemVariants} className="aur-card p-8">
            <h2 className="eyebrow mb-6" style={{ color: "var(--accent)" }}>{t("aboutUs.contactInfo")}</h2>
            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <h3 className="text-xs mb-2 uppercase" style={{ color: "var(--text-muted)" }}>{t("aboutUs.website")}</h3>
                <a href="https://aurict.com" style={{ color: "var(--text)" }}>aurict.com</a>
              </div>
              <div>
                <h3 className="text-xs mb-2 uppercase" style={{ color: "var(--text-muted)" }}>{t("aboutUs.email")}</h3>
                <a href="mailto:contact@aurict.com" style={{ color: "var(--text)" }}>contact@aurict.com</a>
              </div>
            </div>
          </motion.div>
        </div>
      </motion.main>
    </div>
  );
}
