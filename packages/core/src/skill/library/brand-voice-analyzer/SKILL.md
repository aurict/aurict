---
name: brand-voice-analyzer
description: "Marka dili kontrolü. Ton analizi. Tutarlılık skoru. Regresyon önerileri. Benchmark karşılaştırma. Guideline oluşturma."
triggers:
  keywords: ["marka sesi", "brand voice", "ton analizi", "marka dili", "içerik tutarlılığı", "brand guidelines", "tone of voice", " copywriting audit"]
  extensions: [".md", ".txt", ".pdf"]
auto_load_when: "Marka sesi analizi, içerik kontrolü veya brand guideline hazırlama talep edildiğinde"
agent: content-ops
tools: ["Read", "Write", "Bash"]
---

# Brand Voice Analyzer — MARKA SESİ ANALİZ VE REHBER

**Odağ:** Marka sesinin tutarlılığını analiz etmek, regresyon tespiti yapmak ve brand guideline oluşturmak.

---

## 1. Marka Sesi Bileşenleri

```
Brand Voice Matrisi:
├── TON (Tone):
│   ├── Formel ↔ Samimi
│   ├── Ciddi ↔ Eğlenceli
│   ├── Resmi ↔ Konuşma dili
│   ├── Otoriter ↔ Empatik
│   └── Dinamik ↔ Stabil
│
├── DİL (Language):
│   ├── Sözcük seçimi (jargon, sade dil)
│   ├── Cümle yapısı (uzun, kısa, karmaşık, basit)
│   ├── Aktif ↔ Pasif cümle tercihi
│   └── Yabancı kelime kullanımı (İngilizce, Arapça vb.)
│
├── DEĞERLER (Values):
│   ├── Samimiyet / Profesyonellik
│   ├── Yenilikçilik / Geleneksellik
│   ├── Cesaret / Dikkatlilik
│   └── Şeffaflık / Otorite
│
└── HEDEF KİTLE (Audience):
    ├── Yaş aralığı
    ├── Profesyonel seviye
    ├── Sektör bilgisi
    └── Kültürel bağlam
```

---

## 2. Ton Analizi Kategorileri

```
Ton Değerlendirme Matrisi:
├── KURUMSAL TON:
│   ├── Kullanım: B2B, finans, hukuk, sağlık
│   ├── Özellikler: Formel, net, profesyonel, veri odaklı
│   ├── Örnek: "X kuruluşu, Y alanında lider çözümler sunmaktadır."
│   └── Kaçınılacak: Argo, mizah, günlük dil
│
├── SAMİMİ/TİCARİ TON:
│   ├── Kullanım: E-ticaret, tüketici markaları, SaaS
│   ├── Özellikler: Sıcak, erişilebilir, çözüm odaklı
│   ├── Örnek: "X ürünümüzle hayatınızı kolaylaştırmak istiyoruz."
│   └── Kaçınılacak: Aşırı teknik dil, soğuk ton
│
├── EĞLENCELİ/KREATİF TON:
│   ├── Kullanım: Sosyal medya, genç kitle, eğlence
│   ├── Özellikler: Mizah, enerji, beklenmedik ifadeler
│   ├── Örnek: "Kim kahve içmeden güne başlayabilir ki? Biz başlayamıyoruz."
│   └── Kaçınılacak: Ciddi konular, kriz dönemleri
│
└── EMPATİK/DESTEKLEYİCİ TON:
    ├── Kullanım: Sağlık, eğitim, sosyal sorumluluk
    ├── Özellikler: Anlayışlı, kapsayıcı, insancıl
    ├── Örnek: "Zor bir dönemden geçiyorsanız, yanınızdayız."
    └── Kaçınılacak: Baskı, aciliyet hissi yaratan dil
```

---

## 3. Tutarlılık Skoru (Consistency Score)

