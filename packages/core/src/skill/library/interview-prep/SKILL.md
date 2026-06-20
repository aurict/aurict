---
name: interview-prep
description: "Davranışsal ve teknik mülakat soruları, STAR metodu, soru bankası oluşturma ve aday değerlendirme kriterleri"
triggers:
  keywords: ["interview prep", "mülakat hazırlığı", "star metodu", "soru bankası", "aday değerlendirme"]
auto_load_when: "Kullanıcı mülakat sorusu hazırlama, aday değerlendirme kriterleri veya mülakat planı ister"
agent: content-ops
tools: ["Read", "Write", "grep", "glob"]
---

# Interview Prep (Mülakat Hazırlığı)

**Odak Alanı:** Davranışsal ve teknik mülakat soruları, STAR metodu yapısı, soru bankası oluşturma ve aday değerlendirme kriterleri

## 1. Pattern: Mülakat Soruları Türleri

```
soru_türleri
├── davranışsal_sorular
│   ├── Geçmiş davranış örnekleri
│   │   ├── Liderlik senaryoları
│   │   ├── Çatışma çözümü
│   │   ├── Başarı hikayesi
│   │   └── Başarısızlık dersi
│   ├── Problem çözme senaryoları
│   │   ├── Analitik düşünce
│   │   ├── Karar verme
│   │   └── Yaratıcılık
│   └── Kişisel değerler
│       ├── Motivasyon kaynakları
│       ├── Kariyer hedefleri
│       └── Çalışma tarzı
├── teknik_sorular
│   ├── Rol spesifik bilgi
│   │   ├── Araç/tech stack
│   │   ├── Metodoloji
│   │   └── Süreç bilgisi
│   ├── Problem çözme
│   │   ├── Vaka analizi
│   │   ├── Kodlama görevi
│   │   └── Sistem tasarımı
│   └── Derinlemesine bilgi
│       ├── Neden nasıl ne için
│       ├── Alternatif yaklaşımlar
│       └── En iyi uygulamalar
└── kültür_soruları
    ├── Değerler uyumu
    │   ├── Ekip çalışması
    │   ├── Değişim yönetimi
    │   └── Feedback alma
    ├── Senaryo bazlı
    │   ├── Etik ikilemler
    │   ├── Baskı altında çalışma
    │   └── Önceliklendirme
    └── Motivasyon
        ├── Neden bu şirket
        ├── Neden bu rol
        └── Uzun vadeli hedefler
```

## 2. Pattern: STAR Metodu Yapısı

```
star_metodu
├── situation (durum)
│   ├── Bağlam oluşturma
│   ├── Zaman ve yer
│   ├── İlgili kişiler
│   └── Görev tanımı
├── task (görev)
│   ├── Üstlenilen sorumluluk
│   ├── Hedef ve beklenti
│   ├── Zorluk seviyesi
│   └── Kritiklik derecesi
├── action (eylem)
│   ├── Yapılan spesifik adımlar
│   ├── Karar süreci açıklaması
│   ├── Kullanılan araçlar
│   └── Ekibin rolü
└── result (sonuç)
    ├── Ölçülebilir çıktılar
    ├── Öğrenilen dersler
    ├── Gelişim alanları
    └── İşbirliği tanınması
```

## 3. Pattern: Soru Bankası Oluşturma

```
soru_bankası_yapısı
├── pozisyon_tipi_bazlı
│   ├── Junior (0-2 yıl)
│   │   ├── Temel yetkinlik soruları
│   │   ├── Öğrenme kapasitesi
│   │   └── Potansiyel değerlendirme
│   ├── Mid-level (2-5 yıl)
│   │   ├── Uygulama deneyimi
│   │   ├── Bağımsız çalışma
│   │   └── Mentorluk potansiyeli
│   ├── Senior (5+ yıl)
│   │   ├── Stratejik düşünce
│   │   ├── Ekip yönetimi
│   │   └── Liderlik beklentileri
│   └── Yönetim (Team Lead+)
│       ├── Ekip performansı
│       ├── Kaynak yönetimi
│       └── Stakeholder yönetimi
├── departman_bazlı
│   ├── Yazılım (Teknik)
│   ├── Satış (sonuç odaklı)
│   ├── HR (insan odaklı)
│   ├── Pazarlama (yaratıcı)
│   └── Finans (detay odaklı)
└── zorluk_seviyesi_bazlı
    ├── Kolay (ısınma soruları)
    ├── Orta (yetenek testi)
    ├── Zor (sınır testi)
    └── Uzman (derivasyon testi)
```

