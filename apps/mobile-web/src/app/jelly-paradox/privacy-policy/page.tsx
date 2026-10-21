"use client";

import Link from "next/link";
import { useLanguage } from "@/contexts/LanguageContext";
import AmbientBackground from "@/components/AmbientBackground";
import PageHeader from "@/components/PageHeader";

const BRAND = "var(--jelly)";
const APP_NAME = "Jelly Paradox";
const PACKAGE_NAME = "com.aurict.jelly";
const DEVELOPER = "Aurict";
const CONTACT = "contact@aurict.com";

type Section = { title: string; body?: string; items?: string[] };

const STRINGS = {
  tr: {
    title: "Jelly Paradox Gizlilik Politikası",
    identityTitle: "Bu politika kimin, hangi uygulama için",
    appLabel: "Uygulama",
    packageLabel: "Paket adı (Google Play / App Store)",
    developerLabel: "Geliştirici",
    contactLabel: "İletişim",
    identityBody: `Bu gizlilik politikası, ${DEVELOPER} tarafından Android ve iOS için yayınlanan ${APP_NAME} mobil oyunu için geçerlidir. "Biz" ifadesi ${APP_NAME}'u geliştiren ve yayınlayan ${DEVELOPER}'i ifade eder.`,
    sections: [
      {
        title: "Topladığımız bilgiler",
        items: [
          "Misafir hesap: oyunu ilk açtığınızda rastgele bir kimlikle anonim bir hesap oluşturulur. Ad veya e-posta gerekmez.",
          "Google ile giriş (isteğe bağlı): seçerseniz Google hesap kimliğinizi, e-posta adresinizi ve adınızı alırız. Bunları yalnızca ilerlemenizi hesabınıza bağlamak ve başka cihazda devam etmenizi sağlamak için kullanırız. Google şifrenizi asla görmeyiz.",
          "Oyun verileri: bölüm ilerlemesi, puanlar, yıldızlar, oyun içi para ve eşyalar, günlük ödüller, görevler, sezon kartı ilerlemesi, ayarlar ve dil.",
          "Oyun kayıtları: her bölüm denemesindeki hamleler ve zamanlamaları. Sunucumuz sonuçları bu kayıtla doğrular ve oyunu adil tutar.",
          "Satın alma bilgileri: alınan ürün, fiyat, zaman ve Google Play / App Store işlem referansı. Ödemeler tamamen Google veya Apple tarafından işlenir; kart ve banka bilgileriniz bize ulaşmaz.",
          "Cihaz ve teknik veriler: platform (Android/iOS), uygulama sürümü, saat dilimi, IP adresi ve sunucu kayıtları. Güvenlik, dolandırıcılığı önleme ve hizmetin çalışması için kullanılır.",
          "Reklam verileri (reklam gösterilen sürümde): reklam ortağımız Google AdMob cihazınızın reklam kimliğini, IP adresinizi ve reklam etkileşimlerini toplayabilir. Kişiselleştirilmiş reklamlar yalnızca izin verirseniz gösterilir.",
          "Analitik ve hata raporları (yalnızca izninizle): Google Firebase Analytics ve Crashlytics üzerinden anonim kullanım olayları (ör. hangi bölümün oynandığı) ve çökme raporları.",
          "Bildirim kimliği (yalnızca bildirimlere izin verirseniz): cihazınıza bildirim gönderebilmek için Firebase Cloud Messaging'in verdiği cihaz adresi ve oyun diliniz.",
        ],
      },
      {
        title: "Toplamadığımız bilgiler",
        body: "Kesin konum (GPS), rehber, fotoğraf/video, kamera, mikrofon, dosyalar, takvim, mesajlar ve telefon numarası toplamıyoruz. Reklam ortağımız Google AdMob, IP adresinden yaklaşık konum (ülke/şehir düzeyi) çıkarabilir. Oyunda sohbet veya kullanıcılar arası mesajlaşma yoktur.",
      },
      {
        title: "Bilgileri nasıl kullanırız",
        items: [
          "Oyunu sunmak, ilerlemenizi kaydetmek ve başka cihazlarda devam etmenizi sağlamak",
          "Satın almaları teslim etmek, geri yüklemek ve iadeleri işlemek",
          "Bölüm sonuçlarını doğrulamak; hileyi, dolandırıcılığı ve hesap kötüye kullanımını tespit etmek",
          "Hesapları güvende tutmak (ör. çalınmış oturumları tespit edip engellemek)",
          "Seçimlerinize göre reklam göstermek ve ölçmek",
          "İzin verdiyseniz can, günlük hediye ve geri dönüş hatırlatmaları göndermek (günde en fazla bir, gece asla)",
          "İzin verdiyseniz oyunun nasıl kullanıldığını anlamak ve hataları düzeltmek",
        ],
      },
      {
        title: "Hukuki dayanak (KVKK, GDPR)",
        body: "Sizinle yaptığımız sözleşmenin ifası (oyunun ve satın almaların sunulması); meşru menfaatlerimiz (güvenlik, hile ve dolandırıcılığı önleme, hizmetin çalışması); açık rızanız (kişiselleştirilmiş reklam, analitik, hata raporları) ve yasal yükümlülükler (ör. satın almalar için vergi kayıtları). Rızanızı istediğiniz zaman Ayarlar → Gizlilik seçenekleri'nden geri alabilirsiniz.",
      },
      {
        title: "Çocuklar",
        items: [
          "Oyun her yaşa uygundur ve ilk açılışta yaşınızı sorar.",
          "16 yaş altındaki oyunculara yalnızca kişiselleştirilmemiş reklam gösterilir ve reklam istekleri çocuklara yönelik olarak işaretlenir.",
          "16 yaş altındaki oyunculardan analitik veya hata verisi toplanmaz.",
          "16 yaş altındaki oyuncularda her satın alma öncesinde bir yetişkin doğrulaması istenir.",
          "Çocuklardan oyunu çalıştırmak için gerekenden fazla kişisel veri bilerek toplamayız. Bir çocuğun bize kişisel veri verdiğini düşünüyorsanız (ör. Google ile giriş yaparak) bize yazın, sileriz.",
        ],
      },
      {
        title: "Paylaşım ve hizmet sağlayıcılar",
        body: "Kişisel verilerinizi satmayız. Yalnızca oyunu çalıştırmak için bizim adımıza çalışan sağlayıcıları kullanırız: Google Cloud (sunucu barındırma, AB), Cloudflare (ağ güvenliği ve iletim), Google (Google ile Giriş, AdMob, Firebase Analytics, Crashlytics ve Cloud Messaging, Google Play Faturalandırma) ve Apple (App Store Faturalandırma). Liderlik tablolarında yalnızca görünen adınız (yoksa \"Oyuncu\") ve puanınız görünür. Yasal zorunluluk halinde veya kullanıcılarımızı dolandırıcılığa karşı korumak için bilgi paylaşabiliriz.",
      },
      {
        title: "Yurt dışına aktarım",
        body: "Sunucumuz Avrupa Birliği'ndedir. Hizmet sağlayıcılarımız verileri ABD dahil başka ülkelerde de işleyebilir; gerektiğinde Avrupa Komisyonu Standart Sözleşme Hükümleri gibi uygun güvencelere dayanırız.",
      },
      {
        title: "Saklama süreleri",
        items: [
          "Hesap ve oyun verileri: hesabınızı silene kadar.",
          "Tek kullanımlık işlem kayıtları (aynı işlemin iki kez uygulanmasını önlemek için): 60 gün.",
          "Sunucu yedekleri: 14 gün sonra otomatik silinir.",
          "Hesap silindiğinde ona bağlı tüm satır kayıtları (ilerleme, sonuçlar, satın alma kayıtları, güvenlik kayıtları) sunucumuzdan silinir. Google ve Apple kendi işlem kayıtlarını kendi politikalarına göre saklar.",
        ],
      },
      {
        title: "Hesap silme ve haklarınız",
        items: [
          "Oyunda: Ayarlar → Hesap → Hesabı sil. Hesabınız, ilerlemeniz ve satın alma geçmişiniz sunucumuzdan kalıcı olarak silinir (yedeklerdeki kopyalar 14 gün içinde kaybolur).",
          "Web'de: Google ile bağladığınız hesabı aşağıdaki bağlantıdan silebilirsiniz.",
          `Oyuna erişemiyorsanız ${CONTACT} adresine Google hesabınızın e-postasından ya da Ayarlar'da görünen Oyuncu Kimliği'nizle yazın; 30 gün içinde sileriz.`,
          "Reklam ve analitik izinlerinizi istediğiniz zaman değiştirin: Ayarlar → Gizlilik seçenekleri. Kişiselleştirilmiş reklamları cihaz ayarlarından da kapatabilirsiniz.",
          "Bildirimleri telefonunuzun ayarlarından istediğiniz zaman kapatabilirsiniz; bildirim kimliğiniz hesabınızla birlikte silinir.",
          `KVKK ve GDPR kapsamında verilerinize erişme, düzeltme, silme, taşıma, işlemeye itiraz etme ve veri koruma otoritesine (ör. KVKK Kurulu) şikâyet etme haklarınız vardır. Talepleriniz için ${CONTACT} adresine yazın.`,
        ],
      },
      {
        title: "Güvenlik",
        body: "Tüm bağlantılar HTTPS ile şifrelenir. Şifre saklamayız. Oturum anahtarları kısa ömürlüdür ve sürekli yenilenir; çalınmış bir oturum anahtarı tekrar kullanılırsa oturum otomatik kapatılır. Sunuculara yalnızca yetkili kişiler erişebilir. Hiçbir sistem mutlak güvenlik garantisi veremez.",
      },
      {
        title: "Değişiklikler",
        body: "Bu politikayı güncelleyebiliriz. Güncel sürüm her zaman bu sayfada yayınlanır ve aşağıdaki tarih değişir; önemli değişiklikleri oyun içinde de bildiririz.",
      },
    ] as Section[],
    deleteLink: "Jelly Paradox hesabını web'den sil",
    lastUpdated: "Yürürlük ve son güncelleme: 19 Ekim 2026",
    backButton: "Geri",
  },
  en: {
    title: "Jelly Paradox Privacy Policy",
    identityTitle: "Whose policy this is, and for which app",
    appLabel: "App",
    packageLabel: "Package name (Google Play / App Store)",
    developerLabel: "Developer",
    contactLabel: "Contact",
    identityBody: `This privacy policy applies to the ${APP_NAME} mobile game published by ${DEVELOPER} for Android and iOS. "We" and "us" mean ${DEVELOPER}, who develops and publishes ${APP_NAME}.`,
    sections: [
      {
        title: "Information we collect",
        items: [
          "Guest account: when you first open the game we create an anonymous account identified by a random ID. No name or email is needed.",
          "Google sign-in (optional): if you choose it, we receive your Google account ID, email address and name. We use them only to link your progress to your account and let you continue on another device. We never see your Google password.",
          "Game data: level progress, scores, stars, in-game currencies and items, daily rewards, quests, season pass progress, settings and language.",
          "Gameplay records: the moves and their timing in each level attempt. Our server uses them to verify results and keep the game fair.",
          "Purchase information: the product, price, time and the Google Play / App Store transaction reference. Payments are processed entirely by Google or Apple; we never receive card or bank details.",
          "Device and technical data: platform (Android/iOS), app version, time zone, IP address and server logs, used for security, fraud prevention and to keep the service running.",
          "Advertising data (in versions that show ads): our ad partner Google AdMob may collect your device's advertising ID, IP address and ad interactions. Personalized ads are shown only if you agree.",
          "Analytics and crash reports (only with your consent): anonymous usage events (for example, which level was played) and crash reports through Google Firebase Analytics and Crashlytics.",
          "Notification token (only if you allow notifications): the device address issued by Firebase Cloud Messaging and your game language, so we can send notifications to your device.",
        ],
      },
      {
        title: "Information we don't collect",
        body: "We do not collect precise location (GPS), contacts, photos/videos, camera, microphone, files, calendar, messages or phone number. Our ad partner Google AdMob may derive an approximate location (country or city level) from your IP address. The game has no chat or messaging between players.",
      },
      {
        title: "How we use information",
        items: [
          "To run the game, save your progress and let you continue on other devices",
          "To deliver and restore purchases and handle refunds",
          "To verify level results and detect cheating, fraud and account abuse",
          "To keep accounts secure (for example, to detect and block stolen sessions)",
          "To show and measure ads according to your choices",
          "To send reminders about full lives, the daily gift and coming back, if you allow notifications (at most one a day, never at night)",
          "To understand how the game is used and fix problems, if you consent",
        ],
      },
      {
        title: "Legal bases (GDPR, KVKK)",
        body: "Performance of our contract with you (providing the game and purchases); our legitimate interests (security, cheat and fraud prevention, keeping the service running); your consent (personalized ads, analytics, crash reports); and legal obligations (for example, tax records for purchases). You can withdraw consent at any time in Settings → Privacy choices.",
      },
      {
        title: "Children",
        items: [
          "The game is suitable for all ages and asks your age when you first open it.",
          "Players under 16 see only non-personalized ads, and ad requests are marked as child-directed.",
          "No analytics or crash data is collected from players under 16.",
          "For players under 16, a grown-up check is required before every purchase.",
          "We do not knowingly collect more personal data from children than the game needs to work. If you believe a child has given us personal data (for example, by signing in with Google), write to us and we will delete it.",
        ],
      },
      {
        title: "Sharing and service providers",
        body: "We do not sell your personal data. We only use providers that act on our behalf to run the game: Google Cloud (server hosting, EU), Cloudflare (network security and delivery), Google (Google Sign-In, AdMob, Firebase Analytics, Crashlytics and Cloud Messaging, Google Play Billing) and Apple (App Store billing). Leaderboards show only your display name (or \"Player\") and score. We may disclose information when required by law or to protect our players against fraud.",
      },
      {
        title: "International transfers",
        body: "Our server is in the European Union. Our providers may process data in other countries, including the United States; where required we rely on appropriate safeguards such as the European Commission's Standard Contractual Clauses.",
      },
      {
        title: "Retention",
        items: [
          "Account and game data: until you delete your account.",
          "One-time request records (which stop the same action from being applied twice): 60 days.",
          "Server backups: deleted automatically after 14 days.",
          "When an account is deleted, every record tied to it (progress, results, purchase records, security logs) is deleted from our server. Google and Apple keep their own transaction records under their own policies.",
        ],
      },
      {
        title: "Account deletion and your rights",
        items: [
          "In the game: Settings → Account → Delete account. This permanently deletes your account, progress and purchase history from our server (copies in backups disappear within 14 days).",
          "On the web: delete an account linked to Google using the link below.",
          `If you can't open the game, write to ${CONTACT} from your Google account's email or include the Player ID shown in Settings; we will delete your data within 30 days.`,
          "Change ad and analytics consent at any time in Settings → Privacy choices. You can also turn off personalized ads in your device settings.",
          "Turn off notifications at any time in your phone's settings; your notification token is deleted with your account.",
          `Under the GDPR and KVKK you have the right to access, correct, delete and export your data, to object to processing, and to complain to your data protection authority. Write to ${CONTACT} for any request.`,
        ],
      },
      {
        title: "Security",
        body: "All connections are encrypted with HTTPS. We do not store passwords. Session keys are short-lived and rotated; if a stolen session key is reused, the session is closed automatically. Only authorized people can access the servers. No system can guarantee absolute security.",
      },
      {
        title: "Changes",
        body: "We may update this policy. The current version is always published on this page and the date below changes; we also tell you about important changes in the game.",
      },
    ] as Section[],
    deleteLink: "Delete your Jelly Paradox account on the web",
    lastUpdated: "Effective and last updated: 19 October 2026",
    backButton: "Back",
  },
} as const;

