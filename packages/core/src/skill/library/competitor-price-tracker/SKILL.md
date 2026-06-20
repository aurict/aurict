---
name: competitor-price-tracker
description: "E-ticaret fiyat izleme. Dynamic pricing. Price elasticity. Alert sistemleri. Grafikler ve raporlar. Fiyat optimizasyonu önerileri."
triggers:
  keywords: ["fiyat izleme", "price tracking", "e-ticaret", "competitor monitoring", "dynamic pricing", "fiyat optimizasyonu", "price elasticity", "rakip fiyat"]
  extensions: [".md", ".csv", ".xlsx", ".json"]
auto_load_when: "Fiyat analizi, rakip fiyat takibi veya e-ticaret fiyat stratejisi talep edildiğinde"
agent: content-ops
tools: ["Read", "Write", "Bash", "WebFetch"]
---

# Competitor Price Tracker — FİYAT İZLEME VE ANALİZ REHBERİ

**Odağ:** Rakip e-ticaret sitelerinden fiyat verisi çekme, dinamik fiyatlandırma stratejileri ve optimizasyon önerileri.

---

## 1. Fiyat İzleme Temelleri

```
İzleme Kapsamı:
├── TAKİP EDİLECEK VERİLER:
│   ├── Ürün adı ve SKU
│   ├── Rakip site ve URL
│   ├── Fiyat (döviz bazlıysa kur ile)
│   ├── İndirim oranı (varsa)
│   ├── Stok durumu
│   └── Kargo/teslimat bilgisi
│
├── İZLEME SIKLIĞI:
│   ├── Günlük: Hızlı değişen pazar (moda, elektronik)
│   ├── Haftalık: Orta değişim (ev tekstil, spor)
│   ├── Aylık: Yavaş değişen (mobilya, beyaz eşya)
│   └── Günlük kritik anlar: Pazartesi sabah, Cuma günü, kampanyalar
│
└── VERİ TOPLAMA YÖNTEMLERİ:
    ├── Web scraping (otomatik veri çekme)
    ├── Price API servisleri (WebScraper, Pronotrix vb.)
    ├── Manuel kontrol (küçük ölçek)
    └── Rakip bildirimleri (RSS, email alert)
```

---

## 2. Web Scraping Stratejisi

```
Scraping Yaklaşımları:
├── KENDİ ÇÖZÜM (Python/Node.js):
│   ├── Python: BeautifulSoup, Scrapy, Selenium
│   ├── Node.js: Puppeteer, Cheerio
│   ├── Avantaj: Tam kontrol, düşük maliyet
│   └── Dezavantaj: Teknik bakım gerektirir, site değişikliğinde kırılır
│
├── FİYAT API SERVİSLERİ:
│   ├── WebScraper.io
│   ├── Pronotrix
│   ├── ScrapeOps
│   ├── Prisync
│   └── Avantaj: Bakım kolay, hızlı kurulum
│   └── Dezavantaj: Abonelik maliyeti
│
└── MANUEL MONİTÖRİNG:
    ├── Küçük ürün sayısı (<50 SKU)
    ├── Haftada 1-2 kontrol yeterli
    └── Google Alert ile destekle
```

---

## 3. Dynamic Pricing (Dinamik Fiyatlandırma)

```
Dynamic Pricing Modelleri:
├── REKABETÇİ TABANLI (Competitive-Based):
│   ├── Rakip fiyatına göre +/- belirli marj
│   ├── "Rakip fiyatının %2 altında"
│   ├── Otomatik güncelleme
│   └── Dikkat: Fiyat savaşı riski
│
├── TALEP TABANLI (Demand-Based):
│   ├── Talep artınca fiyat artış
│   ├── Talep düşünce fiyat düşüş
│   ├── Geçmiş satış verisi ile model kurulur
│   └── E-ticaret platformları için ideal
│
├── ZAMAN TABANLI (Time-Based):
│   ├── Sezonluk fiyatlandırma
│   ├── "Okul dönemi başlangıcında +%15"
│   ├── Gün içi fiyat dalgalanması (gece indirim)
│   └── Etkinlik/tatil öncesi
│
└── PERİYODİK İNDİRİM (Periodic Discount):
    ├── "Her ayın ilk haftası %10 indirim"
    ├── Black Friday, kampanya dönemleri
    └── Müşteri beklentisi oluşturma
```

