"use client";

import { useLanguage } from "@/contexts/LanguageContext";
import AmbientBackground from "@/components/AmbientBackground";
import PageHeader from "@/components/PageHeader";

const BRAND = "var(--jellysort)";
const APP_NAME = "Jelly Sort";
const PACKAGE_NAME = "com.aurict.jellysort";
const DEVELOPER = "Aurict";
const CONTACT = "contact@aurict.com";

type Section = { title: string; body?: string; items?: string[] };

const STRINGS = {
  tr: {
    title: "Jelly Sort Gizlilik Politikası",
    identityTitle: "Bu politika kimin, hangi uygulama için",
    appLabel: "Uygulama",
    packageLabel: "Paket adı (Google Play)",
    developerLabel: "Geliştirici",
    contactLabel: "İletişim",
    identityBody: `Bu gizlilik politikası, ${DEVELOPER} tarafından Android için yayınlanan ${APP_NAME} mobil oyunu için geçerlidir. "Biz" ifadesi oyunu geliştiren ve yayınlayan ${DEVELOPER}'i ifade eder.`,
    sections: [
      {
        title: "Kısaca",
        body: "Jelly Sort'u misafir olarak, hesap açmadan oynayabilirsiniz; bu durumda ilerlemeniz yalnızca telefonunuzda saklanır. İsteğe bağlı olarak Google hesabınızla giriş yaparsanız, ilerlemenizi cihazlar arasında taşımak, satın almaları doğrulamak ve hileyi önlemek için oyun verileriniz Aurict'in kendi sunucusunda (jellysort.aurict.com) tutulur. E-posta adresinizi saklamayız. Bunun dışında veri işleyen taraflar aşağıda listelenen Google hizmetleridir. Kişisel verilerinizi satmayız.",
      },
      {
        title: "Telefonunuzda kalan bilgiler",
        items: [
          "Oyun kaydı: açtığınız seviyeler, yıldızlar, en iyi skorlar, coin ve booster sayıları, günlük meydan okuma serisi, seçtiğiniz tema, ses, titreşim ve dil ayarları.",
          "Bitirdiğiniz seviyelerin hamle listeleri, Google ile giriş yaparsanız sunucuya gönderilmek üzere telefonunuzda sıraya alınır.",
          "Google ile giriş yaptıysanız oturum anahtarları uygulamanın özel deposunda saklanır.",
        ],
      },
      {
        title: "Google ile giriş yaparsanız sunucumuzda saklananlar",
        items: [
          "Google hesabınızın sabit kimliği (Google'ın verdiği bir sayı). Adınızı, e-postanızı veya profil fotoğrafınızı saklamayız.",
          "Oyun ilerlemeniz: bitirdiğiniz seviyeler, yıldızlar ve en iyi skorlar; her bitirilen seviyenin hamle listesi ve süresi. Hamle listeleri, ödüllerin gerçekten kazanıldığını doğrulamak için sunucuda yeniden oynatılır.",
          "Coin hareketleri (kazanılan ve harcanan her coin), booster envanteriniz ve satın aldığınız kalıcı öğeler (Reklamsız, temalar).",
          "Satın alma kayıtları: Google Play'in satın alma anahtarı, ürün ve sipariş numarası. Ödeme bilgilerinizi görmeyiz.",
          "Ödüllü reklam kayıtları: Google AdMob'un işlem numarası ve hangi ödül için izlendiği.",
          "Günlük meydan okuma sonuçlarınız. Günlük sıralamada adınız değil, otomatik verilen bir takma ad (ör. \"Kiwi #4821\") gösterilir.",
          "Sunucumuz Google Cloud'da, Avrupa – Hollanda bölgesinde çalışır. IP adresiniz kötüye kullanımı sınırlamak için işlenir ve sunucu erişim kayıtlarında 14 gün tutulur.",
        ],
      },
      {
        title: "Google hizmetleri",
        items: [
          "Google ile giriş (Android Credential Manager): Google, hesabınızı doğrulayan imzalı bir kimlik belgesi verir; biz bundan yalnızca hesap kimliğini kullanırız.",
          "Google AdMob (reklamlar): isteğe bağlı ödüllü reklamlar (ek hamle, booster, geri alma) ve bazı seviye aralarında geçiş reklamları. AdMob reklam kimliğini, IP adresini, cihaz bilgilerini ve reklam etkileşimlerini reklam göstermek, ölçmek ve dolandırıcılığı önlemek için işleyebilir. Avrupa Ekonomik Alanı, Birleşik Krallık ve İsviçre'de ilk açılışta izniniz istenir; kişiselleştirilmiş reklamlar yalnızca izin verirseniz gösterilir. \"Reklamsız\" satın alındığında geçiş reklamları gösterilmez.",
          "Google Play Faturalandırma: coin paketleri, \"Reklamsız\" ve temalar Google Play üzerinden satılır. Ödemeyi Google işler; kart ve banka bilgileriniz bize ulaşmaz. Her satın alma hesabınıza bağlanır ve sunucumuz Google'a sorarak doğrular.",
          "Google Play Integrity: giriş ve satın alma sırasında uygulamanın Google Play'den gelen gerçek sürüm olduğunu ve cihazın değiştirilmemiş olduğunu doğrulamak için kullanılabilir. Bu doğrulama kişisel bilgi içermez.",
          "Oyunda analitik veya çökme raporu aracı yoktur.",
        ],
      },
      {
        title: "Toplamadığımız bilgiler",
        body: "Adınızı, e-postanızı, telefon numaranızı, konumunuzu, rehberinizi, fotoğraf/videolarınızı, kameranızı, mikrofonunuzu, dosyalarınızı veya mesajlarınızı toplamıyoruz. Oyunda sohbet veya oyuncular arası mesajlaşma yoktur. Google AdMob, IP adresinden yaklaşık konum (ülke/şehir düzeyi) çıkarabilir.",
      },
      {
        title: "Hukuki dayanak (KVKK, GDPR)",
        body: "Sizinle yaptığımız sözleşmenin ifası (oyunun, hesap eşitlemesinin ve satın almaların sunulması); meşru menfaatlerimiz (hizmetin çalışması, hile ve dolandırıcılığın önlenmesi); açık rızanız (kişiselleştirilmiş reklam). Reklam iznini cihazınızın ayarlarından ve oyunun izin ekranından değiştirebilirsiniz.",
      },
      {
        title: "Çocuklar",
        body: "Jelly Sort 13 yaş altındaki çocuklara yönelik değildir ve 13 yaş altındaki çocuklardan bilerek kişisel veri toplamayız. Bir çocuğun verisinin işlendiğini düşünüyorsanız bize yazın.",
      },
      {
        title: "Yurt dışına aktarım",
        body: "Google hizmetleri verileri ABD dahil başka ülkelerde işleyebilir; Google bu aktarımlarda Avrupa Komisyonu Standart Sözleşme Hükümleri gibi güvencelere dayanır.",
      },
      {
        title: "Saklama ve silme",
        items: [
          "Telefonunuzdaki oyun kaydı, uygulamayı kaldırdığınızda veya uygulama verilerini temizlediğinizde silinir.",
          "Hesabınızı oyunda Ayarlar → Hesabı sil ile hemen ve kalıcı olarak silebilirsiniz. Hesabınız, ilerlemeniz, coin'leriniz, booster'larınız, sıralama sonuçlarınız ve oturumlarınız silinir.",
          `Oyuna erişemiyorsanız Google hesabınızın adresinden ${CONTACT} adresine \"Jelly Sort hesap silme\" konulu bir e-posta gönderin; 7 gün içinde sileriz.`,
          "Satın alma ve ödüllü reklam kayıtları, muhasebe yükümlülüğümüz nedeniyle hesabınızdan ayrılarak (anonim) saklanır. Sunucu yedeklerindeki kopyalar 14 gün içinde kendiliğinden silinir.",
          "Google AdMob ve Google Play kendi verilerini kendi politikalarına göre saklar.",
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
        body: "Sunucumuza tüm bağlantılar şifrelidir (HTTPS). Oturum anahtarlarının sunucuda yalnızca tek yönlü özetleri tutulur; coin, booster ve ödüller sunucuda hesaplanır ve her oyuncu yalnızca kendi kaydına erişebilir. Hiçbir sistem mutlak güvenlik garantisi veremez.",
      },
      {
        title: "Değişiklikler",
        body: "Bu politikayı güncelleyebiliriz. Güncel sürüm her zaman bu sayfada yayınlanır ve aşağıdaki tarih değişir.",
      },
    ] as Section[],
    lastUpdated: "Yürürlük ve son güncelleme: 24 Ekim 2026",
    backButton: "Geri",
  },
  en: {
    title: "Jelly Sort Privacy Policy",
    identityTitle: "Whose policy this is, and for which app",
    appLabel: "App",
    packageLabel: "Package name (Google Play)",
    developerLabel: "Developer",
    contactLabel: "Contact",
    identityBody: `This privacy policy applies to the ${APP_NAME} mobile game published by ${DEVELOPER} for Android. "We" and "us" mean ${DEVELOPER}, who develops and publishes the game.`,
    sections: [
      {
        title: "In short",
        body: "You can play Jelly Sort as a guest without an account; your progress then stays only on your phone. If you choose to sign in with Google, your game data is kept on Aurict's own server (jellysort.aurict.com) to sync your progress across devices, verify purchases and prevent cheating. We do not store your email address. Apart from that, the only parties that process data are the Google services listed below. We do not sell your personal data.",
      },
      {
        title: "Information that stays on your phone",
        items: [
          "Game save: unlocked levels, stars, best scores, coin and booster counts, daily challenge streak, the theme you chose, and sound, vibration and language settings.",
          "Move lists of the levels you finish are queued on your phone so they can be sent to the server once you sign in with Google.",
          "If you signed in with Google, session keys are stored in the app's private storage.",
        ],
      },
      {
        title: "What our server stores if you sign in with Google",
        items: [
          "Your Google account's stable ID (a number issued by Google). We do not store your name, email or profile photo.",
          "Your game progress: levels finished, stars and best scores, and the move list and time of every level you finish. Move lists are replayed on the server to verify that rewards were really earned.",
          "Coin transactions (every coin earned and spent), your booster inventory and the permanent items you bought (No Ads, themes).",
          "Purchase records: Google Play's purchase token, the product and the order number. We never see your payment details.",
          "Rewarded ad records: Google AdMob's transaction number and which reward the ad was watched for.",
          "Your daily challenge results. The daily leaderboard shows an automatically assigned nickname (e.g. \"Kiwi #4821\"), never your name.",
          "Our server runs on Google Cloud in the Europe – Netherlands region. Your IP address is processed to limit abuse and kept in server access logs for 14 days.",
        ],
      },
      {
        title: "Google services",
        items: [
          "Google Sign-In (Android Credential Manager): Google issues a signed token that proves your account; we use only the account ID from it.",
          "Google AdMob (ads): optional rewarded ads (extra moves, boosters, undo) and interstitial ads between some levels. AdMob may process your advertising ID, IP address, device information and ad interactions to show and measure ads and prevent fraud. In the European Economic Area, the UK and Switzerland you are asked for consent on first launch; personalized ads are shown only if you agree. Buying \"No Ads\" turns off interstitial ads.",
          "Google Play Billing: coin packs, \"No Ads\" and themes are sold through Google Play. Payments are processed by Google; we never receive card or bank details. Every purchase is bound to your account and verified by our server with Google.",
          "Google Play Integrity: may be used during sign-in and purchases to check that the app is the genuine version from Google Play on an unmodified device. This check contains no personal information.",
          "The game contains no analytics or crash-reporting tools.",
        ],
      },
      {
        title: "Information we don't collect",
        body: "We do not collect your name, email, phone number, location, contacts, photos/videos, camera, microphone, files or messages. The game has no chat or messaging between players. Google AdMob may derive an approximate location (country or city level) from your IP address.",
      },
      {
        title: "Legal bases (GDPR, KVKK)",
        body: "Performance of our contract with you (providing the game, account sync and purchases); our legitimate interests (keeping the service running, preventing cheating and fraud); your consent (personalized ads). You can change ad consent in your device settings and in the game's consent screen.",
      },
      {
        title: "Children",
        body: "Jelly Sort is not directed at children under 13, and we do not knowingly collect personal data from children under 13. If you believe a child's data has been processed, write to us.",
      },
      {
        title: "International transfers",
        body: "Google services may process data in other countries, including the United States; Google relies on safeguards such as the European Commission's Standard Contractual Clauses for these transfers.",
      },
      {
        title: "Retention and deletion",
        items: [
          "The game save on your phone is deleted when you uninstall the app or clear its data.",
          "You can delete your account instantly and permanently in the game under Settings → Delete account. Your account, progress, coins, boosters, leaderboard results and sessions are deleted.",
          `If you can't open the game, email ${CONTACT} from your Google account's address with the subject \"Jelly Sort account deletion\"; we delete it within 7 days.`,
          "Purchase and rewarded-ad records are kept separated from your account (anonymized) because of our accounting obligations. Copies in server backups are deleted automatically within 14 days.",
          "Google AdMob and Google Play keep their own data under their own policies.",
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
        body: "All connections to our server are encrypted (HTTPS). The server stores only one-way hashes of session keys; coins, boosters and rewards are calculated on the server, and each player can only access their own record. No system can guarantee absolute security.",
      },
      {
        title: "Changes",
        body: "We may update this policy. The current version is always published on this page and the date below changes.",
      },
    ] as Section[],
    lastUpdated: "Effective and last updated: 24 October 2026",
    backButton: "Back",
  },
} as const;

export default function JellySortPrivacyPolicyPage() {
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
