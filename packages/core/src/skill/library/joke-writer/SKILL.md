---
name: joke-writer
description: Komedyen metin yazım aracı. Setup/punchline, observational, self-deprecating ve wordplay teknikleriyle farklı mizaş türlerinde espriler üretir.
triggers:
  - "espri yaz"
  - "komedi metni"
  - "stand-up malzemesi"
  - "punchline bul"
  - "joke writing"
  - "mizah yaz"
auto_load_when:
  - comedy_writing
  - entertainment_content
  - social_media
  - public_speaking
agent: content-ops
tools:
  - template_generator
  - markdown_writer
---

# Joke Writer — Komedi Metin Yazıcı

Mizah yazmak bir zanaattır. Bu skill, farklı komedi türlerinde etkili ve akılda kalıcı espriler üretir — setup'tan punchline'a, wordplay'den observational'a kadar.

---

## Pattern: Setup / Punchline (Kurulum / Vurucu Satır)

Stand-up komedinin temel birimi: beklenti oluştur, beklentiyi kır.

```
Setup / Punchline Structure
├── Setup (Kurulum)
│   ├── Establish the premise
│   │   └── "Karşılaştırma veya senaryo"
│   ├── Build expectation
│   │   └── "Dinleyiciyi X yönünde düşünmeye yönlendir"
│   └── Plant the seed
│       └── "Punchline'ın mantıksal temeli"
│
├── Punchline (Vurucu Satır)
│   ├── Subversion (Beklenti Kırılması)
│   │   └── "En beklenmedik ama mantıklı yön"
│   ├── The rule of three
│   │   ├── Item 1 — setup
│   │   ├── Item 2 — setup
│   │   └── Item 3 — punchline
│   └── Callback potential
│       └── "Sonra referans verilebilir mi?"
│
└── Tag (Ek Vuruş — opsiyonel)
    └── Punchline'ın altını daha da oyma
```

**Klasik Yapı:**
```
Setup: "Erkek arkadaşım bana sordu, 'Sana en çok ne kızdırıyor?' dedi."
Pivot: "Ben de düşündüm, listedim, sıraladım..."
Punchline: "O da 'Hazırladığın listeden kızgın mısın yoksa mutlu mu olacağımı anlayamıyorum' dedi."
Tag: "Arkadaşım, listede 'erkek arkadaşımın bu soruyu sorması' yazıyordu. O da ilk 3'teydi."
```

---

## Pattern: Observational Comedy (Gözlemsel Komedi)

Gündelik hayatın absürtlüklerini yakalayan, evrensel deneyimlere dokunan espriler.

```
Observational Comedy Structure
├── Target (Hedef)
│   └── Evrensel gündelik deneyim
│       ├── İş yerinde toplantılar
│       ├── Seyahat / havaalanı
│       ├── Aile ilişkileri
│       ├── Teknoloji kullanımı
│       └── Sosyal medya
│
├── Observation (Gözlem)
│   ├── First layer: Herkesin fark ettiği şey
│   │   └── "Toplantıda herkes aynı şeyi düşünüyor ama kimse söylemiyor..."
│   ├── Second layer: Ama gerçekte nasıl?
│   │   └── "Hepimiz 'toplantıya ne gerek var' diyoruz, sonra toplantıda 45 dk konuşuyoruz"
│   └── Third layer: Absürt sonuç
│       └── "Toplantının kendisi çözüm. Toplantı olmasa sorunu çözeceğiz — ama bunu da toplantıda konuşuyoruz"
│
└── Delivery (Sunum)
    ├── "Şu an bana gülüyorsunuz ama yarın ofiste bu toplantıyı yapacaksınız"
    └── "Neden? Çünkü 'toplantı yapmamak' kararı da toplantı gerektiriyor"
```

---

## Pattern: Self-Deprecating (Kendine Güldürme)

```
Self-Deprecating Comedy Structure
├── Hook (İlgi Açıcı)
│   └── "Ben [olumsuz özellik] insanıyım"
│
├── Build-up (İnşa)
│   ├── Specific incident A
│   │   └── Gerçek ve inandırıcı bir anekdot
│   ├── Specific incident B
│   │   └── Daha kötüsü / komik versiyon
│   └── The pattern
│       └── "Fark ettim ki bu bir trend değil, ben böyleyim"
│
├── Punchline Types
│   ├── Exaggeration (Abartma)
│   │   └── "Kendi düğünümde kayboldum"
│   ├── Contrast (Kontrast)
│   │   └── "Yapay zeka bile benden daha iyi [aktivite]"
│   └── Revelation (İfşa)
│       └── "Şu an bile sizinle dalga geçmek için sahneye çıktım. Yani bir bakıma siz teselli ödülüsünüz"
│
└── Safety Rules
    ├── Asla tamamen uydurma olma — temeli gerçek olsun
    ├── Aşağılayıcı değil, sevimli olsun
    └── Karşıdakini (insan gruplarını) aşağıatma
```

---

## Pattern: Wordplay / Pun (Kelime Oyunu)

