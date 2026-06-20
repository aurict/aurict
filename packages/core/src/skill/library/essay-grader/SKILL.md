---
name: essay-grader
description: "Essay değerlendirme, rubric bazlı puanlama, geri bildirim yazımı ve improvement önerileri."
triggers:
  keywords: ["essay grader", "essay evaluation", "rubric", "feedback", "değerlendirme", "yazılı anlatım"]
auto_load_when: "User asks to grade an essay, provide feedback on writing, or create a rubric for essay assessment"
agent: content-ops
tools: ["Read", "Write", "Bash"]
---

# Essay Grader — Yazılı Anlatım Değerlendirme ve Geri Bildirim

**Focus:** Analitik rubric ile essay puanlama, yapıcı geri bildirim yazımı, öğrenci gelişim yol haritası ve ortak çekirdek standartlarına uygun değerlendirme.

## 1. Değerlendirme Boyutları (Essay Scoring Dimensions)

```
A. Ana Değerlendirme Boyutları
   ├─ Thesis & Argument (Tez ve Argüman)
   │  ├─ Thesis net mi ve odaklı mı?
   │  ├─ Argüman mantıksal mı?
   │  └─ Bakış açısı tutarlı mı?
   │
   ├─ Evidence & Support (Kanıt ve Destek)
   │  ├─ Yeterli kanıt var mı?
   │  ├─ Kanıtlar argümanı destekliyor mu?
   │  └─ Kaynak güvenilir mi?
   │
   ├─ Organization & Structure (Organizasyon ve Yapı)
   │  ├─ Açılış, gelişme, kapanış düzeni
   │  ├─ Paragraf geçişleri mantıklı mı?
   │  └─ Mantıksal akış sağlanmış mı?
   │
   ├─ Language & Style (Dil ve Üslup)
   │  ├─ Kelime seçimi etkili mi?
   │  ├─ Cümle yapısı çeşitli mi?
   │  └─ Ton ve üslup uygun mu?
   │
   └─ Conventions (Dilbilgisi ve Yazım)
      ├─ Dilbilgisi doğru mu?
      ├─ Yazım hataları var mı?
      └─ Noktalama işaretleri doğru mu?
```

## 2. Analitik Rubric Şablonu (6+1 Trait Model)

```
┌────────────────────────────────────────────────────────────────┐
│ ANALITIK RUBRIC — ESSAY DEĞERLENDİRME FORMU                   │
├────────────────────────────────────────────────────────────────┤
│ Öğrenci: _______________  Tarih: ___________  Toplam: ___/100 │
├────────────────────────────────────────────────────────────────┤
│ BOYUT 1: TEZ VE ARGÜMAN                          /25          │
│   4: Thesis açık, odaklı, original. Argüman güçlü.            │
│   3: Thesis net, argüman genel olarak güçlü.                  │
│   2: Thesis belirsiz veya argüman zayıf.                       │
│   1: Thesis yok veya tamamen kopya.                           │
├────────────────────────────────────────────────────────────────┤
│ BOYUT 2: KANIT VE DESTEK                           /25          │
│   4: Güçlü, çeşitli, ilgili kanıtlar. Tüm iddialar destekli.  │
│   3: Yeterli kanıt. Bazı iddialar desteksiz.                  │
│   2: Sınırlı kanıt. Genellemeler ağırlıkta.                    │
│   1: Kanıt yok veya alakasız.                                  │
├────────────────────────────────────────────────────────────────┤
│ BOYUT 3: ORGANİZASYON VE YAPI                        /20          │
│   4: Mükemmel akış, geçişler doğal, etkili kapanış.         │
│   3: İyi akış, bazı geçiş sorunları.                          │
│   2: Organizasyon takip edilebilir ama zorlanmış.             │
│   1: Düzensiz, mantıksız akış.                                │
├────────────────────────────────────────────────────────────────┤
│ BOYUT 4: DiL VE ÜSLUP                             /15          │
│   4: Zengin kelime dağarcığı, etkili cümle yapısı.            │
│   3: Uygun kelime seçimi, çeşitli yapılar.                    │
│   2: Tekrarlayan kelimeler, basit yapılar.                     │
│   1: Yetersiz kelime dağarcığı, anlaşılmaz.                    │
├────────────────────────────────────────────────────────────────┤
│ BOYUT 5: DİLBİLGİSİ VE YAZIM                        /15          │
│   4: Sıfır hata veya minimal.                                 │
│   3: Birkaç hata, anlamı engellemiyor.                        │
│   2: Çok sayıda hata, bazen anlam bulanıklaşıyor.            │
│   1: Çok sayıda hata, anlam ciddi şekilde etkileniyor.      │
└────────────────────────────────────────────────────────────────┘
```

## 3. Yapıcı Geri Bildirim Yazım Protokolü

