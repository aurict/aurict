import type { Metadata } from 'next'
import { TightPeriods } from '@/components/ui/TightPeriods'
import Image from 'next/image'
import { getLocale } from 'next-intl/server'
import { Link } from '@/i18n/navigation'
import { Footer } from '@/components/sections/Footer'
import { Nav } from '@/components/Nav'
import { Breadcrumb } from '@/components/ui/Breadcrumb'
import { TrackedDownloadLink } from '@/components/analytics/TrackedDownloadLink'
import { getDesktopBetaRelease, type ReleaseAsset } from '@/lib/desktop-beta-release'
import { localizeInstallSteps } from '@/content/landing-translations'
import { InstallTabs, type InstallMethod } from '../InstallTabs'
import styles from '../Downloads.module.css'
import { localizedMetadata } from '@/i18n/metadata'
import type { AppLocale } from '@/i18n/routing'

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getLocale() as AppLocale
  return localizedMetadata(locale, '/downloads', locale === 'tr' ? 'Hoprel İndir — Masaüstü Beta' : 'Hoprel Downloads — Desktop Beta', locale === 'tr' ? 'Hoprel by Aurict uygulamasını Windows, Debian veya macOS için indirin ve SHA-256 sağlama toplamını doğrulayın.' : 'Download Hoprel by Aurict for Windows, Debian, Intel Mac, or Apple Silicon Mac and verify its SHA-256 checksum.')
}

