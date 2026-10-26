"use client";

import { useLanguage } from "@/contexts/LanguageContext";
import AmbientBackground from "@/components/AmbientBackground";
import PageHeader from "@/components/PageHeader";

const BRAND = "var(--sproutvalley)";
const APP_NAME = "Sprout Valley: Merge Farm";
const PACKAGE_NAME = "com.aurict.sprout";
const DEVELOPER = "Aurict";
const CONTACT = "contact@aurict.com";

type Section = { title: string; body?: string; items?: string[] };

const STRINGS = {
  tr: {
    title: "Sprout Valley: Merge Farm Gizlilik Politikası",
    identityTitle: "Bu politika kimin, hangi uygulama için",
    appLabel: "Uygulama",
    packageLabel: "Paket adı (Google Play)",
    developerLabel: "Geliştirici",
    contactLabel: "İletişim",
    identityBody: `Bu gizlilik politikası, ${DEVELOPER} tarafından Android için Google Play'de yayınlanan ${APP_NAME} mobil oyunu için geçerlidir. "Biz" ifadesi oyunu geliştiren ve yayınlayan ${DEVELOPER}'i ifade eder.`,
    sections: [
      {
        title: "Kısaca",
        body: "Sprout Valley'yi hesap açmadan oynarsınız; oyunda hesap sistemi yoktur. Aurict'in Sprout Valley için bir sunucusu yoktur: oyun ilerlemeniz telefonunuzda şifrelenmiş olarak saklanır ve isterseniz Google Play Games ile Google hesabınıza yedeklenir. Biz bu verileri göremeyiz. Veri işleyen taraflar yalnızca aşağıda listelenen Google hizmetleridir (Play Games, reklam, satın alma ve analitik). Kişisel verilerinizi satmayız.",
      },
      {
        title: "Telefonunuzda kalan bilgiler",
        items: [
          "Şifrelenmiş oyun kaydı: tahtanız, çiftliğiniz ve ürünleriniz, siparişler, fırın, açtığınız araziler, seviyeniz, coin'leriniz ve oyun ayarlarınız.",
          "Satın aldığınız kalıcı öğeler (ör. Reklamsız) ve satın almaları doğrulamak için Google Play'in sipariş bilgisi.",
        ],
      },
      {
        title: "Google Play Games (isteğe bağlı)",
        items: [
          "Giriş isteğe bağlıdır ve yalnızca Kayıtlı Oyunlar (bulut yedeği) için kullanılır: ilerlemenizi cihazlar arasında taşıyabilmeniz için oyun kaydınızın bir kopyası Google hesabınızdaki Play Games kayıtlı oyun alanına yazılır. Bu veriyi Google saklar; bizim bir sunucumuz yoktur ve bu kayda erişemeyiz.",
          "Oyunda liderlik tablosu veya başarım yoktur.",
          "Oyun giriş yapmadan da eksiksiz oynanır; bu durumda ilerlemeniz yalnızca telefonunuzda kalır.",
        ],
      },
      {
        title: "Diğer Google hizmetleri",
        items: [
          "Google AdMob (reklamlar): isteğe bağlı ödüllü reklamlar (bir bonus için izlemeyi siz seçersiniz) ve 10. seviyeden sonra yalnızca seviye atlamalarının ardından geçiş reklamları. Banner reklam yoktur. AdMob reklam kimliğini, IP adresini, cihaz bilgilerini ve reklam etkileşimlerini reklam göstermek, ölçmek ve dolandırıcılığı önlemek için işleyebilir.",
          "Reklam izni: Google'ın izin formu (UMP), gerekli olduğu yerlerde (Avrupa Ekonomik Alanı ve Birleşik Krallık'ta GDPR kapsamında, ABD'de eyalet gizlilik yasaları kapsamında) gösterilir. Kararınızı istediğiniz zaman oyunun Ayarlar ekranındaki gizlilik seçenekleri düğmesinden değiştirebilirsiniz.",
          "Google Play Faturalandırma: \"Reklamsız\", Çiftçi Paketi ve coin paketleri isteğe bağlı uygulama içi satın almalar olarak Google Play üzerinden satılır. Ödemeyi tamamen Google Play işler; kart ve ödeme bilgileriniz bize ulaşmaz. Satın almalar telefonunuzda doğrulanır.",
          "Firebase Analytics (Google): oyunu iyileştirmek için anonim oyun olayları toplanır (eğitim adımları, seviye atlama, siparişler, hasatlar, ödüllü reklam ödülleri ve oturum özeti). Ad, e-posta, hesap kimliği veya satın alma anahtarı gönderilmez. Veri toplama kapalı başlar ve izin sonucu belli olana kadar Consent Mode v2 sinyalleri \"reddedildi\" olarak ayarlıdır.",
          "Oyunda Firebase Crashlytics veya başka bir çökme raporlama hizmeti kullanılmaz.",
        ],
      },
      {
        title: "Bildirimler",
        body: "Fırındaki ekmek veya hasat hazır olduğunda oyun yerel bildirim gösterebilir; günde en fazla 2 bildirim. İzin yalnızca fırını ilk kullandığınızda istenir ve bildirimleri oyunun Ayarlar ekranından kapatabilirsiniz. Bildirimler telefonunuzda zamanlanır; bildirim sunucusu yoktur ve hiçbir sunucuya veri gönderilmez.",
      },
      {
        title: "Toplamadığımız bilgiler",
        body: "Adınızı, e-postanızı, telefon numaranızı, konumunuzu, rehberinizi, fotoğraf/videolarınızı, kameranızı, mikrofonunuzu, dosyalarınızı veya mesajlarınızı toplamıyoruz. Oyunda sohbet veya oyuncular arası mesajlaşma yoktur. Google AdMob, IP adresinden yaklaşık konum (ülke/şehir düzeyi) çıkarabilir.",
      },
      {
        title: "Hukuki dayanak (KVKK, GDPR)",
        body: "Sizinle yaptığımız sözleşmenin ifası (oyunun, bulut yedeğinin ve satın almaların sunulması); meşru menfaatlerimiz (oyunun çalışması, dolandırıcılığın önlenmesi); açık rızanız (kişiselleştirilmiş reklam, analitik ve bildirimler). İzninizi oyunun Ayarlar ekranındaki gizlilik seçeneklerinden ve cihazınızın ayarlarından değiştirebilirsiniz.",
      },
      {
        title: "Çocuklar",
        body: "Sprout Valley çocuklar için tasarlanmamıştır ve 13 yaş altındaki çocuklara yönelik değildir. 13 yaş altındaki çocuklardan bilerek kişisel veri toplamayız. Bir çocuğun verisinin işlendiğini düşünüyorsanız bize yazın.",
      },
      {
        title: "Yurt dışına aktarım",
        body: "Google hizmetleri verileri ABD dahil başka ülkelerde işleyebilir; Google bu aktarımlarda Avrupa Komisyonu Standart Sözleşme Hükümleri gibi güvencelere dayanır.",
      },
      {
        title: "Saklama ve silme",
        items: [
          "Telefonunuzdaki oyun kaydı, uygulamayı kaldırdığınızda veya uygulama verilerini temizlediğinizde silinir.",
          "Bulut yedeğinizi Google Play Games hesap ayarlarınızdan (Play Games uygulamasında veya play.google.com/games adresinde, Play Games hesabını ve verilerini silme bölümünden) silebilirsiniz.",
          `Yardım gerekirse ${CONTACT} adresine "Sprout Valley veri silme" konulu bir e-posta gönderin. Hesap sistemi ve sunucumuz olmadığı için bizde silinecek bir hesap kaydı bulunmaz.`,
          "Google AdMob, Google Play, Google Play Games ve Firebase kendi verilerini kendi politikalarına göre saklar.",
        ],
      },
      {
        title: "Haklarınız",
        items: [
          "Reklam iznini oyunun Ayarlar ekranındaki gizlilik seçeneklerinden değiştirebilir, kişiselleştirilmiş reklamları cihazınızın Google ayarlarından kapatabilir ve reklam kimliğinizi sıfırlayabilirsiniz.",
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
    lastUpdated: "Yürürlük ve son güncelleme: 26 Ekim 2026",
    backButton: "Geri",
  },
  en: {
    title: "Sprout Valley: Merge Farm Privacy Policy",
    identityTitle: "Whose policy this is, and for which app",
    appLabel: "App",
    packageLabel: "Package name (Google Play)",
    developerLabel: "Developer",
    contactLabel: "Contact",
    identityBody: `This privacy policy applies to the ${APP_NAME} mobile game published by ${DEVELOPER} for Android on Google Play. "We" and "us" mean ${DEVELOPER}, who develops and publishes the game.`,
    sections: [
      {
        title: "In short",
        body: "You play Sprout Valley without creating an account; the game has no account system. Aurict runs no server for Sprout Valley: your progress is stored encrypted on your phone and, if you choose, backed up to your Google account through Google Play Games. We cannot see this data. The only parties that process data are the Google services listed below (Play Games, ads, purchases and analytics). We do not sell your personal data.",
      },
      {
        title: "Information that stays on your phone",
        items: [
          "Encrypted game save: your board, farm and crops, orders, bakery, unlocked land, level, coins and game settings.",
          "Permanent items you bought (e.g. Remove Ads) and Google Play's order details used to verify purchases.",
        ],
      },
      {
        title: "Google Play Games (optional)",
        items: [
          "Sign-in is optional and used only for Saved Games (cloud backup): so you can move your progress between devices, a copy of your game save is written to the Play Games saved-games area of your Google account. Google stores this data; we have no server and cannot access it.",
          "The game has no leaderboards or achievements.",
          "The game is fully playable without signing in; your progress then stays only on your phone.",
        ],
      },
      {
        title: "Other Google services",
        items: [
          "Google AdMob (ads): optional rewarded ads (you choose to watch one for a bonus) and interstitial ads only after level-ups past level 10. There are no banner ads. AdMob may process your advertising ID, IP address, device information and ad interactions to show and measure ads and prevent fraud.",
          "Ad consent: Google's consent form (UMP) is shown where required (under the GDPR in the European Economic Area and the UK, and under US state privacy laws). You can change your choice at any time with the privacy options button in the game's Settings.",
          "Google Play Billing: Remove Ads, the Farmer Pack and coin packs are optional in-app purchases sold through Google Play. Payments are handled entirely by Google Play; we never receive card or payment details. Purchases are verified on your phone.",
          "Firebase Analytics (Google): to improve the game we collect anonymous gameplay events (tutorial steps, level-ups, orders, harvests, rewarded-ad rewards and a session summary). No names, emails, account IDs or purchase tokens are sent. Collection starts disabled, with Consent Mode v2 signals set to denied until your consent choice is known.",
          "The game does not use Firebase Crashlytics or any other crash-reporting service.",
        ],
      },
      {
        title: "Notifications",
        body: "The game can show local notifications when your bakery or harvest is ready, at most 2 per day. Permission is asked only when you first use the bakery, and you can turn notifications off in the game's Settings. They are scheduled on your phone; there is no push server and no data is sent to any server.",
      },
      {
        title: "Information we don't collect",
        body: "We do not collect your name, email, phone number, location, contacts, photos/videos, camera, microphone, files or messages. The game has no chat or messaging between players. Google AdMob may derive an approximate location (country or city level) from your IP address.",
      },
      {
        title: "Legal bases (GDPR, KVKK)",
        body: "Performance of our contract with you (providing the game, cloud backup and purchases); our legitimate interests (keeping the game running, preventing fraud); your consent (personalized ads, analytics and notifications). You can change your consent with the privacy options in the game's Settings and in your device settings.",
      },
      {
        title: "Children",
        body: "Sprout Valley is not designed for kids and is not directed at children under 13. We do not knowingly collect personal data from children under 13. If you believe a child's data has been processed, write to us.",
      },
      {
        title: "International transfers",
        body: "Google services may process data in other countries, including the United States; Google relies on safeguards such as the European Commission's Standard Contractual Clauses for these transfers.",
      },
      {
        title: "Retention and deletion",
        items: [
          "The game save on your phone is deleted when you uninstall the app or clear its data.",
          "You can delete your cloud backup in your Google Play Games account settings (in the Play Games app or at play.google.com/games, under deleting your Play Games account & data).",
          `If you need help, email ${CONTACT} with the subject "Sprout Valley data deletion". Because there is no account system and we run no server, we hold no account record to delete.`,
          "Google AdMob, Google Play, Google Play Games and Firebase keep their own data under their own policies.",
        ],
      },
      {
        title: "Your rights",
        items: [
          "You can change your ad consent with the privacy options button in the game's Settings, turn off personalized ads in your device's Google settings and reset your advertising ID.",
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
    lastUpdated: "Effective and last updated: 26 October 2026",
    backButton: "Back",
  },
} as const;

export default function SproutValleyPrivacyPolicyPage() {
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
