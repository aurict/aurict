---
name: pr-release-writer
description: "Basın bülteni yazımı. 5N1K formülü. Quote ekleme. Medya dağıtımı. Embargo kullanımı. Follow-up stratejileri."
triggers:
  keywords: ["basın bülteni", "press release", "pr", "halkla ilişkiler", "haber bülteni", "mediya", "press kit", "gazete", "gazetecilik"]
  extensions: [".md", ".docx", ".pdf"]
auto_load_when: "Basın bülteni yazımı, medya ilişkileri veya PR materyalleri talep edildiğinde"
agent: content-ops
tools: ["Read", "Write", "Bash", "WebFetch"]
---

# PR Release Writer — BASIN BÜLTENİ YAZIM REHBERİ

**Odağ:** Profesyonel basın bülteni yazımı, 5N1K formülü, medya dağıtımı ve follow-up stratejileri.

---

## 1. Basın Bülteni Temel Yapısı

```
Basın Bülteni Formatı:
├── BAŞLIK (Headline):
│   ├── Maks 100 karakter
│   ├── "Ne oldu?" — en önemli bilgi
│   ├── Aktif fiil, net, ilgi çekici
│   └── "İNGİLİZCE BAŞLIK" — büyük harflerle
│
├── ALT BAŞLIK (Subheadline):
│   ├── Başlığı destekleyen detay
│   ├── 1-2 cümle
│   └── Başlıkta verilmeyen bağlam
│
├── LOCATION VE TARİH:
│   ├── "[ŞEHİR], [TARİH]" — sol üst
│   └── Embargo varsa: "EMBARGO: [Tarih/Saat] GMT"
│
├── LEAD (İlk Paragraf):
│   ├── 5N1K formülü: Ne, Nerede, Ne zaman, Neden, Nasıl, Kim
│   ├── 25-35 kelime
│   ├── Haberin özeti — kim okusa anlamalı
│   └── Her şey burada bitmeli, geri kalan detay
│
├── BODY (Gövde):
│   ├── Paragraf 1: Detaylar, bağlam
│   ├── Paragraf 2: Şirket bilgisi, ürün detayı
│   ├── Paragraf 3: Ek bilgiler, özellikler
│   └── Paragraf N: Son bilgiler, ek kaynaklar
│
├── QUOTE (Alıntı):
│   ├── Şirket yetkilisinden bir alıntı
│   ├── "X diyor ki: [ quote ]"
│   └── İki alıntı olabilir (şirket + 3. taraf)
│
├── BOİLERPLATE (Şirket Tanıtımı):
│   ├── "X Hakkında" bölümü
│   ├── Kısa şirket tanımı (50-100 kelime)
│   ├── Web sitesi, sosyal medya linkleri
│   └── Temel bilgiler, rakamlar, kuruluş yılı
│
└── İLETİŞİM:
    ├── Medya iletişim bilgileri
    ├── İsim, telefon, e-posta
    └── "Basın soruları için..."
```

---

## 2. 5N1K Formülü Uygulaması

```
5N1K Matrisi:
├── NE? (What?):
│   ├── Ne haber veriyor?
│   ├── Hangi ürün, hizmet, olay?
│   └── "X şirketi, Y ürününü piyasaya sürdü"
│
├── NEREDE? (Where?):
│   ├── Coğrafi konum
│   ├── Global/yerel lansman
│   └── "İstanbul'da gerçekleşen..."
│
├── NE ZAMAN? (When?):
│   ├── Tarih ve saat
│   ├── Lansman tarihi, etkinlik tarihi
│   └── "1 Mart 2026 tarihinde..."
│
├── NEDEN? (Why?):
│   ├── Sebep ve gerekçe
│   ├── Stratejik amaç
│   └── "Müşterilerin artan ihtiyacına yanıt vermek için..."
│
├── NASIL? (How?):
│   ├── Nasıl gerçekleşti?
│   ├── Süreç ve yöntem
│   └── "X teknolojisi ile geliştirilen..."
│
└── KİM? (Who?):
    ├── Kim haber veriyor?
    ├── Kim etkili?
    ├── "X şirketi, Y ortaklarıyla birlikte..."
    └── Tüm paydaşlar
```

---

## 3. Başlık ve Lead Yazım Teknikleri

```
Başlık Formülleri:
├── DOLAYLI ANLATIM:
│   ├── "X Şirketi Y ile İş Birliği Yaptı"
│   ├── "Z Ürün ailesini Duyurdu"
│   └── Olay + etki biçiminde
│
├── DOLAYSIZ İDDİA:
│   ├── "X: Yılda 1 Milyon Müşteri Hedefliyor"
│   ├── "X, Sektörün İlk Yapay Zeka Destekli Çözümünü Sundu"
│   └── Güçlü rakam veya iddia içeren
│
├── SORU:
│   ├── "X Mümkün mü? Y Şirketi Cevap Verdi"
│   ├── "Neden X Artık Z'den Daha Önemli?"
│   └── Merak uyandıran
│
└── ŞOK/Fİ Gur:
    ├── "X Milyon Dolarlık Yatırım Aldı"
    ├── "İlk Kez: X Sektöründe Bir İlk"
    └── Büyük rakam, beklenmedik bilgi
```

