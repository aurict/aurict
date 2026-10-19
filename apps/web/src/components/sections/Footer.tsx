"use client"

import { useTranslations } from "next-intl"
import { BrandMark } from "@/components/BrandMark"
import { Link } from "@/i18n/navigation"
import styles from "./Footer.module.css"

export function Footer() {
  const t = useTranslations("Footer")

  return (
    <footer className={`${styles.footer} surface-dark`}>
      <div className={styles.frame}>
        <div className={styles.identity}>
          <BrandMark />
          <p className={styles.tagline}>{t("tagline")}</p>
          <p className={styles.legalLine}>AGPLv3 · © 2026 Aurict</p>
        </div>
        <div className={styles.columns}>
          <FooterColumn title={t("product")} links={[["Aurict CLI", "/terminal-agent"], ["Hoprel", "/downloads"], ["Aurict Mobile", "https://mobile.aurict.com"], ["Aurict Decision", "https://decision.aurict.com"]]} />
          <FooterColumn title={t("resources")} links={[[t("docs"), "/docs"], [t("blog"), "/blog"], [t("changelog"), "/changelog"], [t("roadmap"), "/roadmap"], [t("compare"), "/compare"], [t("useCases"), "/use-cases"], [t("aiCodingAgent"), "/ai-coding-agent"]]} />
          <FooterColumn title={t("company")} links={[[t("about"), "/about"], [t("privacy"), "/privacy"], [t("terms"), "/terms"]]} />
          <FooterColumn title={t("openSource")} links={[["GitHub", "https://github.com/aurict/aurict"], ["npm", "https://www.npmjs.com/package/aurict"]]} />
        </div>
      </div>
    </footer>
  )
}

function FooterColumn({ title, links }: { title: string; links: Array<[string, string]> }) {
  return (
    <div className={styles.column}>
      <h2>{title}</h2>
      {links.map(([label, href]) => href.startsWith("http")
        ? <a href={href} key={label} rel="noopener noreferrer" target="_blank">{label}</a>
        : <Link data-label="" href={href} key={label}>{label}</Link>)}
    </div>
  )
}
