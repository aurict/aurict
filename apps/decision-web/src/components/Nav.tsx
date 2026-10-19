"use client";

import { useEffect, useState } from "react";
import { useLocale } from "next-intl";
import { Link } from "@/i18n/navigation";
import { LocaleSwitcher } from "@/components/LocaleSwitcher";
import { BrandMark } from "@/components/BrandMark";
import styles from "./Nav.module.css";

const PRODUCT_LINKS = [
  { href: "/#capabilities", label_en: "Scoring Engine",      label_tr: "Skorlama Motoru" },
  { href: "/#capabilities", label_en: "Segmentation",        label_tr: "Segmentasyon" },
  { href: "/#capabilities", label_en: "Decision Runtime",    label_tr: "Karar Çalışma Zamanı" },
  { href: "/#capabilities", label_en: "Attribution",         label_tr: "Attribution" },
  { href: "/#capabilities", label_en: "Explainability",      label_tr: "Açıklanabilirlik" },
  { href: "/#capabilities", label_en: "Federated Learning",  label_tr: "Federe Öğrenme" },
  { href: "/#capabilities", label_en: "A/B Testing",         label_tr: "A/B Testi" },
  { href: "/#capabilities", label_en: "Provider Handoff",    label_tr: "Sağlayıcı Devri" },
] as const;

const SITE_LINKS_EN = [
  ["/pricing",    "Pricing"],
  ["/docs",       "Docs"],
  ["/changelog",  "Changelog"],
  ["/roadmap",    "Roadmap"],
  ["/blog",       "Blog"],
  ["/security",   "Security"],
  ["/about",      "About"],
  ["/contact",    "Contact"],
  ["/use-cases",  "Use Cases"],
  ["/compare",    "Compare"],
] as const;

const SITE_LINKS_TR = [
  ["/pricing",    "Fiyatlandırma"],
  ["/docs",       "Dokümantasyon"],
  ["/changelog",  "Değişiklik Günlüğü"],
  ["/roadmap",    "Yol Haritası"],
  ["/blog",       "Blog"],
  ["/security",   "Güvenlik"],
  ["/about",      "Hakkında"],
  ["/contact",    "İletişim"],
  ["/use-cases",  "Kullanım Senaryoları"],
  ["/compare",    "Karşılaştır"],
] as const;

type MenuName = "product" | "site" | null;