## 4. Pattern: Aday Değerlendirme Kriterleri

```
aday_değerlendirme
├── teknik_yetkinlik
│   ├── Bilgi derinliği (1-5)
│   ├── Uygulama becerisi (1-5)
│   ├── Problem çözme (1-5)
│   └── Güncel kalma (1-5)
├── davranışsal
│   ├── İletişim becerisi (1-5)
│   ├── Ekip uyumu (1-5)
│   ├── Adaptasyon (1-5)
│   └── Özgüven (1-5)
├── kültür_uyumu
│   ├── Değerler契合 (1-5)
│   ├── Motivasyon (1-5)
│   ├── Büyüme potansiyeli (1-5)
│   └── Uzun vadeli uyum (1-5)
└── genel_değerlendirme
    ├── Fizibilite (Evet/Hayir/Tekrar)
    ├── Potansiyel sıralaması
    └── İlerleme önerisi
```

---

## Key Patterns

| Pattern | Açıklama | Kullanım |
|---------|----------|---------|
| Davranışsal Sorular | Geçmiş davranışa dayalı sorular | Kültür uyumu tespiti |
| Teknik Sorular | Rol spesifik bilgi testi | Yetkinlik değerlendirme |
| STAR Metodu | Yapılandırılmış yanıt şablonu | Yanıt kalitesi ölçümü |
| Soru Bankası | Pozisyon bazlı soru hazinesi | Hazırlık aşaması |
| Değerlendirme Kriterleri | Çok boyutlu puanlama | Aday karşılaştırma |

---

## Anti-Patterns

```
❌ "Kendinizi tanıtın" gibi açık uçlu soru
   → Değerlendirme zorluğu

✅ STAR metodu zorunlu tutma
   → Yapılandırılmış yanıt alma

❌ Her adaya aynı soruları sorma
   → Aday deneyimi düşer

✅ Rol ve seviye bazlı soru seçimi
   → Kişiselleştirilmiş mülakat

❌ Referans kontrolü yapmama
   → Riskli işe alım

✅ Detaylı referans kontrolü
   → Doğrulama sağlama

❌ Adaya soru sormama fırsatı vermeme
   → Two-way fit kaybı

✅ Soru sormaya zaman ayırma
   → Aday deneyimi artışı

❌ Değerlendirme kriteri olmadan karar verme
   → Öznel kararlar

✅ Standart puanlama matrisi kullanma
   → Tutarlı karar verme
```

---

## Quick Reference

| Soru Türü | Örnek | Değerlendirme |
|----------|------|--------------|
| Davranışsal | "Birlikte çalışması zor biriyle nasıl başa çıktınız?" | STAR kalitesi |
| Teknik | "Bu özelliği neden bu şekilde tasarladınız?" | Derinlik + pratiklik |
| Kültür | "Bu şirkette en çok neyi değiştirmek isterdiniz?" | Değerler uyumu |
| Motivasyon | "5 yıl sonra kendinizi nerede görüyorsunuz?" | Kariyer planı |

| STAR Bileşeni | Soru | Beklenen Yanıt |
|---------------|------|----------------|
| Situation | "Bu durumda ne işiniz vardı?" | Bağlam açıklaması |
| Task | "Hedefiniz neydi?" | Spesifik hedef |
| Action | "Ne yaptınız?" | Eylem odaklı |
| Result | "Sonuç ne oldu?" | Ölçülebilir çıktı |

| Puanlama | Teknik | Davranışsal | Kültür | Genel |
|----------|--------|------------|-------|-------|
| 5 (Mükemmel) | Uzman düzeyinde | Doğal + enerjik | Mükemmel uyum | İleri |
| 4 (İyi) | Yetkin | İyi iletişim | İyi uyum | Güçlü aday |
| 3 (Orta) | Yeterli | İletişim var | Uyumlu | Değerlendir |
| 2 (Zayıf) | Sınırlı | Zorlanıyor | Belirsiz | Riskli |
| 1 (Yetersiz) | Yok | İletişim yok | Uyumsuz | Red |
