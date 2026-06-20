---
name: market-researcher
description: "Pazar büyüklüğü, demografik analiz. SWOT, PESTLE. Rakip analizi. Trend raporları. Veri kaynakları. Rapor formatları."
triggers:
  keywords: ["pazar araştırması", "market research", "swot", "pestle", "rekabet analizi", "demografik", "trend", "TAM SAM FM"]
  extensions: [".md", ".pdf", ".xlsx"]
auto_load_when: "Pazar analizi, rakip araştırması veya stratejik iş raporu talep edildiğinde"
agent: content-ops
tools: ["Read", "Write", "Bash", "WebFetch"]
---

# Market Researcher — PAZAR ARAŞTIRMASI REHBERİ

**Odağ:** Pazar büyüklüğü analizi, rakip değerlendirme, SWOT/PESTLE ve stratejik rapor hazırlama.

---

## 1. Pazar Büyüklüğü Hesaplama (TAM SAM FM)

```
Pazar Hesaplama Katmanları:
├── TAM (Total Addressable Market — Toplam Potansiyel Pazar):
│   ├── Tüm pazar, tüm potansiyel müşteriler
│   ├── "Eğer herkes alsa" senaryosu
│   ├── Stratejik vizyon için kullanılır
│   └── Genellikle rakip analizi için değil, yatırımcı sunumu için
│
├── SAM (Serviceable Addressable Market — Hizmet Edilebilir Pazar):
│   ├── Coğrafi veya ürün kapsamına giren pazar
│   ├── "Şu an veya yakın gelecekte ulaşabileceğimiz pazar"
│   └── Gerçek iş planlaması için kullanılır
│
└── SOM (Serviceable Obtainable Market — Alınabilecek Pazar):
    ├── Gerçekçi olarak kazanabileceğimiz pazar payı
    ├── Rakipler ve kapasite göz önünde
    ├── "İlk 5 yılda %X pazar payı hedefliyoruz"
    └── Operasyonel planlama için kullanılır

Hesaplama Yöntemleri:
├── TOP-DOWN (Üstten Alta):
│   ├── TAM → coğrafya/ürün filtre → SAM → rekabet → SOM
│   ├── Dış kaynak araştırmasına dayalı
│   └── Büyük ama yanlış olabilir
│
└── BOTTOM-UP (Alttan Üste):
    ├── Birim bazlı hesaplama
    ├── "Müşteri sayısı × birim değer = pazar"
    ├── Daha gerçekçi, daha güvenilir
    └── İlk yıl planlaması için ideal
```

---

## 2. Demografik Analiz

```
Demografik Segmentasyon:
├── COĞRAFİ:
│   ├── Ülke/şehir/ilçe
│   ├── Kırsal/kentsel ayrımı
│   ├── İklim/bölge özellikleri
│   └── Yoğunluk haritası
│
├── PSİKOGRAFİK:
│   ├── Yaşam tarzı
│   ├── Değerler ve inançlar
│   ├── Hobiler ve ilgi alanları
│   └── Kişilik özellikleri
│
├── SOSYOEKONOMİK:
│   ├── Gelir seviyesi (IQR, median)
│   ├── Eğitim düzeyi
│   ├── Meslek kategorisi
│   └── Sosyal sınıf (A/B/C/D)
│
└── DAVRANISSAL:
    ├── Satın alma sıklığı
    ├── Marka sadakati
    ├── Fiyat duyarlılığı
    └── Kullanım durumu (heavy/light/non-user)
```

---

## 3. SWOT Analizi

```
SWOT Çerçevesi:
├── STRENGTHS (Güçlü Yanlar):
│   ├── Dahili, pozitif faktörler
│   ├── "Rakiplerimizde olmayan neyimiz var?"
│   ├── "Müşterilerimiz neden bizi tercih ediyor?"
│   └── Örnek: Patent, güçlü marka, deneyimli ekip, finansal kaynak
│
├── WEAKNESSES (Zayıf Yanlar):
│   ├── Dahili, negatif faktörler
│   ├── "Neyi geliştirmemiz gerekiyor?"
│   ├── "Müşteri kaybettiğimiz konular neler?"
│   └── Örnek: Sınırlı bütçe, düşük marka bilinirliği, personel yetersizliği
│
├── OPPORTUNITIES (Fırsatlar):
│   ├── Harici, pozitif faktörler
│   ├── "Pazardaki boşluklar neler?"
│   ├── "Yeni trendler bize nasıl yardımcı olabilir?"
│   └── Örnek: Yeni düzenleme, azalan rekabet, teknoloji gelişimi
│
└── THREATS (Tehditler):
    ├── Harici, negatif faktörler
    ├── "Dış tehlikeler neler?"
    ├── "Rakiplerimiz nasıl büyüyor?"
    └── Örnek: Yeni düzenleme, ekonomik durgunluk, teknoloji shift'i

SWOT Eşleştirme Stratejileri:
├── SO (Strengths-Opportunities): Güçlü yanları fırsatlarla eşleştir
├── WO (Weaknesses-Opportunities): Zayıflıkları fırsata çevir
├── ST (Strengths-Threats): Güçlü yanlarla tehditleri savuştur
└── WT (Weaknesses-Threats): En riskli alan — önlem al veya çıkış yap
```

