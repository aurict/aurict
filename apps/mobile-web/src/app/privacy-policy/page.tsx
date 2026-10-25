"use client";

import { type ReactNode } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { useLanguage } from "@/contexts/LanguageContext";
import AmbientBackground from "@/components/AmbientBackground";
import PageHeader from "@/components/PageHeader";

const itemVariants = {
  hidden: { opacity: 0, y: 16 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: [0.16, 0.8, 0.2, 1] as const } },
};

function Section({ title, color, children }: { title: string; color: string; children: ReactNode }) {
  return (
    <motion.div variants={itemVariants} className="aur-card p-8">
      <h2 className="eyebrow mb-4" style={{ color }}>{title}</h2>
      {children}
    </motion.div>
  );
}

const COLLECT_KEYS = ["collect1", "collect2", "collect3", "collect4", "collect5", "collect6"] as const;
const USE_KEYS = ["use1", "use2", "use3", "use4", "use5"] as const;
const SERVER_KEYS = ["server1", "server2", "server3", "server4", "server5"] as const;
const RIGHTS_KEYS = ["rights1", "rights2", "rights3", "rights4", "rights5"] as const;

export default function PrivacyPolicyPage() {
  const { t, language } = useLanguage();

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { staggerChildren: 0.1, delayChildren: 0.1 } },
  };

  return (
    <div className="min-h-screen overflow-x-hidden" style={{ background: "var(--bg)", color: "var(--text)" }}>
      <AmbientBackground />
      <PageHeader backLabel={t("privacyPolicy.backButton") || "Back"} />

      <motion.main variants={containerVariants} initial="hidden" animate="visible" className="relative z-10 py-16 px-6">
        <div className="max-w-3xl mx-auto space-y-6">
          <motion.div variants={itemVariants} className="text-center mb-10">
            <h1 className="text-4xl sm:text-5xl md:text-6xl hyphens-auto font-extrabold tracking-tight" style={{ color: "var(--text)" }}>{t("privacyPolicy.title")}</h1>
          </motion.div>

          <Section title={language === "tr" ? "Duckley uygulaması" : "Duckley app"} color="var(--accent)">
            <p className="leading-relaxed text-sm" style={{ color: "var(--text-dim)" }}>
              {language === "tr"
                ? "Google Play'de Aurict geliştirici adıyla yayınlanan Duckley uygulamasının (com.aurict.duckley) gizlilik politikası: "
                : "The privacy policy for the Duckley app (com.aurict.duckley), published on Google Play by developer Aurict, is here: "}
              <Link href="/duckley/privacy-policy" style={{ color: "var(--accent)" }}>
                {language === "tr" ? "Duckley Gizlilik Politikası" : "Duckley Privacy Policy"}
              </Link>
            </p>
          </Section>

          <Section title={language === "tr" ? "Jelly Paradox oyunu" : "Jelly Paradox game"} color="var(--accent)">
            <p className="leading-relaxed text-sm" style={{ color: "var(--text-dim)" }}>
              {language === "tr"
                ? "Aurict tarafından yayınlanan Jelly Paradox oyununun (com.aurict.jelly) gizlilik politikası: "
                : "The privacy policy for the Jelly Paradox game (com.aurict.jelly), published by developer Aurict, is here: "}
              <Link href="/jelly-paradox/privacy-policy" style={{ color: "var(--accent)" }}>
                {language === "tr" ? "Jelly Paradox Gizlilik Politikası" : "Jelly Paradox Privacy Policy"}
              </Link>
            </p>
          </Section>

          <Section title={language === "tr" ? "Dungeon Lord oyunu" : "Dungeon Lord game"} color="var(--accent)">
            <p className="leading-relaxed text-sm" style={{ color: "var(--text-dim)" }}>
              {language === "tr"
                ? "Aurict tarafından yayınlanan Dungeon Lord: Rise of the Boss oyununun (com.aurict.dungeonlord) gizlilik politikası: "
                : "The privacy policy for the Dungeon Lord: Rise of the Boss game (com.aurict.dungeonlord), published by developer Aurict, is here: "}
              <Link href="/dungeon-lord/privacy-policy" style={{ color: "var(--accent)" }}>
                {language === "tr" ? "Dungeon Lord Gizlilik Politikası" : "Dungeon Lord Privacy Policy"}
              </Link>
            </p>
          </Section>

          <Section title={language === "tr" ? "Drift Street oyunu" : "Drift Street game"} color="var(--accent)">
            <p className="leading-relaxed text-sm" style={{ color: "var(--text-dim)" }}>
              {language === "tr"
                ? "Aurict tarafından yayınlanan Drift Street oyununun (com.aurict.driftstreet) gizlilik politikası: "
                : "The privacy policy for the Drift Street game (com.aurict.driftstreet), published by developer Aurict, is here: "}
              <Link href="/drift-street/privacy-policy" style={{ color: "var(--accent)" }}>
                {language === "tr" ? "Drift Street Gizlilik Politikası" : "Drift Street Privacy Policy"}
              </Link>
            </p>
          </Section>

          <Section title={language === "tr" ? "Roomie Puzzle oyunu" : "Roomie Puzzle game"} color="var(--accent)">
            <p className="leading-relaxed text-sm" style={{ color: "var(--text-dim)" }}>
              {language === "tr"
                ? "Aurict tarafından yayınlanan Roomie Puzzle oyununun (com.aurict.roomiepuzzle) gizlilik politikası: "
                : "The privacy policy for the Roomie Puzzle game (com.aurict.roomiepuzzle), published by developer Aurict, is here: "}
              <Link href="/roomie-puzzle/privacy-policy" style={{ color: "var(--accent)" }}>
                {language === "tr" ? "Roomie Puzzle Gizlilik Politikası" : "Roomie Puzzle Privacy Policy"}
              </Link>
            </p>
          </Section>

          <Section title={language === "tr" ? "Jelly Sort oyunu" : "Jelly Sort game"} color="var(--accent)">
            <p className="leading-relaxed text-sm" style={{ color: "var(--text-dim)" }}>
              {language === "tr"
                ? "Aurict tarafından yayınlanan Jelly Sort oyununun (com.aurict.jellysort) gizlilik politikası: "
                : "The privacy policy for the Jelly Sort game (com.aurict.jellysort), published by developer Aurict, is here: "}
              <Link href="/jelly-sort/privacy-policy" style={{ color: "var(--accent)" }}>
                {language === "tr" ? "Jelly Sort Gizlilik Politikası" : "Jelly Sort Privacy Policy"}
              </Link>
            </p>
          </Section>

          <Section title={language === "tr" ? "Drip Jam oyunu" : "Drip Jam game"} color="var(--accent)">
            <p className="leading-relaxed text-sm" style={{ color: "var(--text-dim)" }}>
              {language === "tr"
                ? "Aurict tarafından yayınlanan Drip Jam oyununun (com.aurict.dripjam) gizlilik politikası: "
                : "The privacy policy for the Drip Jam game (com.aurict.dripjam), published by developer Aurict, is here: "}
              <Link href="/drip-jam/privacy-policy" style={{ color: "var(--accent)" }}>
                {language === "tr" ? "Drip Jam Gizlilik Politikası" : "Drip Jam Privacy Policy"}
              </Link>
            </p>
          </Section>

          <Section title={t("privacyPolicy.infoWeCollect")} color="var(--accent)">
            <p className="leading-relaxed mb-4" style={{ color: "var(--text-dim)" }}>
              {t("privacyPolicy.intro")}
            </p>
            <ul className="space-y-2 ml-5 mb-4 text-sm" style={{ color: "var(--text-dim)" }}>
              {COLLECT_KEYS.map((k) => (
                <li key={k}>• {t(`privacyPolicy.${k}`)}</li>
              ))}
            </ul>
            <p className="leading-relaxed text-sm" style={{ color: "var(--text-dim)" }}>
              {t("privacyPolicy.important")}
            </p>
          </Section>

          <Section title={t("privacyPolicy.howWeUse")} color="var(--accent-alt)">
            <p className="leading-relaxed mb-4" style={{ color: "var(--text-dim)" }}>{t("privacyPolicy.howWeUseIntro")}</p>
            <ul className="space-y-2 ml-5 text-sm" style={{ color: "var(--text-dim)" }}>
              {USE_KEYS.map((k) => (
                <li key={k}>• {t(`privacyPolicy.${k}`)}</li>
              ))}
            </ul>
          </Section>

          <Section title={t("privacyPolicy.infoSharing")} color="var(--accent)">
            <p className="leading-relaxed text-sm" style={{ color: "var(--text-dim)" }}>
              {t("privacyPolicy.sharing")}
            </p>
          </Section>

          <Section title={t("privacyPolicy.serverTitle")} color="var(--accent)">
            <p className="leading-relaxed mb-4 text-sm" style={{ color: "var(--text-dim)" }}>
              {t("privacyPolicy.serverIntro")}
            </p>
            <ul className="space-y-2 ml-5 mb-4 text-sm" style={{ color: "var(--text-dim)" }}>
              {SERVER_KEYS.map((k) => (
                <li key={k}>• {t(`privacyPolicy.${k}`)}</li>
              ))}
            </ul>
            <p className="leading-relaxed text-sm" style={{ color: "var(--text-dim)" }}>
              {t("privacyPolicy.serverNote")}
            </p>
          </Section>

          <Section title={t("privacyPolicy.dataSecurity")} color="var(--accent-alt)">
            <p className="leading-relaxed text-sm" style={{ color: "var(--text-dim)" }}>
              {t("privacyPolicy.dataSecurityBody")}
            </p>
          </Section>

          <Section title={t("privacyPolicy.yourRights")} color="var(--accent)">
            <p className="leading-relaxed mb-4 text-sm" style={{ color: "var(--text-dim)" }}>{t("privacyPolicy.rightsIntro")}</p>
            <ul className="space-y-2 ml-5 text-sm" style={{ color: "var(--text-dim)" }}>
              {RIGHTS_KEYS.map((k) => (
                <li key={k}>• {t(`privacyPolicy.${k}`)}</li>
              ))}
            </ul>
          </Section>

          <Section title={t("privacyPolicy.contactUs")} color="var(--accent-alt)">
            <p className="leading-relaxed text-sm mb-4" style={{ color: "var(--text-dim)" }}>
              {t("privacyPolicy.contactIntro")}
            </p>
            <div className="space-y-2 text-sm">
              <p style={{ color: "var(--text-dim)" }}>{t("privacyPolicy.privacyLabel")} <a href="mailto:contact@aurict.com" style={{ color: "var(--accent)" }}>contact@aurict.com</a></p>
              <p style={{ color: "var(--text-dim)" }}>{t("privacyPolicy.supportLabel")} <a href="mailto:contact@aurict.com" style={{ color: "var(--accent)" }}>contact@aurict.com</a></p>
            </div>
          </Section>

          <motion.div variants={itemVariants} className="text-center">
            <p className="text-xs" style={{ color: "var(--text-muted)" }}>{t("privacyPolicy.lastUpdated")}: {t("privacyPolicy.lastUpdatedDate")}</p>
          </motion.div>
        </div>
      </motion.main>
    </div>
  );
}
