"use client";

import { useLanguage } from "@/contexts/LanguageContext";
import AmbientBackground from "@/components/AmbientBackground";
import PageHeader from "@/components/PageHeader";

const BRAND = "var(--roomie)";
const APP_NAME = "Roomie Puzzle";
const PACKAGE_NAME = "com.aurict.roomiepuzzle";
const DEVELOPER = "Aurict";
const CONTACT = "contact@aurict.com";

type Section = { title: string; body?: string; items?: string[] };

const STRINGS = {
  tr: {
    title: "Roomie Puzzle Gizlilik Politikası",
    identityTitle: "Bu politika kimin, hangi uygulama için",
    appLabel: "Uygulama",
    packageLabel: "Paket adı (Google Play)",
    developerLabel: "Geliştirici",
    contactLabel: "İletişim",
    identityBody: `Bu gizlilik politikası, ${DEVELOPER} tarafından Android için yayınlanan ${APP_NAME} mobil oyunu için geçerlidir. "Biz" ifadesi oyunu geliştiren ve yayınlayan ${DEVELOPER}'i ifade eder.`,
    sections: [
      {
        title: "Kısaca",
        body: "Roomie Puzzle hesap açmanızı istemez. Hikâye ilerlemeniz yalnızca telefonunuzda saklanır. İsteğe bağlı Takım Ligi'ne katılırsanız otomatik verilen oyuncu adınız, takımınız ve haftalık puanınız lig tablosunda gösterilmek üzere Google Firebase'de tutulur. Bunun dışında veri toplayan taraflar aşağıda listelenen Google hizmetleridir (reklam, satın alma ve analitik). Kişisel verilerinizi satmayız.",
      },
      {
        title: "Telefonunuzda kalan bilgiler",
        items: [
          "Oyun kaydı: stage ve bölüm ilerlemesi, yıldızlar, balık, ipucu ve süre takviyeleri, günlük görev durumu, Hatıra Yolu ilerlemesi, ses ayarları ve dil. Bu kayıt cihazınızda tutulur ve bize gönderilmez.",
          "Satın alma kayıtları: aynı satın almanın iki kez verilmemesi için Google Play'in işlem anahtarı cihazınızda saklanır. Satın almanın gerçek olduğu, Google'ın imzası telefonunuzda doğrulanarak kontrol edilir.",
        ],
      },
      {
        title: "Takım Ligi (isteğe bağlı)",
        items: [
          "Takım Ligi'ni açtığınızda Firebase Authentication ile anonim bir oyuncu kimliği oluşturulur. Adınız, e-postanız veya telefon numaranız istenmez.",
          "Cloud Firestore'da şunlar saklanır: anonim oyuncu kimliği, oyunun otomatik verdiği oyuncu adı (ör. \"Kaptan 4821\"), seçtiğiniz takım, haftalık puanınız ve oynadığınız maç sayısı. Takım toplamları ve en iyi oyuncular, oyunu oynayan herkes tarafından görülebilen lig tablosunda gösterilir.",
          "Ligi hiç açmazsanız bu bilgilerin hiçbiri oluşturulmaz.",
        ],
      },
      {
        title: "Google hizmetleri",
        items: [
          "Google AdMob (reklamlar): isteğe bağlı ödüllü reklamlar (ek süre, ipucu, ödülü iki katına çıkarma) ve bazı bölüm sonlarında geçiş reklamları. AdMob reklam kimliğini, IP adresini, cihaz bilgilerini ve reklam etkileşimlerini reklam göstermek, ölçmek ve dolandırıcılığı önlemek için işleyebilir. Avrupa Ekonomik Alanı, Birleşik Krallık ve İsviçre'de ilk açılışta izniniz istenir; kişiselleştirilmiş reklamlar yalnızca izin verirseniz gösterilir. \"Reklamları kaldır\" satın alındığında geçiş reklamları gösterilmez.",
          "Google Play Faturalandırma: paketler (ipucu, süre, balık) ve \"Reklamları kaldır\" Google Play üzerinden satılır. Ödemeyi Google işler; kart ve banka bilgileriniz bize ulaşmaz.",
          "Firebase Analytics (Google): oyunu iyileştirmek için uygulama örneği kimliği, cihaz modeli, işletim sistemi, ülke, oturum süreleri ve oyun içi olaylar (bölüm başlangıcı ve sonucu, lig maçları, izlenen ödüllü reklamlar, satın almalar) toplanır. Adınız veya e-postanız toplanmaz ve reklam kişiselleştirmesi için kullanılmaz. İzin gerektiren bölgelerde yalnızca izin verirseniz çalışır.",
          "Firebase Crashlytics (Google): oyun çökerse çökme anındaki teknik bilgiler (cihaz modeli, işletim sistemi sürümü, hata kaydı, uygulama örneği kimliği) hataları düzeltmek için gönderilir. Kişisel bilgi içermez. İzin gerektiren bölgelerde yalnızca izin verirseniz çalışır.",
          "Firebase Authentication ve Cloud Firestore (Google): yalnızca Takım Ligi için, yukarıda anlatıldığı gibi.",
        ],
      },
      {
        title: "Toplamadığımız bilgiler",
        body: "Adınızı, e-postanızı, telefon numaranızı, konumunuzu, rehberinizi, fotoğraf/videolarınızı, kameranızı, mikrofonunuzu, dosyalarınızı veya mesajlarınızı toplamıyoruz. Oyunda sohbet veya oyuncular arası mesajlaşma yoktur. Google AdMob, IP adresinden yaklaşık konum (ülke/şehir düzeyi) çıkarabilir.",
      },
      {
        title: "Hukuki dayanak (KVKK, GDPR)",
        body: "Sizinle yaptığımız sözleşmenin ifası (oyunun, Takım Ligi'nin ve satın almaların sunulması); meşru menfaatlerimiz (hizmetin çalışması, hile ve dolandırıcılığın önlenmesi); açık rızanız (kişiselleştirilmiş reklam ve izin gerektiren bölgelerde analitik ve çökme raporları). Rızanızı istediğiniz zaman Ayarlar → Reklam gizlilik seçenekleri'nden değiştirebilirsiniz.",
      },
      {
        title: "Çocuklar",
        body: "Roomie Puzzle 13 yaş altındaki çocuklara yönelik değildir ve 13 yaş altındaki çocuklardan bilerek kişisel veri toplamayız. Bir çocuğun verisinin işlendiğini düşünüyorsanız bize yazın.",
      },
      {
        title: "Yurt dışına aktarım",
        body: "Google hizmetleri verileri ABD dahil başka ülkelerde işleyebilir; Google bu aktarımlarda Avrupa Komisyonu Standart Sözleşme Hükümleri gibi güvencelere dayanır.",
      },
      {
        title: "Saklama ve silme",
        items: [
          "Telefonunuzdaki oyun kaydı, uygulamayı kaldırdığınızda veya uygulama verilerini temizlediğinizde silinir.",
          `Takım Ligi kayıtlarınızın silinmesini istediğinizde ${CONTACT} adresine lig tablosundaki oyuncu adınızla yazın; 30 gün içinde sileriz.`,
          "Firebase Analytics verileri en fazla 14 ay, Crashlytics çökme raporları 90 gün saklanır.",
          "Google AdMob ve Google Play kendi verilerini kendi politikalarına göre saklar.",
        ],
      },
      {
        title: "Haklarınız",
        items: [
          "Reklam ve analitik izinlerinizi istediğiniz zaman değiştirin: Ayarlar → Reklam gizlilik seçenekleri. Kişiselleştirilmiş reklamları cihazınızın Google ayarlarından da kapatabilir, reklam kimliğinizi sıfırlayabilirsiniz.",
          `KVKK ve GDPR kapsamında verilerinize erişme, düzeltme, silme, taşıma, işlemeye itiraz etme ve veri koruma otoritesine (ör. KVKK Kurulu) şikâyet etme haklarınız vardır. Talepleriniz için ${CONTACT} adresine yazın; 30 gün içinde yanıt veririz.`,
        ],
      },
      {
        title: "Güvenlik",
        body: "Google hizmetleriyle tüm bağlantılar şifrelidir. Lig verilerine yazma, oyuncunun yalnızca kendi kaydını güncelleyebileceği güvenlik kurallarıyla sınırlandırılmıştır. Hiçbir sistem mutlak güvenlik garantisi veremez.",
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
    title: "Roomie Puzzle Privacy Policy",
    identityTitle: "Whose policy this is, and for which app",
    appLabel: "App",
    packageLabel: "Package name (Google Play)",
    developerLabel: "Developer",
    contactLabel: "Contact",
    identityBody: `This privacy policy applies to the ${APP_NAME} mobile game published by ${DEVELOPER} for Android. "We" and "us" mean ${DEVELOPER}, who develops and publishes the game.`,
    sections: [
      {
        title: "In short",
        body: "Roomie Puzzle never asks you to create an account. Your story progress is stored only on your phone. If you join the optional Team League, an automatically assigned player name, your team and your weekly score are kept in Google Firebase so they can be shown on the league table. Apart from that, the only parties that collect data are the Google services listed below (ads, purchases and analytics). We do not sell your personal data.",
      },
      {
        title: "Information that stays on your phone",
        items: [
          "Game save: stage and level progress, stars, fish, hints and time boosts, daily task state, Memory Road progress, sound settings and language. The save stays on your device and is never sent to us.",
          "Purchase records: Google Play's purchase token is stored on your device so the same purchase is never granted twice. Purchases are checked by verifying Google's signature on your phone.",
        ],
      },
      {
        title: "Team League (optional)",
        items: [
          "When you open the Team League, an anonymous player ID is created with Firebase Authentication. Your name, email or phone number are never requested.",
          "Cloud Firestore stores: the anonymous player ID, the player name the game assigns automatically (e.g. \"Kaptan 4821\"), the team you choose, your weekly score and the number of matches you played. Team totals and the top players appear on a league table that everyone who plays can see.",
          "If you never open the league, none of this is created.",
        ],
      },
      {
        title: "Google services",
        items: [
          "Google AdMob (ads): optional rewarded ads (extra time, hints, double rewards) and interstitial ads after some levels. AdMob may process your advertising ID, IP address, device information and ad interactions to show and measure ads and prevent fraud. In the European Economic Area, the UK and Switzerland you are asked for consent on first launch; personalized ads are shown only if you agree. Buying \"Remove ads\" turns off interstitial ads.",
          "Google Play Billing: packs (hints, time, fish) and \"Remove ads\" are sold through Google Play. Payments are processed by Google; we never receive card or bank details.",
          "Firebase Analytics (Google): to improve the game we collect an app instance ID, device model, operating system, country, session length and in-game events (level start and result, league matches, rewarded ads watched, purchases). Your name and email are not collected, and the data is not used for ad personalization. In regions that require consent it runs only if you agree.",
          "Firebase Crashlytics (Google): if the game crashes, technical details from the moment of the crash (device model, OS version, error log, app instance ID) are sent so we can fix bugs. They contain no personal information. In regions that require consent it runs only if you agree.",
          "Firebase Authentication and Cloud Firestore (Google): only for the Team League, as described above.",
        ],
      },
      {
        title: "Information we don't collect",
        body: "We do not collect your name, email, phone number, location, contacts, photos/videos, camera, microphone, files or messages. The game has no chat or messaging between players. Google AdMob may derive an approximate location (country or city level) from your IP address.",
      },
      {
        title: "Legal bases (GDPR, KVKK)",
        body: "Performance of our contract with you (providing the game, the Team League and purchases); our legitimate interests (keeping the service running, preventing cheating and fraud); your consent (personalized ads, and analytics and crash reports in regions that require it). You can change your consent at any time in Settings → Ad privacy options.",
      },
      {
        title: "Children",
        body: "Roomie Puzzle is not directed at children under 13, and we do not knowingly collect personal data from children under 13. If you believe a child's data has been processed, write to us.",
      },
      {
        title: "International transfers",
        body: "Google services may process data in other countries, including the United States; Google relies on safeguards such as the European Commission's Standard Contractual Clauses for these transfers.",
      },
      {
        title: "Retention and deletion",
        items: [
          "The game save on your phone is deleted when you uninstall the app or clear its data.",
          `To have your Team League records deleted, write to ${CONTACT} with the player name shown on the league table; we delete them within 30 days.`,
          "Firebase Analytics data is kept for at most 14 months; Crashlytics crash reports for 90 days.",
          "Google AdMob and Google Play keep their own data under their own policies.",
        ],
      },
      {
        title: "Your rights",
        items: [
          "Change ad and analytics consent at any time in Settings → Ad privacy options. You can also turn off personalized ads and reset your advertising ID in your device's Google settings.",
          `Under the GDPR and KVKK you have the right to access, correct, delete and export your data, to object to processing, and to complain to your data protection authority. Write to ${CONTACT} for any request; we reply within 30 days.`,
        ],
      },
      {
        title: "Security",
        body: "All connections to Google services are encrypted. Writing league data is limited by security rules so a player can only update their own record. No system can guarantee absolute security.",
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

export default function RoomiePuzzlePrivacyPolicyPage() {
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