```
Wordplay Structure
├── Pun Types
│   ├── Homophones (Eşsesliler)
│   │   └── "Pilates yapıyorum çünkü hayatımın kontrolünü kaybettim"
│   ├── Double Meanings (Çift Anlam)
│   │   └── "İstanbul'da yaşıyorum — ada değil, taşıyamıyorum"
│   ├── Mispronunciation (Yanlış Telaffuz)
│   │   └── "Ben vegan'ım. Sadece hayvansal ürün yemiyorum. O yüzden hayvancılık yapmıyorum"
│   └── Morphological Play (Yapısal Oynama)
│       └── "Freudcuyum. Bastırdığım şeyler beni bastırıyor"
│
├── Delivery Method
│   ├── Set up the wrong meaning first
│   │   └── "X dediler, ben de Y sandım"
│   ├── Pause for ambiguity
│   │   └── (1 saniye sessizlik)
│   ├── Reveal the correct meaning
│   │   └── "X DEĞİL, Y'MİŞ"
│   └── Land on the wordplay
│       └── "Yani tam anlamıyla [tekrar kelime oyunu]"
```

---

## Pattern: Rule of Three (Üçler Kuralı)

```
Rule of Three Application
├── Pattern: A-A-B (Üçüncüsü farklı)
│   ├── "Benim üç tutkum var: kitap, kahve ve..."
│   ├── "Hayır, kahve sayılmaz, tutku sayılır"
│   └── "İkinci tutkum da kahve. Üçüncüsü: nereye gittiğimi hatırlamak"
│
├── Pattern: Escalating Absurdity (Artan Absürtlük)
│   ├── "Bekarım, çünkü aşk hayatım yok"
│   ├── "Aşk hayatım yok, çünkü sosyal hayatım yok"
│   └── "Sosyal hayatım yok, çünkü evden çıkmıyorum. Evden çıkmıyorum çünkü bekarım."
│
└── Pattern: Callback (Geri Bildirim)
    ├── Setup (Act 1): "Dedem 90 yaşında maraton koşuyor"
    ├── Setup (Act 2): "Ben 25 yaşında yürüyüş yapmak için randevu alıyorum"
    └── Callback (Act 3): "Demek ki maraton 65 yıl sonra benim işim olacak"
```

---

## Key Patterns

| Tür | Odak | Örnek |
|---|---|---|
| **Observational** | Evrensel deneyim | Ofis, seyahat, aile hayatı |
| **Self-deprecating** | Kendine gülme | Kişisel kusurlar |
| **One-liner** | Tek cümle, hızlı vuruş | "İşte hayatımın özeti..." |
| **Storytelling** | Uzun anlatı, doruk noktası | Anekdot bazlı |
| **Dark comedy** | Tabu konular | Külçü yaklaşım |
| **Satire** | Toplumsal eleştiri | Absürtlüğü ortaya koyma |
| **Surreal** | Mantık dışı, rüya gibi | Bilinçaltı imgeleri |
| **Anti-humor** | Beklenti tersine çevirme | "Ve sonra hiçbir şey olmadı" |

---

## Anti-Patterns

```
❌ "Şaka şaka" uyarısı — espriyi önceden etiketleme
   → Komedi kendini açıklamaz. İz bırakır.

❌ Çok uzun setup — 30 saniyeden fazla açıklama
   → Dinleyici beklentiyi kaybeder. Kısa tut.

❌ Hedefi belirsiz espriler — "insanlar" deyip genelleme
   → Spesifik ol. Kim? Ne zaman? Nerede?

❌ Aşırı mekanik punchline — "dolayısıyla", "yani" ile bitirme
   → Punchline keskin biter. Ek açıklama gereksiz.

❌ İkinci kez aynı espriyi anlatma
   → Bir kez söyle, yetiş. Tekrar = zayıflatma.

❌ Kasıtlı olarak yanlış telaffuz / küfür
   → Mekanik değil, organik olmalı. Kelime oyunu doğal akmalı.

❌ Başkasının espirisini kendinmiş gibi sunma
   → Kaynak her zaman bellidir. İlhama referans ver.

✅ Her espriyi yüksek sesle söyle — kulağa nasıl geliyor?
✅ En az 3 versiyon dene — en iyisini seç
✅ Callback yap eski esprilere — tutarlılık ve derinlik katar
✅ İlk denemeleri kaydet, geri dön, düzelt
```

---

## Quick Reference

| Teknik | Formül | Örnek |
|---|---|---|
| **Rule of Three** | A-A-B | "Kitap, kahve, çılgınlık" |
| **Callback** | Önceki espriye dönüş | "Dediğim gibi, ama bu sefer..." |
| **Topping** | Punchline üzerine ek | "Ama asıl komik kısım..." |
| **Reverse** | Beklenti tersi | "En kötüsüydü. En iyisi." |
| **Misdirection** | Yanlış yöne yönlendir | "Herkes X sandı, oysa Y" |
| **Escalation** | Durumu kötüleştir | "Sonra işler daha da kötüleşti" |
| **Understatement** | Hafife alma | "Biraz sıkıntı yaşadık" |
| **Overstatement** | Abartma | "Gözlerim faltaşı gibi açıldı" |
| **Triple** | 3'lü kombinasyon | "Sevgilim, işim, internet bağlantım gitti" |
| **Contradiction** | Çelişki | "Sigarayı bırakıyorum. Yarın. Mutlaka." |
