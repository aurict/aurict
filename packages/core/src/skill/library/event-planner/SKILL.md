---
name: event-planner
description: Etkinlik organizasyonu, bütçe dağılımı, timeline oluşturma, vendor koordinasyonu ve checklist yönetimi becerisi.
triggers:
  - "Etkinlik organize et"
  - "Davetli listesi"
  - "Bütçe planı"
  - "Organizasyon şirketi"
  - "Düğün/kongre/party planla"
auto_load_when:
  - Etkinlik, organizasyon, organizatör
  - Davetiye, mekan, catering
  - Planlama, timeline, checklist
agent: content-ops
tools:
  - budget-allocator
  - timeline-generator
  - vendor-directory
---

# Event Planner — Etkinlik Organizasyon Uzmanı

Etkinlik planlama skill'i, küçük partilerden büyük konferanslara kadar her türlü organizasyonu profesyonelce yönetir. Kaynak optimizasyonu ve zaman planlaması sağlar.

## Temel Pattern: Etkinlik Planlama Süreci

### 1. Etkinlik Tanımlama

```
ETKİNLİK ANALİZİ
├── Etkinlik Türü:
│   ├── 🎉 Sosyal (Doğum Günü, Düğün, Mezuniyet)
│   ├── 💼 Kurumsal (Konferans, Lansman, Toplantı)
│   ├── 🎓 Eğitim (Workshop, Seminer, Eğitim)
│   ├── 🎭 Kültür (Konser, Tiyatro, Sergi)
│   └── 🏆 Yarışma/Spor (Turnuva, Maraton)
│
├── Ölçek Parametreleri:
│   ├── Katılımcı sayısı (min/maks)
│   ├── Bütçe aralığı
│   ├── Süre (saat/gun)
│   └── Mekan gereksinimleri
│
├── Hedef Kitle:
│   ├── Demografik özellikler
│   ├── Katılımcı profili
│   └── Beklentiler
│
└── Başarı Kriterleri:
    ├── ROI (Return on Investment)
    ├── Memnuniyet skoru
    └── Katılım oranı
```

### 2. Bütçe Dağılım Matrisi

```
BÜTÇE PLANI (100.000 TL örnek)
├── MEKAN & DEKORASYON (35-40%)
│   ├── Mekan kiralama — 35.000 TL
│   ├── Dekorasyon/çiçek — 3.000 TL
│   ├── Işıklandırma — 2.000 TL
│   └── Temizlik — 500 TL
│
├── CATERING & İÇECEK (25-30%)
│   ├── Yemek servisi — 25.000 TL
│   ├── İçecek/alkol — 5.000 TL
│   ├── Servis personeli — 2.000 TL
│   └── Tabak/çatal/bıçak — 1.000 TL
│
├── TEKNİK & EĞLENCE (15-20%)
│   ├── Ses sistemı — 5.000 TL
│   ├── DJ/Canlı müzik — 8.000 TL
│   ├── Fotoğrafçı — 3.000 TL
│   └── Video/sunum ekipmanı — 2.000 TL
│
├── İLETİŞİM & PAZARLAMA (10-15%)
│   ├── Davetiye/baskı — 3.000 TL
│   ├── Dijital pazarlama — 2.000 TL
│   ├── Hediyelik eşya — 3.000 TL
│   └── Web sitesi/kayıt — 1.000 TL
│
└── BEKLENMEDİK GİDERLER (5-10%)
    ├── Acil durum fonu — 5.000 TL
    └── Fazla mesai/personel — 3.000 TL
```

### 3. Zaman Çizelgesi (Timeline)

```
ETKİNLİK ZAMAN ÇİZELGESİ (6 ay öncesinden)
├── 6 AY ÖNCE
│   ├── □ Tarih ve mekan belirleme
│   ├── □ Bütçe kesinleştirme
│   └── □ Organizasyon ekibi oluşturma
│
├── 4 AY ÖNCE
│   ├── □ Tedarikçi teklifleri alma
│   ├── □ Ana tedarikçileri seçme
│   ├── □ Davetiye tasarımına başlama
│   └── □ Konuşmacı/sunucu daveti
│
├── 2 AY ÖNCE
│   ├── □ Mekan onayı ve depozito
│   ├── □ Catering menü kesinleştirme
│   ├── □ Davetiye gönderimi
│   ├── □ Mekan düzeni planı
│   └── □ Teknik gereksinimler
│
├── 1 AY ÖNCE
│   ├── □ Katılımcı takibi ve RSVP
│   ├── □ Seating planı
│   ├── □ Program akışı yayınlama
│   ├── □ Yedek planları hazırlama
│   └── □ Son bütçe kontrolü
│
├── 1 HAFTA ÖNCE
│   ├── □ Tüm tedarikçilerle son görüşme
│   ├── □ Personel schedule'ı
│   ├── □ Acil durum numaraları
│   └── □ Mekan son keşfi
│
└── ETKİNLİK GÜNÜ
    ├── □ Mekan kontrol (sahne, ses, ışık)
    ├── □ Personel briefi
    ├── □ Kayıt masası hazırlığı
    └── □ Toast/sunum Provası
```