---

## 4. PESTLE Analizi

```
PESTLE Bileşenleri:
├── POLITICAL (Politik):
│   ├── Hükümet politikaları
│   ├── Ticaret düzenlemeleri
│   ├── Politik istikrar
│   └── Örnek: Vergi politikası, ithalat/ihracat düzenlemeleri
│
├── ECONOMIC (Ekonomik):
│   ├── Ekonomik büyüme oranı
│   ├── Enflasyon ve faiz oranları
│   ├── Döviz kuru dalgalanmaları
│   └── Örnek: Kurlardaki dalgalanma, enflasyon etkisi
│
├── SOCIAL (Sosyal):
│   ├── Demografik değişimler
│   ├── Yaşam tarzı trendleri
│   ├── Eğitim seviyesi
│   └── Örnek: Yaşlanan nüfus, iş gücü becerileri
│
├── TECHNOLOGICAL (Teknolojik):
│   ├── Teknoloji yatırımları
│   ├── Ar-Ge faaliyetleri
│   ├── Otomasyon ve dijitalleşme
│   └── Örnek: Yapay zeka, blockchain, bulut teknolojisi
│
├── LEGAL (Yasal):
│   ├── İş yasaları
│   ├── Tüketici koruma kanunları
│   ├── Veri gizliliği düzenlemeleri
│   └── Örnek: KVKK, GDPR, sektörel lisanslar
│
└── ENVIRONMENTAL (Çevresel):
    ├── İklim değişikliği etkileri
    ├── Sürdürülebilirlik baskısı
    ├── Kaynak kıtlığı
    └── Örnek: Karbon ayak izi regülasyonları, yeşil enerji
```

---

## 5. Rakip Analizi

```
Rakip Analiz Hiyerarşisi:
├── DİREKT RAKİPLER:
│   ├── Aynı ürün/hizmet, aynı hedef kitle
│   ├── "X şirketi bizimle aynı müşteriye satıyor"
│   └── Pazar payı savaşı
│
├── İNDİREKT RAKİPLER:
│   ├── Farklı ürün ama aynı ihtiyacı karşılıyor
│   ├── "X'in yerine Y alan müşteri potansiyelimiz"
│   └── Yakın tehdit
│
└── POTANSİYEL RAKİPLER:
    ├── Farklı sektörden giriş
    ├── Yeni teknoloji shift'i ile gelenler
    └── "Şu an rakip değil ama yakında olabilir"

Rakip Profil Şablonu:
ŞİRKET: [Rakip Adı]
├── Temel bilgiler: Kuruluş, merkez, çalışan sayısı
├── Ürün/hizmet: Portföy, fiyatlandırma
├── Hedef kitle: Coğrafya, segment
├── Pazar payı: Tahmini %
├── Güçlü yanları: [liste]
├── Zayıf yanları: [liste]
├── Satış kanalları: Online/offline, partner
├── Pazarlama stratejisi: Tone, kanal, mesaj
└── Son finansal veriler: Büyüme, karlılık (varsa)
```

---

## 6. Trend Analizi

```
Trend Araştırma Kategorileri:
├── SEKTÖR TRENDLERİ:
│   ├── Büyüme oranı (CAGR)
│   ├── Tüketici davranış değişimleri
│   ├── Teknoloji entegrasyonu
│   └── Regülasyon değişiklikleri
│
├── TÜKETİCİ TRENDLERİ:
│   ├── Satın alma alışkanlıkları
│   ├── Değer değişimleri (sürdürülebilirlik vb.)
│   ├── Dijital kanallara geçiş
│   └── Fiyat duyarlılığı trendleri
│
├── TEKNOLOJİ TRENDLERİ:
│   ├── Yükselen teknolojiler
│   ├── Yapay zeka/otomasyon etkisi
│   ├── Veri kullanımı ve mahremiyet
│   └── Platform ekonomisi
│
└── EKONOMİK TRENDLER:
    ├── Makroekonomik göstergeler
    ├── Sektör özel ekonomik veriler
    ├── Tedarik zinciri durumu
    └── İş gücü piyasası
```

---

## 7. Veri Kaynakları

```
Veri Kaynağı Kategorileri:
├── BİRİNCİL KAYNAKLAR (First-Party):
│   ├── Şirket içi satış/CRM verileri
│   ├── Anket ve müşteri görüşmeleri
│   ├── Website/webinar katılımcı verileri
│   └── Sosyal medya analitik verileri
│
├── İKİNCİL KAYNAKLAR (Second-Party):
│   ├── İş ortakları verileri
│   ├── Müşteri panel verileri
│   └── Affiliate/dağıtım kanalları verileri
│
└── ÜÇÜNCÜL KAYNAKLAR (Third-Party):
    ├── Devlet istatistikleri (TÜİK, Eurostat vb.)
    ├── Sektör raporları (McKinsey, Gartner, IBISWorld)
    ├── Pazar araştırma şirketleri (Nielsen, IPSOS)
    ├── Finansal veri sağlayıcıları (Bloomberg, Reuters)
    └── Akademik araştırmalar ve makaleler

Ücretsiz Kaynaklar:
├── Türkiye: TÜİK, Merkez Bankası, BDDK, KOSGEB
├── Global: World Bank, IMF, UN Data
├── Sektörel: Sektör dernekleri yayınları
└── Şirket: LinkedIn, Crunchbase, Glassdoor
```

