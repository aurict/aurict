---
name: habit-tracker
description: Alışkanlık takibi yapma, streak yönetimi, motivasyon sistemleri kurma ve milestone ödülleri tasarlama becerisi.
triggers:
  - "Alışkanlık takibi"
  - "Streak koruma"
  - "Günlük hedeflerim"
  - "Motivasyonumu yüksek tut"
  - "Hangi alışkanlıkları kazanmalıyım"
auto_load_when:
  - Alışkanlık, günlük, hedef, disiplin
  - Streak, takip, kontrol, başarı
  - Motivasyon, ödül, milestone
agent: content-ops
tools:
  - streak-calculator
  - habit-matrix-generator
  - motivation-tracker
---

# Habit Tracker — Alışkanlık Yönetim Uzmanı

Alışkanlık takip skill'i, kullanıcıların yeni alışkanlıklar oluşturmasına ve mevcut olanları sürdürmesine yardımcı olur. Bilimsel temelli davranış değişikliği stratejileri sunar.

## Temel Pattern: Alışkanlık Sistemi Tasarımı

### 1. Alışkanlık Tanımlama Matrisi

```
HABIT MATRIX
├── KRİTİK ALIŞKANLIKLAR (Non-negotiable)
│   ├── Sabah rutinleri
│   ├── Egzersiz/fitness
│   ├── Uyku düzeni
│   └── Beslenme düzeni
│
├── GELİŞİM ALIŞKANLIKLARI (Growth)
│   ├── Kitap okuma
│   ├── Dil öğrenme
│   ├── Meditasyon
│   └── Yaratıcı projeler
│
├── KÜÇÜK KAZANIMLAR (Micro-habits)
│   ├── Su içme (8 bardak)
│   ├── 10 dakika temizlik
│   ├── 5 dakika esneme
│   └── Farkındalık anları
│
└── SOSYAL ALIŞKANLIKLAR (Connection)
    ├── Aile/arkadaşlarla zaman
    ├── Networking
    └── Topluluk katılımı
```

### 2. Haftalık Planlama Yapısı

```
HAFTALIK HABIT TRACKER
┌─────────────┬────┬────┬────┬────┬────┬────┬────┐
│ Alışkanlık  │ Pzt│ Sal│ Çar│ Per│ Cum│ Cmt│ Paz│
├─────────────┼────┼────┼────┼────┼────┼────┼────┤
│ Meditasyon  │ ✅ │ ✅ │ ❌ │ ✅ │ ✅ │ ✅ │ ✅ │
│ Egzersiz    │ ✅ │ ✅ │ ❌ │ ✅ │ ✅ │ ❌ │ ✅ │
│ Kitap 20dk  │ ✅ │ ✅ │ ✅ │ ✅ │ ✅ │ ✅ │ ✅ │
│ Su 8 bardak │ ⚠️ │ ✅ │ ✅ │ ⚠️ │ ✅ │ ✅ │ ✅ │
│ Kodlama 1sr │ ✅ │ ❌ │ ✅ │ ✅ │ ❌ │ ✅ │ ✅ │
└─────────────┴────┴────┴────┴────┴────┴────┴────┘

Semboller: ✅ Tamamlandı | ❌ Atlandı | ⚠️ Kısmen
```

### 3. Streak Yönetim Sistemi

```
STREAK DÖNGÜSÜ
├── BAŞLANGIÇ SEVİYESİ (1-7 gün)
│   ├── Zorluk: ★☆☆☆☆
│   ├── Strateji: Minumum viable action
│   │   "Sadece 5 dakika bile olsa yap"
│   └── Dikkat: Unutma riski yüksek
│
├── GÜMÜŞ SEVİYESİ (8-30 gün)
│   ├── Zorluk: ★★☆☆☆
│   ├── Strateji: Trigger bağlantısı
│   │   "Kahvaltıdan sonra meditasyon"
│   └── Dikkat: Sıkıcılık başlayabilir
│
├── ALTIN SEVİYESİ (31-90 gün)
│   ├── Zorluk: ★★★☆☆
│   ├── Strateji: Identity shift
│   │   "Ben meditasyon yapan biriyim"
│   └── Dikkat: Büyük engeller gelebilir
│
├── PLATİN SEVİYESİ (91-365 gün)
│   ├── Zorluk: ★★★★☆
│   ├── Strateji: Environmental design
│   │   "Evimi habit-uyumlu düzenle"
│   └── Dikkat: Kendini tatmin riski
│
└── ELMAS SEVİYESİ (365+ gün)
    ├── Zorluk: ★★★★★
    ├── Strateji: Legacy building
    │   "Başkalarına öğret"
    └── Dikkat: Yeni alışkanlık ekle
```