```
Tutarlılık Değerlendirme Kriterleri:
├── SÖZCÜK KULLANIMI (%25):
│   ├── Marka-specific terimler tutarlı mı?
│   ├── Rakip marka isimleri nasıl geçiyor?
│   └── Yasaklı kelimeler (brand guide'da belirtilen) kullanılmış mı?
│
├── CÜMLE YAPISI (%25):
│   ├── Ortalama cümle uzunluğu tutarlı mı?
│   ├── Aktif/Pasif oranı tutarlı mı?
│   └── Madde işareti ve liste kullanımı tutarlı mı?
│
├── TON TUTARLILIĞI (%25):
│   ├── Genel ton (formel-samimi) korunuyor mu?
│   ├── Duygu ifadeleri tutarlı mı?
│   └── Emoji kullanımı tutarlı mı?
│
├── FORMAT UYUMU (%15):
│   ├── Başlık formatları tutarlı mı?
│   ├── CTA'lar tutarlı mı?
│   └── Görsel+metin oranı tutarlı mı?
│
└── DEĞER YANSIMASI (%10):
    ├── Marka değerleri vurgulanıyor mu?
    ├── Mesaj tutarlı mı?
    └── Hedef kitleye uygun ton mu?
```

---

## 4. Tutarlılık Kontrol Listesi (Audit Checklist)

```
İçerik Türü Bazlı Kontrol:
├── SOSYAL MEDYA:
│   ├── Aynı konsept farklı platformlarda tutarlı mı?
│   ├── Emoji ve hashtag kullanımı kurallara uygun mu?
│   ├── Posting sıklığı ve zamanlaması tutarlı mı?
│   └── Thread formatları kurallara uygun mu?
│
├── WEB SİTESİ:
│   ├── Ana sayfa tonu, diğer sayfalarla uyumlu mu?
│   ├── Ürün/hizmet açıklamaları tutarlı mı?
│   ├── Hata mesajları marka tonuna uygun mu?
│   └── Blog yazıları tonu ana siteyle uyumlu mu?
│
├── E-POSTA:
│   ├── Subject line tonu tutarlı mı?
│   ├── Body copy tonu tutarlı mı?
│   ├── Signature blokları standart mı?
│   └── Unsubscribe tonu uygun mu?
│
├── REKLAM:
│   ├── Reklam metni tonu diğer kanallarla uyumlu mu?
│   ├── CTA'lar standart mı?
│   └── Görsel metin dengesi korunuyor mu?
│
└── YAZILI BASIN:
│   ├── Basın bülteni tonu kurumsal standartlara uygun mu?
│   ├── Quote kullanımı tutarlı mı?
│   └── Teknik terim açıklamaları yapılıyor mu?
```

---

## 5. Regresyon Tespiti

```
Regresyon Türleri:
├── BİREYSEL REGRESYON:
│   ├── Yeni yazar eski yazara göre farklı ton
│   ├── Farklı department farklı dil kullanıyor
│   └── Freelance/agent yazıları tutarsızlık
│
├── ZAMANSAL REGRESYON:
│   ├── Marka yenilenmesi sonrası eski içerik güncellenmemiş
│   ├── Sezonsal kampanya tonu ana markadan saptığında
│   └── Aciliyet kampanyaları tonu zorlaması
│
├── KANAL REGRESYONU:
│   ├── Twitter tonu LinkedIn'den farklı (kullanılabilir ama bilinçli olmalı)
│   ├── Instagram samimi, web sitesi kurumsal
│   └── Customer support tonu marketing tonundan farklı
│
└── KRIZ REGRESYONU:
    ├── Kriz döneminde ton radikal değişiyor
    ├── Aşırı savunmacı veya aşırı empatik ton
    └── Tutarsız kriz mesajları
```

---

## 6. Benchmark Karşılaştırma

```
Benchmark Süreci:
├── ADIM 1: Rakipleri Belirle:
│   ├── Direkt rakipler (aynı segment)
│   ├── İdol markalar (aynı ton hedefleyen)
│   └── Global standart markalar (Apple, Nike, vs.)
│
├── ADIM 2: Veri Toplama:
│   ├── Son 20 post (sosyal medya)
│   ├── Website ana sayfa ve 3 alt sayfa
│   ├── Son 5 e-posta
│   ├── 2 reklam metni
│   └── 1 basın bülteni (varsa)
│
├── ADIM 3: Analiz:
│   ├── Sözcük frekans analizi
│   ├── Ton karşılaştırması (5'li ölçek)
│   ├── Cümle uzunluğu ortalaması
│   └── Emoji/format kullanım oranı
│
└── ADIM 4: Raporlama:
    ├── Karşılaştırma tablosu
    ├── Güçlü yanlarımız
    ├── Geliştirme alanları
    └── Öneriler
```

---

## 7. Brand Guideline Oluşturma

