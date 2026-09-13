"use client"

import { useLocale } from "next-intl"
import { CopyCommand } from "@/components/CopyCommand"
import { Link } from "@/i18n/navigation"
import { currentEditionLabel, providerCount } from "@/content/product-facts"
import { localizeLandingUi } from "@/content/landing-ui"
import type { AppLocale } from "@/i18n/config"
import styles from "./LandingHero.module.css"

const providers = ["Anthropic", "OpenAI", "Google", "xAI", "Azure", "AWS Bedrock", "Ollama", "OpenRouter"]

export function LandingHero() {
  const locale = useLocale() as AppLocale
  const t = localizeLandingUi(locale).hero

  return (
    <section className={styles.hero} data-screen-label="Hero">
      <div className={styles.stage}>
        <aside className={styles.rail}>
          <div className={styles.signal}><span />{t.openSource}</div>
          <p>{t.localContext}</p>
          <p>{t.explicitControl}</p>
          <i aria-hidden="true">01—04</i>
        </aside>
        <div className={styles.content}>
          <header className={styles.masthead}>
            <p className={styles.version}>{currentEditionLabel} · AGPLv3</p>
            <p>{t.surfaces}</p>
          </header>
          <h1>{t.title[0]}<br />{t.title[1]}</h1>
          <WorkThread copy={t} />
          <div className={styles.decisionRow}>
            <div>
              <p className={styles.summary}>{t.summary}</p>
              <p className={styles.proof}>{t.proof}</p>
            </div>
          <div className={styles.actions}>
            <Link className={styles.primaryAction} href="/downloads">↓ {t.download}</Link>
            <CopyCommand className={styles.secondaryAction} command="curl -fsSL https://aurict.com/install.sh | bash" copiedLabel={t.copied} label={t.install} />
            <a className={styles.githubAction} href="https://github.com/aurict/aurict" rel="noopener noreferrer" target="_blank">★ GitHub</a>
          </div>
        </div>
        </div>
      </div>

      <div className={styles.providers}>
        <span>{t.worksWith}</span>
        {providers.map((provider) => <b key={provider}>{provider}</b>)}
        <span>{t.moreProviders(providerCount - providers.length)}</span>
      </div>
    </section>
  )
}

function WorkThread({ copy }: { copy: ReturnType<typeof localizeLandingUi>["hero"] }) {
  return (
    <div aria-label={copy.threadAria} className={styles.thread}>
      <div className={styles.threadTopline}>
        <span>{copy.threadLabel}</span>
        <span className={styles.live}><i /> {copy.liveContext}</span>
      </div>
      <div className={styles.threadPrompt}>
        <span>$</span>
        <p>{copy.prompt}</p>
      </div>
      <ol>
        {copy.steps.map(([number, title, detail], index) => (
          <li className={index === 2 ? styles.approval : ""} key={number}>
            <span className={styles.stepNumber}>{number}</span>
            <div><strong>{title}</strong><small>{detail}</small></div>
            <span className={styles.stepState}>{index === 2 ? copy.awaiting : "✓"}</span>
          </li>
        ))}
      </ol>
      <div className={styles.threadFooter}>{copy.threadFooter.map((item) => <span key={item}>{item}</span>)}</div>
    </div>
  )
}
