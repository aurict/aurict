---
name: speech-writer
description: Konuşma metni yazım aracı. Keynote, düğün toast, TED-style ve narrative arc formatlarında etkileyici konuşma metinleri üretir.
triggers:
  - "konuşma yaz"
  - "sunum metni"
  - "düğün konuşması"
  - "keynote hazırla"
  - "speech writing"
  - "toast yaz"
auto_load_when:
  - public_speaking
  - event_preparation
  - professional_communication
  - ceremonial_speaking
agent: content-ops
tools:
  - template_generator
  - markdown_writer
---

# Speech Writer — Konuşma Metni Yazıcı

Konuşma yazmak, düşünceyi etkiye dönüştürme sanatıdır. Bu skill; keynote, düğün toast, TED-style ve anlatısal arc formatlarında güçlü konuşma metinleri üretir.

---

## Pattern: Generic Speech Arc (Genel Konuşma Yayı)

```
Speech Arc — 5 Bölüm
├── 1. Hook (Kanca — ilk 30 saniye)
│   ├── Question opener
│   │   └── "Hiçbiriz düşündünüz mü..."
│   ├── Provocative statement
│   │   └── "X'in sonu geliyor. Ve bu iyi bir şey."
│   ├── Story opening
│   │   └── "6 ay önce [senaryo]..."
│   └── Startling statistic
│       └── "%87'si farkında değil. Ben de değildim."
│
├── 2. Problem / Stakes (Sorun / Risk)
│   ├── Establish the gap
│   │   └── "Olan ve olması gereken arasındaki uçurum"
│   ├── Why it matters now
│   │   └── "Neden bugün harekete geçmeliyiz?"
│   └── Personal stakes
│       └── "Bu benim hayatımı nasıl etkiledi?"
│
├── 3. Main Argument (Ana Argüman)
│   ├── Thesis statement
│   │   └── "Bugün size şunu göstereceğim: X"
│   ├── Supporting pillar 1
│   │   ├── Evidence
│   │   ├── Story / example
│   │   └── Transition
│   ├── Supporting pillar 2
│   │   ├── Evidence
│   │   ├── Story / example
│   │   └── Transition
│   └── Supporting pillar 3
│       ├── Evidence
│       ├── Story / example
│       └── Transition
│
├── 4. Call to Action / Vision (Eylem Çağrısı)
│   ├── Immediate next step
│   │   └── "Yarın şunu yapabilirsiniz..."
│   ├── Ripple effect
│   │   └── "Bu sadece sizi değil..."
│   └── Shared future
│       └── "Birlikte inşa edebileceğimiz dünya..."
│
└── 5. Closing (Kapanış)
    ├── Return to hook
    │   └── "Hatırlıyorsanız, başta sorduğum soru..."
    ├── Emotional landing
    │   └── "Son bir şey söylemek istiyorum..."
    └── Signature line
        └── "Ve o cümle, konuşmanızın son sözü olarak kalsın"
```

---

## Pattern: Keynote Speech (Ana Konuşma Formatı)

```
Keynote Speech Structure
├── Pre-Opening (Sahnede bekleme)
│   └── 5–10 saniye sessizce dur, izleyiciyi topla
│
├── Opening (0–3 dk)
│   ├── Hook (1 cümle)
│   │   └── En güçlü açış cümlelerinden biri
│   ├── Personal connection
│   │   └── "Size neden bu konuyu anlatıyorum..."
│   └── Roadmap (bugünkü yol haritası)
│       └── "Bugün 3 şey anlatacağım: 1, 2, 3"
│
├── Section 1 (3–8 dk)
│   ├── "İlk olarak..."
│   ├── Story / data
│   ├── Insight
│   └── Transition
│
├── Section 2 (8–15 dk)
│   ├── "İkinci olarak..."
│   ├── Story / data
│   ├── Insight
│   └── Transition
│
├── Section 3 (15–22 dk)
│   ├── "Ve son olarak..."
│   ├── Story / data
│   ├── Insight
│   └── Transition
│
├── Climax (22–25 dk)
│   ├── "Ama asıl mesele şu..."
│   ├── Emotional peak
│   └── "Hepimiz..."
│
└── Closing (25–30 dk)
    ├── Call to action
    ├── "Teşekkürler" + signature moment
    └── Q&A daveti (opsiyonel)
```

