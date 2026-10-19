"use client"

import { useState } from "react"
import { TightPeriods } from "@/components/ui/TightPeriods"
import { useLocale } from "next-intl"
import { localizeFaqs } from "@/content/landing-translations"
import { localizeLandingUi } from "@/content/landing-ui"
import type { AppLocale } from "@/i18n/config"
import styles from "./LandingSections.module.css"

export function LandingFaq() {
  const [openFaq, setOpenFaq] = useState(0)
  const locale = useLocale() as AppLocale
  const faqs = localizeFaqs(locale)
  const copy = localizeLandingUi(locale).faq

  return (
    <section className={styles.faq} id="faq">
      <div className={styles.eyebrow}>{copy.eyebrow}</div>
      <div className={styles.faqHeading}>
        <h2><TightPeriods text={copy.title} /></h2>
        <p>{copy.body}</p>
      </div>
      <div className={styles.faqList}>
        {faqs.map(([question, answer], index) => {
          const isOpen = openFaq === index
          return (
            <article className={isOpen ? styles.faqOpen : ""} key={question}>
              <h3>
                <button aria-expanded={isOpen} onClick={() => setOpenFaq(isOpen ? -1 : index)} type="button">
                  <span>{question}</span><span aria-hidden="true">{isOpen ? "−" : "+"}</span>
                </button>
              </h3>
              {isOpen && <p>{answer}</p>}
            </article>
          )
        })}
      </div>
    </section>
  )
}
