"use client"

import { useLocale } from "next-intl"
import { CopyCommand } from "@/components/CopyCommand"
import { Link } from "@/i18n/navigation"
import { currentEditionLabel, providerCount } from "@/content/product-facts"
import styles from "./LandingHero.module.css"

const providers = ["Anthropic", "OpenAI", "Google", "xAI", "Azure", "AWS Bedrock", "Ollama", "OpenRouter"]

export function LandingHero() {
  const tr = useLocale() === "tr"

  return (
    <section className={styles.hero} data-screen-label="Hero">
      <div className={styles.stage}>
        <aside className={styles.rail}>
          <div className={styles.signal}><span />{tr ? "açık kaynak" : "open source"}</div>
          <p>{tr ? "yerel bağlam" : "local context"}</p>
          <p>{tr ? "açık kontrol" : "explicit control"}</p>
          <i aria-hidden="true">01—04</i>
        </aside>
        <div className={styles.content}>
          <header className={styles.masthead}>
            <p className={styles.version}>{currentEditionLabel} · AGPLv3</p>
            <p>{tr ? "masaüstü · terminal · mobil" : "desktop · terminal · mobile"}</p>
          </header>
          <h1>{tr ? <>İşiniz neredeyse,<br />Aurict orada.</> : <>One intelligence.<br />Every surface.</>}</h1>
          <WorkThread tr={tr} />
          <div className={styles.decisionRow}>
            <div>
              <p className={styles.summary}>{tr
                ? "İşiniz neredeyse Aurict oradadır: Hoprel'de yerel öncelikli masaüstü çalışma alanı, terminalde kodlama, Aurict Mobile ile araştırma ve uzaktan kontrol."
                : "Aurict brings agentic work to the surface that fits: Hoprel for a local-first desktop workspace, a native terminal runtime for code, and Aurict Mobile for research and remote control."}</p>
              <p className={styles.proof}>{tr ? "tek hesap · kendi sağlayıcılarınız · yerel bağlam · açık kontrol" : "one account · your providers · local context · explicit control"}</p>
            </div>
          <div className={styles.actions}>
            <Link className={styles.primaryAction} href="/downloads">↓ {tr ? "Hoprel'i indir" : "download Hoprel"}</Link>
            <CopyCommand className={styles.secondaryAction} command="curl -fsSL https://aurict.com/install.sh | bash" copiedLabel={tr ? "$ kopyalandı" : "$ copied"} label={tr ? "$ kur" : "$ install"} />
            <a className={styles.githubAction} href="https://github.com/aurict/aurict" rel="noopener noreferrer" target="_blank">★ GitHub</a>
          </div>
        </div>
        </div>
      </div>

      <div className={styles.providers}>
        <span>{tr ? "uyumlu" : "works with"}</span>
        {providers.map((provider) => <b key={provider}>{provider}</b>)}
        <span>{tr ? `+${providerCount - providers.length} daha — kendi anahtarını getir` : `+${providerCount - providers.length} more — bring your own key`}</span>
      </div>
    </section>
  )
}

function WorkThread({ tr }: { tr: boolean }) {
  const steps = tr
    ? [["01", "bağlam taraması", "84 dosya · framework algılandı"], ["02", "uzmanlara ayır", "keşfet · kodla · incele"], ["03", "açık onay", "komut çalışmadan önce durur"], ["04", "sonuç teslimi", "dosyalar · kanıt · sonraki adım"]]
    : [["01", "context scan", "84 files · framework detected"], ["02", "delegate specialists", "explore · code · review"], ["03", "explicit approval", "commands stop before they run"], ["04", "deliver the result", "files · evidence · next step"]]

  return (
    <div aria-label={tr ? "Aurict çalışma akışı" : "Aurict work thread"} className={styles.thread}>
      <div className={styles.threadTopline}>
        <span>aurict / work thread</span>
        <span className={styles.live}><i /> {tr ? "canlı bağlam" : "live context"}</span>
      </div>
      <div className={styles.threadPrompt}>
        <span>$</span>
        <p>{tr ? "Bu kod tabanında güvenle ilerle." : "Move this codebase forward safely."}</p>
      </div>
      <ol>
        {steps.map(([number, title, detail], index) => (
          <li className={index === 2 ? styles.approval : ""} key={number}>
            <span className={styles.stepNumber}>{number}</span>
            <div><strong>{title}</strong><small>{detail}</small></div>
            <span className={styles.stepState}>{index === 2 ? (tr ? "bekliyor" : "awaiting") : "✓"}</span>
          </li>
        ))}
      </ol>
      <div className={styles.threadFooter}><span>{tr ? "paralel uzmanlar" : "parallel specialists"}</span><span>{tr ? "yerel öncelikli" : "local-first"}</span><span>{tr ? "denetlenebilir" : "auditable"}</span></div>
    </div>
  )
}
