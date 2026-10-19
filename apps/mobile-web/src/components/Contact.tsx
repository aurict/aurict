"use client";

import { motion } from "framer-motion";
import { useLanguage } from "@/contexts/LanguageContext";
import TightPeriod from "./TightPeriod";

const socialLinks = [
  {
    name: "GitHub",
    url: "https://github.com/aurict/aurict",
    handle: "aurict/aurict",
    icon: (
      <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
        <path d="M12 0C5.37 0 0 5.37 0 12c0 5.3 3.438 9.8 8.205 11.385.6.11.82-.26.82-.577 0-.285-.01-1.04-.015-2.04-3.338.725-4.042-1.61-4.042-1.61-.546-1.387-1.333-1.757-1.333-1.757-1.089-.745.083-.729.083-.729 1.205.085 1.84 1.237 1.84 1.237 1.07 1.834 2.807 1.304 3.492.997.108-.775.42-1.305.763-1.605-2.665-.303-5.467-1.333-5.467-5.93 0-1.31.468-2.38 1.235-3.22-.123-.303-.535-1.523.117-3.176 0 0 1.008-.322 3.3 1.23A11.5 11.5 0 0112 5.803c1.02.005 2.047.138 3.006.404 2.29-1.552 3.297-1.23 3.297-1.23.653 1.653.24 2.873.118 3.176.77.84 1.233 1.91 1.233 3.22 0 4.61-2.807 5.624-5.48 5.92.43.372.823 1.102.823 2.222 0 1.605-.015 2.897-.015 3.29 0 .32.216.694.825.576C20.565 21.795 24 17.297 24 12c0-6.63-5.37-12-12-12z" />
      </svg>
    ),
  },
  {
    name: "Website",
    url: "https://aurict.com",
    handle: "aurict.com",
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9" />
      </svg>
    ),
  },
  {
    name: "X",
    url: "https://x.com/aurictdev",
    handle: "@aurictdev",
    icon: (
      <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
        <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
      </svg>
    ),
  },
];

export default function Contact() {
  const { t } = useLanguage();

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { staggerChildren: 0.1 } },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 16 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: [0.16, 0.8, 0.2, 1] as const } },
  };

  return (
    <section id="contact" className="relative pt-8 pb-16 px-6 overflow-hidden z-10" style={{ scrollMarginTop: 72 }}>
      <div className="relative z-10 max-w-5xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.6, ease: [0.16, 0.8, 0.2, 1] as const }}
          className="text-center mb-14"
        >
          <h2
            className="font-extrabold tracking-tight mb-4"
            style={{ fontSize: "clamp(2.1rem, 4.4vw, 3.4rem)", letterSpacing: "-0.035em", lineHeight: 1.05, color: "var(--text)" }}
          >
            <TightPeriod text={t("contact.title")} />
          </h2>
          <p className="text-xl max-w-2xl mx-auto leading-relaxed" style={{ color: "var(--text-dim)" }}>
            {t("contact.subtitle") || "We're here to help. Reach out to us anytime."}
          </p>
        </motion.div>

        <div className="grid md:grid-cols-2 gap-8 mb-28">
          <motion.div variants={containerVariants} initial="hidden" whileInView="visible" viewport={{ once: true, margin: "-100px" }} className="space-y-3">
            <motion.h3 variants={itemVariants} className="text-xl font-extrabold tracking-tight mb-4" style={{ color: "var(--text)" }}>
              {t("contact.info.title") || "Contact Information"}
            </motion.h3>

            <motion.div variants={itemVariants} className="aur-card p-6">
              <h4 className="eyebrow mb-2">{t("contact.info.email") || "Email"}</h4>
              <a href="mailto:contact@aurict.com" className="text-lg" style={{ color: "var(--text)" }}>
                contact@aurict.com
              </a>
            </motion.div>

            <motion.div variants={itemVariants} className="aur-card p-6">
              <h4 className="eyebrow mb-2">{t("contact.info.responseTime") || "Response Time"}</h4>
              <p className="text-lg" style={{ color: "var(--text)" }}>Within 24 hours</p>
            </motion.div>
          </motion.div>

          <motion.div variants={containerVariants} initial="hidden" whileInView="visible" viewport={{ once: true, margin: "-100px" }} className="space-y-3">
            <motion.h4 variants={itemVariants} className="text-xl font-extrabold tracking-tight mb-4" style={{ color: "var(--text)" }}>
              {t("contact.info.followUs") || "Connect"}
            </motion.h4>

            {socialLinks.map((social) => (
              <motion.a key={social.name} href={social.url} target="_blank" rel="noopener noreferrer" variants={itemVariants} className="aur-card p-5 flex items-center gap-5 group">
                <div className="w-12 h-12 rounded-2xl flex items-center justify-center transition-colors duration-300" style={{ background: "var(--accent-soft)", color: "var(--accent)" }}>
                  {social.icon}
                </div>
                <div>
                  <div className="text-lg font-semibold" style={{ color: "var(--text)" }}>{social.name}</div>
                  <div className="text-xs mt-0.5" style={{ color: "var(--text-muted)" }}>{social.handle}</div>
                </div>
              </motion.a>
            ))}
          </motion.div>
        </div>

        <motion.footer
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
          className="pt-10 text-center"
          style={{ borderTop: "1px solid var(--border)" }}
        >
          <div className="eyebrow mb-4">Aurict Mobile</div>
          <p className="text-sm mb-8" style={{ color: "var(--text-muted)" }}>
            {t("contact.footer.tagline") || "Mobile apps, built and run by Aurict."}
          </p>

          <div className="flex flex-wrap justify-center gap-x-6 gap-y-3 mb-8 text-sm font-semibold">
            <a href="/about-us" style={{ color: "var(--text-dim)" }}>{t("contact.footer.aboutUs") || "About Us"}</a>
            <a href="/privacy-policy" style={{ color: "var(--text-dim)" }}>{t("contact.footer.privacyPolicy") || "Privacy Policy"}</a>
            <a href="/terms-of-service" style={{ color: "var(--text-dim)" }}>{t("contact.footer.termsOfService") || "Terms of Service"}</a>
            <a href="/ccpa-policy" style={{ color: "var(--text-dim)" }}>{t("contact.footer.ccpaPolicy") || "CCPA Policy"}</a>
            <a href="/mindgrid/delete-account" style={{ color: "var(--text-dim)" }}>{t("contact.footer.deleteAccount") || "Delete Account"}</a>
          </div>

          <div className="text-[11px] space-y-2" style={{ color: "var(--text-muted)" }}>
            <div>{t("contact.footer.copyright") || "© 2026 Aurict Mobile. All rights reserved."}</div>
            <div>
              Developed by <a href="https://aurict.com" style={{ color: "var(--text)" }}>Aurict</a>
            </div>
          </div>
        </motion.footer>
      </div>
    </section>
  );
}
