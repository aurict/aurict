"use client";

import { useLocale } from "next-intl";
import { Link } from "@/i18n/navigation";
import styles from "./Footer.module.css";

export function Footer() {
  const locale = useLocale();
  const tr = locale === "tr";

  const productLinks: [string, string][] = [
    ["/",            tr ? "Genel Bakış"       : "Overview"],
    ["/pricing",     tr ? "Fiyatlandırma"      : "Pricing"],
    ["/security",    tr ? "Güvenlik"          : "Security"],
    ["/changelog",   tr ? "Changelog"         : "Changelog"],
    ["/roadmap",     tr ? "Yol Haritası"      : "Roadmap"],
    ["/#integrations", tr ? "Entegrasyonlar"  : "Integrations"],
  ];

  const companyLinks: [string, string][] = [
    ["/about",      tr ? "Hakkında"           : "About"],
    ["/blog",       tr ? "Blog"               : "Blog"],
    ["/use-cases",  tr ? "Kullanım Senaryoları" : "Use Cases"],
    ["/compare",    tr ? "Karşılaştır"        : "Compare"],
  ];

  const legalLinks: [string, string][] = [
    ["/privacy",    tr ? "Gizlilik Politikası" : "Privacy Policy"],
    ["/terms",      tr ? "Hizmet Şartları"     : "Terms of Service"],
  ];

  const ossLinks: [string, string][] = [
    ["https://github.com/aurict", "GitHub"],
    ["/docs",      tr ? "Dokümantasyon"   : "Documentation"],
  ];

  return (
    <footer className={styles.footer}>
      <div className={styles.frame}>
        {/* Identity */}
        <div className={styles.identity}>
          <span className={styles.wordmark}>
            aurict decision<span className={styles.cursor}>▊</span>
          </span>
          <p className={styles.sub}>
            {tr
              ? "Aurict alt ürünü · Ticari Lisans"
              : "An Aurict sub-product · Commercial License"}
          </p>
          <a className={styles.email} href="mailto:contact@aurict.com">
            contact@aurict.com
          </a>
          <p className={styles.copyright}>
            © {new Date().getFullYear()} Aurict
          </p>
        </div>

        {/* Columns */}
        <div className={styles.columns}>
          <FooterCol title={tr ? "Ürün" : "Product"} links={productLinks} />
          <FooterCol title={tr ? "Şirket" : "Company"} links={companyLinks} />
          <FooterCol title={tr ? "Yasal" : "Legal"} links={legalLinks} />
          <FooterCol title={tr ? "Geliştiriciler" : "Developers"} links={ossLinks} external />
        </div>
      </div>

      {/* Bottom bar */}
      <div className={styles.bottom}>
        <span>aurict decision · aurict sub-product · decision engine</span>
        <span>
          {tr
            ? "© 2026 Aurict · Tüm hakları saklıdır"
            : "© 2026 Aurict · All rights reserved"}
        </span>
      </div>
    </footer>
  );
}

function FooterCol({
  title,
  links,
  external = false,
}: {
  title: string;
  links: [string, string][];
  external?: boolean;
}) {
  return (
    <div className={styles.col}>
      <span className={styles.colLabel}>{title}</span>
      {links.map(([href, label]) =>
        href.startsWith("http") || external ? (
          <a
            key={label}
            href={href}
            target={href.startsWith("http") ? "_blank" : undefined}
            rel={href.startsWith("http") ? "noopener noreferrer" : undefined}
          >
            {label}
          </a>
        ) : (
          <Link key={label} href={href}>
            {label}
          </Link>
        )
      )}
    </div>
  );
}
