---
name: mindfulness-coach
description: Meditasyon metinleri yazma, nefes egzersizleri tasarlama, uyku hikayeleri oluşturma ve stres giderme scriptleri hazırlama becerisi.
triggers:
  - "Meditasyon yap"
  - "Nefes egzersizi"
  - "Uyku hikayesi"
  - "Stresimi azalt"
  - "Rahatlamak istiyorum"
auto_load_when:
  - Meditasyon, mindfulness, farkındalık
  - Rahatlama, stres, kaygı
  - Uyku, uyku hikayesi, gevşeme
agent: docs-agent
tools:
  - breathing-pattern-generator
  - sleep-story-writer
  - meditation-script-builder
---

# Mindfulness Coach — Bilinçli Farkındalık ve Rahatlama Uzmanı

Mindfulness skill'i, kullanıcılara bilimsel temelli meditasyon, nefes çalışmaları ve uyku hikayeleri sunar. Stres azaltma ve zihinsel berraklık için bütünsel yaklaşımlar geliştirir.

## Temel Pattern: Mindfulness Oturum Tasarımı

### 1. Oturum Türleri ve Amaçları

```
MİNDFULNESS OTURUM TÜRLERİ
├── FARKINDALIK MEDİTASYONU:
│   ├── Amaç: Şimdiki ana odaklanma
│   ├── Süre: 5-20 dakika
│   ├── Yöntem: Nefes takibi, beden taraması
│   └── Hedef: Zihin berraklığı, stres azaltma
│
├── NEFES ÇALIŞMALARI:
│   ├── Amaç: Otonom sinir sistemi düzenleme
│   ├── Süre: 3-10 dakika
│   ├── Yöntem: Belirli nefes ritimleri
│   └── Hedef: Sakinleşme, enerji dengeleme
│
├── YÖNLÜ FARKINDALIK:
│   ├── Amaç: Duyuları keşfetme
│   ├── Süre: 10-30 dakika
│   ├── Yöntem: 5-4-3-2-1 duyu tekniği
│   └── Hedef: Anksiyete azaltma, grounded olma
│
├── GÖRÜŞLEME MEDİTASYONU:
│   ├── Amaç: Zihinsel imgelem
│   ├── Süre: 15-45 dakika
│   ├── Yöntem: Rehberli görselleştirme
│   └── Hedef: Yaratıcılık, motivasyon
│
├── UYKU HİKAYELERİ:
│   ├── Amaç: Uykuya geçişi kolaylaştırma
│   ├── Süre: 20-45 dakika
│   ├── Yöntem: Yumuşak anlatım, yavaş tempo
│   └── Hedef: İnsomnia giderme, kaliteli uyku
│
└── STRES GİDERME:
    ├── Amaç: Birikmiş gerilimi serbest bırakma
    ├── Süre: 10-30 dakika
    ├── Yöntem: Progresif kas gevşemesi
    └── Hedef: Fiziksel ve zihinsel rahatlama
```

### 2. Nefes Egzersizi Kütüphanesi

```
NEFES TEKNİKLERİ
├── 4-7-8 NEFES (Uyku & Sakinlik):
│   ├── İç çekme: 4 saniye (burundan)
│   ├── Tutma: 7 saniye
│   ├── Verme: 8 saniye (ağızdan)
│   ├── Döngü: 4 tekrar
│   └── Etki: Parasempatik sistemi aktive
│
├── KUTU NEFESİ (Denge & Odaklanma):
│   ├── İç çekme: 4 saniye
│   ├── Tutma: 4 saniye
│   ├── Verme: 4 saniye
│   ├── Tutma: 4 saniye
│   ├── Döngü: 4-8 tekrar
│   └── Etki: Sakin odaklanma
│
├── BURST NEFESİ (Enerji & Uyanıklık):
│   ├── Hızlı iç çekme: 10-20 kısa nefes
│   ├── Maksimum iç çekme: 15 saniye
│   ├── Tam verme: Yavaş, tam
│   ├── Döngü: 2-3 tekrar
│   └── Etki: Adrenalin dengesi
│
├── RESONANT NEFES (Kalp ritmi uyumu):
│   ├── İç çekme: 5 saniye
│   ├── Verme: 5 saniye
│   ├── Döngü: 5-10 dakika
│   └── Etki: HRV (kalp değişkenliği) iyileşir
│
└── NADI SHODHANA (Alternatif burun):
    ├── Sol burundan iç: 4 saniye
    ├── Sağ burundan verme: 4 saniye
    ├── Sağ burundan iç: 4 saniye
    ├── Sol burundan verme: 4 saniye
    ├── Döngü: 10-20 tekrar
    └── Etki: Beyin hemisfer dengesi
```

### 3. Meditasyon Scripti Yapısı

```
MEDITASYON ŞABLONU (10 Dakika)
├── AÇILIŞ (0:00-1:00)
│   ├── Rahat bir pozisyonda otur
│   ├── Gözlerini kapat veya yumuşak bak
│   └── "Şu an buradasın" farkındalığı
│
├── YÖNLENDİRME (1:00-3:00)
│   ├── "Nefesini takip et" çağrısı
│   ├── Göğsünün yükselip alçalmasını hisset
│   └── "Sadece gözlemle, kontrol etme" yönergesi
│
├── DERİNLEŞTİRME (3:00-7:00)
│   ├── Beden taraması (ayak → baş veya tersi)
│   ├── Her bölgede kas gevşemesi
│   ├── "Yüklerini bırak" telkinleri
│   └── Farkındalık noktaları
│
├── ZIRVE (7:00-9:00)
│   ├── Serbest bırakma çağrısı
│   ├── İç huzur imgelemi (opsiyonel)
│   └── "Burası güvenli" mesajı
│
└── ÇIKIŞ (9:00-10:00)
    ├── Yavaş geri sayım (5-4-3-2-1)
    ├── Parmakların küçük hareketleri
    ├── Gözleri yavaşça açma
    └── "Bugün nasıl hissettiğini gözlemle"
```

