"use client"

import Image from "next/image"
import { useLocale } from "next-intl"
import { ArrowUpRight, Check, Loader } from "lucide-react"
import type { CSSProperties, ReactNode } from "react"
import { CopyCommand } from "@/components/CopyCommand"
import { Link } from "@/i18n/navigation"
import { localizeLandingUi } from "@/content/landing-ui"
import { providerCount } from "@/content/product-facts"
import type { AppLocale } from "@/i18n/config"
import styles from "./HubHero.module.css"

const providers = ["Anthropic", "OpenAI", "Google", "xAI", "Azure", "AWS Bedrock", "Ollama", "OpenRouter"]

export function HubHero() {
  const locale = useLocale() as AppLocale
  const { hero, hub } = localizeLandingUi(locale)

  return (
    <section className={styles.hero} data-screen-label="Hub">
      <header className={styles.heading}>
        <p className={styles.eyebrow}>{hub.eyebrow}</p>
        <h1>{hub.title}</h1>
        <p className={styles.subtitle}>{hub.subtitle}</p>
      </header>

      <div className={styles.hub}>
        <svg aria-hidden="true" className={styles.wires} preserveAspectRatio="none" viewBox="0 0 1000 600">
          <path d="M500 230 C 470 150, 420 120, 360 110" />
          <path d="M500 230 C 530 150, 580 120, 640 110" />
          <path d="M470 330 C 440 420, 410 450, 360 470" />
          <path d="M530 330 C 560 420, 590 450, 640 470" />
          <circle cx="360" cy="110" r="7" />
          <circle cx="640" cy="110" r="7" />
          <circle cx="360" cy="470" r="7" />
          <circle cx="640" cy="470" r="7" style={{ fill: "var(--decision)" }} />
        </svg>

        <ProductCard area="cli" art="/ecosystem/cli.webp" color="var(--cli)" href="/terminal-agent" link={hub.cliLink} soft="var(--cli-soft)" title="Aurict CLI">
          <p>{hub.cliBody}</p>
          <div className={`${styles.terminal} surface-dark`}>
            <span className={styles.dots} aria-hidden="true"><i /><i /><i /></span>
            <CopyCommand className={`mono ${styles.command}`} command="npm install -g aurict" copiedLabel={hero.copied} />
          </div>
        </ProductCard>

        <div className={styles.core}>
          <Image alt="" className={styles.coreArt} height={520} priority src="/ecosystem/core.webp" width={520} />
          <p>{hub.core}</p>
        </div>

        <ProductCard area="hoprel" art="/ecosystem/hoprel.webp" color="var(--hoprel)" href="/downloads" link={hub.hoprelLink} soft="var(--hoprel-soft)" title="Hoprel">
          <p>{hub.hoprelBody}</p>
          <ol className={styles.tasks}>
            <li><Check aria-hidden="true" className={styles.done} size={16} strokeWidth={3} />{hub.hoprelTasks[0]}</li>
            <li><Loader aria-hidden="true" className={styles.working} size={16} strokeWidth={2.6} />{hub.hoprelTasks[1]}</li>
            <li><span aria-hidden="true" className={styles.waiting} />{hub.hoprelTasks[2]}<b>{hub.approve}</b></li>
          </ol>
        </ProductCard>

        <ProductCard area="mobile" art="/ecosystem/mobile.webp" color="var(--mobile)" external href="https://mobile.aurict.com" link={hub.mobileLink} soft="var(--mobile-soft)" title="Aurict Mobile">
          <p>{hub.mobileBody}</p>
          <p className={styles.apps}>Jelly Paradox · Duckley · Mind Grid</p>
        </ProductCard>

        <ProductCard area="decision" art="/ecosystem/decision.webp" color="var(--decision)" external href="https://decision.aurict.com" link={hub.decisionLink} soft="var(--decision-soft)" title="Aurict Decision">
          <p>{hub.decisionBody}</p>
          <p className={styles.apps}>{hub.decisionSub}</p>
        </ProductCard>
      </div>

      <div className={styles.providers}>
        <span>{hero.worksWith}</span>
        {providers.map((provider) => <b key={provider}>{provider}</b>)}
        <span>{hero.moreProviders(providerCount - providers.length)}</span>
      </div>
    </section>
  )
}

function ProductCard({ area, art, children, color, external = false, href, link, soft, title }: {
  area: "cli" | "hoprel" | "mobile" | "decision"
  art: string
  children: ReactNode
  color: string
  external?: boolean
  href: string
  link: string
  soft: string
  title: string
}) {
  const linkContent = <>{link}<ArrowUpRight aria-hidden="true" size={18} strokeWidth={2.4} /></>

  return (
    <article className={`${styles.card} ${styles[area]}`} style={{ "--product": color, "--product-soft": soft } as CSSProperties}>
      <div className={styles.cardBody}>
        <h2>{title}</h2>
        {children}
        {external
          ? <a className={styles.cardLink} href={href} rel="noopener noreferrer" target="_blank">{linkContent}</a>
          : <Link className={styles.cardLink} href={href}>{linkContent}</Link>}
      </div>
      <Image alt="" aria-hidden="true" className={styles.cardArt} height={360} src={art} width={360} />
    </article>
  )
}
