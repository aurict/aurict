"use client";

import { useLanguage } from "@/contexts/LanguageContext";
import AmbientBackground from "@/components/AmbientBackground";
import PageHeader from "@/components/PageHeader";

const BRAND = "var(--brewtothemoon)";
const APP_NAME = "Brew to the Moon";
const PACKAGE_NAME = "com.aurict.brewtothemoon";
const DEVELOPER = "Aurict";
const CONTACT = "contact@aurict.com";

type Section = { title: string; body?: string; items?: string[] };

const STRINGS = {
  tr: {
    title: "Brew to the Moon Gizlilik Politikası",
    identityTitle: "Bu politika kimin, hangi uygulama için",
    appLabel: "Uygulama",
    packageLabel: "Paket adı (Google Play)",
    developerLabel: "Geliştirici",
    contactLabel: "İletişim",
    identityBody: `Bu gizlilik politikası, ${DEVELOPER} tarafından Android için Google Play'de yayınlanan ${APP_NAME} mobil oyunu için geçerlidir. "Biz" ifadesi oyunu geliştiren ve yayınlayan ${DEVELOPER}'i ifade eder.`,
    sections: [
      {
        title: "Kısaca",
        body: "Brew to the Moon'u hesap açmadan ve giriş yapmadan oynarsınız; oyunda hesap sistemi yoktur. Aurict'in Brew to the Moon için bir sunucusu yoktur: oyun ilerlemeniz yalnızca telefonunuzda şifrelenmiş olarak saklanır ve biz bu verileri göremeyiz. Veri işleyen taraflar yalnızca aşağıda listelenen Google hizmetleridir (reklam, satın alma ve analitik). Kişisel verilerinizi satmayız.",
      },
      {
        title: "Telefonunuzda kalan bilgiler",
        items: [
          "Şifrelenmiş oyun kaydı: oyun içi paranız ($, gerçek para değildir), Altın Çekirdekleriniz, baristalarınız ve diğer üreticileriniz, geliştirmeleriniz, menünüz, ulaştığınız mekân, günlük görevleriniz, giriş serisi ve oyun ayarlarınız.",
          "Satın aldığınız kalıcı öğeler (Reklamsız, kalıcı x2 gelir, makine renkleri) ve satın almaları doğrulamak için Google Play'in sipariş bilgisi.",
          "Android otomatik yedekleme bu oyun için kapalıdır; oyun kaydı Google Drive'a veya başka bir buluta yedeklenmez.",
        ],
      },
      {
        title: "Google hizmetleri",
        items: [
          "Google AdMob (reklamlar): isteğe bağlı ödüllü reklamlar (offline kazancı ikiye katlamak veya 4 saatlik x2 gelir bonusu için izlemeyi siz seçersiniz) ve oyunun doğal aralarında geçiş reklamları. İlk oyun oturumunuzda geçiş reklamı gösterilmez. AdMob reklam kimliğini, IP adresini, cihaz bilgilerini ve reklam etkileşimlerini Google'ın politikalarına göre reklam göstermek, ölçmek ve dolandırıcılığı önlemek için işleyebilir.",
          "Reklam izni: Google'ın izin formu (UMP), Avrupa Ekonomik Alanı, Birleşik Krallık ve İsviçre'de gösterilir. Kararınızı istediğiniz zaman oyunun Ayarlar ekranındaki \"Gizlilik seçenekleri\" düğmesinden değiştirebilirsiniz.",
          "Google Play Faturalandırma: Reklamsız, kalıcı x2 gelir ve iki kozmetik makine rengi, Google Play üzerinden satılan isteğe bağlı tek seferlik uygulama içi satın almalardır. Ödemeyi tamamen Google Play işler; kart ve ödeme bilgileriniz bize ulaşmaz. Bize yalnızca bir satın alma anahtarı (makbuz) ulaşır ve bu telefonunuzda doğrulanır.",
          "Firebase Analytics (Google): oyunu iyileştirmek için oyun olayları toplanır (eğitimin başlaması ve bitmesi, seviye atlama ve yeni mekâna ulaşma, franchise satışı, offline kazanç toplama, görev ödülü alma, ödüllü reklam ödülü, gösterilen geçiş reklamı, oyun içi para kazanma ve harcama). Ad, e-posta veya hesap kimliği gönderilmez. Veri toplama kapalı başlar ve izin sonucu belli olana kadar Consent Mode v2 sinyallerinin tamamı \"reddedildi\" olarak ayarlıdır.",
          "Oyunda Firebase Crashlytics, çökme raporlama hizmeti veya bildirim (push/mesajlaşma) hizmeti kullanılmaz.",
        ],
      },
      {
        title: "İzinler",
        body: "Oyun yalnızca internet erişimi (INTERNET), ağ durumunu okuma (ACCESS_NETWORK_STATE) ve titreşim (VIBRATE) izinlerini kullanır. İnternet yalnızca reklamlar, satın almalar ve analitik içindir; oyun internetsiz de oynanır.",
      },
      {
        title: "Toplamadığımız bilgiler",
        body: "Adınızı, e-postanızı, telefon numaranızı, konumunuzu, rehberinizi, fotoğraf/videolarınızı, kameranızı, mikrofonunuzu, dosyalarınızı veya mesajlarınızı toplamıyoruz. Oyunda sohbet veya oyuncular arası mesajlaşma yoktur. Google AdMob, IP adresinden yaklaşık konum (ülke/şehir düzeyi) çıkarabilir.",
      },
      {
        title: "Hukuki dayanak (KVKK, GDPR)",
        body: "Sizinle yaptığımız sözleşmenin ifası (oyunun ve satın almaların sunulması); meşru menfaatlerimiz (oyunun çalışması, dolandırıcılığın önlenmesi); açık rızanız (kişiselleştirilmiş reklam ve analitik). İzninizi oyunun Ayarlar ekranındaki gizlilik seçeneklerinden ve cihazınızın ayarlarından değiştirebilirsiniz.",
      },
      {
        title: "Çocuklar",
        body: "Brew to the Moon çocuklar için tasarlanmamıştır; 13 yaş ve üzeri oyuncular içindir ve 13 yaş altındaki çocuklara yönelik değildir. 13 yaş altındaki çocuklardan bilerek kişisel veri toplamayız. Bir çocuğun verisinin işlendiğini düşünüyorsanız bize yazın.",
      },
      {
        title: "Yurt dışına aktarım",
        body: "Google hizmetleri verileri ABD dahil başka ülkelerde işleyebilir; Google bu aktarımlarda Avrupa Komisyonu Standart Sözleşme Hükümleri gibi güvencelere dayanır.",
      },
      {
        title: "Saklama ve silme",
        items: [
          "Oyun kaydı yalnızca telefonunuzdadır; uygulamayı kaldırdığınızda veya uygulama verilerini temizlediğinizde silinir ve geri getirilemez.",
          `Yardım gerekirse ${CONTACT} adresine "Brew to the Moon veri silme" konulu bir e-posta gönderin. Hesap sistemi ve sunucumuz olmadığı için bizde silinecek bir hesap kaydı bulunmaz.`,
          "Google AdMob, Google Play ve Firebase kendi verilerini kendi politikalarına göre saklar.",
        ],
      },
      {
        title: "Haklarınız",
        items: [
          "Reklam iznini oyunun Ayarlar ekranındaki \"Gizlilik seçenekleri\" düğmesinden değiştirebilir, kişiselleştirilmiş reklamları cihazınızın Google ayarlarından kapatabilir ve reklam kimliğinizi sıfırlayabilirsiniz.",
          `KVKK ve GDPR kapsamında verilerinize erişme, düzeltme, silme, taşıma, işlemeye itiraz etme ve veri koruma otoritesine (ör. KVKK Kurulu) şikâyet etme haklarınız vardır. Talepleriniz için ${CONTACT} adresine yazın; 30 gün içinde yanıt veririz.`,
        ],
      },
      {
        title: "Güvenlik",
        body: "Oyun kaydı telefonunuzda şifrelenmiş olarak saklanır ve Google hizmetlerine tüm bağlantılar şifrelidir (HTTPS). Hiçbir sistem mutlak güvenlik garantisi veremez.",
      },
      {
        title: "Değişiklikler",
        body: "Bu politikayı güncelleyebiliriz. Güncel sürüm her zaman bu sayfada yayınlanır ve aşağıdaki tarih değişir.",
      },
    ] as Section[],
    lastUpdated: "Yürürlük ve son güncelleme: 27 Ekim 2026",
    backButton: "Geri",
  },
  en: {
    title: "Brew to the Moon Privacy Policy",
    identityTitle: "Whose policy this is, and for which app",
    appLabel: "App",
    packageLabel: "Package name (Google Play)",
    developerLabel: "Developer",
    contactLabel: "Contact",
    identityBody: `This privacy policy applies to the ${APP_NAME} mobile game published by ${DEVELOPER} for Android on Google Play. "We" and "us" mean ${DEVELOPER}, who develops and publishes the game.`,
    sections: [
      {
        title: "In short",
        body: "You play Brew to the Moon without creating an account or signing in; the game has no account system. Aurict runs no server for Brew to the Moon: your progress is stored encrypted only on your phone, and we cannot see it. The only parties that process data are the Google services listed below (ads, purchases and analytics). We do not sell your personal data.",
      },
      {
        title: "Information that stays on your phone",
        items: [
          "Encrypted game save: your in-game money ($, not real money), Golden Beans, baristas and other producers, upgrades, menu, the venue you have reached, daily tasks, login streak and game settings.",
          "Permanent items you bought (Remove Ads, permanent x2 income, machine colors) and Google Play's order details used to verify purchases.",
          "Android auto-backup is turned off for this game; the game save is not backed up to Google Drive or any other cloud.",
        ],
      },
      {
        title: "Google services",
        items: [
          "Google AdMob (ads): optional rewarded ads (you choose to watch one to double your offline earnings or for a 4-hour x2 income boost) and interstitial ads at natural breaks in play. No interstitial ads are shown in your first session. AdMob may process your advertising ID, IP address, device information and ad interactions, under Google's policies, to show and measure ads and prevent fraud.",
          "Ad consent: Google's consent form (UMP, User Messaging Platform) is shown in the European Economic Area, the UK and Switzerland. You can change your choice at any time with the \"Privacy options\" button in the game's Settings.",
          "Google Play Billing: Remove Ads, permanent x2 income and two cosmetic machine colors are optional one-time in-app purchases sold through Google Play. Payments are handled entirely by Google Play; we never receive card or payment details. We only receive a purchase token (receipt), which is verified on your phone.",
          "Firebase Analytics (Google): to improve the game we collect gameplay events (tutorial begin and complete, level-ups and venues reached, franchise sales, offline earnings collected, task rewards claimed, rewarded-ad rewards, interstitial ads shown, and in-game currency earned and spent). No names, emails or account IDs are sent. Collection starts disabled, with all Consent Mode v2 signals set to denied until your consent choice is known.",
          "The game does not use Firebase Crashlytics, any crash-reporting service or any push messaging service.",
        ],
      },
      {
        title: "Permissions",
        body: "The game uses only internet access (INTERNET), network state (ACCESS_NETWORK_STATE) and vibration (VIBRATE). The internet is used only for ads, purchases and analytics; the game also plays offline.",
      },
      {
        title: "Information we don't collect",
        body: "We do not collect your name, email, phone number, location, contacts, photos/videos, camera, microphone, files or messages. The game has no chat or messaging between players. Google AdMob may derive an approximate location (country or city level) from your IP address.",
      },
      {
        title: "Legal bases (GDPR, KVKK)",
        body: "Performance of our contract with you (providing the game and purchases); our legitimate interests (keeping the game running, preventing fraud); your consent (personalized ads and analytics). You can change your consent with the privacy options in the game's Settings and in your device settings.",
      },
      {
        title: "Children",
        body: "Brew to the Moon is not designed for kids; it is intended for players aged 13 and over and is not directed at children under 13. We do not knowingly collect personal data from children under 13. If you believe a child's data has been processed, write to us.",
      },
      {
        title: "International transfers",
        body: "Google services may process data in other countries, including the United States; Google relies on safeguards such as the European Commission's Standard Contractual Clauses for these transfers.",
      },
      {
        title: "Retention and deletion",
        items: [
          "The game save exists only on your phone; it is deleted when you uninstall the app or clear its data, and cannot be restored.",
          `If you need help, email ${CONTACT} with the subject "Brew to the Moon data deletion". Because there is no account system and we run no server, we hold no account record to delete.`,
          "Google AdMob, Google Play and Firebase keep their own data under their own policies.",
        ],
      },
      {
        title: "Your rights",
        items: [
          "You can change your ad consent with the \"Privacy options\" button in the game's Settings, turn off personalized ads in your device's Google settings and reset your advertising ID.",
          `Under the GDPR and KVKK you have the right to access, correct, delete and export your data, to object to processing, and to complain to your data protection authority. Write to ${CONTACT} for any request; we reply within 30 days.`,
        ],
      },
      {
        title: "Security",
        body: "The game save is stored encrypted on your phone, and all connections to Google services are encrypted (HTTPS). No system can guarantee absolute security.",
      },
      {
        title: "Changes",
        body: "We may update this policy. The current version is always published on this page and the date below changes.",
      },
    ] as Section[],
    lastUpdated: "Effective and last updated: 27 October 2026",
    backButton: "Back",
  },
} as const;

export default function BrewToTheMoonPrivacyPolicyPage() {
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

          <p className="text-center text-xs" style={{ color: "var(--text-muted)" }}>{s.lastUpdated}</p>
        </div>
      </main>
    </div>
  );
}
