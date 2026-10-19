"use client"

import { useLocale } from "next-intl"
import { TightPeriods } from "@/components/ui/TightPeriods"
import type { CSSProperties } from "react"
import { CopyCommand } from "@/components/CopyCommand"
import { TerminalWindow } from "@/components/terminal/TerminalWindow"
import {
  localizeCapabilityItems,
  localizeInstallSteps,
  localizeSecurityProfiles,
  localizeWhyItems,
} from "@/content/landing-translations"
import { Link } from "@/i18n/navigation"
import { localizeLandingUi } from "@/content/landing-ui"
import type { AppLocale } from "@/i18n/config"
import styles from "./LandingSections.module.css"

const integrations = ["GitHub", "PostgreSQL", "Docker", "Slack", "Jira", "Linear", "Figma", "Sentry", "Vercel", "AWS", "Notion", "Browser"]

export function LandingSections() {
  const locale = useLocale() as AppLocale
  const copy = localizeLandingUi(locale)
  const t = copy.sections

  return (
    <>
      <section className={styles.section} id="why" data-screen-label="WhyAurict">
        <div className={styles.shell}>
          <SectionIntro eyebrow={t.why[0]} title={t.why[1]} body={t.why[2]} />
          <div className={styles.whyGrid}>
            {localizeWhyItems(locale).map(([number, title, body]) => (
              <article className={styles.card} key={number}>
                <span className={styles.number}>{number}</span>
                <h3>{title}</h3>
                <p>{body}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className={`${styles.section} ${styles.tinted}`} id="capabilities" data-screen-label="Capabilities">
        <div className={styles.shell}>
          <SectionIntro eyebrow={t.capabilities[0]} title={t.capabilities[1]} body={t.capabilities[2]} />
          <div className={styles.capabilityLayout}>
            <div className={styles.capabilityGrid}>
              {localizeCapabilityItems(locale).map(([title, body, color]) => (
                <article key={title} style={{ "--dot": color } as CSSProperties}>
                  <h3>{title}</h3>
                  <p>{body}</p>
                </article>
              ))}
            </div>
            <div className={styles.runtimeDemo} aria-label={t.terminalAria}>
              <TerminalWindow />
            </div>
          </div>
        </div>
      </section>

      <section className={styles.section} id="security" data-screen-label="Security">
        <div className={styles.shell}>
          <SectionIntro eyebrow={t.security[0]} title={t.security[1]} body={t.security[2]} />
          <div className={styles.securityGrid}>
            {localizeSecurityProfiles(locale).map(([tag, title, body, color]) => (
              <article className={styles.card} key={title} style={{ "--tag": color } as CSSProperties}>
                <span className={styles.tag}>{tag}</span>
                <h3>{title}</h3>
                <p>{body}</p>
              </article>
            ))}
          </div>
          <p className={`${styles.securityCommand} mono surface-dark`}>{t.securityCommand}</p>
        </div>
      </section>

      <section className={`${styles.section} ${styles.tinted}`} id="install" data-screen-label="Install">
        <div className={styles.shell}>
          <SectionIntro eyebrow={t.install[0]} title={t.install[1]} />
          <div className={styles.installGrid}>
            {localizeInstallSteps(locale).map(([title, code, note]) => (
              <article className={styles.card} key={title}>
                <span className={styles.number}>{title}</span>
                {code.startsWith("#") ? <code className={`${styles.code} mono surface-dark`}>{code}</code> : <CopyCommand command={code} />}
                <p>{note}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className={styles.section} data-screen-label="Integrations">
        <div className={styles.shell}>
          <SectionIntro eyebrow={t.integrations[0]} title={t.integrations[1]} body={t.integrations[2]} />
          <div className={styles.integrationList}>{integrations.map((item) => <span key={item}>{item}</span>)}</div>
        </div>
      </section>

      <section className={styles.finalCta} data-screen-label="FinalCTA">
        <div className={styles.finalInner}>
          <div>
            <p>{t.final[0]}</p>
            <h2><TightPeriods text={t.final[1]} /></h2>
          </div>
          <div className={styles.finalActions}>
            <CopyCommand className={`mono copy-command ${styles.finalCommand}`} command="npm install -g aurict" copiedLabel={copy.hero.copied} />
            <Link className={styles.finalButton} href="/terminal-agent">{copy.hub.getStarted} →</Link>
            <Link className={styles.finalGhost} href="/downloads">{copy.hub.hoprelLink}</Link>
          </div>
        </div>
      </section>
    </>
  )
}

function SectionIntro({ body, eyebrow, title }: { body?: string; eyebrow: string; title: string }) {
  return (
    <div className={styles.intro}>
      <p className={styles.eyebrow}>{eyebrow}</p>
      <h2><TightPeriods text={title} /></h2>
      {body && <p className={styles.introBody}>{body}</p>}
    </div>
  )
}
