import type { Metadata, Viewport } from "next";
import { Footer } from "@/components/Footer";
import { JsonLd } from "@/components/JsonLd";
import { Nav } from "@/components/Nav";
import { DESCRIPTION, REPO_URL, SITE_NAME, SITE_URL } from "@/content/site";
import "./globals.css";

const TITLE = "Quaera — Open-source AI research team with Lean-verified proofs";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: { default: TITLE, template: "%s | Quaera" },
  description: DESCRIPTION,
  applicationName: SITE_NAME,
  keywords: [
    "AI research agent",
    "Lean 4",
    "Mathlib",
    "automated theorem proving",
    "AI theorem prover",
    "formal verification",
    "AI scientist",
    "reproducible machine learning",
    "citation verification",
    "open source",
    "QuaeraLabs",
    "Quaera",
  ],
  authors: [{ name: "Aurict", url: "https://aurict.com" }],
  creator: "Aurict",
  publisher: "Aurict",
  icons: {
    icon: [{ url: "/icon-512.png", type: "image/png", sizes: "512x512" }],
    apple: [{ url: "/apple-touch-icon.png", sizes: "180x180" }],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: { index: true, follow: true, "max-image-preview": "large", "max-snippet": -1, "max-video-preview": -1 },
  },
  openGraph: {
    type: "website",
    locale: "en_US",
    url: SITE_URL,
    siteName: SITE_NAME,
    title: TITLE,
    description: DESCRIPTION,
  },
  twitter: {
    card: "summary_large_image",
    site: "@aurictdev",
    creator: "@aurictdev",
    title: TITLE,
    description: DESCRIPTION,
  },
  category: "technology",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: "#faf6f1",
};

const organization = {
  "@context": "https://schema.org",
  "@type": "Organization",
  "@id": `${SITE_URL}/#org`,
  name: "QuaeraLabs",
  url: SITE_URL,
  logo: `${SITE_URL}/icon-512.png`,
  sameAs: [REPO_URL],
  parentOrganization: { "@type": "Organization", name: "Aurict", url: "https://aurict.com" },
};

const website = {
  "@context": "https://schema.org",
  "@type": "WebSite",
  "@id": `${SITE_URL}/#website`,
  name: SITE_NAME,
  url: SITE_URL,
  publisher: { "@id": `${SITE_URL}/#org` },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        {/* eslint-disable-next-line @next/next/no-page-custom-font -- runtime link keeps offline builds stable */}
        <link
          href="https://fonts.googleapis.com/css2?family=IBM+Plex+Mono:wght@400;500&family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap"
          rel="stylesheet"
        />
        <JsonLd data={organization} />
        <JsonLd data={website} />
      </head>
      <body>
        <a href="#main" className="skip-link">Skip to content</a>
        <Nav />
        <main id="main">{children}</main>
        <Footer />
      </body>
    </html>
  );
}
