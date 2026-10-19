"use client";

import { useEffect, useState } from "react";
import { ChevronDown } from "lucide-react";
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
  const primaryLinks: [string, string][] = [
    ["/#how-it-works", tr ? "Nasıl çalışır" : "How it works"],
    ["/pricing", tr ? "Fiyatlar" : "Pricing"],
    ["/docs", tr ? "Dokümanlar" : "Docs"],
  ];

  return (
    <>
      <nav
        id="mt-nav"
        aria-label="Primary navigation"
        className={`${styles.nav} ${scrolled || menuOpen ? styles.elevated : ""}`}
      >
        <div className={styles.frame}>
          <BrandMark />

          <div className={styles.desktopNav}>
            <div className={styles.menuWrap}>
              <button
                aria-expanded={activeMenu === "product"}
                className={styles.trigger}
                onClick={() => setActiveMenu((m) => (m === "product" ? null : "product"))}
                type="button"
              >
                {tr ? "Ürün" : "Product"}
                <ChevronDown aria-hidden="true" className={styles.chevron} size={15} strokeWidth={2.4} />
              </button>
              {activeMenu === "product" && (
                <div className={styles.panel}>
                  <div className={styles.productGrid}>
                    {PRODUCT_LINKS.map((link) => (
                      <Link key={link.label_en} href={link.href} className={styles.menuItem} onClick={closeAll}>
                        {tr ? link.label_tr : link.label_en}
                      </Link>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {primaryLinks.map(([href, label]) => (
              <Link key={href} href={href} className={styles.siteLink}>{label}</Link>
            ))}

            <div className={styles.menuWrap}>
              <button
                aria-expanded={activeMenu === "site"}
                className={styles.trigger}
                onClick={() => setActiveMenu((m) => (m === "site" ? null : "site"))}
                type="button"
              >
                {tr ? "Kaynaklar" : "Resources"}
                <ChevronDown aria-hidden="true" className={styles.chevron} size={15} strokeWidth={2.4} />
              </button>
              {activeMenu === "site" && (
                <div className={`${styles.panel} ${styles.panelNarrow}`}>
                  <div className={styles.siteGrid}>
                    {siteLinks.map(([href, label]) => (
                      <Link key={href} href={href} className={styles.menuItem} onClick={closeAll}>
                        {label}
                      </Link>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className={styles.controls}>
            <LocaleSwitcher />
            <a href="https://decision.aurict.com/register" className={styles.cta}>
              {tr ? "Başla" : "Get started"}
            </a>
            <a className={styles.byAurict} href="https://aurict.com" rel="noopener noreferrer" target="_blank">
              by Aurict
              <span aria-hidden="true" className={styles.aurictDot} />
            </a>
          </div>

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

      {menuOpen && (
        <div className={styles.drawer}>
          <DrawerGroup label={tr ? "Ürün" : "Product"}>
            {primaryLinks.map(([href, label]) => (
              <Link key={href} href={href} onClick={closeAll}>{label}</Link>
            ))}
            {PRODUCT_LINKS.map((link) => (
              <Link key={link.label_en} href={link.href} onClick={closeAll}>
                {tr ? link.label_tr : link.label_en}
              </Link>
            ))}
          </DrawerGroup>
          <DrawerGroup label={tr ? "Kaynaklar" : "Resources"}>
            {siteLinks.map(([href, label]) => (
              <Link key={href} href={href} onClick={closeAll}>{label}</Link>
            ))}
          </DrawerGroup>
          <div className={styles.drawerControls}>
            <LocaleSwitcher />
            <a href="https://decision.aurict.com/register" className={styles.cta}>
              {tr ? "Başla" : "Get started"}
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
