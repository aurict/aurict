"use client"

import { useLocale, useTranslations } from "next-intl"
import { Link } from "@/i18n/navigation"
import type { AppLocale } from "@/i18n/config"
import styles from "./Footer.module.css"

export function Footer() {
  const t = useTranslations("Footer")
  const locale = useLocale() as AppLocale
  const license = { en: "License", tr: "Lisans", de: "Lizenz", fr: "Licence", es: "Licencia" }[locale]

  return (
    <footer className={styles.footer}>
      <div className={styles.frame}>
        <div className={styles.identity}>
          <span>aurict<span>▊</span></span>
          <p>AGPLv3 {license} · © 2026 aurict</p>
        </div>
        <div className={styles.columns}>
          <FooterColumn title={t("product")} links={[[t("aiCodingAgent"), "/ai-coding-agent"], [t("terminalAgent"), "/terminal-agent"], [t("capabilities"), "/#capabilities"], ["Bondley.one", "https://bondley.one"], [t("roadmap"), "/roadmap"], [t("compare"), "/compare"], [t("docs"), "/docs"], [t("changelog"), "/changelog"]]} />
          <FooterColumn title={t("company")} links={[[t("about"), "/about"], [t("blog"), "/blog"], [t("useCases"), "/use-cases"]]} />
          <FooterColumn title={t("legal")} links={[[t("privacy"), "/privacy"], [t("terms"), "/terms"]]} />
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
        : <Link href={href} key={label}>{label}</Link>)}
    </div>
  )
}
