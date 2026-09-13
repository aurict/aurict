import type { Metadata } from 'next'
import Image from 'next/image'
import { getLocale } from 'next-intl/server'
import { Link } from '@/i18n/navigation'
import { Footer } from '@/components/sections/Footer'
import { Nav } from '@/components/Nav'
import { Breadcrumb } from '@/components/ui/Breadcrumb'
import { TrackedDownloadLink } from '@/components/analytics/TrackedDownloadLink'
import { getDesktopBetaRelease, type ReleaseAsset } from '@/lib/desktop-beta-release'
import { localizedMetadata } from '@/i18n/metadata'
import type { AppLocale } from '@/i18n/routing'
import { localizeEnglish } from '@/i18n/content'

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getLocale() as AppLocale
  return localizedMetadata(locale, '/downloads', locale === 'tr' ? 'Hoprel İndir — Masaüstü Beta' : localizeEnglish(locale, 'Hoprel Downloads — Desktop Beta'), locale === 'tr' ? 'Hoprel by Aurict uygulamasını Windows, Debian veya macOS için indirin ve SHA-256 sağlama toplamını doğrulayın.' : localizeEnglish(locale, 'Download Hoprel by Aurict for Windows, Debian, Intel Mac, or Apple Silicon Mac and verify its SHA-256 checksum.'))
}

export default async function WindowsDownloadPage() {
  const [beta, rawLocale] = await Promise.all([getDesktopBetaRelease(), getLocale()])
  const locale = rawLocale as AppLocale
  const tr = locale === 'tr'
  const t = (source: string) => localizeEnglish(locale, source)

  return (
    <>
      <Nav />
      <main className="marketing-main" style={{ maxWidth: 860 }}>
        <Breadcrumb items={[{ label: tr ? 'Ana sayfa' : t('Home'), href: '/' }, { label: tr ? 'Hoprel indirmeleri' : t('Hoprel downloads'), href: '/downloads' }]} />
        <section className="marketing-hero" style={{ marginTop: 24 }}>
          <p className="marketing-eyebrow">{tr ? 'Masaüstü · herkese açık beta' : t('Desktop · public beta')}</p>
          <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
            <Image alt="Hoprel icon" height={50} src="/hoprel-icon.svg" width={50} />
            <h1 className="marketing-title">{tr ? 'Hoprel indirmeleri.' : t('Hoprel downloads.')}</h1>
          </div>
          <p className="marketing-lede">
            {tr ? 'Hoprel by Aurict yerel öncelikli bir masaüstü çalışma alanıdır. Windows, Debian ve macOS paketleri aynı beta sürümünden yayımlanır.' : t('Hoprel by Aurict is a local-first desktop workspace. Windows, Debian, and macOS packages are published from the same beta release.')}
          </p>
        </section>

        <section className="marketing-card" style={{ borderColor: 'color-mix(in oklch, var(--warning) 48%, var(--border))', marginBottom: 22, padding: 26 }}>
          <p className="mono" style={{ color: 'var(--warning)', fontSize: 11, letterSpacing: '.08em', textTransform: 'uppercase', marginBottom: 12 }}>{tr ? 'İmzasız beta bildirimi' : t('Unsigned beta notice')}</p>
          <p className="marketing-copy" style={{ color: 'var(--text)', marginBottom: 12 }}>
            {tr ? 'Bu beta derlemeleri kamuya açık olarak güvenilir kabul edilmediği için Windows SmartScreen, macOS ise Gatekeeper uyarısı gösterebilir. Yalnızca Hoprel’i bu sayfadan veya bağlı GitHub sürümünden bilerek indirdiyseniz devam edin.' : t('Windows may show a SmartScreen warning and macOS may show a Gatekeeper warning because these beta builds are not publicly trusted. Only continue if you intentionally downloaded Hoprel from this page or the linked GitHub release.')}
          </p>
          <p className="marketing-copy">
            {tr ? 'Bir kök sertifika yüklemeyin ve Windows güvenlik özelliklerini devre dışı bırakmayın. Yükleyiciyi açmadan önce yayımlanan SHA-256 sağlama toplamını doğrulayın.' : t('Do not install a root certificate or disable Windows security features. Verify the published SHA-256 checksum before opening the installer.')}
          </p>
        </section>

        {beta ? (
          <section className="marketing-card" style={{ padding: 28, marginBottom: 64 }}>
            <p className="mono" style={{ color: 'var(--success)', fontSize: 11, letterSpacing: '.08em', textTransform: 'uppercase', marginBottom: 12 }}>{tr ? 'Son beta kullanılabilir' : t('Latest beta available')}</p>
            <h2 style={{ color: 'var(--text)', fontSize: 28, fontWeight: 600, marginBottom: 10 }}>{beta.version}</h2>
            <p className="marketing-copy" style={{ marginBottom: 24 }}>{tr ? 'Her masaüstü paketi bir SHA-256 doğrulama dosyası içerir.' : t('Every desktop package includes a SHA-256 verification file.')}</p>
            <div className="resp-grid-2" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 14 }}>
              <DownloadCard
                asset={beta.windows}
                command="Get-FileHash .\Hoprel-Beta-Setup.exe -Algorithm SHA256"
                detail={tr ? 'Windows x64 · kendinden imzalı beta yükleyicisi' : t('Windows x64 · self-signed beta installer')}
                analyticsPlatform="windows"
                platform="Windows"
                releaseVersion={beta.version}
                locale={locale}
              />
              <DownloadCard
                asset={beta.debian}
                command="sha256sum Hoprel-Beta-amd64.deb"
                detail={tr ? 'Debian amd64 · doğrudan .deb paketi' : t('Debian amd64 · direct .deb package')}
                analyticsPlatform="debian"
                platform="Debian / Ubuntu"
                releaseVersion={beta.version}
                locale={locale}
              />
              <DownloadCard
                asset={beta.macosArm64}
                command="shasum -a 256 Hoprel-Beta-macos-arm64.zip"
                detail={tr ? 'Apple Silicon · imzasız macOS ZIP' : t('Apple Silicon · unsigned macOS ZIP')}
                analyticsPlatform="macos_arm64"
                platform="macOS · Apple Silicon"
                releaseVersion={beta.version}
                locale={locale}
              />
              <DownloadCard
                asset={beta.macosX64}
                command="shasum -a 256 Hoprel-Beta-macos-x64.zip"
                detail={tr ? 'Intel · imzasız macOS ZIP' : t('Intel · unsigned macOS ZIP')}
                analyticsPlatform="macos_x64"
                platform="macOS · Intel"
                releaseVersion={beta.version}
                locale={locale}
              />
            </div>
            <a className="aur-button aur-button-secondary" href={beta.releaseUrl} style={{ marginTop: 18 }}>{tr ? 'sürümü görüntüle' : t('view release')}</a>
          </section>
        ) : (
          <section className="marketing-card" style={{ padding: 28, marginBottom: 64 }}>
            <p className="mono" style={{ color: 'var(--warning)', fontSize: 11, letterSpacing: '.08em', textTransform: 'uppercase', marginBottom: 12 }}>{tr ? 'Beta derlemesi bekleniyor' : t('Beta build pending')}</p>
            <h2 style={{ color: 'var(--text)', fontSize: 28, fontWeight: 600, marginBottom: 10 }}>{tr ? 'İlk Hoprel betası hazırlanıyor.' : t('The first Hoprel beta is being prepared.')}</h2>
            <p className="marketing-copy" style={{ marginBottom: 22 }}>{tr ? 'Yayımlandığında bu sayfa kullanılabilir her masaüstü paketini ve SHA-256 sağlama toplamını gösterecek.' : t('When published, this page will show each available desktop package and its SHA-256 checksum.')}</p>
            <a className="aur-button aur-button-secondary" href="https://github.com/aurict/aurict/releases">{tr ? 'GitHub sürümlerini görüntüle' : t('view GitHub releases')}</a>
          </section>
        )}

        <section className="marketing-card" style={{ padding: 26, marginBottom: 64 }}>
          <p className="marketing-eyebrow" style={{ marginBottom: 12 }}>{tr ? 'Önerilen kanal' : t('Recommended channel')}</p>
          <h2 style={{ color: 'var(--text)', fontSize: 25, fontWeight: 600, marginBottom: 10 }}>{tr ? 'Microsoft Store dağıtımı planlanıyor.' : t('Microsoft Store distribution is planned.')}</h2>
          <p className="marketing-copy">{tr ? 'Store derlemesi, Microsoft tarafından yönetilen imza ve güncellemelerle önerilen herkese açık kurulum yolunu sunacak.' : t('The Store build will provide the recommended public installation path with Microsoft-managed signing and updates.')}</p>
          <Link className="aur-button aur-button-secondary" href="/roadmap" style={{ marginTop: 20 }}>{tr ? 'ürün yol haritasını gör' : t('view product roadmap')}</Link>
        </section>
      </main>
      <Footer />
    </>
  )
}

