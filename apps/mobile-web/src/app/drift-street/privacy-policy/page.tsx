"use client";

import { useLanguage } from "@/contexts/LanguageContext";
import AmbientBackground from "@/components/AmbientBackground";
import PageHeader from "@/components/PageHeader";

const BRAND = "var(--drift)";
const APP_NAME = "Drift Street";
const PACKAGE_NAME = "com.aurict.driftstreet";
const DEVELOPER = "Aurict";
const CONTACT = "contact@aurict.com";

type Section = { title: string; body?: string; items?: string[] };

const STRINGS = {
  tr: {
    title: "Drift Street Gizlilik Politikası",
    identityTitle: "Bu politika kimin, hangi uygulama için",
    appLabel: "Uygulama",
    packageLabel: "Paket adı (Google Play)",
    developerLabel: "Geliştirici",
    contactLabel: "İletişim",
    identityBody: `Bu gizlilik politikası, ${DEVELOPER} tarafından Android için yayınlanan ${APP_NAME} mobil oyunu için geçerlidir. "Biz" ifadesi oyunu geliştiren ve yayınlayan ${DEVELOPER}'i ifade eder.`,
    sections: [
      {
        title: "Kısaca",
        body: "Drift Street'in kendi sunucusu yoktur ve hesap açmanızı istemez. İlerlemeniz telefonunuzda şifreli olarak saklanır. Veri toplayan tek taraflar aşağıda listelenen Google hizmetleridir (reklam, satın alma, isteğe bağlı Play Games ve analitik). Kişisel verilerinizi satmayız.",
      },
      {
        title: "Telefonunuzda kalan bilgiler",
        items: [
          "Oyun kaydı: level ilerlemesi, yıldızlar, rekorlar, coin, açılan araçlar, günlük ödül durumu, ayarlar ve dil. Bu kayıt cihazınıza özel bir anahtarla şifrelenir ve bize gönderilmez.",
          "Satın alma kayıtları: aynı satın almanın iki kez verilmemesi için Google Play'in işlem anahtarı cihazınızda saklanır. Satın almanın gerçek olduğu, Google'ın imzası telefonunuzda doğrulanarak kontrol edilir.",
          "Bildirimler: hatırlatmalar telefonunuzda zamanlanır (günlük hediye hazır olduğunda ve 3 gün oynamadığınızda). Bunun için hiçbir sunucuya bilgi gönderilmez.",
        ],
      },
      {
        title: "Google hizmetleri",
        items: [
          "Google AdMob (reklamlar): isteğe bağlı ödüllü reklamlar (ek süre, coin x2) ve bazı level sonlarında geçiş reklamları. AdMob reklam kimliğini, IP adresini, cihaz bilgilerini ve reklam etkileşimlerini reklam göstermek, ölçmek ve dolandırıcılığı önlemek için işleyebilir. Avrupa Ekonomik Alanı, Birleşik Krallık ve İsviçre'de ilk açılışta izniniz istenir; kişiselleştirilmiş reklamlar yalnızca izin verirseniz gösterilir. \"Reklamları kaldır\" satın alındığında geçiş reklamları gösterilmez.",
          "Google Play Faturalandırma: coin paketleri ve \"Reklamları kaldır\" Google Play üzerinden satılır. Ödemeyi Google işler; kart ve banka bilgileriniz bize ulaşmaz.",
          "Google Play Games Hizmetleri (isteğe bağlı): Play Games ile oturum açarsanız oyuncu kimliğiniz ve Play Games adınız lider tablolarında gösterilir; oyun kaydınızın bir kopyası Google hesabınızdaki Saved Games alanında saklanır, böylece başka cihazda devam edebilirsiniz.",
          "Firebase Analytics (Google): oyunu iyileştirmek için uygulama örneği kimliği, cihaz modeli, işletim sistemi, ülke, oturum süreleri ve oyun içi olaylar (level başlangıcı ve sonucu, puan, öğretici adımları, izlenen ödüllü reklamlar, satın almalar) toplanır. Adınız veya e-postanız toplanmaz ve reklam kişiselleştirmesi için kullanılmaz. İzin gerektiren bölgelerde yalnızca izin verirseniz çalışır.",
        ],
      },
      {
        title: "Toplamadığımız bilgiler",
        body: "Adınızı, e-postanızı, telefon numaranızı, konumunuzu, rehberinizi, fotoğraf/videolarınızı, kameranızı, mikrofonunuzu, dosyalarınızı veya mesajlarınızı toplamıyoruz. Oyunda sohbet veya oyuncular arası mesajlaşma yoktur. Google AdMob, IP adresinden yaklaşık konum (ülke/şehir düzeyi) çıkarabilir.",
      },
      {
        title: "Hukuki dayanak (KVKK, GDPR)",
        body: "Sizinle yaptığımız sözleşmenin ifası (oyunun ve satın almaların sunulması); meşru menfaatlerimiz (hizmetin çalışması, dolandırıcılığın önlenmesi); açık rızanız (kişiselleştirilmiş reklam ve izin gerektiren bölgelerde analitik). Rızanızı istediğiniz zaman Ayarlar → Gizlilik seçenekleri'nden değiştirebilirsiniz.",
      },
      {
        title: "Çocuklar",
        body: "Drift Street 13 yaş altındaki çocuklara yönelik değildir ve 13 yaş altındaki çocuklardan bilerek kişisel veri toplamayız. Bir çocuğun verisinin işlendiğini düşünüyorsanız bize yazın.",
      },
      {
        title: "Yurt dışına aktarım",
        body: "Google hizmetleri verileri ABD dahil başka ülkelerde işleyebilir; Google bu aktarımlarda Avrupa Komisyonu Standart Sözleşme Hükümleri gibi güvencelere dayanır.",
      },
      {
        title: "Saklama ve silme",
        items: [
          "Telefonunuzdaki oyun kaydı, uygulamayı kaldırdığınızda veya uygulama verilerini temizlediğinizde silinir.",
          "Play Games'teki kayıt kopyasını ve lider tablosu kayıtlarını Play Games uygulamasının ayarlarından ya da Google hesabınızdan silebilirsiniz.",
          "Firebase Analytics verileri en fazla 14 ay saklanır.",
          "Google AdMob ve Google Play kendi verilerini kendi politikalarına göre saklar.",
        ],
      },
      {
        title: "Haklarınız",
        items: [
          "Reklam ve analitik izinlerinizi istediğiniz zaman değiştirin: Ayarlar → Gizlilik seçenekleri. Kişiselleştirilmiş reklamları cihazınızın Google ayarlarından da kapatabilir, reklam kimliğinizi sıfırlayabilirsiniz.",
          "Bildirimleri oyunun Ayarlar ekranından veya telefonunuzun ayarlarından kapatabilirsiniz.",
          `KVKK ve GDPR kapsamında verilerinize erişme, düzeltme, silme, taşıma, işlemeye itiraz etme ve veri koruma otoritesine (ör. KVKK Kurulu) şikâyet etme haklarınız vardır. Talepleriniz için ${CONTACT} adresine yazın; 30 gün içinde yanıt veririz.`,
        ],
      },
      {
        title: "Güvenlik",
        body: "Oyun kaydınız cihazınızda şifrelenir. Google hizmetleriyle tüm bağlantılar şifrelidir. Hiçbir sistem mutlak güvenlik garantisi veremez.",
      },
      {
        title: "Değişiklikler",
        body: "Bu politikayı güncelleyebiliriz. Güncel sürüm her zaman bu sayfada yayınlanır ve aşağıdaki tarih değişir.",
      },
    ] as Section[],
    lastUpdated: "Yürürlük ve son güncelleme: 23 Ekim 2026",
    backButton: "Geri",
  },
  en: {
    title: "Drift Street Privacy Policy",
    identityTitle: "Whose policy this is, and for which app",
    appLabel: "App",
    packageLabel: "Package name (Google Play)",
    developerLabel: "Developer",
    contactLabel: "Contact",
    identityBody: `This privacy policy applies to the ${APP_NAME} mobile game published by ${DEVELOPER} for Android. "We" and "us" mean ${DEVELOPER}, who develops and publishes the game.`,
    sections: [
      {
        title: "In short",
        body: "Drift Street has no server of its own and never asks you to create an account. Your progress is stored encrypted on your phone. The only parties that collect data are the Google services listed below (ads, purchases, optional Play Games and analytics). We do not sell your personal data.",
      },
      {
        title: "Information that stays on your phone",
        items: [
          "Game save: level progress, stars, records, coins, unlocked cars, daily reward state, settings and language. The save is encrypted with a key unique to your device and is never sent to us.",
          "Purchase records: Google Play's purchase token is stored on your device so the same purchase is never granted twice. Purchases are checked by verifying Google's signature on your phone.",
          "Notifications: reminders are scheduled on your phone (when the daily gift is ready and after 3 days without playing). No information is sent to any server for this.",
        ],
      },
      {
        title: "Google services",
        items: [
          "Google AdMob (ads): optional rewarded ads (extra time, double coins) and interstitial ads after some levels. AdMob may process your advertising ID, IP address, device information and ad interactions to show and measure ads and prevent fraud. In the European Economic Area, the UK and Switzerland you are asked for consent on first launch; personalized ads are shown only if you agree. Buying \"Remove ads\" turns off interstitial ads.",
          "Google Play Billing: coin packs and \"Remove ads\" are sold through Google Play. Payments are processed by Google; we never receive card or bank details.",
          "Google Play Games Services (optional): if you sign in to Play Games, your player ID and Play Games name are shown on leaderboards, and a copy of your save is kept in Saved Games in your Google account so you can continue on another device.",
          "Firebase Analytics (Google): to improve the game we collect an app instance ID, device model, operating system, country, session length and in-game events (level start and result, score, tutorial steps, rewarded ads watched, purchases). Your name and email are not collected, and the data is not used for ad personalization. In regions that require consent it runs only if you agree.",
        ],
      },
      {
        title: "Information we don't collect",
        body: "We do not collect your name, email, phone number, location, contacts, photos/videos, camera, microphone, files or messages. The game has no chat or messaging between players. Google AdMob may derive an approximate location (country or city level) from your IP address.",
      },
      {
        title: "Legal bases (GDPR, KVKK)",
        body: "Performance of our contract with you (providing the game and purchases); our legitimate interests (keeping the service running, preventing fraud); your consent (personalized ads, and analytics in regions that require it). You can change your consent at any time in Settings → Privacy options.",
      },
      {
        title: "Children",
        body: "Drift Street is not directed at children under 13, and we do not knowingly collect personal data from children under 13. If you believe a child's data has been processed, write to us.",
      },
      {
        title: "International transfers",
        body: "Google services may process data in other countries, including the United States; Google relies on safeguards such as the European Commission's Standard Contractual Clauses for these transfers.",
      },
      {
        title: "Retention and deletion",
        items: [
          "The game save on your phone is deleted when you uninstall the app or clear its data.",
          "You can delete the Play Games save copy and leaderboard entries from the Play Games app settings or your Google account.",
          "Firebase Analytics data is kept for at most 14 months.",
          "Google AdMob and Google Play keep their own data under their own policies.",
        ],
      },
      {
        title: "Your rights",
        items: [
          "Change ad and analytics consent at any time in Settings → Privacy options. You can also turn off personalized ads and reset your advertising ID in your device's Google settings.",
          "Turn off notifications in the game's Settings screen or in your phone's settings.",
          `Under the GDPR and KVKK you have the right to access, correct, delete and export your data, to object to processing, and to complain to your data protection authority. Write to ${CONTACT} for any request; we reply within 30 days.`,
        ],
      },
      {
        title: "Security",
        body: "Your game save is encrypted on your device. All connections to Google services are encrypted. No system can guarantee absolute security.",
      },
      {
        title: "Changes",
        body: "We may update this policy. The current version is always published on this page and the date below changes.",
      },
    ] as Section[],
    lastUpdated: "Effective and last updated: 23 October 2026",
    backButton: "Back",
  },
} as const;

export default function DriftStreetPrivacyPolicyPage() {
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
