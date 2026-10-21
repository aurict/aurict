"use client";

import Link from "next/link";
import { useLanguage } from "@/contexts/LanguageContext";
import AmbientBackground from "@/components/AmbientBackground";
import PageHeader from "@/components/PageHeader";

const BRAND = "var(--duck)";
const APP_NAME = "Duckley";
const PACKAGE_NAME = "com.aurict.duckley";
const DEVELOPER = "benLothe";
const CONTACT = "contact@aurict.com";

type Section = { title: string; body?: string; items?: string[] };

const STRINGS = {
  tr: {
    title: "Duckley Kullanım Koşulları",
    identityTitle: "Bu koşullar kimin, hangi uygulama için",
    appLabel: "Uygulama",
    packageLabel: "Paket adı / Bundle ID",
    developerLabel: "Geliştirici (App Store ve Google Play'deki adı)",
    contactLabel: "İletişim",
    identityBody: `Bu kullanım koşulları (son kullanıcı lisans sözleşmesi), App Store ve Google Play'de ${DEVELOPER} geliştirici adıyla yayınlanan ${APP_NAME} mobil uygulaması ve ona bağlı hizmetler için geçerlidir. "Biz" ifadesi ${APP_NAME}'yi geliştiren ve yayınlayan ${DEVELOPER}'ı, "sen" ifadesi uygulamayı kullanan kişiyi ifade eder. Uygulamayı indirerek veya kullanarak bu koşulları kabul etmiş olursun.`,
    sections: [
      {
        title: "Hizmet",
        body: `${APP_NAME}; kısa dersler, quizler, tekrarlar, günlük plan, Duki karakteri, yumurta ve kart albümü, çalışma grupları ve ders hikâyeleri sunan bir öğrenme uygulamasıdır. Dersler genel bilgi amaçlıdır; tıbbi, hukuki, finansal veya başka bir profesyonel tavsiye yerine geçmez. İçeriği doğru tutmaya çalışırız, ancak hata içermeyeceğini garanti edemeyiz.`,
      },
      {
        title: "Yaş sınırı ve hesap",
        items: [
          `${APP_NAME} yetişkinlere (18+) yöneliktir. Uygulamayı kullanarak 18 yaşını doldurduğunu beyan edersin.`,
          "Uygulamayı misafir olarak kullanabilirsin. Yumurta, kart, İnci, çalışma grupları ve satın almalar için Google veya Apple ile giriş yapman gerekir.",
          "Hesabının ve cihazının güvenliğinden sen sorumlusun. Başkasının hesabını kullanamaz, hesabını devredemez veya satamazsın.",
          "Hesabını istediğin zaman uygulama içinden veya web üzerinden silebilirsin. Hesap silme işlemi mağaza aboneliğini iptal etmez.",
        ],
      },
      {
        title: "Premium aboneliği",
        items: [
          "Duckley Premium, aylık ve otomatik yenilenen bir aboneliktir. Fiyat, satın almadan önce App Store veya Google Play'de yerel para biriminle gösterilir.",
          "Ödeme, satın almayı onayladığında App Store (Apple ID) veya Google Play hesabından alınır.",
          "Abonelik, mevcut dönem bitmeden en az 24 saat önce iptal edilmezse aynı süre ve o anki fiyatla kendiliğinden yenilenir. Yenileme ücreti dönem bitmeden önceki 24 saat içinde alınır.",
          "Aboneliğini App Store'da Ayarlar > Apple ID > Abonelikler bölümünden, Google Play'de Play Store > Ödemeler ve abonelikler bölümünden yönetebilir ve iptal edebilirsin. İptal sonrasında Premium erişimin ödenen dönemin sonuna kadar sürer.",
          "Ücretsiz deneme sunulursa, deneme süresinin kullanılmayan kısmı abonelik satın alındığında sona erer.",
          "Uygulamayı veya hesabını silmek aboneliği iptal etmez.",
          "İade talepleri mağazanın kendi kurallarına göre Apple veya Google tarafından değerlendirilir; biz mağaza ödemelerini doğrudan iade edemeyiz. Yasal tüketici hakların saklıdır.",
          "Premium, uygulama içi ödüllerle (İnci) sınırlı bir süre için de açılabilir. Bu şekilde açılan Premium ücretli değildir ve otomatik yenilenmez.",
        ],
      },
      {
        title: "Tek seferlik satın almalar",
        body: "Mağazadan satın alınan karakterler ve benzeri kalıcı içerikler, satın alındıkları Duckley hesabına bağlanır ve aynı hesapla giriş yapıldığında geri yüklenebilir. Mağaza tarafından iade edilen veya iptal edilen satın almaların sağladığı içerik geri alınabilir.",
      },
      {
        title: "Sanal öğeler",
        body: "XP, İnci, yumurta, kartlar ve aksesuarlar yalnızca uygulama içinde kullanılan sanal öğelerdir. Gerçek para değeri yoktur; paraya çevrilemez, satılamaz, başka hesaba aktarılamaz. Yumurtalar satılmaz, yalnızca derslerle kazanılır. Hata, kötüye kullanım veya hile sonucu elde edilen sanal öğeleri düzeltme veya geri alma hakkımız saklıdır.",
      },
      {
        title: "Kullanıcı içeriği ve davranış kuralları",
        items: [
          "Görünen adın, ders hikâyelerin ve tepkilerin çalışma grubundaki diğer üyelere görünür. Paylaştığın içerikten sen sorumlusun.",
          "Yasa dışı, nefret söylemi içeren, taciz edici, müstehcen, şiddet içeren, başkasını taklit eden veya başkalarının kişisel bilgilerini içeren içerik paylaşamazsın.",
          "Uygulamayı tersine mühendislikle çözemez, otomatik araçlarla kullanamaz, hataları ödül kazanmak için istismar edemez veya kuralları aşmak için birden fazla hesap açamazsın.",
          `Bu kurallara aykırı içeriği kaldırabilir, ilgili hesabı geçici veya kalıcı olarak kısıtlayabiliriz. Uygunsuz içeriği veya kullanıcıyı ${CONTACT} adresine bildirebilirsin; bildirimleri en kısa sürede inceleriz.`,
          "Paylaştığın içeriğin sahibi sensin. Hizmeti sunabilmemiz için bize bu içeriği uygulamada saklama ve seçtiğin kişilere gösterme izni verirsin.",
        ],
      },
      {
        title: "Lisans ve fikri mülkiyet",
        body: `${APP_NAME} uygulaması, dersler, Duki karakteri, görseller, sesler ve diğer tüm içerik ${DEVELOPER}'a veya lisans verenlerine aittir. Sana, uygulamayı sahibi olduğun veya kontrol ettiğin cihazlarda, kişisel ve ticari olmayan amaçla kullanman için kişisel, münhasır olmayan, devredilemez ve geri alınabilir bir lisans veririz. Bu koşullarda açıkça verilmeyen tüm haklar saklıdır.`,
      },
      {
        title: "Değişiklikler, kesintiler ve sona erme",
        body: "Uygulamayı ve özelliklerini geliştirebilir, değiştirebilir veya sonlandırabiliriz. Hizmetin kesintisiz veya hatasız olacağını garanti etmeyiz. Bu koşulları ihlal edersen hesabını kapatabiliriz. Hesabını silerek veya uygulamayı kullanmayı bırakarak bu sözleşmeyi istediğin zaman sona erdirebilirsin.",
      },
      {
        title: "Sorumluluğun sınırlandırılması",
        body: "Uygulama \"olduğu gibi\" sunulur. Yürürlükteki hukukun izin verdiği en geniş ölçüde, uygulamanın kullanımından doğan dolaylı zararlardan sorumlu değiliz. Bu sınırlama, kasıt veya ağır ihmalden doğan sorumluluğu ve yasal tüketici haklarını kısıtlamaz.",
      },
      {
        title: "Apple App Store'dan indirenler için",
        items: [
          `Bu sözleşme Apple ile değil, yalnızca seninle ${DEVELOPER} arasındadır. ${APP_NAME}'den ve içeriğinden Apple değil ${DEVELOPER} sorumludur.`,
          "Lisans, sahibi olduğun veya kontrol ettiğin Apple markalı cihazlarda ve App Store Hizmet Koşulları'ndaki Kullanım Kurallarına uygun şekilde kullanım içindir; Aile Paylaşımı da bu kurallara tabidir.",
          "Apple'ın uygulama için bakım veya destek hizmeti sağlama yükümlülüğü yoktur. Destek için bize ulaşabilirsin.",
          "Uygulama yürürlükteki bir garantiye uymazsa Apple'a bildirebilirsin; Apple da varsa uygulamanın satın alma bedelini iade edebilir. Yasanın izin verdiği ölçüde Apple'ın uygulamayla ilgili başka bir garanti yükümlülüğü yoktur.",
          "Uygulamayla ilgili ürün sorumluluğu, yasal veya mevzuata uyumla ilgili iddialar ve tüketici korumasıyla ilgili talepler Apple'a değil bize yöneltilir.",
          "Uygulamanın veya kullanımının başkasının fikri mülkiyet haklarını ihlal ettiği iddia edilirse, bu iddianın incelenmesi ve çözümü Apple'ın değil bizim sorumluluğumuzdadır.",
          "ABD ambargosu altındaki bir ülkede veya ABD'nin \"terörü destekleyen\" ülkeler listesinde bulunmadığını ve ABD hükümetinin yasaklı veya kısıtlı kişiler listelerinde yer almadığını beyan edersin.",
          "Uygulamayı kullanırken mobil veri sağlayıcın gibi üçüncü tarafların koşullarına da uymalısın.",
          "Apple ve bağlı şirketleri bu sözleşmenin üçüncü taraf lehtarıdır. Bu koşulları kabul ettiğinde Apple, sözleşmeyi bir üçüncü taraf lehtar olarak sana karşı uygulama hakkını kazanır.",
        ],
      },
      {
        title: "Google Play'den indirenler için",
        body: "Google Play üzerinden yapılan indirme ve satın almalara Google Play Hizmet Şartları da uygulanır. Bu koşullar ile Google Play şartları arasında çelişki olursa, Google ile aranızdaki ilişki bakımından Google Play şartları geçerlidir.",
      },
      {
        title: "Uygulanacak hukuk",
        body: "Bu koşullar Türkiye Cumhuriyeti hukukuna tabidir. Tüketici olarak yaşadığın ülkenin zorunlu tüketici koruma hükümlerinden doğan hakların saklıdır; Türkiye'deki tüketiciler Tüketici Hakem Heyetlerine ve Tüketici Mahkemelerine başvurabilir.",
      },
      {
        title: "Koşullardaki değişiklikler",
        body: "Bu koşulları güncelleyebiliriz. Güncel sürüm her zaman bu sayfada yayınlanır ve aşağıdaki tarih değişir. Önemli değişiklikleri uygulama içinde de duyururuz. Değişiklikten sonra uygulamayı kullanmaya devam etmen güncel koşulları kabul ettiğin anlamına gelir.",
      },
      {
        title: "İletişim",
        body: `Sorular, destek talepleri, içerik bildirimleri ve hukuki talepler için ${DEVELOPER}'a ${CONTACT} adresinden ulaşabilirsin.`,
      },
    ] as Section[],
    privacyLink: "Duckley gizlilik politikası",
    deleteLink: "Duckley hesabını web üzerinden sil",
    lastUpdated: "Yürürlük ve son güncelleme: 21 Ekim 2026",
    backButton: "Geri",
  },
  en: {
    title: "Duckley Terms of Use",
    identityTitle: "Who these terms are from and which app they cover",
    appLabel: "App",
    packageLabel: "Package name / Bundle ID",
    developerLabel: "Developer (name on the App Store and Google Play)",
    contactLabel: "Contact",
    identityBody: `These terms of use (end user license agreement) apply to the ${APP_NAME} mobile app and its related services, published on the App Store and Google Play under the developer name ${DEVELOPER}. "We", "us" and "our" refer to ${DEVELOPER}, the developer and publisher of ${APP_NAME}; "you" refers to the person using the app. By downloading or using the app you agree to these terms.`,
    sections: [
      {
        title: "The service",
        body: `${APP_NAME} is a learning app with short lessons, quizzes, reviews, a daily plan, the Duki character, eggs and a card album, study circles and lesson stories. Lessons are for general information only and are not medical, legal, financial or other professional advice. We work to keep content accurate but cannot guarantee it is free of errors.`,
      },
      {
        title: "Age requirement and accounts",
        items: [
          `${APP_NAME} is intended for adults (18+). By using the app you confirm that you are at least 18 years old.`,
          "You can use the app as a guest. Eggs, cards, Pearls, study circles and purchases require signing in with Google or Apple.",
          "You are responsible for keeping your account and device secure. You may not use someone else's account or transfer or sell your account.",
          "You can delete your account at any time in the app or on the web. Deleting your account does not cancel a store subscription.",
        ],
      },
      {
        title: "Premium subscription",
        items: [
          "Duckley Premium is a monthly, auto-renewing subscription. The price is shown in your local currency on the App Store or Google Play before you buy.",
          "Payment is charged to your App Store (Apple ID) or Google Play account when you confirm the purchase.",
          "The subscription renews automatically for the same period at the then-current price unless it is cancelled at least 24 hours before the end of the current period. Your account is charged for renewal within the 24 hours before the current period ends.",
          "You can manage and cancel your subscription on the App Store under Settings > Apple ID > Subscriptions, and on Google Play under Play Store > Payments & subscriptions. After cancelling, Premium access continues until the end of the paid period.",
          "If a free trial is offered, any unused portion of the trial ends when you purchase a subscription.",
          "Deleting the app or your account does not cancel your subscription.",
          "Refund requests are handled by Apple or Google under their own store policies; we cannot refund store payments directly. Your statutory consumer rights are not affected.",
          "Premium can also be unlocked for a limited time with in-app rewards (Pearls). Premium unlocked this way is not paid and does not renew automatically.",
        ],
      },
      {
        title: "One-time purchases",
        body: "Characters and similar permanent content bought in the store are linked to the Duckley account used for the purchase and can be restored by signing in with the same account. Content from purchases that the store refunds or cancels may be removed.",
      },
      {
        title: "Virtual items",
        body: "XP, Pearls, eggs, cards and accessories are virtual items for use inside the app only. They have no real-world monetary value and cannot be exchanged for money, sold or transferred to another account. Eggs are not sold; they are earned only through lessons. We may correct or remove virtual items obtained through errors, abuse or cheating.",
      },
      {
        title: "User content and conduct",
        items: [
          "Your display name, lesson stories and reactions are visible to the other members of your study circle. You are responsible for what you share.",
          "You may not share content that is illegal, hateful, harassing, sexually explicit or violent, that impersonates someone, or that contains other people's personal information.",
          "You may not reverse engineer the app, use it with automated tools, exploit bugs to earn rewards, or create multiple accounts to get around the rules.",
          `We may remove content that breaks these rules and temporarily or permanently restrict the account involved. You can report objectionable content or users to ${CONTACT}; we review reports promptly.`,
          "You own the content you share. You give us permission to store it in the app and show it to the people you choose, so that we can provide the service.",
        ],
      },
      {
        title: "License and intellectual property",
        body: `The ${APP_NAME} app, its lessons, the Duki character, artwork, sounds and all other content belong to ${DEVELOPER} or its licensors. We grant you a personal, non-exclusive, non-transferable, revocable license to use the app on devices you own or control for personal, non-commercial purposes. All rights not expressly granted in these terms are reserved.`,
      },
      {
        title: "Changes, interruptions and termination",
        body: "We may improve, change or discontinue the app and its features. We do not guarantee that the service will be uninterrupted or error-free. We may close your account if you break these terms. You can end this agreement at any time by deleting your account or stopping use of the app.",
      },
      {
        title: "Limitation of liability",
        body: "The app is provided \"as is\". To the fullest extent permitted by applicable law, we are not liable for indirect damages arising from use of the app. This limitation does not restrict liability for intent or gross negligence, or your statutory consumer rights.",
      },
      {
        title: "If you downloaded the app from the Apple App Store",
        items: [
          `This agreement is between you and ${DEVELOPER} only, not Apple. ${DEVELOPER}, not Apple, is solely responsible for ${APP_NAME} and its content.`,
          "The license is for use on Apple-branded products that you own or control, as permitted by the Usage Rules in the App Store Terms of Service, including Family Sharing where those rules allow it.",
          "Apple has no obligation to provide any maintenance or support services for the app. Contact us for support.",
          "If the app fails to conform to any applicable warranty, you may notify Apple, and Apple may refund the purchase price of the app, if any. To the maximum extent permitted by law, Apple has no other warranty obligation with respect to the app.",
          "We, not Apple, are responsible for addressing any claims relating to the app, including product liability claims, claims that the app fails to conform to any legal or regulatory requirement, and claims under consumer protection or similar legislation.",
          "If a third party claims that the app or your use of it infringes their intellectual property rights, we, not Apple, are responsible for the investigation, defence, settlement and discharge of that claim.",
          "You represent that you are not located in a country that is subject to a U.S. Government embargo or that has been designated by the U.S. Government as a \"terrorist supporting\" country, and that you are not listed on any U.S. Government list of prohibited or restricted parties.",
          "You must comply with applicable third-party terms, such as your wireless data service agreement, when using the app.",
          "Apple and Apple's subsidiaries are third-party beneficiaries of this agreement. Once you accept these terms, Apple will have the right to enforce this agreement against you as a third-party beneficiary.",
        ],
      },
      {
        title: "If you downloaded the app from Google Play",
        body: "Downloads and purchases made through Google Play are also subject to the Google Play Terms of Service. If these terms conflict with the Google Play terms, the Google Play terms govern your relationship with Google.",
      },
      {
        title: "Governing law",
        body: "These terms are governed by the laws of the Republic of Türkiye. You keep any rights you have under the mandatory consumer protection laws of the country where you live; consumers in Türkiye may apply to Consumer Arbitration Committees and Consumer Courts.",
      },
      {
        title: "Changes to these terms",
        body: "We may update these terms. The current version is always published on this page and the date below changes. We also announce material changes in the app. Continuing to use the app after a change means you accept the updated terms.",
      },
      {
        title: "Contact",
        body: `For questions, support requests, content reports and legal requests, contact ${DEVELOPER} at ${CONTACT}.`,
      },
    ] as Section[],
    privacyLink: "Duckley privacy policy",
    deleteLink: "Delete your Duckley account on the web",
    lastUpdated: "Effective and last updated: 21 October 2026",
    backButton: "Back",
  },
} as const;

export default function DuckleyTermsPage() {
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
            <div className="flex flex-wrap justify-center gap-x-6 gap-y-2">
              <Link href="/duckley/privacy-policy" className="text-sm underline" style={{ color: BRAND }}>
                {s.privacyLink}
              </Link>
              <Link href="/duckley/delete-account" className="text-sm underline" style={{ color: BRAND }}>
                {s.deleteLink}
              </Link>
            </div>
            <p className="text-xs" style={{ color: "var(--text-muted)" }}>{s.lastUpdated}</p>
          </div>
        </div>
      </main>
    </div>
  );
}
