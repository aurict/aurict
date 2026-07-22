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
import styles from "./LandingSections.module.css"

const integrations = ["GitHub", "PostgreSQL", "Docker", "Slack", "Jira", "Linear", "Figma", "Sentry", "Vercel", "AWS", "Notion", "Browser"]

export function LandingSections() {
  const tr = useLocale() === "tr"
  const locale = tr ? "tr" : "en"

  return (
    <>
      <section className={`${styles.band} ${styles.surfaces}`} id="surfaces" data-screen-label="Surfaces">
        <div className={styles.shell}>
          <SectionIntro eyebrow={tr ? "aurict ekosistemi" : "the aurict ecosystem"} title={tr ? "Nerede çalışacağınızı seçin. Bağlamı koruyun." : "Choose the surface. Keep the context."} body={tr ? "Her ürünün ayrı bir işi var. Aynı Aurict kimliği, sağlayıcıları ve çalışmanız sizinle birlikte yolculuk eder." : "Each product has a distinct job. The same Aurict identity, providers, and work travel with you."} />
          <div className={styles.surfaceGrid}>
            <article className={`${styles.surfaceCard} ${styles.hoprel}`}>
              <div className={styles.surfaceHead}><Image alt="Hoprel icon" height={44} src="/hoprel-icon.svg" width={44} /><div><span>{tr ? "masaüstü çalışma alanı" : "desktop workspace"}</span><h3>Hoprel <em>by Aurict</em></h3></div></div>
              <p>{tr ? "Sohbetler, dosyalar, çıktılar, Tasarım Stüdyosu, Finans Masası ve uzaktan kontrol için yerel öncelikli bir yapay zekâ çalışma alanı." : "A local-first AI workspace for conversations, files, artifacts, Design Studio, Finance Desk, and remote control."}</p>
              <Link href="/downloads">{tr ? "Hoprel'i indir" : "download Hoprel"} <span>→</span></Link>
            </article>
            <SurfaceCard eyebrow={tr ? "yerel çalışma zamanı" : "native runtime"} title="Aurict Terminal" body={tr ? "Ajan tabanlı kodlama, çoklu ajan yürütmesi, MCP, yerel bağlam, sınırlı Project Auto ve açık onaylar için açık kaynak çalışma zamanı." : "The open-source runtime for agentic coding, multi-agent execution, MCP, local context, scoped Project Auto, and explicit approvals."} href="#install" link={tr ? "kabuğunuza kurun" : "install in your shell"} />
            <SurfaceCard eyebrow={tr ? "yoldaş" : "companion"} title="Aurict Mobile" body={tr ? "BYOK sohbeti, araştırma, belge üretimi ve masaüstü çalışmanız ilginizi gerektirdiğinde canlı uzaktan kontrol." : "BYOK chat, research, document generation, and live remote control when your desktop work needs your attention."} href="https://mobile.aurict.com" link={tr ? "Aurict Mobile'ı ziyaret et" : "visit Aurict Mobile"} external />
          </div>
        </div>
      </section>

      <section className={styles.principles} id="why" data-screen-label="WhyAurict">
        <div className={styles.shell}>
          <SectionIntro eyebrow={tr ? "neden aurict" : "why aurict"} title={tr ? "İstemi yanıtlamadan önce işi anlamak için tasarlandı." : "Designed to understand the work before it answers the prompt."} body={tr ? "Aurict bir sohbet penceresini başka bir sohbet penceresiyle değiştirmez. Projenizi, riskinizi ve çalışmanın nasıl bölüneceğini görünür kılar." : "Aurict does not replace one chat window with another. It makes your project, risk, and the shape of the work visible."} />
          <div className={styles.principleList}>
            {localizeWhyItems(locale).map(([number, title, body]) => <article key={number}><span>{number}</span><div><h3>{title}</h3><p>{body}</p></div></article>)}
          </div>
        </div>
      </section>

      <section className={`${styles.band} ${styles.capabilities}`} id="capabilities" data-screen-label="Capabilities">
        <div className={styles.shell}>
          <SectionIntro eyebrow={tr ? "yetenek mimarisi" : "capability architecture"} title={tr ? "Çalışmayı anlayın, koordine edin, güvenle yürütün." : "Understand the work. Coordinate it. Act safely."} body={tr ? "Her özellik ayrı bir kutu değil; bağlamdan sonuca uzanan aynı operasyon akışının bir parçasıdır." : "Every capability is not a separate box. It is part of the same operating path from context to result."} />
          <div className={styles.capabilityGrid}>
            {localizeCapabilityItems(locale).map(([title, body, color], index) => <article key={title} style={{ "--capability-color": color } as CSSProperties}><span>{String(index + 1).padStart(2, "0")}</span><h3>{title}</h3><p>{body}</p></article>)}
          </div>
          <div className={styles.runtimeDemo} aria-label={tr ? "Aurict terminal çalışma akışı örneği" : "Aurict terminal workflow example"}>
            <TerminalWindow />
          </div>
        </div>
      </section>

      <section className={styles.security} id="security" data-screen-label="Security">
        <div className={styles.shell}>
          <SectionIntro eyebrow={tr ? "güvenlik duruşu" : "security posture"} title={tr ? "Onay varsayılan; sonradan eklenen bir düşünce değil." : "Confirmation is the default, not an afterthought."} body={tr ? "Güvenlik yeteneği tamamen modele gizli başlar. Aurict'in ne kadar ileri uzanabileceğine siz karar verirsiniz." : "Security capability starts hidden from the model entirely. You choose how far Aurict is allowed to reach."} />
          <div className={styles.securityGrid}>
            {localizeSecurityProfiles(locale).map(([tag, title, body, color]) => <article key={title} style={{ "--profile-color": color } as CSSProperties}><span>{tag}</span><h3>{title}</h3><p>{body}</p></article>)}
          </div>
          <p className={styles.securityCommand}>$ aurict /config security allow &lt;target&gt; — every active profile still requires an allowlisted target and explicit approval.</p>
        </div>
      </section>

      <section className={`${styles.band} ${styles.mobile}`} id="mobile" data-screen-label="Mobile">
        <div className={`${styles.shell} ${styles.mobileLayout}`}>
          <div aria-hidden="true" className={styles.mobileRail}><span>mobile</span><span>01—04</span></div>
          <div>
            <SectionIntro eyebrow={tr ? "mobil · BYOK asistanı" : "mobile · BYOK assistant"} title={tr ? "Cebinizde kişisel bir yapay zeka çalışma alanı." : "A personal AI workspace in your pocket."} body={tr ? "Aurict mobil yalnızca uzak onay ekranı değildir. Kullanıcıların zaten güvendiği modellerle sohbet edebildiği, araştırma isteyebildiği, PDF ve raporlar üretebildiği ve terminalden uzakta çalışmaya devam edebildiği kendi anahtarını-getir (BYOK) asistanıdır." : "Aurict mobile is not just a remote approval screen. It is a bring-your-own-key assistant where users can chat with the models they already trust, ask for research, generate PDFs and reports, and continue work away from the terminal."} />
            <div className={styles.mobileFeatures}>{localizeMobileAssistantItems(locale).map(([title, body], index) => <article key={title}><span>{String(index + 1).padStart(2, "0")}</span><div><h3>{title}</h3><p>{body}</p></div></article>)}</div>
          </div>
          <MobileFrame tr={tr} />
        </div>
      </section>

      <section className={styles.install} id="install" data-screen-label="Install">
        <div className={styles.shell}>
          <SectionIntro eyebrow={tr ? "kurulum" : "install"} title={tr ? "Otuz saniye, tek komut, halihazırda kullandığınız kabuk." : "Thirty seconds, one command, your existing shell."} />
          <div className={styles.installGrid}>{localizeInstallSteps(locale).map(([title, code, note, color]) => <article key={title} style={{ "--install-color": color } as CSSProperties}><span>{title}</span>{code.startsWith("#") ? <code>{code}</code> : <CopyCommand command={code} />}<p>{note}</p></article>)}</div>
        </div>
      </section>

      <section className={`${styles.band} ${styles.ecosystem}`} data-screen-label="Integrations">
        <div className={styles.shell}>
          <SectionIntro eyebrow={tr ? "açık ekosistem" : "open ecosystem"} title={tr ? "Zaten kullandığınız araçlarla çalışır." : "Works with the tools you already run."} body={tr ? "MCP ile — bir yapılandırma dosyası olan her şeyi bağlayın" : "via MCP — connect anything with a config file"} />
          <div className={styles.integrationList}>{integrations.map((item, index) => <span key={item}><i>{String(index + 1).padStart(2, "0")}</i>{item}</span>)}</div>
        </div>
      </section>

      <section className={styles.finalCta} data-screen-label="FinalCTA">
        <p>{tr ? "kendi bağlamınızda başlayın" : "start in your own context"}</p>
        <h2>{tr ? "İşinizin ait olduğu yerde başlayın." : "Start where your work belongs."}</h2>
        <div><Link href="/downloads">↓ {tr ? "Hoprel'i indir" : "download Hoprel"}</Link><a href="#install">{tr ? "$ hızlı kurulum" : "$ quick install"}</a></div>
      </section>
    </>
  )
}

