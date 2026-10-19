import { getLocale } from "next-intl/server"
import { BrandMark } from "@/components/BrandMark"
import { Link } from "@/i18n/navigation"
import type { AppLocale } from "@/i18n/routing"

const copy: Record<AppLocale, { title: string; nav: string; back: string; another: string }> = {
  en: { title: "Beyond the map.", nav: "Route options", back: "go back", another: "choose another path" },
  tr: { title: "Haritanın dışında.", nav: "Rota seçenekleri", back: "geri dön", another: "başka bir yol seç" },
  de: { title: "Außerhalb der Karte.", nav: "Routenoptionen", back: "zurück", another: "anderen Weg wählen" },
  fr: { title: "Au-delà de la carte.", nav: "Options de navigation", back: "revenir", another: "choisir un autre chemin" },
  es: { title: "Más allá del mapa.", nav: "Opciones de navegación", back: "volver", another: "elegir otro camino" },
}

export default async function NotFound() {
  const locale = await getLocale() as AppLocale
  const t = copy[locale]

  return (
    <main className="lost-route" aria-labelledby="lost-route-title">
      <div className="lost-route-top"><BrandMark /></div>
      <div className="lost-route-mark" aria-hidden="true">
        <span className="lost-route-wing lost-route-wing-left" />
        <span className="lost-route-core">▊</span>
        <span className="lost-route-wing lost-route-wing-right" />
      </div>
      <div className="lost-route-copy">
        <p className="lost-route-signal mono">aurict ▊</p>
        <h1 id="lost-route-title">{t.title}</h1>
      </div>
      <nav aria-label={t.nav} className="lost-route-actions">
        <Link href="/">{t.back}</Link>
        <Link href="/docs">{t.another}</Link>
      </nav>
    </main>
  )
}
