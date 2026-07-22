"use client"

import { useEffect, useRef, useState } from "react"
import { useTranslations } from "next-intl"
import { BrandMark } from "@/components/BrandMark"
import { AuthNavSlot } from "@/components/auth/AuthNavSlot"
import { LocaleSwitcher } from "@/components/LocaleSwitcher"
import { Link } from "@/i18n/navigation"
import { currentEditionLabel } from "@/content/product-facts"
import styles from "./Nav.module.css"

const SITE_LINKS = [
  { href: "/roadmap", key: "roadmap" },
  { href: "/docs", key: "docs" },
  { href: "/changelog", key: "changelog" },
]

const PRODUCT_LINKS = [
  { href: "/", key: "overview" },
  { href: "/#surfaces", key: "surfaces" },
  { href: "/#capabilities", key: "capabilities" },
  { href: "/#security", key: "security" },
  { href: "/#mobile", key: "mobile" },
  { href: "/downloads", key: "downloadHoprel" },
  { href: "/#install", key: "install" },
  { href: "/#faq", key: "faq" },
]

const ECOSYSTEM_LINKS = [
  { href: "https://mobile.aurict.com", label: "aurict mobile" },
]

type MenuName = "product" | "ecosystem" | null

export function Nav() {
  const [scrolled, setScrolled] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)
  const [activeMenu, setActiveMenu] = useState<MenuName>(null)
  const navRef = useRef<HTMLElement>(null)
  const t = useTranslations("Nav")

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 12)
    onScroll()
    window.addEventListener("scroll", onScroll, { passive: true })
    return () => window.removeEventListener("scroll", onScroll)
  }, [])

  useEffect(() => {
    const close = () => {
      setMenuOpen(false)
      setActiveMenu(null)
    }
    window.addEventListener("resize", close)
    return () => window.removeEventListener("resize", close)
  }, [])

  useEffect(() => {
    function closeOnOutsideClick(event: MouseEvent) {
      if (navRef.current?.contains(event.target as Node)) return
      setActiveMenu(null)
    }
    function closeOnEscape(event: KeyboardEvent) {
      if (event.key === "Escape") setActiveMenu(null)
    }
    document.addEventListener("mousedown", closeOnOutsideClick)
    document.addEventListener("keydown", closeOnEscape)
    return () => {
      document.removeEventListener("mousedown", closeOnOutsideClick)
      document.removeEventListener("keydown", closeOnEscape)
    }
  }, [])

  function closeMenus() {
    setActiveMenu(null)
    setMenuOpen(false)
  }

  return (
    <>
      <nav
        aria-label="Primary navigation"
        className={`${styles.nav} mono ${scrolled || menuOpen ? styles.navElevated : ""}`}
        ref={navRef}
      >
        <div className={styles.frame}>
          <div className={styles.identity}>
            <BrandMark compact />
            <span className={styles.edition}>{currentEditionLabel} · AGPLv3</span>
          </div>

          <div className={styles.desktopNav}>
            <NavMenu
              active={activeMenu === "product"}
              label={t("product")}
              onToggle={() => setActiveMenu((menu) => menu === "product" ? null : "product")}
            >
              <div className={styles.productGrid}>
                {PRODUCT_LINKS.map((link, index) => (
                  <Link className={styles.menuItem} href={link.href} key={link.href} onClick={closeMenus}>
                    <span className={styles.itemIndex}>{String(index + 1).padStart(2, "0")}</span>
                    <span>{t(link.key)}</span>
                  </Link>
                ))}
              </div>
            </NavMenu>
            <NavMenu
              active={activeMenu === "ecosystem"}
              label={t("ecosystem")}
              onToggle={() => setActiveMenu((menu) => menu === "ecosystem" ? null : "ecosystem")}
            >
              <div className={styles.ecosystemPanel}>
                <span className={styles.panelLabel}>connected surface</span>
                {ECOSYSTEM_LINKS.map((link) => (
                  <a className={styles.ecosystemLink} href={link.href} key={link.href} onClick={closeMenus}>
                    <span>{link.label}</span>
                    <span aria-hidden="true">↗</span>
                  </a>
                ))}
              </div>
            </NavMenu>
            {SITE_LINKS.map((link) => (
              <Link className={styles.siteLink} href={link.href} key={link.href}>{t(link.key)}</Link>
            ))}
          </div>

          <div className={styles.controls}>
            <LocaleSwitcher />
            <AuthNavSlot />
          </div>

          <button
            aria-expanded={menuOpen}
            aria-label={menuOpen ? t("closeMenu") : t("openMenu")}
            className={styles.burger}
            onClick={() => setMenuOpen((open) => !open)}
            type="button"
          >
            <span />
            <span />
          </button>
        </div>
      </nav>

      {menuOpen && (
        <div className={`${styles.drawer} mono`}>
          <DrawerGroup label={t("product")}>
            {PRODUCT_LINKS.map((link) => <Link href={link.href} key={link.href} onClick={closeMenus}>{t(link.key)}</Link>)}
          </DrawerGroup>
          <DrawerGroup label={t("ecosystem")}>
            {ECOSYSTEM_LINKS.map((link) => <a href={link.href} key={link.href} onClick={closeMenus}>{link.label}</a>)}
          </DrawerGroup>
          <DrawerGroup label={t("site")}>
            {SITE_LINKS.map((link) => <Link href={link.href} key={link.href} onClick={closeMenus}>{t(link.key)}</Link>)}
          </DrawerGroup>
          <div className={styles.drawerControls}>
            <LocaleSwitcher />
            <AuthNavSlot drawer />
          </div>
        </div>
      )}
    </>
  )
}

function NavMenu({ active, children, label, onToggle }: {
  active: boolean
  children: React.ReactNode
  label: string
  onToggle: () => void
}) {
  return (
    <div className={styles.menuWrap}>
      <button aria-expanded={active} className={styles.menuTrigger} onClick={onToggle} type="button">
        {label}
        <span aria-hidden="true" className={styles.chevron}>⌄</span>
      </button>
      {active && <div className={styles.menuPanel}>{children}</div>}
    </div>
  )
}

function DrawerGroup({ children, label }: { children: React.ReactNode; label: string }) {
  return <div className={styles.drawerGroup}><span>{label}</span>{children}</div>
}