---

## 4. Quote Kullanımı

```
Quote Yazım Kuralları:
├── KİMDEN ALINTI:
│   ├── CEO veya kurucu (önemli haberler)
│   ├── İlgili VP veya direktör (ürün/servis haberleri)
│   ├── Satış/pazarlama müdürü (ortaklık haberleri)
│   └── Üçüncü taraf (müşteri, partner, analist)
│
├── QUOTE İÇERİĞİ:
│   ├── Haberin neden önemli olduğunu açıklayan
│   ├── Gelecek hedeflerini paylaşan
│   ├── Müşteri/piyasa perspektifi sunan
│   └── "Bugün duyurduğumuz X, şirketimiz için dönüm noktası..."
│
└── ÖRNEK QUOTE YAPISI:
    ```
    "[İSİM], [UNVAN] ve [ŞİRKET]:
    
    "Bu iş birliği, müşterilerimize sunduğumuz hizmet kalitesini 
    önemli ölçüde artıracak. [Kısa fayda açıklaması]. Gelecek yıl 
    [X] hedefimizi gerçekleştirmek için güçlü bir adım atıyoruz."
    ```
```

---

## 5. Embargo Kullanımı

```
Embargo Nedir?
├── Tanım: Belirli bir tarih/saate kadar yayınlanmaması istenen içerik
├── Kullanım: Büyük haberler, analist erişimi, yazılım beta
└── Medya güveni için önemli

Embargo Formatı:
```
EMBARGO: Bu basın bülteni [TARİH] GMT saat [SAAT]'e kadar 
yayınlanmamalıdır.

[İçerik devam eder...]

EMBARGO BİTİŞİ: [TARİH VE SAAT]
```

Embargo Kuralları:
├── EMBARGOYU AÇIKÇA BELİRT:
│   ├── Başlık altında ilk satırda
│   ├── "EMBARGO: [Tarih/Saat]" formatında
│   └── Büyük harflerle yaz
│
├── GEREKÇE AÇIKLA:
│   ├── "Analist raporu yayınlanana kadar"
│   ├── "Ürün lansmanı ile eş zamanlı"
│   └── Medya neden beklemesi gerektiğini anlamalı
│
└── EMBARGOYU İHLAL EDENİ BİLDİR:
    ├── O an haberi çeken medyaya ulaş
    ├── Açıklama iste
    └── Gelecek embargo ihlallerinde bilgi kes
```

---

## 6. Medya Dağıtım Stratejisi

```
Dağıtım Kanalları:
├── DOĞRUDAN E-POSTA:
│   ├── Gazeteci/muhabir e-postaları
│   ├── Kişiye özel mesajlaşma
│   ├── Her gazeteciye özel e-posta (copy-paste değil)
│   └── Hedef: Muhabir ve editörler
│
├── PR DAĞITIM SERVİSLERİ:
│   ├── Türkiye: Haber Ajansı, PR Newswire Türkiye, İstanbul Press
│   ├── Global: PR Newswire, Business Wire, GlobeNewswire
│   ├── Otomatik dağıtım + performans raporu
│   └── Fiyat: Ücretsiz-pahalı arası seçenekler
│
├── SEKTÖREL PLATFORM:
│   ├── Sektörün yayınladığı dergiler/portallar
│   ├── LinkedIn medya ortakları
│   └── Sektör influencer'ları
│
└── SOSYAL MEDYA:
    ├── Şirket Twitter/LinkedIn hesabı
    ├── Press kit paylaşımı
    └── Medya tagleme
```

---

## 7. Press Kit (Basın Kiti) İçeriği

```
Press Kit Bileşenleri:
├── BASIN BÜLTENİ (PDF):
│   ├── Güncel basın bülteni
│   └── Geçmiş bültenler de eklenebilir
│
├── ŞİRKET BİLGİ KİTİ (Fact Sheet):
│   ├── Kuruluş yılı, merkez
│   ├── Çalışan sayısı
│   ├── Finansal veriler (varsa)
│   ├── Ürün/hizmet portföyü
│   └── Ödüller ve başarılar
│
├── LOGO VE GÖRSELLER:
│   ├── Vector logo (EPS, SVG)
│   ├── PNG logo (şeffaf arka plan)
│   ├── Kurumsal fotoğraflar
│   ├── Ürün görselleri
│   └── Yönetici fotoğrafları
│
├── YÖNETİCİ BİYOGRAFİLERİ:
│   ├── CEO ve kilit yöneticiler
│   ├── Fotoğraf + bio
│   └── LinkedIn profile linkleri
│
├── ÜRÜN/HİZMET GÖRSELLERİ:
│   ├── High-res ürün fotoğrafları
│   ├── Kullanım senaryoları
│   ├── Lifestyle görseller
│   └── Demo video linki (varsa)
│
└── SSS (Sıkça Sorulan Sorular):
    ├── Medyanın sorabileceği sorular + cevaplar
    ├── Teknik detaylar
    └── Rakip karşılaştırması notları
```