### 4. Milestone Ödül Sistemi

```
ÖDÜL HİYERARŞİSİ
├── KÜÇÜK MİLEADLAR (Haftalık)
│   ├── 7 gün streak → Küçük bir hediye
│   ├── 2 hafta streak → Kendine ice cream
│   └── 30 gün streak → Yeni bir kitap
│
├── ORTA MİLEADLAR (Aylık)
│   ├── 60 gün streak → Yeni kıyafet
│   ├── 90 gün streak → Günübirlik gezi
│   └── 180 gün streak → Pahalı bir alet
│
├── BÜYÜK MİLEADLAR (Yıllık)
│   ├── 365 gün streak → Büyük tatil
│   ├── 500 gün streak → Deneyim (konser, vb.)
│   └── 1000 gün streak → Hayallerindeki şey
│
└── ÖDÜL PRENSİPLERİ
    ├── experiences > things (deneyim > eşya)
    ├── Ödül gecikmeli tatmin değil
    └── Her milestone kutlanabilir
```

## Key Patterns

### Pattern 1: Habit Stacking (Alışkanlık Yığını)
- Mevcut alışkanlığa yenisini bağla
- "Sonra [Yeni Alışkanlık]" formülü
- Örnek: "Kahve koyduktan sonra 5 meditasyon"

### Pattern 2: Tiny Habits (Küçük Alışkanlıklar)
- Başlangıçta küçük adımlar
- "1) Her gün 5 dakika egzersiz" → "Her gün 1 şınav"
- Başarı oranı önemli

### Pattern 3: Implementation Intention
- Detaylı planlama
- "When I [TRIGGER], I will [HABIT]"
- Zaman ve mekan belirle

### Pattern 4: Habit Contract
- Hesap verebilirlik sistemi
- Sosyal taahhüt
- Para cezası (opsiyonel)

## Anti-Patterns

```
❌ Aynı anda çok fazla alışkanlık eklemek
   // "Bu ay 15 yeni alışkanlık başlatıyorum"
   → Max 2-3 alışkanlıkla başla

❌ Mükemmeliyetçilik tuzağı
   // "Bugün 1 gün kaçırdım, hepsi bitti"
   → Streak kırılsa bile devam et

❌ Çok büyük hedefler koymak
   // "Her gün 2 saat kitap okuyacağım"
   → Küçük başla, sonra artır

❌ Sadece sonuca odaklanmak
   // "Streak kaç gün?" (süreç değil)
   → Process celebrate et

❌ Ortamı değiştirmemek
   // "Evimde odaklanamıyorum"
   → Environment design uygula

✅ Her alışkanlık için trigger tanımla
✅ Fail olursan "reset" değil "restart" et
✅ Görsel ilerleme takibi (grafik, takvim)
✅ Haftalık review yap (Pazar günleri)
✅ Identity-based habits kur ("Ben ... yapan biriyim")
```

## Quick Reference

| Parametre | Değer | Not |
|---|---|---|
| **Başlangıç Sayısı** | 1-3 alışkanlık | Aşırı yüklenme |
| **Minimum Eylem** | 2 dk veya 1 rep | Barrier düşük |
| **Trigger Aralığı** | "After [Mevcut rutin]" | Bağlantı kur |
| **Streak Hesabı** | Ardışık gün sayısı | Kesintisiz |
| **Haftalık Hedef** | %80+ uyum hedefi | Esneklik var |
| **Reset Toleransı** | Max 2 gün kaçış | Sonra restart |
| **Review Sıklığı** | Haftalık | Pazar önerilir |
| **Ödül Zamanı** | Milestone'a ulaşınca | kutlama |
| **Gecikme Önleme** | Habit in minutes | Hızlı başlangıç |
| **Ortam Düzeni** | Her alışkanlık için | Tetikleyici |

---

*Habit Tracker v1.0 — Küçük adımlar, büyük değişimler!*
