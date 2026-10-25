"use client";

import { useLanguage } from "@/contexts/LanguageContext";
import AmbientBackground from "@/components/AmbientBackground";
import PageHeader from "@/components/PageHeader";

const BRAND = "var(--dripjam)";
const APP_NAME = "Drip Jam";
const PACKAGE_NAME = "com.aurict.dripjam";
const DEVELOPER = "Aurict";
const CONTACT = "contact@aurict.com";

type Section = { title: string; body?: string; items?: string[] };

const STRINGS = {
  tr: {
    title: "Drip Jam Gizlilik Politikası",
    identityTitle: "Bu politika kimin, hangi uygulama için",
    appLabel: "Uygulama",
    packageLabel: "Paket adı (Google Play)",
    developerLabel: "Geliştirici",
    contactLabel: "İletişim",
    identityBody: `Bu gizlilik politikası, ${DEVELOPER} tarafından Android için yayınlanan ${APP_NAME} mobil oyunu için geçerlidir. "Biz" ifadesi oyunu geliştiren ve yayınlayan ${DEVELOPER}'i ifade eder.`,
    sections: [
      {
        title: "Kısaca",
        body: "Drip Jam'i hesap açmadan oynarsınız. Aurict'in Drip Jam için bir sunucusu yoktur; oyun kaydınız telefonunuzda saklanır ve Google Play Games kullanıyorsanız Google hesabınızdaki Play Games kayıtlı oyun alanına yedeklenir. Biz bu verileri göremeyiz. Veri işleyen taraflar yalnızca aşağıda listelenen Google hizmetleridir (Play Games, reklam, satın alma, analitik ve çökme raporları). Kişisel verilerinizi satmayız.",
      },
      {
        title: "Telefonunuzda kalan bilgiler",
        items: [
          "Şifrelenmiş oyun kaydı: açtığınız bölümler, yıldızlar, coin ve güçlendirici sayıları, canlar, albüm çıkartmaları, Paint Pass ve etkinlik ilerlemesi, günlük ödül serisi, seçtiğiniz kova desenleri ve çerçeveler, ses, müzik, titreşim, bildirim ve dil ayarları.",
          "Satın aldığınız kalıcı öğeler (ör. Reklamsız) ve satın alma doğrulaması için Google Play'in sipariş bilgisi.",
          "Play Games ile giriş yaptıysanız Play Games profil adınız (oyunda adınız olarak gösterilir).",
        ],
      },
      {
        title: "Google Play Games",
        items: [
          "Giriş: Google Play Games, cihazınızdaki Play Games hesabınızla sizi oyuna otomatik bağlar. Oyun yalnızca Play Games profil adınızı ve oyuncu kimliğinizi alır; e-postanızı almaz.",
          "Kayıtlı oyunlar: ilerlemenizi cihazlar arasında taşımak için oyun kaydınızın bir kopyası Google hesabınızdaki Play Games kayıtlı oyun alanına yazılır. Bu veriyi Google saklar; bizim bir sunucumuz yoktur ve bu kayda erişemeyiz.",
          "Başarımlar ve skor tabloları: kazandığınız başarımlar ile yıldız, en uzun zincir ve günlük bulmaca süresi skorlarınız Play Games'e gönderilir. Skor tablolarında Play Games profil adınız ve avatarınız, Play Games görünürlük ayarlarınıza göre diğer oyunculara gösterilebilir.",
        ],
      },
      {
        title: "Diğer Google hizmetleri",
        items: [
          "Google AdMob (reklamlar): isteğe bağlı ödüllü reklamlar (devam etme, iki kat coin, ücretsiz coin, can, güçlendirici) ve ilk 10 bölümden sonra bazı bölüm aralarında geçiş reklamları. AdMob reklam kimliğini, IP adresini, cihaz bilgilerini ve reklam etkileşimlerini reklam göstermek, ölçmek ve dolandırıcılığı önlemek için işleyebilir. Avrupa Ekonomik Alanı, Birleşik Krallık ve İsviçre'de ilk açılışta izniniz istenir; kişiselleştirilmiş reklamlar yalnızca izin verirseniz gösterilir. \"Reklamsız\" satın alındığında geçiş reklamları gösterilmez.",
          "Google Play Faturalandırma: coin paketleri, paketler, \"Reklamsız\" ve Paint Pass Google Play üzerinden satılır. Ödemeyi Google işler; kart ve banka bilgileriniz bize ulaşmaz. Satın almalar, Google Play'in imzası kontrol edilerek telefonunuzda doğrulanır.",
          "Firebase Analytics (Google): oyunu iyileştirmek için uygulama örneği kimliği, cihaz modeli, işletim sistemi, ülke, oturum süreleri ve oyun içi olaylar (bölüm başlangıcı ve sonucu, hamle sayısı, devam etme, izlenen ödüllü reklamlar, satın alma adımları, günlük ödüller, paylaşım) toplanır. Adınız, e-postanız veya reklam kimliğiniz toplanmaz ve veriler reklam kişiselleştirmesi için kullanılmaz. İzin gerektiren bölgelerde yalnızca izin verirseniz çalışır.",
          "Firebase Crashlytics (Google): oyun çökerse çökme anındaki teknik bilgiler (cihaz modeli, işletim sistemi sürümü, hata kaydı, uygulama örneği kimliği) hataları düzeltmek için gönderilir. Kişisel bilgi içermez. İzin gerektiren bölgelerde yalnızca izin verirseniz çalışır.",
          "Google Play uygulama içi değerlendirme: oyun ara sıra Google Play'in puanlama penceresini açabilir. Puanınızı ve yorumunuzu doğrudan Google alır; biz göremeyiz.",
        ],
      },
      {
        title: "Bildirimler ve paylaşım",
        items: [
          "Bildirimler: izin verirseniz oyun, canlarınız dolduğunda, günlük ödülünüz hazır olduğunda veya seriniz bozulmak üzereyken hatırlatma gösterir. Bu bildirimler telefonunuzda zamanlanır; hiçbir sunucuya veri gönderilmez. İzni Ayarlar'dan veya oyunun ayarlarından kapatabilirsiniz.",
          "Paylaşım: \"Paylaş\" düğmesine bastığınızda bitirdiğiniz resmin bir görseli Android'in paylaşım ekranına verilir ve yalnızca sizin seçtiğiniz uygulamaya gider.",
        ],
      },
      {
        title: "Toplamadığımız bilgiler",
        body: "Adınızı, e-postanızı, telefon numaranızı, konumunuzu, rehberinizi, fotoğraf/videolarınızı, kameranızı, mikrofonunuzu, dosyalarınızı veya mesajlarınızı toplamıyoruz. Oyunda sohbet veya oyuncular arası mesajlaşma yoktur. Google AdMob, IP adresinden yaklaşık konum (ülke/şehir düzeyi) çıkarabilir.",
      },
      {
        title: "Hukuki dayanak (KVKK, GDPR)",
        body: "Sizinle yaptığımız sözleşmenin ifası (oyunun, ilerleme eşitlemesinin ve satın almaların sunulması); meşru menfaatlerimiz (oyunun çalışması, dolandırıcılığın önlenmesi); açık rızanız (kişiselleştirilmiş reklam, bildirimler ve izin gerektiren bölgelerde analitik ve çökme raporları). İzninizi cihazınızın ayarlarından ve oyunun izin ekranından değiştirebilirsiniz.",
      },
      {
        title: "Çocuklar",
        body: "Drip Jam 13 yaş altındaki çocuklara yönelik değildir ve 13 yaş altındaki çocuklardan bilerek kişisel veri toplamayız. Bir çocuğun verisinin işlendiğini düşünüyorsanız bize yazın.",
      },
      {
        title: "Yurt dışına aktarım",
        body: "Google hizmetleri verileri ABD dahil başka ülkelerde işleyebilir; Google bu aktarımlarda Avrupa Komisyonu Standart Sözleşme Hükümleri gibi güvencelere dayanır.",
      },
      {
        title: "Saklama ve silme",
        items: [
          "Telefonunuzdaki oyun kaydı, uygulamayı kaldırdığınızda veya uygulama verilerini temizlediğinizde silinir.",
          "Play Games'teki kayıtlı oyununuzu, başarımlarınızı ve skorlarınızı Play Games uygulamasında veya play.google.com/games adresinde Ayarlar → Play Games hesabını ve verilerini sil bölümünden (yalnızca Drip Jam verileri için oyun bazında da) silebilirsiniz.",
          `Yardım gerekirse ${CONTACT} adresine \"Drip Jam veri silme\" konulu bir e-posta gönderin; sizi 7 gün içinde yönlendiririz. Sunucumuz olmadığı için bizde silinecek bir hesap kaydı bulunmaz.`,
          "Firebase Analytics verileri en fazla 14 ay, Crashlytics çökme raporları 90 gün saklanır.",
          "Google AdMob, Google Play ve Google Play Games kendi verilerini kendi politikalarına göre saklar.",
        ],
      },
      {
        title: "Haklarınız",
        items: [
          "Kişiselleştirilmiş reklamları cihazınızın Google ayarlarından kapatabilir, reklam kimliğinizi sıfırlayabilirsiniz.",
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
    lastUpdated: "Yürürlük ve son güncelleme: 25 Ekim 2026",
    backButton: "Geri",
  },
  en: {
    title: "Drip Jam Privacy Policy",
    identityTitle: "Whose policy this is, and for which app",
    appLabel: "App",
    packageLabel: "Package name (Google Play)",
    developerLabel: "Developer",
    contactLabel: "Contact",
    identityBody: `This privacy policy applies to the ${APP_NAME} mobile game published by ${DEVELOPER} for Android. "We" and "us" mean ${DEVELOPER}, who develops and publishes the game.`,
    sections: [
      {
        title: "In short",
        body: "You play Drip Jam without creating an account. Aurict runs no server for Drip Jam: your game save is kept on your phone and, if you use Google Play Games, backed up to the Play Games saved-games area of your Google account. We cannot see this data. The only parties that process data are the Google services listed below (Play Games, ads, purchases, analytics and crash reports). We do not sell your personal data.",
      },
      {
        title: "Information that stays on your phone",
        items: [
          "Encrypted game save: unlocked levels, stars, coin and booster counts, lives, album stickers, Paint Pass and event progress, daily reward streak, the bucket patterns and frames you chose, and sound, music, vibration, notification and language settings.",
          "Permanent items you bought (e.g. No Ads) and Google Play's order details used to verify purchases.",
          "If you are signed in to Play Games, your Play Games profile name (shown as your name in the game).",
        ],
      },
      {
        title: "Google Play Games",
        items: [
          "Sign-in: Google Play Games connects the game to the Play Games account on your device automatically. The game receives only your Play Games profile name and player ID, never your email.",
          "Saved games: to move your progress between devices, a copy of your game save is written to the Play Games saved-games area of your Google account. Google stores this data; we have no server and cannot access it.",
          "Achievements and leaderboards: the achievements you earn and your scores for stars, longest chain and daily puzzle time are sent to Play Games. Leaderboards may show your Play Games profile name and avatar to other players, depending on your Play Games visibility settings.",
        ],
      },
      {
        title: "Other Google services",
        items: [
          "Google AdMob (ads): optional rewarded ads (continue, double coins, free coins, a life, boosters) and, after the first 10 levels, interstitial ads between some levels. AdMob may process your advertising ID, IP address, device information and ad interactions to show and measure ads and prevent fraud. In the European Economic Area, the UK and Switzerland you are asked for consent on first launch; personalized ads are shown only if you agree. Buying \"No Ads\" turns off interstitial ads.",
          "Google Play Billing: coin packs, bundles, \"No Ads\" and the Paint Pass are sold through Google Play. Payments are processed by Google; we never receive card or bank details. Purchases are verified on your phone by checking Google Play's signature.",
          "Firebase Analytics (Google): to improve the game we collect an app instance ID, device model, operating system, country, session length and in-game events (level start and result, move counts, continues, rewarded ads watched, purchase steps, daily rewards, shares). Your name, email and advertising ID are not collected, and the data is not used for ad personalization. In regions that require consent it runs only if you agree.",
          "Firebase Crashlytics (Google): if the game crashes, technical details from the moment of the crash (device model, OS version, error log, app instance ID) are sent so we can fix bugs. They contain no personal information. In regions that require consent it runs only if you agree.",
          "Google Play in-app review: the game may occasionally open Google Play's rating dialog. Your rating and review go directly to Google; we cannot see them.",
        ],
      },
      {
        title: "Notifications and sharing",
        items: [
          "Notifications: if you allow them, the game shows reminders when your lives are full, your daily reward is ready or your streak is about to end. They are scheduled on your phone; no data is sent to any server. You can turn them off in your device settings or in the game's settings.",
          "Sharing: when you tap \"Share\", an image of the picture you finished is handed to Android's share sheet and goes only to the app you choose.",
        ],
      },
      {
        title: "Information we don't collect",
        body: "We do not collect your name, email, phone number, location, contacts, photos/videos, camera, microphone, files or messages. The game has no chat or messaging between players. Google AdMob may derive an approximate location (country or city level) from your IP address.",
      },
      {
        title: "Legal bases (GDPR, KVKK)",
        body: "Performance of our contract with you (providing the game, progress sync and purchases); our legitimate interests (keeping the game running, preventing fraud); your consent (personalized ads, notifications, and analytics and crash reports in regions that require it). You can change your consent in your device settings and in the game's consent screen.",
      },
      {
        title: "Children",
        body: "Drip Jam is not directed at children under 13, and we do not knowingly collect personal data from children under 13. If you believe a child's data has been processed, write to us.",
      },
      {
        title: "International transfers",
        body: "Google services may process data in other countries, including the United States; Google relies on safeguards such as the European Commission's Standard Contractual Clauses for these transfers.",
      },
      {
        title: "Retention and deletion",
        items: [
          "The game save on your phone is deleted when you uninstall the app or clear its data.",
          "You can delete your Play Games saved game, achievements and scores in the Play Games app or at play.google.com/games under Settings → Delete Play Games account & data (also per game, for Drip Jam only).",
          `If you need help, email ${CONTACT} with the subject \"Drip Jam data deletion\"; we will guide you within 7 days. Because we run no server, we hold no account record to delete.`,
          "Firebase Analytics data is kept for at most 14 months; Crashlytics crash reports for 90 days.",
          "Google AdMob, Google Play and Google Play Games keep their own data under their own policies.",
        ],
      },
      {
        title: "Your rights",
        items: [
          "You can turn off personalized ads and reset your advertising ID in your device's Google settings.",
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
    lastUpdated: "Effective and last updated: 25 October 2026",
    backButton: "Back",
  },
} as const;

export default function DripJamPrivacyPolicyPage() {
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
