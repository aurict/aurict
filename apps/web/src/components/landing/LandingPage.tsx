"use client"

import { Nav } from "@/components/Nav"
import { Footer } from "@/components/sections/Footer"
import { LandingFaq } from "./LandingFaq"
import { HubHero } from "./HubHero"
import { LandingSections } from "./LandingSections"
import styles from "./LandingPage.module.css"

export function LandingPage() {
  return (
    <div className={styles.page}>
      <Nav />
      <main>
        <HubHero />
        <LandingSections />
        <LandingFaq />
      </main>
      <Footer />
    </div>
  )
}