export default async function WindowsDownloadPage() {
  const [beta, locale] = await Promise.all([getDesktopBetaRelease(), getLocale()])
  const tr = locale === 'tr'
  const installMethods: InstallMethod[] = [
    { id: 'npm', label: 'npm', command: 'npm install -g aurict', note: tr ? 'macOS, Linux ve Windows için aynı komut.' : 'The same command on macOS, Linux and Windows.' },
    { id: 'curl', label: 'curl', command: 'curl -fsSL https://aurict.com/install.sh | bash', note: tr ? 'macOS ve Linux için yerel ikiliyi ~/.local/bin altına kurar.' : 'Installs the native binary into ~/.local/bin on macOS and Linux.' },
    { id: 'windows', label: 'Windows', command: 'Invoke-WebRequest https://github.com/aurict/aurict/releases/latest/download/aurict-win32-x64.exe -OutFile aurict.exe', note: tr ? 'Windows x64 için yerel ikiliyi PowerShell ile indirir.' : 'Downloads the native Windows x64 binary with PowerShell.' },
  ]

  return (
    <>
      <Nav />
      <main className={styles.page}>
        <div className={styles.shell}>
          <Breadcrumb items={[{ label: tr ? 'Ana sayfa' : 'Home', href: '/' }, { label: tr ? 'İndirmeler' : 'Downloads', href: '/downloads' }]} />
        </div>

        <section className={`${styles.shell} ${styles.hero}`}>
          <div>
            <p className={styles.eyebrow}>{tr ? 'Hoprel · Aurict tarafından' : 'Hoprel · by Aurict'}</p>
            <h1><TightPeriods text={tr ? 'Ajanların. Çalışma alanın. Bilgisayarın.' : 'Your agents. Your workspace. Your machine.'} /></h1>
            <p className={styles.lede}>
              {tr ? 'Hoprel by Aurict yerel öncelikli bir masaüstü çalışma alanıdır. Windows, Debian ve macOS paketleri aynı beta sürümünden yayımlanır.' : 'Hoprel by Aurict is a local-first desktop workspace. Windows, Debian, and macOS packages are published from the same beta release.'}
            </p>
            {beta ? (
              <>
                <p className={styles.release}><span className={styles.live} />{tr ? 'Son beta' : 'Latest beta'} · {beta.version}</p>
                <div className={styles.downloadList}>
                  <DownloadCard asset={beta.macosArm64} command="shasum -a 256 Hoprel-Beta-macos-arm64.zip" detail={tr ? 'Apple Silicon · imzasız macOS ZIP' : 'Apple Silicon · unsigned macOS ZIP'} analyticsPlatform="macos_arm64" platform="macOS · Apple Silicon" releaseVersion={beta.version} tr={tr} />
                  <DownloadCard asset={beta.macosX64} command="shasum -a 256 Hoprel-Beta-macos-x64.zip" detail={tr ? 'Intel · imzasız macOS ZIP' : 'Intel · unsigned macOS ZIP'} analyticsPlatform="macos_x64" platform="macOS · Intel" releaseVersion={beta.version} tr={tr} />
                  <DownloadCard asset={beta.windows} command="Get-FileHash .\Hoprel-Beta-Setup.exe -Algorithm SHA256" detail={tr ? 'Windows x64 · kendinden imzalı beta yükleyicisi' : 'Windows x64 · self-signed beta installer'} analyticsPlatform="windows" platform="Windows" releaseVersion={beta.version} tr={tr} />
                  <DownloadCard asset={beta.debian} command="sha256sum Hoprel-Beta-amd64.deb" detail={tr ? 'Debian amd64 · doğrudan .deb paketi' : 'Debian amd64 · direct .deb package'} analyticsPlatform="debian" platform="Debian / Ubuntu" releaseVersion={beta.version} tr={tr} />
                </div>
                <a className={styles.textLink} href={beta.releaseUrl}>{tr ? 'Sürüm notlarını görüntüle' : 'View release notes'} ↗</a>
              </>
            ) : (
              <div className={styles.pending}>
                <p className={styles.pendingLabel}>{tr ? 'Beta derlemesi bekleniyor' : 'Beta build pending'}</p>
                <h2>{tr ? 'İlk Hoprel betası hazırlanıyor.' : 'The first Hoprel beta is being prepared.'}</h2>
                <p>{tr ? 'Yayımlandığında bu sayfa kullanılabilir her masaüstü paketini ve SHA-256 sağlama toplamını gösterecek.' : 'When published, this page will show each available desktop package and its SHA-256 checksum.'}</p>
                <a className={styles.textLink} href="https://github.com/aurict/aurict/releases">{tr ? 'GitHub sürümlerini görüntüle' : 'View GitHub releases'} ↗</a>
              </div>
            )}
          </div>
          <div className={styles.heroArt} aria-hidden="true">
            <Image alt="" height={420} priority src="/ecosystem/hoprel.webp" width={380} />
          </div>
        </section>

        <section className={`${styles.shell} ${styles.notice}`}>
          <p className={styles.noticeLabel}>{tr ? 'İmzasız beta bildirimi' : 'Unsigned beta notice'}</p>
          <p>
            {tr ? 'Bu beta derlemeleri kamuya açık olarak güvenilir kabul edilmediği için Windows SmartScreen, macOS ise Gatekeeper uyarısı gösterebilir. Yalnızca Hoprel’i bu sayfadan veya bağlı GitHub sürümünden bilerek indirdiyseniz devam edin.' : 'Windows may show a SmartScreen warning and macOS may show a Gatekeeper warning because these beta builds are not publicly trusted. Only continue if you intentionally downloaded Hoprel from this page or the linked GitHub release.'}
          </p>
          <p>
            {tr ? 'Bir kök sertifika yüklemeyin ve Windows güvenlik özelliklerini devre dışı bırakmayın. Yükleyiciyi açmadan önce yayımlanan SHA-256 sağlama toplamını doğrulayın.' : 'Do not install a root certificate or disable Windows security features. Verify the published SHA-256 checksum before opening the installer.'}
          </p>
        </section>

        <section className={styles.cliBand}>
          <div className={`${styles.shell} ${styles.cliLayout}`}>
            <div>
              <p className={styles.eyebrow}>{tr ? 'Açık kaynak · terminalin' : 'Open source · your terminal'}</p>
              <h2>{tr ? 'Aurict CLI kur' : 'Install Aurict CLI'}</h2>
              <p className={styles.lede}>{tr ? 'Açık kaynak terminal yapay zekâ kodlama ajanı. Kendi model sağlayıcını getir, bağlamı yerelde tut ve her eylemi onayla.' : 'An open-source terminal AI coding agent. Bring your own model provider, keep context local, and approve every action.'}</p>
              <InstallTabs methods={installMethods} />
              <p className={styles.checksums}>
                <a className={styles.textLink} href="https://github.com/aurict/aurict/releases/latest/download/checksums.txt">SHA-256 checksums ↗</a>
                <Link className={styles.textLink} href="/terminal-agent">{tr ? 'Aurict CLI hakkında' : 'About Aurict CLI'} →</Link>
              </p>
            </div>
            <div className={styles.steps}>
              <h3>{tr ? 'Hızlı başlangıç' : 'Quick start'}</h3>
              {localizeInstallSteps(locale as AppLocale).map(([title, code, note]) => (
                <article key={title}>
                  <span>{title}</span>
                  <code className="mono surface-dark">{code}</code>
                  <p>{note}</p>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section className={`${styles.shell} ${styles.store}`}>
          <p className={styles.eyebrow}>{tr ? 'Önerilen kanal' : 'Recommended channel'}</p>
          <h2><TightPeriods text={tr ? 'Microsoft Store dağıtımı planlanıyor.' : 'Microsoft Store distribution is planned.'} /></h2>
          <p>{tr ? 'Store derlemesi, Microsoft tarafından yönetilen imza ve güncellemelerle önerilen herkese açık kurulum yolunu sunacak.' : 'The Store build will provide the recommended public installation path with Microsoft-managed signing and updates.'}</p>
          <Link className={styles.textLink} href="/roadmap">{tr ? 'Ürün yol haritasını gör' : 'View product roadmap'} →</Link>
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
  tr,
}: {
  asset: ReleaseAsset | undefined
  command: string
  detail: string
  analyticsPlatform: "windows" | "debian" | "macos_arm64" | "macos_x64"
  platform: string
  releaseVersion: string
  tr: boolean
}) {
  if (!asset) {
    return (
      <article className={`${styles.downloadCard} ${styles.unavailable}`}>
        <div>
          <strong>{platform}</strong>
          <small>{tr ? 'Bu beta sürümünde mevcut değil.' : 'Not available in this beta release.'}</small>
        </div>
      </article>
    )
  }

  return (
    <article className={styles.downloadCard}>
      <div>
        <strong>{platform}</strong>
        <small>{detail}</small>
        <code className="mono">{command}</code>
      </div>
      <div className={styles.downloadActions}>
        <TrackedDownloadLink className={styles.downloadButton} href={asset.downloadUrl} platform={analyticsPlatform} releaseVersion={releaseVersion}>{tr ? 'İndir' : 'Download'}</TrackedDownloadLink>
        <a className={styles.checksumLink} href={asset.checksumUrl}>SHA-256</a>
      </div>
    </article>
  )
}