---

## Pattern: Wedding Toast (Düğün Konuşması)

```
Wedding Toast Structure
├── Introduction (30 sn)
│   ├── Kim olduğunuzu söyleyin
│   │   └── "Ben [isim], [neden tanıyorsunuz]"
│   └── Tone set
│       └── "Bugün [gelin/trans] ve [damat/gelin] için özel bir gün"
│
├── The Relationship Story (2–3 dk)
│   ├── Nasıl tanıştılar? (komik/tavsiye anekdot)
│   │   └── "İlk tanıştıklarında [komik detay]..."
│   ├── Çiftin en sevdiğiniz özelliği
│   │   └── "[Gelin] der ki... [karakteristik söz]"
│   └── Birlikte büyüme hikayesi
│       └── "Gözlemlediğim en güzel şey..."
│
├── Why This Works (1–2 dk)
│   ├── Neden birbirleri için doğru?
│   │   └── "Birbirlerini nasıl tamamladıklarını gördüm..."
│   ├── Küçük ama anlamlı detay
│   │   └── "En sevdiğim sahne: [spesifik an]"
│   └── Their future vision
│       └── "Gelecekte onları nasıl görüyorum..."
│
├── Wishes & Toast (30 sn)
│   ├── Kısa, samimi dilek
│   │   └── "İyi günde, kötü günde, her günde..."
│   ├── Kadeh kaldırma
│   │   └── "Kalkıyoruz, kadeh kaldırıyoruz"
│   └── "Gelin ve damada!"
│
└── Time Limit: 3–5 dakika toplam
    └── Her cümle bir öncekinden daha kısa olsun
```

---

## Pattern: TED-Style Speech (TED Konuşması Formatı)

```
TED-Style Speech — 18 Dakika Kuralı
├── The Idea Worth Spreading
│   └── Tek bir ana fikir, net ifade
│
├── Structure (18 dakika)
│   ├── Hook + Intro (2 dk)
│   │   └── "Size daha önce duymadığınız bir şey söyleyeceğim"
│   │
│   ├── Background (3 dk)
│   │   ├── "Nasıl bu noktaya geldim?"
│   │   ├── "Neden bu soru beni 10 yıldır meşgul ediyor?"
│   │   └── Map the territory
│   │
│   ├── First Revelation (4 dk)
│   │   ├── "İlk keşfim: X"
│   │   ├── Demo / evidence
│   │   └── "Bu her şeyi değiştirdi"
│   │
│   ├── Second Revelation (4 dk)
│   │   ├── "Sonra fark ettim ki: Y"
│   │   ├── Story / example
│   │   └── "Puzzle'ın parçaları birleşmeye başladı"
│   │
│   ├── Third Revelation (3 dk)
│   │   ├── "Ve son kilit nokta: Z"
│   │   ├── The synthesis
│   │   └── "İşte cevap"
│   │
│   ├── So What (1 dk)
│   │   └── "Peki bunun anlamı ne?"
│   │       └── "Sizin için ne değişiyor?"
│   │
│   └── Closing (1 dk)
│       ├── Return to opening
│       ├── Call to action
│       └── Memorable ending line
│
└── Delivery Notes
    ├── Maksimum 100 kelime/dakika konuşma hızı
    ├── Her 3 dakikada bir somut örnek / hikaye
    ├── Yapayalnızlaştırıcı, tekrar et
    └── Fiziksel hareketi kontrollü kullan
```

---

## Pattern: Narrative Arc Speech (Anlatısal Konuşma)