function DownloadCard({
  asset,
  command,
  detail,
  analyticsPlatform,
  platform,
  releaseVersion,
  locale,
}: {
  asset: ReleaseAsset | undefined
  command: string
  detail: string
  analyticsPlatform: "windows" | "debian" | "macos_arm64" | "macos_x64"
  platform: string
  releaseVersion: string
  locale: AppLocale
}) {
  const tr = locale === 'tr'
  const t = (source: string) => localizeEnglish(locale, source)
  if (!asset) {
    return (
      <article style={{ border: '1px solid var(--border)', borderRadius: 8, padding: 20 }}>
        <p className="mono" style={{ color: 'var(--text-muted)', fontSize: 11, marginBottom: 10 }}>{platform}</p>
        <p style={{ color: 'var(--text-dim)', fontSize: 14, lineHeight: 1.55 }}>{tr ? 'Bu beta sürümünde mevcut değil.' : t('Not available in this beta release.')}</p>
      </article>
    )
  }

  return (
    <article style={{ border: '1px solid var(--border)', borderRadius: 8, padding: 20 }}>
      <p className="mono" style={{ color: 'var(--accent)', fontSize: 11, letterSpacing: '.06em', textTransform: 'uppercase', marginBottom: 10 }}>{platform}</p>
      <p style={{ color: 'var(--text-dim)', fontSize: 14, lineHeight: 1.55, marginBottom: 18 }}>{detail}</p>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 9, marginBottom: 16 }}>
        <TrackedDownloadLink className="aur-button aur-button-primary" href={asset.downloadUrl} platform={analyticsPlatform} releaseVersion={releaseVersion}>{tr ? 'indir' : t('download')}</TrackedDownloadLink>
        <a className="aur-button aur-button-secondary" href={asset.checksumUrl}>SHA-256</a>
      </div>
      <p className="mono" style={{ color: 'var(--text-muted)', fontSize: 11, lineHeight: 1.65 }}>{command}</p>
    </article>
  )
}