export default function JellyParadoxPrivacyPolicyPage() {
  const { language } = useLanguage();
  const s = language === "tr" ? STRINGS.tr : STRINGS.en;

  return (
    <div className="min-h-screen overflow-x-hidden" style={{ background: "var(--bg)", color: "var(--text)" }}>
      <AmbientBackground />
      <PageHeader backLabel={s.backButton} brand={`${APP_NAME} · ${DEVELOPER}`} />

      <main className="relative z-10 py-10 px-6">
        <div className="max-w-3xl mx-auto space-y-6">
          <div className="text-center mb-10">
            <h1 className="text-4xl md:text-5xl hyphens-auto font-extrabold tracking-tight" style={{ color: BRAND }}>
              {s.title}
            </h1>
          </div>

          <section className="aur-card p-8" style={{ borderLeft: `2px solid ${BRAND}` }}>
            <h2 className="eyebrow mb-4" style={{ color: BRAND }}>{s.identityTitle}</h2>
            <dl className="grid grid-cols-1 sm:grid-cols-[auto_1fr] gap-x-6 gap-y-2 text-sm mb-4">
              <dt style={{ color: "var(--text-muted)" }}>{s.appLabel}</dt>
              <dd style={{ color: "var(--text)" }}>{APP_NAME}</dd>
              <dt style={{ color: "var(--text-muted)" }}>{s.packageLabel}</dt>
              <dd className="break-all" style={{ color: "var(--text)" }}>{PACKAGE_NAME}</dd>
              <dt style={{ color: "var(--text-muted)" }}>{s.developerLabel}</dt>
              <dd style={{ color: "var(--text)" }}>{DEVELOPER}</dd>
              <dt style={{ color: "var(--text-muted)" }}>{s.contactLabel}</dt>
              <dd>
                <a href={`mailto:${CONTACT}`} style={{ color: BRAND }}>{CONTACT}</a>
              </dd>
            </dl>
            <p className="leading-relaxed text-sm" style={{ color: "var(--text-dim)" }}>{s.identityBody}</p>
          </section>

          {s.sections.map((section) => (
            <section key={section.title} className="aur-card p-8">
              <h2 className="eyebrow mb-4" style={{ color: BRAND }}>{section.title}</h2>
              {section.body && (
                <p className="leading-relaxed text-sm" style={{ color: "var(--text-dim)" }}>{section.body}</p>
              )}
              {section.items && (
                <ul className="space-y-2 ml-5 text-sm" style={{ color: "var(--text-dim)" }}>
                  {section.items.map((item) => (
                    <li key={item}>• {item}</li>
                  ))}
                </ul>
              )}
            </section>
          ))}

          <div className="text-center space-y-3">
            <Link href="/jelly-paradox/delete-account" className="text-sm underline" style={{ color: BRAND }}>
              {s.deleteLink}
            </Link>
            <p className="text-xs" style={{ color: "var(--text-muted)" }}>{s.lastUpdated}</p>
          </div>
        </div>
      </main>
    </div>
  );
}
