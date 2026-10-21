"use client";

import Link from "next/link";
import { useLanguage } from "@/contexts/LanguageContext";
import AmbientBackground from "@/components/AmbientBackground";
import PageHeader from "@/components/PageHeader";

const BRAND = "var(--duck)";
const APP_NAME = "Duckley";
const PACKAGE_NAME = "com.aurict.duckley";
const DEVELOPER = "Aurict";
const CONTACT = "contact@aurict.com";

type Section = { title: string; body?: string; items?: string[] };

const STRINGS = {
  tr: {
    title: "Duckley Gizlilik Politikası",
    identityTitle: "Bu politika kimin, hangi uygulama için",
    appLabel: "Uygulama",
    packageLabel: "Paket adı / Bundle ID",
    developerLabel: "Geliştirici (App Store ve Google Play'deki adı)",
    contactLabel: "İletişim",
    identityBody: `Bu gizlilik politikası, App Store ve Google Play'de ${DEVELOPER} geliştirici adıyla yayınlanan ${APP_NAME} mobil uygulaması için geçerlidir. "Biz" ifadesi ${APP_NAME}'yi geliştiren ve yayınlayan ${DEVELOPER}'i ifade eder.`,
    sections: [
      {
        title: "Topladığımız bilgiler",
        items: [
          "Uygulama içi etkinlik: ders ilerlemesi, quiz cevapları, günlük plan, tekrarlar, rozetler ve XP.",
          "Cihaz ve kurulum kimlikleri: misafir hesap kimliği, hatırlatıcılar açıksa bildirim (FCM) token'ı ve Firebase uygulama örneği kimliği.",
          "Google ile giriş yaparsanız: e-posta adresiniz ve Google hesap kimliğiniz.",
          "Apple ile giriş yaparsanız: Apple hesap kimliğiniz, paylaşmayı seçtiğiniz e-posta adresi (Apple'ın gizli yönlendirme adresi olabilir) ve adınız.",
          "Görünen ad: çalışma grupları ve hikâyelerde göstermek için seçtiğiniz ad.",
          "Kullanıcı içeriği: çalışma hikâyeleri, tepkiler ve çalışma grubu üyeliği.",
          "Satın alma geçmişi: App Store veya Google Play üzerinden yapılan satın almaların kayıtları. Kart ve ödeme bilgileriniz Apple veya Google tarafından işlenir, bize ulaşmaz.",
        ],
      },
      {
        title: "Toplamadığımız bilgiler",
        body: "Konum, rehber, fotoğraf/video, mikrofon, dosyalar, takvim, sağlık verisi, mesajlar ve telefon numarası toplamıyoruz. Duki çalışma selfiesi karakter görsellerinden oluşturulur; kamera kullanılmaz. Uygulamada reklam yoktur.",
      },
      {
        title: "Bilgileri nasıl kullanırız",
        items: [
          "Dersleri, ilerleme takibini, tekrarları ve kişisel günlük planı sunmak",
          "Hesabınızı yönetmek ve ilerlemenizi cihazlar arasında korumak",
          "Satın almaları doğrulamak ve hakları tanımlamak",
          "İzin verdiyseniz çalışma hatırlatıcıları göndermek",
          "Kötüye kullanımı ve dolandırıcılığı önlemek, hizmeti güvende tutmak",
          "İzin verdiyseniz uygulamayı iyileştirmek için anonim kullanım istatistikleri çıkarmak",
        ],
      },
      {
        title: "Analitik",
        body: "Firebase Analytics ve öğrenme olayları varsayılan olarak kapalıdır; yalnızca profilden açarsanız toplanır ve istediğiniz zaman kapatabilirsiniz. İsteğe bağlı öğrenme olayları 90 gün sonra silinir.",
      },
      {
        title: "Paylaşım ve hizmet sağlayıcılar",
        body: "Kişisel verilerinizi satmayız ve reklam amacıyla paylaşmayız. Hizmeti sunmak için yalnızca bizim adımıza çalışan sağlayıcıları kullanırız: Google (Google ile Giriş, Google Play Faturalandırma, Firebase Analytics, Firebase Cloud Messaging), Apple (Apple ile Giriş, App Store satın almaları, iOS bildirimleri için Apple Push Notification service) ve sunucu barındırma sağlayıcımız. Bir hikâyeyi başka bir uygulamayla paylaştığınızda, o uygulamanın gizlilik kuralları geçerli olur. Çalışma grubundaki görünen adınız ve hikâyeleriniz grubun diğer üyelerine görünür.",
      },
      {
        title: "Saklama ve hesap silme",
        body: "Verilerinizi hesabınız açık olduğu sürece saklarız. Hesabınızı uygulama içinden veya web üzerinden silebilirsiniz. Silme işleminde Google veya Apple hesap bağlantınız, ilerlemeniz, hikâyeleriniz, grup üyelikleriniz, bildirim token'larınız ve oturumlarınız silinir; Apple ile giriş yaptıysanız Apple'daki uygulama yetkiniz de iptal edilir. Satın alma kayıtları yasal yükümlülükler ve denetim için kimliksizleştirilerek saklanır.",
      },
      {
        title: "Güvenlik",
        body: "Uygulama ile sunucu arasındaki tüm trafik HTTPS ile şifrelenir ve verilere erişim yetkiyle sınırlıdır. Hiçbir sistem mutlak güvenlik garantisi veremez.",
      },
      {
        title: "Haklarınız",
        body: `Verilerinize erişme, düzeltme ve silme talebinde bulunabilirsiniz. Talepleriniz için ${CONTACT} adresine yazın.`,
      },
      {
        title: "Yaş sınırı",
        body: `${APP_NAME} yetişkinlere (18+) yöneliktir. Çocuklardan bilerek veri toplamayız.`,
      },
      {
        title: "Değişiklikler",
        body: "Bu politikayı güncelleyebiliriz. Güncel sürüm her zaman bu sayfada yayınlanır ve aşağıdaki tarih değişir.",
      },
    ] as Section[],
    deleteLink: "Duckley hesabını web üzerinden sil",
    lastUpdated: "Yürürlük ve son güncelleme: 21 Ekim 2026",
    backButton: "Geri",
  },
  en: {
    title: "Duckley Privacy Policy",
    identityTitle: "Who this policy is from and which app it covers",
    appLabel: "App",
    packageLabel: "Package name / Bundle ID",
    developerLabel: "Developer (name on the App Store and Google Play)",
    contactLabel: "Contact",
    identityBody: `This privacy policy applies to the ${APP_NAME} mobile app, published on the App Store and Google Play under the developer name ${DEVELOPER}. "We", "us" and "our" refer to ${DEVELOPER}, the developer and publisher of ${APP_NAME}.`,
    sections: [
      {
        title: "Information we collect",
        items: [
          "App activity: lesson progress, quiz answers, daily plan, reviews, badges and XP.",
          "Device and install IDs: a guest account ID, a notification (FCM) token if reminders are on, and the Firebase app instance ID.",
          "If you sign in with Google: your email address and Google account ID.",
          "If you sign in with Apple: your Apple account ID, the email address you choose to share (which may be an Apple private relay address) and your name.",
          "Display name: the name you choose to show in study circles and stories.",
          "User content: study stories, reactions and study circle membership.",
          "Purchase history: records of purchases made through the App Store or Google Play. Your card and payment details are handled by Apple or Google and never reach us.",
        ],
      },
      {
        title: "Information we do not collect",
        body: "We do not collect location, contacts, photos/videos, microphone audio, files, calendar, health data, messages or phone numbers. Duki's study selfie is built from character art; the camera is not used. The app contains no ads.",
      },
      {
        title: "How we use information",
        items: [
          "To provide lessons, progress tracking, reviews and your personal daily plan",
          "To manage your account and keep your progress across devices",
          "To verify purchases and grant entitlements",
          "To send study reminders, if you allow them",
          "To prevent abuse and fraud and keep the service secure",
          "To produce anonymous usage statistics that improve the app, if you opt in",
        ],
      },
      {
        title: "Analytics",
        body: "Firebase Analytics and learning events are off by default; they are collected only if you turn them on in your profile, and you can turn them off at any time. Optional learning events are deleted after 90 days.",
      },
      {
        title: "Sharing and service providers",
        body: "We do not sell your personal data or share it for advertising. We only use providers that act on our behalf to run the service: Google (Google Sign-In, Google Play Billing, Firebase Analytics, Firebase Cloud Messaging), Apple (Sign in with Apple, App Store purchases, Apple Push Notification service for iOS notifications) and our server hosting provider. When you share a story to another app, that app's privacy practices apply. Your display name and stories in a study circle are visible to the other members of that circle.",
      },
      {
        title: "Retention and account deletion",
        body: "We keep your data while your account exists. You can delete your account in the app or on the web. Deletion removes your Google or Apple account link, progress, stories, circle memberships, notification tokens and sessions; if you signed in with Apple, the app's authorization in your Apple account is also revoked. Purchase records are kept in anonymized form for legal and audit obligations.",
      },
      {
        title: "Security",
        body: "All traffic between the app and our server is encrypted with HTTPS, and access to data is restricted. No system can guarantee absolute security.",
      },
      {
        title: "Your rights",
        body: `You can request access to, correction of, or deletion of your data. Write to ${CONTACT} for any request.`,
      },
      {
        title: "Age requirement",
        body: `${APP_NAME} is intended for adults (18+). We do not knowingly collect data from children.`,
      },
      {
        title: "Changes",
        body: "We may update this policy. The current version is always published on this page and the date below changes.",
      },
    ] as Section[],
    deleteLink: "Delete your Duckley account on the web",
    lastUpdated: "Effective and last updated: 21 October 2026",
    backButton: "Back",
  },
} as const;

export default function DuckleyPrivacyPolicyPage() {
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
            <Link href="/duckley/delete-account" className="text-sm underline" style={{ color: BRAND }}>
              {s.deleteLink}
            </Link>
            <p className="text-xs" style={{ color: "var(--text-muted)" }}>{s.lastUpdated}</p>
          </div>
        </div>
      </main>
    </div>
  );
}