---

## 4. Price Elasticity (Fiyat Esnekliği)

```
Fiyat Esnekliği Kavramı:
├── TANIM:
│   ├── Fiyattaki %1'lik değişime karşılık talepteki % değişim
│   ├── PE > 1: Esnek (fiyat artışı = satış düşüşü çok)
│   ├── PE = 1: Birim esnek
│   └── PE < 1: İnelastik (fiyat artışı = satış düşüşü az)
│
├── HESAPLAMA:
│   ├── PE = (% Talep Değişimi) / (% Fiyat Değişimi)
│   ├── Negatif sonuç: Fiyat ↑ = Talep ↓ (normal mal)
│   └── PE formülü: ((Q2-Q1)/Q1) / ((P2-P1)/P1)
│
├── KARAR ÇERÇEVESİ:
│   ├── PE < 1: Fiyat artırılabilir (düşük duyarlılık)
│   ├── PE = 1: Fiyat optimum noktada
│   └── PE > 1: Fiyat düşürülürse toplam gelir artar
│
└── UYGULAMA NOTU:
    ├── Yeni ürün: Düşük esneklik (benzersiz ürün)
    ├── Rekabetçi pazar: Yüksek esneklik (çok alternatif var)
    └── Marka güçlü: Düşük esneklik (sadık müşteri)
```

---

## 5. Alert Sistemleri

```
Alert Türleri:
├── FİYAT DEĞİŞİKLİĞİ ALERT:
│   ├── "Rakip X ürün Y'yi %10 indirdi"
│   ├── Eşik belirleme: "5% üzeri değişimde bildirim"
│   ├── Kanal: Email, Slack, SMS
│   └── Öncelik: Normal / Yüksek / Kritik
│
├── REKABETÇİ KAMPANYA ALERT:
│   ├── Rakip indirim kampanyası başladığında
│   ├── "Amazon'da X kategorisinde büyük indirim başladı"
│   └── Hafta sonu ve gece de kontrol et
│
├── STOK DURUMU ALERT:
│   ├── Rakip ürün stoğu tükendiğinde
│   ├── "Rakip X'te Y ürünü tükendi — fırsat"
│   └── Stok tekrar geldiğinde de bilgilendir
│
└── FİYAT SAVAŞI ALERT:
    ├── Ardışık fiyat düşüşlerinde
    ├── "3 gündür fiyat düşüyor, trend analiz et"
    └── Otomatik değil, insan değerlendirmesi gerekir
```

---

## 6. Raporlama ve Görselleştirme

```
Rapor Türleri:
├── GÜNLÜK FİYAT RAPORU:
│   ├── Tüm takip edilen SKU'ların son fiyatları
│   ├── Bir önceki güne göre değişim
│   ├── En büyük değişimler listesi (top 5)
│   └── Kritik değişiklik alert'leri
│
├── HAFTALIK ANALİZ:
│   ├── Haftalık fiyat trend grafiği
│   ├── Rakip fiyat karşılaştırma tablosu
│   ├── En çok değişen ürünler
│   └── Rakip fiyat stratejisi analizi
│
└── AYLIK STRATEJİ RAPORU:
    ├── Aylık ortalama fiyat karşılaştırması
    ├── Fiyat esnekliği tahminleri
    ├── Fiyat savaşı bölgeleri tespiti
    └── Fiyat optimizasyonu önerileri
```

---

## 7. Grafik Türleri

```
Kullanılacak Grafikler:
├── ZAMAN SERİSİ (Time Series):
│   ├── X ekseni: Tarih
│   ├── Y ekseni: Fiyat
│   ├── Her rakip ayrı renk çizgi
│   ├── Kullanım: Fiyat trend analizi
│   └── Araç: Line chart
│
├── HEATMAP:
│   ├── Satır: Ürünler
│   ├── Sütun: Rakip firmalar
│   ├── Hücre: Fiyat / Fiyat farkı
│   ├── Kullanım: Hangi ürün, kimde ucuz/sert
│   └── Araç: Conditional formatting tablo
│
├── BOX-PLOT:
│   ├── Fiyat dağılımı göstergesi
│   ├── Rakip bazlı karşılaştırma
│   ├── Outlier'ları tespit
│   └── Araç: Box chart
│
└── SCATTER PLOT:
    ├── X: Rakip fiyat
    ├── Y: Bizim fiyat
    ├── Renk: Ürün kategorisi
    ├── Kullanım: Fiyat konumlandırma analizi
    └── Araç: XY scatter
```