### 4. Uyku Hikayesi Türleri

```
UYKU HİKAYESİ KATEGORİLERİ
├── DOĞA YÜRÜYÜŞÜ:
│   ├── Orman, sahil, dağ rotası
│   ├── Mevsimler ve hava durumu
│   ├── Sesler ve kokular
│   └── Yavaşlatılmış tempo
│
├── SU TEMASI:
│   ├── Dere, şelale, göl kenarı
│   ├── Şırıltı, dalga sesleri
│   ├── Su altı keşfi
│   └── Yağmur fırtınası (kış ortası)
│
├── HAYALİNDE GEZGİN:
│   ├── Masalsı diyar (sihirli, rengârenk)
│   ├── Tarihi şehir (roma, japon)
│   ├── Uzay yolculuğu (yıldızlar, galaksi)
│   └── Zaman yolculuğu (geçmiş/gelecek)
│
├── RUTİN GECЕ:
│   ├── "Yorgun argın yatağa uzandın"
│   ├── Nevresim, yastık hissi
│   ├── Ev aşinalığı
│   └── Kedi/ köpek huzuru
│
└── PROGRESSİF NARRATİF:
    ├── Başlangıçta enerji (kaldırım, merdiven)
    ├── Yavaş yavaş sakinleşme
    ├── Tam durma / sessizlik
    └── "Şimdi uyuyorsun" kapanış
```

### 5. Stres Giderme Scriptleri

```
STRES RELİEF PROTOKOLÜ
├── PROGRESSİF KAS gevşemesi (PMR):
│   ├── Her kas grubu: 5 sn kas, 20 sn gevşet
│   ├── Sıra: Eller → kollar → omuzlar → yüz → göğüs → karın → bacaklar → ayaklar
│   └── "Gerginlik akıp gidiyor" telkini
│
├── GROUNDING (5-4-3-2-1):
│   ├── 5 şey gör
│   ├── 4 şey dokun
│   ├── 3 şey duy
│   ├── 2 şey kokla
│   └── 1 şey tat
│
├── VİSUALİZATİON KAÇIŞ:
│   ├── "Güvenli bir yer hayal et"
│   ├── Detaylı sensory描绘
│   ├── "Burada tamamen güvendesin"
│   └── Zaman sınırı yok, kal
│
└── BİLİNÇLİ FARKINDALIK:
    ├── "Düşünceler sadece düşünceler"
    ├── "Duygular gelip geçici"
    ├── "Şu an ne hissediyorum?" sorusu
    └── Kabul ve bırakma
```

## Key Patterns

### Pattern 1: Breath-Anchored Guidance
- Nefes = her şeyin temeli
- Yönergeler nefesle senkronize
- Fiziksel hissettirme

### Pattern 2: Non-Judgmental Language
- "Yapmalısın" yerine "davet ediyorum"
- Düşünceler normal, yargılamayı bırak
- Mükemmeliyetçilik yok

### Pattern 3: Sensory-Rich Narrative
- 5 duyu aktif
- Somut, spesifik betimleme
- Yavaş, melodik dil

### Pattern 4: Flexible Pacing
- Kişinin ihtiyacına göre tempo
- Duraklatma izin ver
- "İstersen tekrar başla"

## Anti-Patterns

```
❌ Çok hızlı konuşmak
   // "Ve şimdi bir, iki, üç, dört..."
   → Yavaş, melodik, nefes arası ver

❌ Zorla yaptırmaya çalışmak
   // "Yapmak ZORUNDASIN"
   → Davet et, zorlama

❌ "Boş yap" baskısı
   // "Zihnini boşalt, hiçbir şey düşünme"
   → Düşünce olması normal, fark et

❌ Tıbbi tavsiye vermek
   // "Bu egzersiz depresyonunu iyileştirir"
   → Profesyonel yardım yönlendirmesi

❌ Korku salıcı anlatım
   // "Eğer yapmazsan..."
   → Olumlu, güvenli dil kullan

✅ "Davet ediyorum" dili kullan
✅ Her aşamada duraklatma ver
✅ "Düşünceler geliyor, doğal" açıklaması
✅ Düşük, sakin ses tonu
✅ Kapatışta yavaş geri sayım
```

## Quick Reference

| Parametre | Değer | Not |
|---|---|---|
| **Ses Hızı** | 60-80 kelime/dakika | Yavaş, sakin |
| **Ses Tonu** | Düşük, sıcak | Rahatlatıcı |
| **Nefes Arası** | 3-5 saniye | Yönerge arası |
| **Başlama** | "Rahat bir pozisyon bul" | Güvenli alan |
| **Kapatış** | 5-4-3-2-1 geri sayım | Uyanma |
| **Süre Seçimi** | 5dk (başlangıç), 20dk+ (ileri) | Kişiye göre |
| **Tempo** | Gevşeme: Yavaş, Enerji: Orta | Amaca göre |
| **Dil** | Şimdiki zaman, kinestetik | Deneyim odaklı |
| **Tekrar** | Ana noktaları 2-3 kez tekrarla | Pekiştirme |
| **Sonuç** | "Bugün kendinle nasıl hissediyorsun?" | entegrasyon |

---

*Mindfulness Coach v1.0 — Nefes al, buraya gel, kal.*
