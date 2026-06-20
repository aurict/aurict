---
name: resume-screener
description: "PDF CV inceleme, aday eşleştirme, ATS uyumluluğu, anahtar kelime analizi ve skor algoritması ile red gerekçeleri üretme"
triggers:
  keywords: ["resume screener", "cv incele", "aday eleme", "ats uyumlu", "keyword matching"]
auto_load_when: "Kullanıcı CV tarama, aday değerlendirme veya işe uygunluk analizi ister"
agent: content-ops
tools: ["Read", "Write", "grep", "glob"]
---

# Resume Screener (CV Tarayıcı)

**Odak Alanı:** PDF CV inceleme, ATS uyumluluk kontrolü, anahtar kelime eşleştirme, skor algoritması ve red gerekçeleri üretme

## 1. Pattern: CV İnceleme Akışı

```
resume_screener_akısı
├── cv_al
│   ├── PDF çözümleme
│   ├── Metin ekstraksiyonu
│   └── Format normalizasyonu
├── temel_veri_çıkarımı
│   ├── İsim, iletişim bilgileri
│   ├── Eğitim geçmişi
│   ├── İş deneyimi
│   ├── Yetkinlikler
│   └── Sertifikalar
├── ats_uyumluluk_kontrolü
│   ├── Dosya formatı doğrulama
│   ├── Anahtar kelime yoğunluğu
│   ├── Aranabilirlik testi
│   └── Yapısal uyum analizi
└── skor_üretimi
    ├── Yetkinlik eşleştirme puanı
    ├── Deneyim uyum puanı
    ├── Kültür uyum puanı
    └──Toplam skor hesaplama
```

## 2. Pattern: ATS Uyumluluk Analizi

```
ats_uyumluluk_kontrolü
├── format_kontrolü
│   ├── PDF/A formatı destekliyor mu?
│   ├── Görüntü tabanlı metin var mı?
│   ├── Form alanları kullanılmış mı?
│   └── Tablo/çizelge yapısı doğru mu?
├── anahtar_kelime_analizi
│   ├── Zorunlu kelimeler (+)
│   ├── Olumsuz kelimeler (-)
│   ├── Yoğunluk oranı
│   └── Eşanlamlı kelime kontrolü
├── seo_optimizasyonu
│   ├── Başlık yapısı kontrolü
│   ├── Para içi kelime yerleşimi
│   ├── Atomik yetkinlikler
│   └── Mikar veri işaretleri
└── ats_parser_testı
    ├── Alan eşleştirme oranı
    ├── Veri çıkarılabilirlik
    └── Sıralama tahmini
```

## 3. Pattern: Skor Algoritması

```
skor_algoritması
├── ağırlıklandırma_matrisı
│   ├── Yetkinlik uyumu (35%)
│   ├── Deneyim seviyesi (25%)
│   ├── Eğitim uyumu (15%)
│   ├── Sertifika/vizalı (15%)
│   └── Kültür uyumu (10%)
├── puanlama_kriterleri
│   ├── Tam eşleşme = 100 puan
│   ├── Kısmi eşleşme = 50 puan
│   ├── Eksik = 0 puan
│   └── Fazla = +10 bonus
└── eşik_değerleri
    ├── Yeşil (ileri aşama) = >=70
    ├── Sarı (detay inceleme) = 50-69
    └── Kırmızı (red) = <50
```

## 4. Pattern: Red Gerekçeleri Üretimi

```
red_gerekçe_uretimi
├── kategori_tespiti
│   ├── Yetersiz deneyim
│   ├── Eksik yetkinlikler
│   ├── Eğitim uyumsuzluğu
│   ├── Ücret beklentisi
│   └── Konum uyumsuzluğu
├── gerekçe_yazımı
│   ├── Spesifik geri bildirim
│   ├── Yapıcı öneriler
│   └── Sonraki fırsatlar
└── format_dönüşümü
    ├── Türkçe karakter kontrolü
    ├── Profesyonel ton
    └── Ölçülebilir dil
```

---

## Key Patterns

| Pattern | Açıklama | Kullanım |
|---------|----------|---------|
| CV İnceleme Akışı | PDF'den yapılandırılmış veri çıkarma | İlk tarama aşaması |
| ATS Uyumluluk | ATS sistemleriyle uyum kontrolü | Otomatik eleme |
| Skor Algoritması | Çok boyutlu aday değerlendirme | Sıralama oluşturma |
| Red Gerekçeleri | Yapıcı geri bildirim üretme | Aday yanıtları |

---

## Anti-Patterns

```
❌ Sadece "iyi" kelimesine bakarak geçirme
   → Yanlış pozitifler artar

✅ ATS uyumlu anahtar kelime yoğunluğunu kontrol etme
   → Gerçek yetkinlik değerlendirmesi

❌ 5 yıl deneyim isteyen pozisyona 1 yıl aday kabul etme
   → İşe alım maliyeti artar

✅Deneyim eşik değerlerini sabit tutma
   → Tutarlı karar verme

❌PDF'deki görsel metinleri okuyamama
   → Bilgi kaybı

✅ OCR + metin parser combo kullanma
   → %95 doğruluk

❌Red gerekçesi yazmama
   → Aday deneyimi olumsuz etkilenir

✅Yapıcı geri bildirim sağlama
   → Employer brand korunur
```

---

## Quick Reference

| Süreç | Adım | Araç | Çıktı |
|------|------|------|-------|
| CV Alma | PDF çözümleme | pdf-parser | Ham metin |
| Veri Çıkarma | Alan tespiti | Regex/ner | Yapılandırılmış veri |
| ATS Kontrol | Uyumluluk | ATS-simulator | Uyum skoru |
| Skorlama | Ağırlık hesabı | Skor-motoru | Toplam puan |
| Red Gerekçesi | Kategori + metin | Template-engine | Yazılı gerekçe |
| Raporlama | Özet + detay | Report-generator | Final rapor |

| Skor Aralığı | Yorum | Aksiyon |
|-------------|------|---------|
| 70-100 | Mükemmel uyum | İleri mülakata davet |
| 50-69 | Kısmi uyum | Detaylı inceleme |
| 0-49 | Yetersiz | Red gerekçesi ile bilgilendir |

| Red Nedeni | Oran | Çözüm |
|-----------|-----|-------|
| Deneyim yetersiz | %35 | Gelişim planı öner |
| Yetkinlik eksik | %25 | Eğitim öner |
| Eğitim uyumsuz | %15 | Alternatif rol öner |
| Ücret beklentisi | %15 | Pazar araştırması |
| Konum | %10 | Remote seçenek |
