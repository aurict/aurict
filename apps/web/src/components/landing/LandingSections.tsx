"use client"

import Image from "next/image"
import { useLocale } from "next-intl"
import type { CSSProperties } from "react"
import { CopyCommand } from "@/components/CopyCommand"
import { TerminalWindow } from "@/components/terminal/TerminalWindow"
import {
  localizeCapabilityItems,
  localizeInstallSteps,
  localizeMobileAssistantItems,
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
      <section className={`${styles.band} ${styles.surfaces}`} id="surfaces" data-screen-label="Surfaces">
        <div className={styles.shell}>
          <SectionIntro eyebrow={t.ecosystem[0]} title={t.ecosystem[1]} body={t.ecosystem[2]} />
          <div className={styles.surfaceGrid}>
            <article className={`${styles.surfaceCard} ${styles.hoprel}`}>
              <div className={styles.surfaceHead}><Image alt="" height={44} src="/hoprel-icon.svg" width={44} /><div><span>{t.desktopWorkspace}</span><h3>Hoprel <em>{t.byAurict}</em></h3></div></div>
              <p>{t.hoprelBody}</p>
              <Link href="/downloads">{t.downloadHoprel} <span>→</span></Link>
            </article>
            <SurfaceCard eyebrow={t.nativeRuntime} title="Aurict Terminal" body={t.terminalBody} href="/terminal-agent" link={t.installShell} />
            <SurfaceCard eyebrow={t.companion} title="Aurict Mobile" body={t.mobileCardBody} href="https://mobile.aurict.com" link={t.visitMobile} external />
            <SurfaceCard className={styles.bondley} eyebrow={t.subProduct} title="Bondley.one" body={t.bondleyBody} href="https://bondley.one" link={t.exploreBondley} external />
          </div>
        </div>
      </section>

      <section className={styles.principles} id="why" data-screen-label="WhyAurict">
        <div className={styles.shell}>
          <SectionIntro eyebrow={t.why[0]} title={t.why[1]} body={t.why[2]} />
          <div className={styles.principleList}>
            {localizeWhyItems(locale).map(([number, title, body]) => <article key={number}><span>{number}</span><div><h3>{title}</h3><p>{body}</p></div></article>)}
          </div>
        </div>
      </section>

      <section className={`${styles.band} ${styles.capabilities}`} id="capabilities" data-screen-label="Capabilities">
        <div className={styles.shell}>
          <SectionIntro eyebrow={t.capabilities[0]} title={t.capabilities[1]} body={t.capabilities[2]} />
          <div className={styles.capabilityGrid}>
            {localizeCapabilityItems(locale).map(([title, body, color], index) => <article key={title} style={{ "--capability-color": color } as CSSProperties}><span>{String(index + 1).padStart(2, "0")}</span><h3>{title}</h3><p>{body}</p></article>)}
          </div>
          <div className={styles.runtimeDemo} aria-label={t.terminalAria}>
            <TerminalWindow />
          </div>
        </div>
      </section>

      <section className={styles.security} id="security" data-screen-label="Security">
        <div className={styles.shell}>
          <SectionIntro eyebrow={t.security[0]} title={t.security[1]} body={t.security[2]} />
          <div className={styles.securityGrid}>
            {localizeSecurityProfiles(locale).map(([tag, title, body, color]) => <article key={title} style={{ "--profile-color": color } as CSSProperties}><span>{tag}</span><h3>{title}</h3><p>{body}</p></article>)}
          </div>
          <p className={styles.securityCommand}>{t.securityCommand}</p>
        </div>
      </section>

      <section className={`${styles.band} ${styles.mobile}`} id="mobile" data-screen-label="Mobile">
        <div className={`${styles.shell} ${styles.mobileLayout}`}>
          <div aria-hidden="true" className={styles.mobileRail}><span>mobile</span><span>01—04</span></div>
          <div>
            <SectionIntro eyebrow={t.mobile[0]} title={t.mobile[1]} body={t.mobile[2]} />
            <div className={styles.mobileFeatures}>{localizeMobileAssistantItems(locale).map(([title, body], index) => <article key={title}><span>{String(index + 1).padStart(2, "0")}</span><div><h3>{title}</h3><p>{body}</p></div></article>)}</div>
          </div>
          <MobileFrame copy={copy.phone} />
        </div>
      </section>

      <section className={styles.install} id="install" data-screen-label="Install">
        <div className={styles.shell}>
          <SectionIntro eyebrow={t.install[0]} title={t.install[1]} />
          <div className={styles.installGrid}>{localizeInstallSteps(locale).map(([title, code, note, color]) => <article key={title} style={{ "--install-color": color } as CSSProperties}><span>{title}</span>{code.startsWith("#") ? <code>{code}</code> : <CopyCommand command={code} />}<p>{note}</p></article>)}</div>
        </div>
      </section>

      <section className={`${styles.band} ${styles.ecosystem}`} data-screen-label="Integrations">
        <div className={styles.shell}>
          <SectionIntro eyebrow={t.integrations[0]} title={t.integrations[1]} body={t.integrations[2]} />
          <div className={styles.integrationList}>{integrations.map((item, index) => <span key={item}><i>{String(index + 1).padStart(2, "0")}</i>{item}</span>)}</div>
        </div>
      </section>

      <section className={styles.finalCta} data-screen-label="FinalCTA">
        <p>{t.final[0]}</p>
        <h2>{t.final[1]}</h2>
        <div><Link href="/downloads">↓ {t.downloadHoprel}</Link><a href="#install">{t.quickInstall}</a></div>
      </section>
    </>
  )
}

function SectionIntro({ body, eyebrow, title }: { body?: string; eyebrow: string; title: string }) {
  return <div className={styles.intro}><div className={styles.eyebrow}>{eyebrow}</div><div><h2>{title}</h2>{body && <p>{body}</p>}</div></div>
}

function SurfaceCard({ body, className, eyebrow, external = false, href, link, title }: { body: string; className?: string; eyebrow: string; external?: boolean; href: string; link: string; title: string }) {
  return <article className={`${styles.surfaceCard} ${className ?? ""}`}><div className={styles.surfaceHead}><div><span>{eyebrow}</span><h3>{title}</h3></div></div><p>{body}</p>{external ? <a href={href} rel="noopener noreferrer" target="_blank">{link} <span>↗</span></a> : <Link href={href}>{link} <span>→</span></Link>}</article>
}

function MobileFrame({ copy }: { copy: ReturnType<typeof localizeLandingUi>["phone"] }) {
  return <div className={styles.phone}><div className={styles.phoneNotch} /><div className={styles.phoneScreen}><header><span>aurict mobile</span><b><i />BYOK</b></header><div className={styles.bubble}>{copy.request}</div><div className={`${styles.bubble} ${styles.assistant}`}>{copy.answer}</div><article><span>{copy.scan}<b>{copy.running}</b></span><small>{copy.sourcesSummary}</small></article><article><span>{copy.cliSession}<b>{copy.approval}</b></span><small>{copy.approvalBody}</small><div className={styles.phoneActions}><span>{copy.approve}</span><span>{copy.deny}</span></div></article></div></div>
}