### 4. Vendor Koordinasyon Matrisi

```
VENDOR YÖNETİMİ
├── KRİTİK VENDORLAR (Lead Time: 3+ ay)
│   ├── Mekan — Kontrat, depozito, kurallar
│   ├── Catering — Menü tadım, servis düzeni
│   └── Ana sanatçı/ konuşmacı — Sözleşme
│
├── ORTA ÖNCELİKLİ (Lead Time: 1-2 ay)
│   ├── Fotoğrafçı/video — Portfolyo kontrolü
│   ├── DJ/müzik — Playlist, sahne gereksinimi
│   ├── Dekoratör — Konsept, renk paleti
│   └── Çiçekçi — Çiçek türleri, yerleşim
│
├── DESTEK VENDORLAR (Lead Time: 2-4 hafta)
│   ├── Davetiye baskı — Tasarım onayı
│   ├── Nakliye/lojistik — Ekipman taşıma
│   ├── Güvenlik — Sertifika, sayı
│   └── Otopark — Kapasite, vale
│
└── GÜNÜBİRLİK (Lead Time: 1 hafta)
    ├── Garson/host — Briefing
    ├── Teknisyen — Sahne kurulumu
    └── Temizlik — Atık yönetimi
```

## Key Patterns

### Pattern 1: RSVP Management
- Kesin/koşullu/alternatif katılım
- Follow-up sistemi
- Yedek liste

### Pattern 2: Seating Strategy
- VIP öncelikli yerleşim
- Sosyal grupları dengeleme
- Engelli erişimi

### Pattern 3: Risk Mitigation
- Hava durumu planı
- Vendor backup
- Sağlık/güvenlik protokolü

### Pattern 4: Post-Event Analysis
- ROI hesaplama
- Geri bildirim toplama
- Gelecek için lesson learned

## Anti-Patterns

```
❌ Yeterli önceden planlamamak
   // "Bir hafta kala hallederiz"
   → Minimum 2-3 ay önceden başla

❌ Bütçeyi aşmak
   // "Biraz fazla harcayalım, olsun olsun"
   → Buffer %10-15 tut

❌ Tek vendor'a bağımlılık
   // "Sadece bu fotoğrafçı var, onu alalım"
   → Yedek vendor tanımla

❌ Detayları sona bırakmak
   // "Davetiyeyi göndeririz, zamanı gelince"
   → Her şeyi milestone'a bağla

❌ Plan B olmaması
   // "Işıklar yanar ama ne yapalım"
   → Her risk için yedek plan

✅ Günlük/haftalık checklist tut
✅ Tüm anlaşmaları yazılı yap
✅ Sahne kurulumu günü önce tamamla
✅ Acil durum iletişim listesi hazırla
✅ Sonrası temizlik planlamayı unutma
```

## Quick Reference

| Parametre | Değer | Not |
|---|---|---|
| **Planlama Süresi** | Küçük: 2 ay, Büyük: 6+ ay | Ölçeğe göre |
| **Vendor Lead Time** | Kritik: 3 ay, Destek: 2 hafta | Öncelik sırası |
| **Buffer Bütçe** | Toplamın %10-15 | Beklenmedik |
| **RSVP Deadline** | Etkinlikten 2-3 hafta önce | Kesin rakam |
| **Mekan Depozito** | Toplamın %30-50 | Sözleşmede |
| **Personel/100 Kişi** | 3-5 kişi | Etkinlik türüne göre |
| **Oturma Alanı m²** | 1.5-2 m²/kişi | Konforsuna göre |
| **Işık/Yükseklik** | Minimum 3-4 metre | Tavan yüksekliği |
| **Valf Zamanı** | Etkinlikten 1-2 saat önce | Kurulum |
| **Checklist Update** | Günlük (son 2 hafta) | Sürekli takip |

---

*Event Planner v1.0 — Her detay önemli!*
