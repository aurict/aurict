"use client";

import { useLanguage } from "@/contexts/LanguageContext";
import AmbientBackground from "@/components/AmbientBackground";
import PageHeader from "@/components/PageHeader";

const BRAND = "var(--dungeon)";
const APP_NAME = "Dungeon Lord: Rise of the Boss";
const PACKAGE_NAME = "com.aurict.dungeonlord";
const DEVELOPER = "Aurict";
const CONTACT = "contact@aurict.com";

type Section = { title: string; body?: string; items?: string[] };

const STRINGS = {
  tr: {
    title: "Dungeon Lord Gizlilik Politikası",
    identityTitle: "Bu politika kimin, hangi uygulama için",
    appLabel: "Uygulama",
    packageLabel: "Paket adı (Google Play)",
    developerLabel: "Geliştirici",
    contactLabel: "İletişim",
    identityBody: `Bu gizlilik politikası, ${DEVELOPER} tarafından Android için yayınlanan ${APP_NAME} mobil oyunu için geçerlidir. "Biz" ifadesi oyunu geliştiren ve yayınlayan ${DEVELOPER}'i ifade eder.`,
    sections: [
      {
        title: "Kısaca",
        body: "Oyunu açtığınızda sizin için otomatik olarak bir misafir hesabı oluşturulur ve ilerlemeniz sunucumuzda (dungeon.aurict.com) saklanır. Böylece hile yapılmasını önler, satın almaları güvenle teslim eder ve isterseniz başka bir cihazda devam etmenizi sağlarız. Kişisel verilerinizi satmayız. Hesabınızı istediğiniz an oyundan ya da web sitemizden silebilirsiniz.",
      },
      {
        title: "Topladığımız bilgiler",
        items: [
          "Hesap bilgileri: rastgele üretilen bir oyuncu kimliği, cihaz kaydı (platform ve uygulama sürümü) ve oturum anahtarları. Misafir hesabı için ad, e-posta veya telefon numarası istemeyiz.",
          "Google ile Giriş (isteğe bağlı): bağlarsanız Google hesap kimliğiniz ve e-posta adresiniz. Bu yalnızca hesabınızı başka cihazda geri yüklemek ve silme talebinde sahipliği doğrulamak için kullanılır. Google şifrenizi asla görmeyiz.",
          "Oyun verileri: altın, elmas, ruh puanı, açılan katlar, canavar ve ejderha seviyeleri, mektuplar ve anılar, görevler, başarımlar, ayarlar ve cihazınızın saat dilimi. Saat dilimi bildirimleri gece göndermemek için kullanılır.",
          "Görünen ad ve sıralama: Ayarlar'da seçtiğiniz ad, en derin katınız ve doğuş sayınız sıralamada diğer oyunculara görünür. Ad seçmezseniz \"Lord\" görünür.",
          "Satın alma kayıtları: ürün, Google sipariş numarası ve işlem anahtarının özeti (hash). Ödemeyi Google işler; kart ve banka bilgileriniz bize ulaşmaz.",
          "Güvenlik ve hile önleme kayıtları: IP adresi, giriş/çıkış olayları ve kaydınızda tutarsızlık tespit edildiğinde oluşan kayıtlar (ör. cihaz saatinin ileri alınması).",
          "Bildirim anahtarı (yalnızca izin verirseniz): cihazınıza bildirim gönderebilmemiz için Firebase Cloud Messaging'in verdiği anahtar ve oyun dili.",
        ],
      },
      {
        title: "Bilgileri nasıl kullanırız",
        items: [
          "Oyunu çalıştırmak, ilerlemenizi kaydetmek ve başka cihazda geri yüklemek",
          "Satın almaları Google ile doğrulayıp teslim etmek, iadeleri işlemek ve aynı satın almanın iki kez verilmesini önlemek",
          "Çevrimdışı kazançları sunucu saatine göre hesaplamak ve hileli kayıtları reddetmek; böylece sıralama herkes için adil kalır",
          "Sıralamayı göstermek",
          "İzin verdiyseniz hatırlatma bildirimleri göndermek (zindan tehlikedeyken, sandık dolduğunda, günlük hediye hazır olduğunda). Günde en fazla bir bildirim, yalnızca 10:00–21:00 arası gönderilir.",
          "Seçimlerinize göre ödüllü reklam göstermek",
        ],
      },
      {
        title: "Google ve diğer hizmet sağlayıcılar",
        items: [
          "Google AdMob (reklamlar): oyunda yalnızca sizin isteyerek izlediğiniz ödüllü reklamlar vardır, zorunlu reklam yoktur. AdMob reklam kimliğini, IP adresini, cihaz bilgilerini, reklam etkileşimlerini ve tanılama verilerini reklam göstermek, ölçmek ve dolandırıcılığı önlemek için işleyebilir. Avrupa Ekonomik Alanı, Birleşik Krallık ve benzer bölgelerde ilk açılışta izniniz istenir; kişiselleştirilmiş reklamlar yalnızca izin verirseniz gösterilir.",
          "Google Play Faturalandırma: elmas paketleri ve Başlangıç Paketi Google Play üzerinden satılır. Satın almanın yalnızca sizin hesabınıza teslim edilmesi için Google'a hesabınızdan türetilmiş anonim bir etiket iletilir.",
          "Firebase Cloud Messaging (Google): bildirimleri cihazınıza iletir.",
          "Google Cloud (sunucu barındırma, AB) ve Cloudflare (ağ güvenliği ve iletim): sunucumuz bu altyapılar üzerinde çalışır.",
        ],
      },
      {
        title: "Toplamadığımız bilgiler",
        body: "Konumunuzu, rehberinizi, fotoğraf/videolarınızı, kameranızı, mikrofonunuzu, dosyalarınızı veya mesajlarınızı toplamıyoruz. Oyunda sohbet veya oyuncular arası mesajlaşma yoktur. Analitik veya hata raporlama SDK'sı kullanmıyoruz.",
      },
      {
        title: "Hukuki dayanak (KVKK, GDPR)",
        body: "Sizinle yaptığımız sözleşmenin ifası (hesap, oyun, kayıt, satın almalar, sıralama), meşru menfaatimiz (hile ve dolandırıcılığı önleme, hizmet güvenliği) ve açık rızanız (bildirimler ve kişiselleştirilmiş reklamlar). Bildirimleri Ayarlar → Bildirimler'den, reklam iznini Ayarlar → Reklam Tercihleri'nden istediğiniz zaman değiştirebilirsiniz.",
      },
      {
        title: "Çocuklar",
        body: "Oyun 13 yaş altındaki çocuklara yönelik değildir; hikâyesi karanlık temalar içerir. 13 yaş altındaki çocuklardan bilerek kişisel veri toplamayız. Bir çocuğun verisinin işlendiğini düşünüyorsanız bize yazın; hesabı sileriz.",
      },
      {
        title: "Paylaşım",
        body: "Kişisel verilerinizi satmayız. Veriler yalnızca yukarıda sayılan, bizim adımıza çalışan sağlayıcılarla ve Google'ın kendi gizlilik politikalarına göre işlenir: policies.google.com/privacy ve policies.google.com/technologies/ads. Yasal zorunluluk halinde veya oyuncularımızı dolandırıcılığa karşı korumak için bilgi paylaşabiliriz.",
      },
      {
        title: "Yurt dışına aktarım",
        body: "Sunucumuz Avrupa Birliği'ndedir. Google ve Cloudflare verileri ABD dahil başka ülkelerdeki sunucularda işleyebilir; bu aktarımlar için Avrupa Komisyonu Standart Sözleşme Hükümleri gibi güvencelere dayanırlar.",
      },
      {
        title: "Saklama süreleri",
        items: [
          "Hesap, oyun kaydı, sıralama kaydı ve satın alma kayıtları: hesabınızı silene kadar.",
          "Güvenlik ve hile önleme kayıtları: 180 gün.",
          "Bildirim gönderim kayıtları: 60 gün.",
          "Sunucu yedekleri: 14 gün sonra otomatik silinir.",
          "Hesap silindiğinde ona bağlı tüm kayıtlar sunucumuzdan hemen silinir. Google kendi işlem kayıtlarını kendi politikalarına göre saklar.",
        ],
      },
      {
        title: "Hesabınızı silme ve haklarınız",
        items: [
          "Oyunda: Ayarlar → Hesabı Sil (onay için iki kez dokunun). Hesabınız, ilerlemeniz ve satın alma geçmişiniz sunucumuzdan kalıcı olarak silinir.",
          "Web'den: mobile.aurict.com/dungeon-lord/delete-account adresinde Google ile giriş yaparak hesabınızı silebilirsiniz.",
          `Oyuna erişemiyorsanız ${CONTACT} adresine Google hesabınızın e-postasından ya da Ayarlar'da görünen Kimlik ile yazın; 30 gün içinde sileriz.`,
          "Reklam verileri: reklam iznini Ayarlar → Reklam Tercihleri'nden değiştirebilir, reklam kimliğinizi cihaz ayarlarından sıfırlayabilir veya silebilirsiniz.",
          `KVKK ve GDPR kapsamında erişme, düzeltme, silme, taşıma, işlemeye itiraz etme ve veri koruma otoritesine (ör. KVKK Kurulu) şikâyet etme haklarınız vardır. Her türlü soru ve talep için ${CONTACT} adresine yazın; 30 gün içinde yanıt veririz.`,
        ],
      },
      {
        title: "Güvenlik",
        body: "Tüm bağlantılar HTTPS/TLS ile şifrelenir. Şifre saklamayız. Oturum anahtarları kısa ömürlüdür ve sürekli yenilenir; çalınmış bir anahtar tekrar kullanılırsa oturum otomatik kapatılır. Cihazdaki oturum bilgisi şifreli tutulur. Sunuculara yalnızca yetkili kişiler erişebilir. Hiçbir sistem mutlak güvenlik garantisi veremez.",
      },
      {
        title: "Değişiklikler",
        body: "Bu politikayı güncelleyebiliriz. Güncel sürüm her zaman bu sayfada yayınlanır ve aşağıdaki tarih değişir; önemli değişiklikleri oyun içinde de bildiririz.",
      },
    ] as Section[],
    lastUpdated: "Yürürlük ve son güncelleme: 22 Ekim 2026",
    backButton: "Geri",
  },
  en: {
    title: "Dungeon Lord Privacy Policy",
    identityTitle: "Whose policy this is, and for which app",
    appLabel: "App",
    packageLabel: "Package name (Google Play)",
    developerLabel: "Developer",
    contactLabel: "Contact",
    identityBody: `This privacy policy applies to the ${APP_NAME} mobile game published by ${DEVELOPER} for Android. "We" and "us" mean ${DEVELOPER}, who develops and publishes the game.`,
    sections: [
      {
        title: "In short",
        body: "When you open the game, a guest account is created for you automatically and your progress is stored on our server (dungeon.aurict.com). This lets us stop cheating, deliver purchases safely and, if you want, let you continue on another device. We do not sell your personal data. You can delete your account at any time in the game or on our website.",
      },
      {
        title: "Information we collect",
        items: [
          "Account data: a randomly generated player ID, a device record (platform and app version) and session tokens. A guest account needs no name, email or phone number.",
          "Google Sign-In (optional): if you link it, your Google account ID and email address. They are used only to restore your account on another device and to verify ownership when you ask for deletion. We never see your Google password.",
          "Game data: gold, gems, soul points, unlocked floors, monster and dragon levels, letters and memories, quests, achievements, settings and your device's time zone. The time zone is used so that notifications are never sent at night.",
          "Display name and leaderboard: the name you choose in Settings, your deepest floor and your rebirth count are visible to other players on the leaderboard. Without a name, \"Lord\" is shown.",
          "Purchase records: product, Google order number and a hash of the purchase token. Payments are processed by Google; we never receive card or bank details.",
          "Security and anti-cheat records: IP address, sign-in/sign-out events and records created when your save looks inconsistent (for example, the device clock moved forward).",
          "Notification token (only if you allow it): the token Firebase Cloud Messaging issues so we can send notifications to your device, and the game language.",
        ],
      },
      {
        title: "How we use information",
        items: [
          "To run the game, save your progress and restore it on another device",
          "To verify purchases with Google, deliver them, handle refunds and make sure the same purchase is never delivered twice",
          "To calculate offline earnings by server time and refuse cheated saves, so the leaderboard stays fair",
          "To show the leaderboard",
          "If you allowed it, to send reminder notifications (your dungeon is in danger, your chest is full, a daily gift is ready). At most one a day, only between 10:00 and 21:00 your time.",
          "To show rewarded ads according to your choices",
        ],
      },
      {
        title: "Google and other service providers",
        items: [
          "Google AdMob (ads): the game only has rewarded ads that you choose to watch; there are no forced ads. AdMob may process the advertising ID, IP address, device information, ad interactions and diagnostics to show and measure ads and to prevent fraud. In the EEA, the UK and similar regions you are asked for consent on first launch; personalized ads are shown only if you agree.",
          "Google Play Billing: gem packs and the Starter Pack are sold through Google Play. An anonymous tag derived from your account is passed to Google so that a purchase can only be delivered to your account.",
          "Firebase Cloud Messaging (Google): delivers notifications to your device.",
          "Google Cloud (server hosting, EU) and Cloudflare (network security and delivery): our server runs on this infrastructure.",
        ],
      },
      {
        title: "Information we don't collect",
        body: "We do not collect your location, contacts, photos/videos, camera, microphone, files or messages. The game has no chat or messaging between players. We use no analytics or crash-reporting SDK.",
      },
      {
        title: "Legal bases (GDPR, KVKK)",
        body: "Performance of our contract with you (account, game, saves, purchases, leaderboard), our legitimate interest (preventing cheating and fraud, keeping the service secure) and your consent (notifications and personalized ads). You can change notifications in Settings → Bildirimler and ad consent in Settings → Reklam Tercihleri at any time.",
      },
      {
        title: "Children",
        body: "The game is not directed at children under 13; its story contains dark themes. We do not knowingly collect personal data from children under 13. If you believe a child's data has been processed, write to us and we will delete the account.",
      },
      {
        title: "Sharing",
        body: "We do not sell your personal data. Data is processed only by the providers above, acting on our behalf, and by Google under its own privacy policies: policies.google.com/privacy and policies.google.com/technologies/ads. We may disclose information when required by law or to protect our players against fraud.",
      },
      {
        title: "International transfers",
        body: "Our server is in the European Union. Google and Cloudflare may process data on servers in other countries, including the United States; they rely on safeguards such as the European Commission's Standard Contractual Clauses for these transfers.",
      },
      {
        title: "How long we keep data",
        items: [
          "Account, save, leaderboard entry and purchase records: until you delete your account.",
          "Security and anti-cheat records: 180 days.",
          "Notification delivery records: 60 days.",
          "Server backups: deleted automatically after 14 days.",
          "When an account is deleted, every record linked to it is removed from our server immediately. Google keeps its own transaction records under its own policies.",
        ],
      },
      {
        title: "Deleting your account and your rights",
        items: [
          "In the game: Settings → Hesabı Sil (tap twice to confirm). This permanently deletes your account, progress and purchase history from our server.",
          "On the web: sign in with Google at mobile.aurict.com/dungeon-lord/delete-account to delete your account.",
          `If you can't open the game, write to ${CONTACT} from your Google account's email or include the ID (Kimlik) shown in Settings; we will delete your data within 30 days.`,
          "Ad data: change your ad consent in Settings → Reklam Tercihleri, and reset or delete your advertising ID in your device settings.",
          `Under the GDPR and KVKK you have the right to access, correct, delete and export your data, to object to processing, and to complain to your data protection authority. Write to ${CONTACT} with any question or request; we answer within 30 days.`,
        ],
      },
      {
        title: "Security",
        body: "All connections are encrypted with HTTPS/TLS. We store no passwords. Session tokens are short-lived and rotate constantly; if a stolen token is reused, the session is closed automatically. Session data on the device is stored encrypted. Only authorized people can access the servers. No system can guarantee absolute security.",
      },
      {
        title: "Changes",
        body: "We may update this policy. The current version is always published on this page and the date below changes; we also announce important changes in the game.",
      },
    ] as Section[],
    lastUpdated: "Effective and last updated: 22 October 2026",
    backButton: "Back",
  },
} as const;

export default function DungeonLordPrivacyPolicyPage() {
  const { language } = useLanguage();
  const s = language === "tr" ? STRINGS.tr : STRINGS.en;

  return (
    <div className="min-h-screen overflow-x-hidden" style={{ background: "var(--bg)", color: "var(--text)" }}>
      <AmbientBackground />
      <PageHeader backLabel={s.backButton} brand={`Dungeon Lord · ${DEVELOPER}`} />

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

          <div className="text-center">
            <p className="text-xs" style={{ color: "var(--text-muted)" }}>{s.lastUpdated}</p>
          </div>
        </div>
      </main>
    </div>
  );
}