```
Brand Voice Guideline Bölümleri:
├── 1. MARKA KİMLİĞİ:
│   ├── Misyon ve vizyon
│   ├── Temel değerler
│   └── Hedef kitle profili
│
├── 2. TON TANIMI:
│   ├── Ton skalası (1-5 veya görsel)
│   ├── Tanımlayıcı kelimeler: "biz X ama Y değiliz"
│   ├── İzin verilen ve yasaklanmış ifadeler
│   └── Kanal bazlı ton farklılıkları (bilinçli)
│
├── 3. DİL KURALLARI:
│   ├── Sözcük listesi (doğru + yanlış örnekler)
│   ├── Jargon kullanımı politikası
│   ├── Yabancı kelime politikası
│   └── Rakip marka isimleri nasıl geçer?
│
├── 4. YAZIM STANDARTLARI:
│   ├── Büyük harf kullanımı
│   ├── Sayı yazımı (rakam mı yazıyla mı)
│   ├── Noktalama işaretleri
│   └── Emoji politikası
│
├── 5. FORMAT STANDARTLARI:
│   ├── Başlık formatları
│   ├── CTA standartları
│   ├── Paragraf uzunluğu
│   └── Görsel+metin oranı
│
└── 6. ÖRNEKLER:
    ├── Doğru örnek metin (3-5 örnek)
    ├── Yanlış örnek metin (3-5 örnek)
    ├── Farklı kanal örnekleri
    └── Kriz iletişimi örneği
```

---

## Key Patterns

1. **Kanal farklılığı bilinçli olmalı** — Twitter'da samimi, LinkedIn'de profesyonel olabilir ama bilinçli seçim olmalı.
2. **Yazarlar için "copy-paste" bir guide hazırla** — Soyut değil, somut örneklerle dolu olmalı.
3. **Sürekli güncelleme** — Marka evrildikçe guide güncellenmeli (en az 6 ayda bir).
4. **Tutarlılık scorecard kullan** — Her içerik için otomatik kontrol listesi.
5. **Yeni yazar onboarding zorunlu** — Her yeni yazar guide'ı okumalı ve onaylamalı.

---

## Anti-Patterns

```
❌ "Samimi ve profesyonel" gibi çelişkili tanımlar
✅ Somut tanım: "X konularında samimi, Y konularında profesyonel"

❌ Sadece "neyi yapma" kuralları
✅ "Neyi yapma" + "nasıl yap" + "örnek" üçlüsü şart

❌ Guide'ı PDF'te bırakıp unutturmak
✅ Tüm yazarlara erişilebilir, aranabilir formatta tut

❌ Benchmark sadece rakiplere bakmak
✅ Hem rakipler hem de "biz ne olmak istiyoruz" perspektifi

❌ Ton'u sürekli değiştirmek
✅ Ton stabil kalsın, değişiklik sadece bilinçli kararla olsun
```

---

## Quick Reference

| Ton Türü | Kullanım | Örnek Cümle |
|---|---|---|
| Kurumsal | B2B, finans, hukuk | "X kuruluşu, Y alanında lider çözümler sunmaktadır." |
| Samimi-ticari | E-ticaret, SaaS | "Hayatınızı kolaylaştıracak ürünlerimiz hazır." |
| Eğlenceli | Genç kitle, sosyal medya | "Bugün de kahvesiz güne başlayan var mı?" |
| Empatik | Sağlık, sosyal sorumluluk | "Zor bir dönemde yanınızdayız." |
| Otoriter | Eğitim, danışmanlık | "Bu metodoloji, X sonuçları garantiler." |

| Tutarlılık Kriteri | Ağırlık | Sıklık |
|---|---|---|
| Sözcük kullanımı | %25 | Her içerik |
| Cümle yapısı | %25 | Her içerik |
| Ton tutarlılığı | %25 | Her içerik |
| Format uyumu | %15 | Her içerik |
| Değer yansıması | %10 | Her içerik |

| Regresyon Türü | Tespit | Çözüm |
|---|---|---|
| Bireysel | Yazar bazlı analiz | Eğitim + guide tekrarı |
| Zamansal | tarihsel karşılaştırma | İçerik güncelleme |
| Kanal | Kanal bazlı analiz | Kanal rehberi |
| Kriz | Kriz sonrası analiz | Kriz planı |