---

## 8. Follow-up Stratejileri

```
Follow-up Protokolü:
├── TAKİP 1 (Bülten Gönderimden 3-5 gün sonra):
│   ├── "Bültenimizi aldınız mı?" kısa e-posta
│   ├── Ek bilgi sunma teklifi
│   ├── Kişisel bağlantı (ortak tanışıklık varsa referans)
│   └── Ton: Samimi, baskısız
│
├── TAKİP 2 (1-2 hafta sonra):
│   ├── Alternatif bir açı açısı
│   ├── "Bu hafta X gündemde — ilginizi çekebilir"
│   ├── Farklı içerik önerisi
│   └── Ton: Bilgilendirici
│
└── TAKİP 3 (3-4 hafta sonra — son deneme):
    ├── "Son bir hatırlatma" formatı
    ├── Yeni bir haber varsa sun
    ├── "Bir sonraki bültenimizde sizi inclusion edelim" teklifi
    └── Ton: Kısa, net

Follow-up NOT'ları:
├── AŞIRI TAKİPTEN KAÇIN:
│   ├── 2 kereden fazla aynı muhabire aynı haftada yazma
│   ├── "Cevap vermedi" üzerine baskı kurma
│   └── Reddedildiğinde saygıyla çekil
│
├── KİŞİSEL ERİŞİM KUR:
│   ├── LinkedIn'ten bağlantı kur
│   ├── Gazetecinin önceki yazılarından referans ver
│   └── "Son yazınızı okudum, bu haber ilginizi çeker..." yaklaşımı
│
└── MEDYA İLİŞKİLERİNİ BÜYÜT:
    ├── Her başarılı haber = medya ilişkisi güçlenir
    ├── Bir sonraki haber için kapı açılır
    └── "Background briefing" teklifi ile güven inşası
```

---

## Key Patterns

1. **Lead'de 5N1K mutlaka cevaplanmalı** — Okuyucunun sadece ilk paragrafı okuyacağını varsayarak yaz.
2. **Başlık tek başına haber olmalı** — "Bunu okuyunca ne öğreneceğim?" sorusu.
3. **Quote = hikaye anlatımı** — Sadece teşekkür değil, haberin anlamını genişletmeli.
4. **Boilerplate standart tut** — Her bültene aynı şirket tanımı.
5. **Dağıtım = gönderim değil** — Follow-up ve ilişki inşası şart.

---

## Anti-Patterns

```
❌ "Şirketimizin gurur duyacağı..." gibi abartılı ifadeler
✅ Objektif, haber değeri taşıyan dil

❌ Teknik jargondan kaçınmamak
✅ Herkesin anlayacağı sade dil; jargon varsa açıkla

❌ Başlıkta şirket adını ön plana çıkarmak
✅ Haber değeri önce gelir; şirket adı lead'de yeter

❌ "Detaylar için..." gibi belirsiz CTA'lar
✅ Somut bilgi, web sitesi linki, iletişim bilgisi

❌ Copy-paste email göndermek
✅ Her gazeteciye kişiselleştirilmiş e-posta
```

---

## Quick Reference

| Bülten Bölümü | Kelime Sayısı | Kural |
|---|---|---|
| Başlık | 10-15 kelime | Aktif fiil, net |
| Alt başlık | 20-30 kelime | Başlığı destekler |
| Lead | 25-35 kelime | 5N1K cevaplanır |
| Body | 300-500 kelime | Detaylar |
| Quote | 50-100 kelime | Şirket perspektifi |
| Boilerplate | 50-100 kelime | Standart şirket tanımı |

| Embargo Durumu | Format | Kullanım |
|---|---|---|
| Embargo yok | Standart format | Acil/hızlı haberler |
| Embargo var | "EMBARGO: [Tarih/Saat]" | Analist erişimi |
| Embargo bitti | Not kaldırılır | Tarih geçtikten sonra |

| Dağıtım Kanalı | Hedef | Öneri |
|---|---|---|
| Doğrudan email | Muhabir/Editör | En etkili |
| PR servisi | Mass medya | Geniş kapsam |
| Sektörel portal | Niche medya | Uzman çevre |
| Sosyal medya | Genel halk | Farkındalık |

| Follow-up | Zamanlama | Ton |
|---|---|---|
| Takip 1 | 3-5 gün | Samimi, bilgi verici |
| Takip 2 | 1-2 hafta | Farklı açı |
| Takip 3 | 3-4 hafta | Kısa, net |