---

## 8. Rapor Formatları

```
Pazar Araştırma Raporu Şablonu:
├── YÖNETİCİ ÖZETİ (Executive Summary):
│   ├── 1 sayfa: Ana bulgular
│   ├── Pazar büyüklüğü ve büyüme
│   ├── Ana fırsatlar ve tehditler
│   └── Önerilen strateji
│
├── PAZAR TANIMI:
│   ├── Pazar tanımı ve sınırları
│   ├── TAM/SAM/SOM hesaplamaları
│   ├── Büyüme drivers'ları
│   └── Mevsimsellik/döngüsellik
│
├── DEMOGRAFİK ANALİZ:
│   ├── Hedef kitle profili
│   ├── Coğrafi dağılım
│   ├── Psikografik segmentler
│   └── Müşteri yolculuğu
│
├── RAKİP ANALİZİ:
│   ├── Rakip haritası
│   ├── Pazar payı dağılımı
│   ├── Karşılaştırmalı analiz tablosu
│   └── Boşluk ve fırsat analizi
│
├── SWOT/PESTLE:
│   ├── SWOT analizi
│   ├── PESTLE analizi
│   └── Stratejik çıkarımlar
│
├── TREND ANALİZİ:
│   ├── Sektör trendleri
│   ├── Tüketici trendleri
│   └── Gelecek projeksiyonları
│
├── FİYAT ANALİZİ:
│   ├── Fiyat aralıkları
│   ├── Fiyat belirleyiciler
│   └── Dinamik fiyatlandırma trendleri
│
└── SONUÇ VE ÖNERİLER:
    ├── Ana bulgular özeti
    ├── Stratejik öneriler
    ├── Riskler ve azaltma stratejileri
    └── Sonraki adımlar
```

---

## Key Patterns

1. **Her sayı arkasında kaynak olmalı** — "Kaynak: [kurum, tarih]" mutlaka eklenmeli.
2. **TAM/SAM/SOM ayrımı şart** — Yatırımcı veya yönetim farklı sorular sorar, her biri cevaplanabilir olmalı.
3. **Görsel destek zorunlu** — Grafik, tablo, infografik ile destekle; sadece metin okunmaz.
4. **Güncel tut** — Pazar araştırması 6 ayda eskir; güncelleme notu ekle.
5. **SWOT eyleme dönüşmeli** — Her SWOT maddesi için somut aksiyon belirle.

---

## Anti-Patterns

```
❌ "Pazar büyüyor" demek yetmez — "Yılda %X büyüyor, kaynak: X raporu"
✅ Somut rakam + kaynak gösterimi

❌ Rakipleri sadece listelemek
✅ Her rakip için güçlü/zayıf analizi + rekabet stratejisi

❌ Tüm trendleri eşit göstermek
✅ "En yüksek etki" ve "marjinal etki" ayrımı

❌ Negatif bulguları gizlemek
✅ Objektif analiz — zayıflıkları görmezden gelmek zararlı

❌ Sadece desk research
✅ Mümkünse birincil araştırma (müşteri görüşmesi, anket) ekle
```

---

## Quick Reference

| Analiz Türü | Kullanım | Zaman |
|---|---|---|
| TAM/SAM/SOM | Pazar büyüklüğü | İlk sunum |
| Demografik | Hedef kitle | Ürün stratejisi |
| SWOT | Stratejik konum | Strateji belirleme |
| PESTLE | Makro çevre | Uzun vadeli plan |
| Rakip | Rekabet stratejisi | Ürün/pazarlama |

| Veri Kaynağı | Tür | Güvenilirlik |
|---|---|---|
| TÜİK/Devlet | Birincil (ücretsiz) | Çok yüksek |
| McKinsey/Gartner | İkincil (ücretli) | Çok yüksek |
| LinkedIn/Crunchbase | İkincil (kısmi ücretsiz) | Orta-yüksek |
| Şirket anketleri | Birincil (kendi) | Orta |
| Sektör dernekleri | İkincil | Orta-yüksek |

| Rapor Bölümü | Min Kelime | Format |
|---|---|---|
| Executive Summary | 200-300 | Metin |
| Pazar Tanımı | 500-800 | Metin + tablo |
| Demografik | 400-600 | Tablo + grafik |
| Rakip Analizi | 600-1000 | Tablo + matris |
| SWOT/PESTLE | 500-700 | Matris + metin |
| Trendler | 400-600 | Liste + grafik |
| Öneriler | 300-500 | Liste |