function SectionIntro({ body, eyebrow, title }: { body?: string; eyebrow: string; title: string }) {
  return <div className={styles.intro}><div className={styles.eyebrow}>{eyebrow}</div><div><h2>{title}</h2>{body && <p>{body}</p>}</div></div>
}

function SurfaceCard({ body, eyebrow, external = false, href, link, title }: { body: string; eyebrow: string; external?: boolean; href: string; link: string; title: string }) {
  return <article className={styles.surfaceCard}><div className={styles.surfaceHead}><div><span>{eyebrow}</span><h3>{title}</h3></div></div><p>{body}</p>{external ? <a href={href}>{link} <span>↗</span></a> : <Link href={href}>{link} <span>→</span></Link>}</article>
}

function MobileFrame({ tr }: { tr: boolean }) {
  return <div className={styles.phone}><div className={styles.phoneNotch} /><div className={styles.phoneScreen}><header><span>aurict mobile</span><b><i />BYOK</b></header><div className={styles.bubble}>{tr ? "Solo girişimciler için AI destek araçlarını araştır ve PDF özeti hazırla." : "Research AI support tools for solo founders and make a PDF brief."}</div><div className={`${styles.bubble} ${styles.assistant}`}>{tr ? "Fiyatlandırma, iş akışları ve konumlandırmayı karşılaştıracağım." : "I’ll compare pricing, workflows, and positioning."}</div><article><span>{tr ? "araştırma taraması" : "research scan"}<b>running</b></span><small>12 sources · competitor notes · citations</small></article><article><span>CLI session<b>{tr ? "onay" : "approval"}</b></span><small>{tr ? "terminal eylemini mobilden onayla" : "approve a terminal action from mobile"}</small><div className={styles.phoneActions}><span>{tr ? "onayla" : "approve"}</span><span>{tr ? "reddet" : "deny"}</span></div></article></div></div>
}