```
A. Sandwich Feedback Model (Katmanlı Geri Bildirim)
   ├─ Layer 1: Pozitif başlangıç
   │  → "Giriş paragrafında thesis oldukça net ifade edilmiş."
   │
   ├─ Layer 2: Geliştirme alanları (spesifik + somut)
   │  → "Ancak ikinci paragrafta kanıtlar yeterli değil.
   │     Örneğin, 'toplumsal etki' iddiasını desteklemek için
   │     en az 2 somut veri/s实例 eklemen gerekiyor."
   │
   └─ Layer 3: Sonuç ve motive edici kapanış
      → "Sonuç paragrafı güçlü bir kapanış sunuyor. Bu
        düzeltmelerle essay çok daha etkili olacak."
```

```
B. Geri Bildirim Yazım Kuralları
   ├─ Spesifik ol → "iyi yazılmış" yerine "transitional
   │  phrase'ler etkili kullanılmış"
   │
   ├─ Somut örnek ver → Hangi paragrafta, ne yanlıştı
   │
   ├─ Önce neyi düzeltmesi gerektiğini söyle
   │
   ├─ Neden önemli olduğunu açıkla
   │
   └─ Sonra nasıl düzeltileceğini göster
```

```
C. Gelişim Odaklı Öneri Şablonları
   ┌─────────────────────────────────────────────────────────┐
   │ [BOYUT]: [SPESIFIK DURUM]                              │
   │ Sorun: [Ne yanlış gidiyor]                             │
   │ Neden Önemli: [Sonuç ne olacak]                         │
   │ Nasıl Düzeltilir: [Somut adım önerisi]                  │
   │ Örnek: "[İyi bir alternatif cümle veya yaklaşım]"      │
   └─────────────────────────────────────────────────────────┘
```

## 4. Öğrenci Gelişim Yol Haritası

```
A. Önceki Çalışma Referansı
   ├─ Önceki essay'lerin puanlarını karşılaştır
   ├─ Tekrarlayan hata kalıplarını tespit et
   └─ Gelişim alanlarını sırala (öncelik sırasına göre)
```

```
B. Bireyselleştirilmiş Gelişim Planı
   ├─ Kısa vadeli hedef (1-2 hafta): [En kritik alan]
   ├─ Orta vadeli hedef (1 ay): [İkinci öncelik]
   ├─ Uzun vadeli hedef (dönem sonu): [Genel iyileşme]
   └─ Kaynak önerileri: [Tutorial, alıştırma, okuma]
```

## Key Patterns

| Boyut | Ağırlık | Puan Aralığı | Önem |
|-------|---------|--------------|------|
| Thesis & Argument | %25 | 25 puan | En kritik |
| Evidence & Support | %25 | 25 puan | En kritik |
| Organization | %20 | 20 puan | Orta |
| Language & Style | %15 | 15 puan | Orta |
| Conventions | %15 | 15 puan | Düşük |

## Anti-Patterns

```
❌ Genel geri bildirim: "İyi çalışma" veya "Geliştirmeye açık"
   → Her zaman spesifik kanıt ve örnek ver

❌ Sadece hata listesi vermek (değerlendirme değil geri bildirim)
   → Hatalar + nedenleri + nasıl düzeltileceği üçlüsü şart

❌ Negatif ton veya yargılayıcı dil kullanmak
   → "Sen hiç anlamamışsın" → "Bu kavram biraz daha pratik gerektiriyor"

❌ Tüm sorunları tek seferde listelemek
   → Öğrenci bunaltılır; önceliklendir, 2-3 spesifik öneriyle sınırla

❌ Kopya/darphane tespiti yapıp sadece notu düşürmek
   → Kopya durumunda ayrı bir protokol izle; eğitici geri bildirim ayrı
```

## Quick Reference

| Geri Bildirim Türü | Kullanım | Ton |
|-------------------|----------|-----|
| Biçimlendirici | Ders içi taslak | Destekleyici |
| Düzey belirleyici | Final değerlendirme | Somut, detaylı |
| Peer feedback | Akran değerlendirmesi | Yapıcı, nazik |
| Self-assessment | Öz değerlendirme | Yansıtıcı |

| Hata Türü | Örnek | Geri Bildirim Format |
|-----------|-------|----------------------|
| Thesis zayıf | Thesis eksik veya belirsiz | "Thesis bölümünde şunu netleştirmelisin: ..." |
| Kanıt yetersiz | Sadece geneleme | "Bu iddiayı desteklemek için şu kanıtı ekle:" |
| Organizasyon | Kopuk geçişler | "3. ve 4. paragraf arasına şu geçiş cümlesi ekle:" |
| Dilbilgisi | Tekrarlayan tense hatası | "Geçmiş zaman yerine şimdiki zaman kullan:" |
| Mantık | Non sequitur | "Bu sonuç bu öncüllerden çıkmıyor. Nedenini açıkla:" |
