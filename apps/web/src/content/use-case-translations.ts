import type { AppLocale } from "@/i18n/routing"
import { localizeEnglishContent } from "@/i18n/content"

type LocalizableUseCase = {
  slug: string
  title: string
  description: string
  agent: string
  problem: string
  solution: string
  steps: string[]
  benefits: string[]
}

const tr: Record<string, Omit<LocalizableUseCase, "slug">> = {
  refactoring: {
    title: "Yapay Zekâ Destekli Kod Yeniden Düzenleme", description: "Aurict'in kod ajanıyla karmaşık kodu güvenle yeniden düzenleyin. Sorunları belirleyin, değişiklikleri planlayın ve güvenle uygulayın.", agent: "Kod Ajanı",
    problem: "Eski kodu yeniden düzenlemek zordur. Bağımlılıkları anlamanız, kırıcı değişikliklerden kaçınmanız ve testlerin hâlâ geçtiğinden emin olmanız gerekir. Manuel yeniden düzenleme yavaş ve hataya açıktır.",
    solution: "Aurict kod tabanınızı analiz eder, bağımlılıkları haritalar ve bağlam farkındalığıyla hedefli değişiklikleri planlamak ve uygulamak için uzman ajanlar kullanır.",
    steps: ["Aurict'ten belirli bir modülü veya deseni yeniden düzenlemesini isteyin", "Keşif Ajanı bağımlılıkları ve kullanımları haritalar", "Kod Ajanı yeniden düzenleme yaklaşımını planlar", "Değişiklikler proje bağlamıyla yapılır", "Doğruluğu doğrulamak için testler çalıştırılır veya önerilir"],
    benefits: ["Bağımlılık farkındalıklı yeniden düzenleme", "Test odaklı doğrulama", "Karmaşık çok dosyalı değişiklikler", "Proje stilinin korunması", "Framework farkındalıklı yönlendirme"],
  },
  "code-review": {
    title: "Yapay Zekâ ile Otomatik Kod İncelemesi", description: "Hataları, güvenlik sorunlarını ve stil ihlallerini üretime ulaşmadan yakalayın. Aurict'in İnceleme Ajanı yapılandırılmış kod incelemesi sunar.", agent: "İnceleme Ajanı",
    problem: "Kod incelemeleri zaman alır. Değişiklikler büyük olduğunda veya bağlam parçalı olduğunda inceleyenler ince hataları, güvenlik sorunlarını ve tutarlılık problemlerini kaçırabilir.",
    solution: "Aurict'in İnceleme Ajanı kod değişikliklerini hata, güvenlik riski, performans sorunu ve stil sapması açısından analiz eder; ardından bulguları açık önem dereceleriyle raporlar.",
    steps: ["Aurict'i bir PR'a, branch'e veya dosyaya yönlendirin", "İnceleme Ajanı değişikliği analiz eder", "Sorunlar önem derecesine göre gruplanır", "Öneriler somut düzeltmeler içerir", "Güvenliğe duyarlı bulgular açıkça vurgulanır"],
    benefits: ["Hata odaklı inceleme", "Güvenlik sorunu tespiti", "Tutarlı inceleme yapısı", "Performans riski belirleme", "Büyük değişikliklere ölçeklenme"],
  },
  testing: {
    title: "Gerçekten İşe Yarayan Yapay Zekâ Testleri", description: "Aurict'in Test Ajanıyla anlamlı testler üretin. Gerçek akışları, uç durumları ve hata kiplerini hedefleyen testlerle kapsamı artırın.", agent: "Test Ajanı",
    problem: "Test yazmayı ertelemek kolaydır. Düşük kapsam, hataların üretime ulaşmasına izin verir; yüzeysel üretilmiş testler de gerçek uç durumları çoğu zaman kaçırır.",
    solution: "Aurict'in Test Ajanı kod yapısını okur, önemli akışları belirler ve projenin mevcut framework'ünde birim veya entegrasyon testleri taslakları oluşturur.",
    steps: ["Aurict'ten bir modül için test üretmesini isteyin", "Test Ajanı kod yollarını analiz eder", "Uç durumlar ve hata durumları seçilir", "Testler yerel framework'te yazılır", "Sonuç doğrulanır veya sonraki test komutlarıyla işaretlenir"],
    benefits: ["Uç durum kapsamı", "Framework farkındalıklı test yapısı", "Okunabilir test adları", "Bağımlılık mock yönlendirmesi", "Daha iyi regresyon güvenliği"],
  },
  documentation: {
    title: "Otomatik Dokümantasyon Üretimi", description: "Kodunuzdan yararlı dokümantasyon üretin. Aurict'in Doküman Ajanı README'ler, API notları, satır içi açıklamalar ve kullanım örnekleri hazırlayabilir.", agent: "Doküman Ajanı",
    problem: "Kod, dokümanlardan daha hızlı değiştiğinde dokümantasyon güncelliğini yitirir. Yeni katkıcılar kaynak dosyalardan niyeti yeniden kurmak için zaman kaybeder.",
    solution: "Aurict'in Doküman Ajanı yapıyı, herkese açık API'leri, komutları ve kullanım desenlerini analiz eder; ardından kod tabanıyla uyumlu dokümantasyon taslağı oluşturur.",
    steps: ["Aurict'ten bir modülü veya projeyi belgelemesini isteyin", "Doküman Ajanı ilgili dosyaları okur", "Herkese açık API'ler ve komutlar çıkarılır", "Dokümantasyon örneklerle taslak hâline getirilir", "Boşluklar ve varsayımlar vurgulanır"],
    benefits: ["README üretimi", "API dokümantasyonu", "Kullanım örnekleri", "Katkıcı onboarding'i", "Daha az dokümantasyon sapması"],
  },
}

export function localizeUseCase<T extends LocalizableUseCase>(useCase: T, locale: AppLocale): T {
  if (locale === "tr" && tr[useCase.slug]) return { ...useCase, ...tr[useCase.slug] }
  return localizeEnglishContent(locale, useCase)
}