---

## 8. Fiyat Optimizasyonu Önerileri

```
Optimizasyon Stratejileri:
├── MARJ OPTİMİZASYONU:
│   ├── En düşük marjlı ürünleri belirle
│   ├── "Bu ürünlerde fiyat artışı yapılabilir mi?" analizi
│   ├── Alternatif: Paket satış (upsell)
│   └── Düşük marjlı ürünler = akış ürünü olarak konumlandır
│
├── REKABETÇİ KONUMLANDIRMA:
│   ├── "En düşük fiyat" konumu = düşük marj savaşı
│   ├── "En iyi değer" konumu = fayda odaklı fiyat
│   ├── Premium konum = yüksek marj, düşük hacim
│   └── Rakip fiyatlarını analiz edip kendi konumumuzu belirle
│
├── DÖNÜŞÜM ODAKLI FİYATLANDIRMA:
│   ├── Dönüşüm oranı yüksek fiyat = optimal
│   ├── Sepete ekleme + satın alma ayrımını izle
│   ├── A/B test ile optimum fiyat bul
│   └── "En düşük fiyat" değil "en çok satan fiyat" hedefle
│
└── PSİKOLOJİK FİYATLANDIRMA:
    ├── xxx.99 stratejisi
    ├── "300₺ yerine 299₺" (fiyat algısı)
    ├── Charm pricing (çekici fiyatlandırma)
    └── Kalite işareti olarak premium fiyat
```

---

## Key Patterns

1. **Fiyat takibi sadece veri toplama değil** — Veriyi eyleme dönüştürmek için raporlama şart.
2. **Alert sistemi kuralsız çalışmaz** — Eşik değerleri, kanal seçimi ve öncelikler net olmalı.
3. **Fiyat savaşına girmemek** — Rekabette sadece fiyata oynamak sürdürülebilir değil; değer teklifine odaklan.
4. **Price elasticity bilmek şart** — Her ürün için farklı esneklik — aynı strateji her üründe çalışmaz.
5. **Düzenli raporlama** — Haftalık ve aylık rapor ile trend görünür hale gelir.

---

## Anti-Patterns

```
❌ Sadece en düşük fiyatı hedeflemek
✅ "En iyi değer" konumlandırması — kalite + fiyat dengesi

❌ Günde 50 kez fiyat değiştirmek
✅ Stabil fiyat + kampanya dönemleri tercih et; müşteri güveni kazan

❌ Rakipten habersiz fiyat artışı yapmak
✅ Rakip fiyat analizi + marj hesabı öncesi şart

❌ Sadece kendi fiyatlarına bakmak
✅ Pazar ortalaması ve trendler de göz önünde bulundur

❌ Tüm ürünlere aynı strateji
✅ High-velocity vs slow-moving ayrımı yap; farklı yaklaşım
```

---

## Quick Reference

| Fiyat Stratejisi | Avantaj | Risk | Kullanım |
|---|---|---|---|
| Competitive-based | Hızlı sonuç | Fiyat savaşı | Homojen ürünler |
| Demand-based | Karlılık optimize | Talep tahmini zor | Mevsimsel ürünler |
| Time-based | Planlı kampanya | Fırsat kaçırma | Kıyafet, aksesuar |
| Periodic discount | Müşteri beklentisi | Marj erimesi | Her ürün |

| Fiyat Değişim Eşiği | Alert Seviyesi | Aksiyon |
|---|---|---|
| %1-3 değişim | Bilgilendirme | Rapor |
| %3-5 değişim | Normal alert | İncele |
| %5-10 değişim | Yüksek alert | Aksiyon planı |
| %10+ değişim | Kritik alert | Hemen değerlendir |

| Fiyat Konumlandırma | Hedef Kitle | Strateji |
|---|---|---|
| Premium | Sadık, kalite odaklı | Yüksek marj, düşük hacim |
| Mid-market | Standart tüketici | Hacim + marj dengesi |
| Economy | Fiyat duyarlı | Düşük marj, yüksek hacim |
| Value leader | Her iki segment | "En iyi değer" konumu |