export function Nav() {
  const locale = useLocale();
  const tr = locale === "tr";

  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [activeMenu, setActiveMenu] = useState<MenuName>(null);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 12);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // close desktop menus on resize
  useEffect(() => {
    const close = () => { setActiveMenu(null); setMenuOpen(false); };
    window.addEventListener("resize", close);
    return () => window.removeEventListener("resize", close);
  }, []);

  // close desktop menus on outside click
  useEffect(() => {
    function closeOutside(e: MouseEvent) {
      const nav = document.getElementById("mt-nav");
      if (nav?.contains(e.target as Node)) return;
      setActiveMenu(null);
    }
    function closeEsc(e: KeyboardEvent) {
      if (e.key === "Escape") { setActiveMenu(null); setMenuOpen(false); }
    }
    document.addEventListener("mousedown", closeOutside);
    document.addEventListener("keydown", closeEsc);
    return () => {
      document.removeEventListener("mousedown", closeOutside);
      document.removeEventListener("keydown", closeEsc);
    };
  }, []);

  function closeAll() { setActiveMenu(null); setMenuOpen(false); }

  const siteLinks = tr ? SITE_LINKS_TR : SITE_LINKS_EN;

  return (
    <>
      <nav
        id="mt-nav"
        aria-label="Primary navigation"
        className={`${styles.nav} mono ${scrolled || menuOpen ? styles.elevated : ""}`}
      >
        <div className={styles.frame}>
          {/* Brand */}
          <div className={styles.identity}>
            <BrandMark />
            <span className={styles.edition}>decision engine</span>
          </div>

          {/* Desktop links */}
          <div className={styles.desktopNav}>
            {/* Product dropdown */}
            <div className={styles.menuWrap}>
              <button
                aria-expanded={activeMenu === "product"}
                className={styles.trigger}
                onClick={() =>
                  setActiveMenu((m) => (m === "product" ? null : "product"))
                }
                type="button"
              >
                {tr ? "Ürün" : "Product"}
                <span aria-hidden="true" className={styles.chevron}>⌄</span>
              </button>
              {activeMenu === "product" && (
                <div className={styles.panel}>
                  <span className={styles.panelLabel}>
                    {tr ? "kapasite indeksi" : "capability index"}
                  </span>
                  <div className={styles.productGrid}>
                    {PRODUCT_LINKS.map((link, i) => (
                      <Link
                        key={i}
                        href={link.href}
                        className={styles.menuItem}
                        onClick={closeAll}
                      >
                        <span className={styles.itemIndex}>
                          {String(i + 1).padStart(2, "0")}
                        </span>
                        <span>{tr ? link.label_tr : link.label_en}</span>
                      </Link>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Site dropdown */}
            <div className={styles.menuWrap}>
              <button
                aria-expanded={activeMenu === "site"}
                className={styles.trigger}
                onClick={() =>
                  setActiveMenu((m) => (m === "site" ? null : "site"))
                }
                type="button"
              >
                {tr ? "Site" : "Site"}
                <span aria-hidden="true" className={styles.chevron}>⌄</span>
              </button>
              {activeMenu === "site" && (
                <div className={`${styles.panel} ${styles.panelNarrow}`}>
                  <span className={styles.panelLabel}>
                    {tr ? "sayfa dizini" : "page index"}
                  </span>
                  <div className={styles.siteGrid}>
                    {siteLinks.map(([href, label]) => (
                      <Link
                        key={href}
                        href={href}
                        className={styles.siteItem}
                        onClick={closeAll}
                      >
                        {label}
                      </Link>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <Link href="/docs" className={styles.siteLink}>
              {tr ? "Docs" : "Docs"}
            </Link>
            <Link href="/pricing" className={styles.siteLink}>
              {tr ? "Fiyatlar" : "Pricing"}
            </Link>
            <Link href="/contact" className={styles.siteLink}>
              {tr ? "İletişim" : "Contact"}
            </Link>
          </div>

          {/* Controls */}
          <div className={styles.controls}>
            <LocaleSwitcher />
            <a
              href="https://decision.aurict.com/register"
              className="aur-button aur-button-primary"
              style={{ fontSize: 11, minHeight: 36, padding: "0 13px" }}
            >
              {tr ? "Başla" : "Get Started"}
            </a>
          </div>

          {/* Mobile burger */}
          <button
            aria-expanded={menuOpen}
            aria-label={menuOpen ? (tr ? "Menüyü kapat" : "Close menu") : (tr ? "Menüyü aç" : "Open menu")}
            className={styles.burger}
            onClick={() => setMenuOpen((o) => !o)}
            type="button"
          >
            <span />
            <span />
          </button>
        </div>
      </nav>

      {/* Mobile drawer */}
      {menuOpen && (
        <div className={`${styles.drawer} mono`}>
          <DrawerGroup label={tr ? "Ürün" : "Product"}>
            {PRODUCT_LINKS.map((link, i) => (
              <Link key={i} href={link.href} onClick={closeAll}>
                <span style={{ color: "var(--text-muted)", marginRight: 8, fontSize: 10, fontFamily: "var(--font-mono)" }}>
                  {String(i + 1).padStart(2, "0")}
                </span>
                {tr ? link.label_tr : link.label_en}
              </Link>
            ))}
          </DrawerGroup>
          <DrawerGroup label={tr ? "Site" : "Site"}>
            {siteLinks.map(([href, label]) => (
              <Link key={href} href={href} onClick={closeAll}>
                {label}
              </Link>
            ))}
          </DrawerGroup>
          <div className={styles.drawerControls}>
            <LocaleSwitcher />
            <a
              href="https://decision.aurict.com/register"
              className="aur-button aur-button-primary"
              style={{ fontSize: 12, width: "100%", justifyContent: "center" }}
            >
              {tr ? "Başla" : "Get Started"}
            </a>
          </div>
        </div>
      )}
    </>
  );
}

function DrawerGroup({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className={styles.drawerGroup}>
      <span className={styles.drawerGroupLabel}>{label}</span>
      {children}
    </div>
  );
}
