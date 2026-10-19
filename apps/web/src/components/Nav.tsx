"use client"

import { useEffect, useRef, useState } from "react"
import { useTranslations } from "next-intl"
import { AppWindow, ChevronDown, Cpu, Download, Smartphone, SquareTerminal, type LucideIcon } from "lucide-react"
import { BrandMark } from "@/components/BrandMark"
import { AuthNavSlot } from "@/components/auth/AuthNavSlot"
import { LocaleSwitcher } from "@/components/LocaleSwitcher"
import { Link } from "@/i18n/navigation"
import styles from "./Nav.module.css"

type Product = {
  href: string
  name: string
  descKey: string
  icon: LucideIcon
  color: string
  soft: string
  external?: boolean
}

const PRODUCTS: Product[] = [
  { href: "/terminal-agent", name: "Aurict CLI", descKey: "cliDesc", icon: SquareTerminal, color: "var(--cli)", soft: "var(--cli-soft)" },
  { href: "/downloads", name: "Hoprel", descKey: "hoprelDesc", icon: AppWindow, color: "var(--hoprel)", soft: "var(--hoprel-soft)" },
  { href: "https://mobile.aurict.com", name: "Aurict Mobile", descKey: "mobileDesc", icon: Smartphone, color: "var(--mobile)", soft: "var(--mobile-soft)", external: true },
  { href: "https://decision.aurict.com", name: "Aurict Decision", descKey: "decisionDesc", icon: Cpu, color: "var(--decision)", soft: "var(--decision-soft)", external: true },
]

const PRIMARY_LINKS = [
  { href: "/terminal-agent", key: "cli" },
  { href: "/downloads", key: "hoprel" },
  { href: "/docs", key: "docs" },
  { href: "/blog", key: "blog" },
]

const RESOURCE_LINKS = [
  { href: "/ai-coding-agent", key: "aiCodingAgent" },
  { href: "/use-cases", key: "useCases" },
  { href: "/compare", key: "compare" },
  { href: "/roadmap", key: "roadmap" },
  { href: "/changelog", key: "changelog" },
]

type MenuName = "products" | "resources" | null

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
        className={`${styles.nav} ${scrolled || menuOpen ? styles.navElevated : ""}`}
        ref={navRef}
      >
        <div className={styles.frame}>
          <BrandMark />

          <div className={styles.desktopNav}>
            <NavMenu
              active={activeMenu === "products"}
              label={t("products")}
              onToggle={() => setActiveMenu((menu) => menu === "products" ? null : "products")}
            >
              <div className={styles.productPanel}>
                {PRODUCTS.map((product) => <ProductLink key={product.name} onClick={closeMenus} product={product} t={t} />)}
              </div>
            </NavMenu>
            {PRIMARY_LINKS.map((link) => (
              <Link className={styles.siteLink} href={link.href} key={link.key}>{t(link.key)}</Link>
            ))}
            <NavMenu
              active={activeMenu === "resources"}
              label={t("resources")}
              onToggle={() => setActiveMenu((menu) => menu === "resources" ? null : "resources")}
            >
              <div className={styles.resourcePanel}>
                {RESOURCE_LINKS.map((link) => (
                  <Link className={styles.resourceLink} href={link.href} key={link.key} onClick={closeMenus}>{t(link.key)}</Link>
                ))}
              </div>
            </NavMenu>
          </div>

          <div className={styles.controls}>
            <LocaleSwitcher />
            <AuthNavSlot />
            <Link className={styles.cta} href="/downloads">
              <Download aria-hidden="true" size={16} strokeWidth={2.4} />
              {t("download")}
            </Link>
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
        <div className={styles.drawer}>
          <DrawerGroup label={t("products")}>
            {PRODUCTS.map((product) => <ProductLink key={product.name} onClick={closeMenus} product={product} t={t} />)}
          </DrawerGroup>
          <DrawerGroup label={t("site")}>
            {[...PRIMARY_LINKS, ...RESOURCE_LINKS].map((link) => <Link className={styles.drawerLink} href={link.href} key={`${link.key}-${link.href}`} onClick={closeMenus}>{t(link.key)}</Link>)}
          </DrawerGroup>
          <div className={styles.drawerControls}>
            <LocaleSwitcher />
            <AuthNavSlot drawer />
          </div>
          <Link className={`${styles.cta} ${styles.drawerCta}`} href="/downloads" onClick={closeMenus}>
            <Download aria-hidden="true" size={16} strokeWidth={2.4} />
            {t("download")}
          </Link>
        </div>
      )}
    </>
  )
}

function ProductLink({ onClick, product, t }: { onClick: () => void; product: Product; t: ReturnType<typeof useTranslations> }) {
  const Icon = product.icon
  const body = (
    <>
      <span className={styles.productIcon} style={{ background: product.soft, color: product.color }}>
        <Icon aria-hidden="true" size={20} strokeWidth={2.2} />
      </span>
      <span className={styles.productText}>
        <strong>{product.name}</strong>
        <small>{t(product.descKey)}</small>
      </span>
      {product.external && <span aria-hidden="true" className={styles.external}>↗</span>}
    </>
  )

  return product.external
    ? <a className={styles.productLink} href={product.href} onClick={onClick} rel="noopener noreferrer" target="_blank">{body}</a>
    : <Link className={styles.productLink} href={product.href} onClick={onClick}>{body}</Link>
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
        <ChevronDown aria-hidden="true" className={styles.chevron} size={15} strokeWidth={2.4} />
      </button>
      {active && <div className={styles.menuPanel}>{children}</div>}
    </div>
  )
}

function DrawerGroup({ children, label }: { children: React.ReactNode; label: string }) {
  return <div className={styles.drawerGroup}><span>{label}</span>{children}</div>
}
