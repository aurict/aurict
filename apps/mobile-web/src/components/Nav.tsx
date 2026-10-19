"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { BrandMark } from "@/components/BrandMark";
import { LanguageMenu } from "@/components/LanguageMenu";
import { useLanguage } from "@/contexts/LanguageContext";

const LINKS = [
  { href: "/#apps", key: "nav.ourApps" },
  { href: "/about-us", key: "nav.about" },
  { href: "/#support", key: "nav.support" },
];

const PRODUCT_LINKS = [
  { href: "/", key: "nav.overview" },
  { href: "/capabilities", key: "nav.capabilities" },
  { href: "/security", key: "nav.security" },
  { href: "/#apps", key: "nav.mobile" },
  { href: "/install", key: "nav.install" },
  { href: "/faq", key: "nav.faq" },
];

const ACCOUNT_LINKS = [
  { href: "/duckley/delete-account", key: "nav.duckleyAccount" },
  { href: "/mindgrid/delete-account", key: "nav.mindgridAccount" },
];

const X_ICON = (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24h-6.66l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
  </svg>
);

const CHEVRON = (
  <svg aria-hidden="true" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.2">
    <path d="m6 9 6 6 6-6" />
  </svg>
);

export function Nav() {
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const { t } = useLanguage();

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 16);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    const close = () => setMenuOpen(false);
    window.addEventListener("resize", close);
    return () => window.removeEventListener("resize", close);
  }, []);

  return (
    <>
      <nav
        style={{
          position: "sticky",
          top: 0,
          zIndex: 50,
          borderBottom: scrolled || menuOpen ? "1px solid var(--border)" : "1px solid transparent",
          background: scrolled || menuOpen ? "color-mix(in srgb, var(--bg) 90%, transparent)" : "transparent",
          backdropFilter: scrolled || menuOpen ? "blur(14px)" : "none",
          transition: "background 0.2s ease, border-color 0.2s ease",
        }}
      >
        <div
          className="section-shell"
          style={{
            alignItems: "center",
            display: "flex",
            height: 72,
            justifyContent: "space-between",
          }}
        >
          <BrandMark />

          <div className="nav-links">
            {LINKS.map((link) => (
              <Link key={link.key} className="dim-link nav-label" href={link.href} style={{ fontSize: 15 }}>
                {t(link.key)}
              </Link>
            ))}
            <Dropdown label={t("nav.product")} links={PRODUCT_LINKS} />
            <a
              className="nav-social"
              href="https://x.com/aurict"
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Aurict on X"
            >
              {X_ICON}
            </a>
            <LanguageMenu />
            <div className="nav-dropdown">
              <button className="aur-btn-primary nav-account" type="button" aria-haspopup="menu">
                {t("nav.account")}
                {CHEVRON}
              </button>
              <div className="nav-dropdown-menu nav-dropdown-menu-end" role="menu">
                {ACCOUNT_LINKS.map((link) => (
                  <Link key={link.href} className="nav-dropdown-item" href={link.href} role="menuitem">
                    {t(link.key)}
                  </Link>
                ))}
              </div>
            </div>
          </div>

          <button
            aria-label={menuOpen ? "Close menu" : "Open menu"}
            aria-expanded={menuOpen}
            className="nav-burger"
            onClick={() => setMenuOpen((open) => !open)}
          >
            {menuOpen ? (
              <svg width="24" height="24" viewBox="0 0 22 22" fill="none" stroke="currentColor" strokeLinecap="round" strokeWidth="2">
                <line x1="5" y1="5" x2="17" y2="17" />
                <line x1="17" y1="5" x2="5" y2="17" />
              </svg>
            ) : (
              <svg width="24" height="24" viewBox="0 0 22 22" fill="none" stroke="currentColor" strokeLinecap="round" strokeWidth="2">
                <line x1="4" y1="7" x2="18" y2="7" />
                <line x1="4" y1="11" x2="18" y2="11" />
                <line x1="4" y1="15" x2="18" y2="15" />
              </svg>
            )}
          </button>
        </div>
      </nav>

      {menuOpen && (
        <div className="nav-drawer" onClick={() => setMenuOpen(false)}>
          <span className="nav-drawer-label">{t("nav.site")}</span>
          {LINKS.map((link) => (
            <Link key={link.key} className="nav-label" href={link.href}>
              {t(link.key)}
            </Link>
          ))}
          <span className="nav-drawer-label">{t("nav.account")}</span>
          {ACCOUNT_LINKS.map((link) => (
            <Link key={link.href} href={link.href}>
              {t(link.key)}
            </Link>
          ))}
          <span className="nav-drawer-label">{t("nav.product")}</span>
          {PRODUCT_LINKS.map((link) => (
            <Link key={link.key} className="nav-label" href={link.href}>
              {t(link.key)}
            </Link>
          ))}
          <a className="nav-label" href="https://x.com/aurict" target="_blank" rel="noopener noreferrer">
            {t("nav.aurictOnX")}
          </a>
          <div style={{ paddingTop: 14 }} onClick={(e) => e.stopPropagation()}>
            <LanguageMenu />
          </div>
        </div>
      )}
    </>
  );
}

function Dropdown({ label, links }: { label: string; links: Array<{ href: string; key: string }> }) {
  const { t } = useLanguage();
  return (
    <div className="nav-dropdown">
      <button className="nav-dropdown-trigger" type="button" aria-haspopup="menu">
        <span className="nav-label">{label}</span>
        {CHEVRON}
      </button>
      <div className="nav-dropdown-menu" role="menu">
        {links.map((link) => (
          <Link key={link.key} className="nav-dropdown-item nav-label" href={link.href} role="menuitem">
            {t(link.key)}
          </Link>
        ))}
      </div>
    </div>
  );
}