```
Narrative Speech Structure
├── The Setup (Giriş)
│   ├── Where / When / Who
│   │   └── "10 yıl önce, [yer], [durum]"
│   ├── Why this matters
│   │   └── "O gün öğrendiğim şey hayatımı değiştirdi"
│   └── Your role
│       └── "Ben orada ne arıyordum?"
│
├── The Challenge (Meydan Okuma)
│   ├── What was at stake
│   │   └── "Eğer başarısız olsaydım..."
│   ├── The obstacles
│   │   ├── Internal: korkular, şüpheler
│   │   └── External: koşullar, insanlar
│   └── The low point
│       └── "En karanlık an: [detay]"
│
├── The Turning Point (Dönüm Noktası)
│   ├── The moment of realization
│   │   └── "O anda ne fark ettim?"
│   ├── The decision
│   │   └── "Ne yaptım ve neden?"
│   └── The help
│       └── "Kim / ne yardım etti?"
│
├── The Resolution (Çözüm)
│   ├── What happened
│   │   └── "Sonuç ne oldu?"
│   ├── The lessons learned
│   │   └── "3 şey öğrendim: 1, 2, 3"
│   └── How it changed you
│       └── "Bugün nasıl farklı düşünüyorum?"
│
└── The Connection to Audience (Kitle Bağlantısı)
    └── "Siz de şu anda benzer bir noktada olabilirsiniz"
        └── "Umarım benim hikayem size şunu gösteriyor..."
```

---

## Key Patterns

| Konuşma Türü | Hedef Kitle | Ton | Süre |
|---|---|---|---|
| **Keynote** | Büyük salon, genel | İlham verici, vizyoner | 20–45 dk |
| **Wedding Toast** | Düğün davetlileri | Samimi, eğlenceli | 3–5 dk |
| **TED-Style** | Meraklı, eğitimli | Düşünceli, kanıt odaklı | 12–20 dk |
| **Business Pitch** | Yatırımcılar, müşteriler | Progresif, değer odaklı | 5–15 dk |
| **Motivational** | Çalışanlar, öğrenciler | Enerjik, aksiyona çağıran | 10–20 dk |
| **Farewell / Retirement** | İş arkadaşları | Nostaljik, minnettar | 5–10 dk |
| **Political** | Seçmenler, halk | İdeolojik, birleştirici | 15–30 dk |

---

## Anti-Patterns

```
❌ "Öncelikle, ikinci olarak, son olarak" — liste gibi okuma
   → Hikayeyle, anekdotla, somut örnekle anlat

❌ Kendinden 50 kez bahsetmek
   → "Ben" yerine "siz" ve "biz" kullan

❌ Her cümlede istatistik — duygu yok
   → Data + hikaye + his = etkili konuşma

❌ İnsult/kritik — olumsuz bir şeyi hedef alma
   → Olumlu çerçevele, vizyonu sun

❌ "Şimdi, sonuç olarak" — monoton geçişler
   → "İşte bu yüzden...", "Ama asıl mesele...", "Ve bu beni şaşırtıyor ki..."

❌ Elinizde kağıt — ezberlenmiş ya da teleprompter
   → Hafif notlar, doğal konuşma

✅ İlk ve son cümle en güçlü olsun
✅ Kısa cümleler, uzun paragraflar değil
✅ Yüksek sesle pratik yap — her satırı oku
✅ Kronometre tut — hedef sürenin %80'inde bitir
✅ "Ne hissettirmek istiyorum?" sorusunu sor
```

---

## Quick Reference

| Element | Hedef | Teknik |
|---|---|---|
| **Hook** | İlk 30 sn'de tut | Soru, istatistik, hikaye, provokasyon |
| **Tone** | Kitleye uygun | Resmi (iş) vs samimi (düğün) |
| **Pacing** | Dakikada 100–120 kelime | Stresli kelimeleri yavaşlat |
| **Rhetorical devices** | Bellekle | Anaphora, tricolon, antithesis |
| **Transitions** | Akış | Soru, tekrar, kontrast, hikaye köprüsü |
| **Call to action** | Somut + ulaşılabilir | "Yarın şunu yapın" formatı |
| **Visual aids** | Destek, ana değil | Slayt: 1 fikir, 1 görsel, 0 metin |
| **Memorable close** | Son 30 sn kritik | İstatistik, hikaye, slogan |
| **Body language** | Sözsüz iletişim | Duruş, jest, göz teması |
| **Rehearsal** | En az 3 kere | Aynaya, zamanlayarak, farklı ortamda |
