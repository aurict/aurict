---
name: podcast-script-writer
description: Podcast scripti yazım aracı. Intro/outro, segment yapısı, konuk soruları ve show notes ile profesyonel podcast içerikleri üretir.
triggers:
  - "podcast scripti yaz"
  - "bölüm taslağı"
  - "konuk soruları hazırla"
  - "show notes oluştur"
  - "intro/outro yaz"
  - "podcast planning"
auto_load_when:
  - content_creation
  - audio_production
  - interview_planning
  - media_production
agent: content-ops
tools:
  - markdown_writer
  - template_generator
  - outline_builder
---

# Podcast Script Writer — Podcast Scripti Yazıcı

Podcast üretiminin kalbi script'tir. Bu skill, formatından içeriğine, yayından sonrasına kadar tüm aşamaları kapsayan profesyonel podcast scriptleri üretir.

---

## Pattern: Episode Structure (Bölüm Yapısı)

```
Podcast Episode Structure
├── Cold Open (0:00–1:00)
│   ├── Hook Statement
│   │   └── "Bugün sizi şoke edecek bir şey söyleyeceğim..."
│   ├── Sound Effect / Music Sting
│   └── Transition to Intro
│
├── Intro / Opening (1:00–3:00)
│   ├── Host Greeting
│   │   └── "Merhaba, hoş geldiniz, ben [isim]..."
│   ├── Podcast Name Drop
│   │   └── "[Podcast Adı]'nda bu hafta..."
│   ├── Episode Preview
│   │   └── "Bugün konuşacağımız konular: 1, 2, 3..."
│   └── Music Intro Jingle (2–3sn)
│
├── Segment 1 — Main Topic Introduction (3:00–10:00)
│   ├── Topic Statement
│   │   └── "Bugünün ana konusu: [başlık]"
│   ├── Context Setup
│   │   ├── Neden önemli?
│   │   ├── Kimi ilgilendiriyor?
│   │   └── Ne beklemeli?
│   └── Quick Stat / Story Hook
│
├── Segment 2 — Deep Dive (10:00–30:00)
│   ├── Sub-point A
│   │   ├── Key insight
│   │   ├── Example / Story
│   │   └── Transition
│   ├── Sub-point B
│   │   ├── Key insight
│   │   ├── Example / Story
│   │   └── Transition
│   ├── Sub-point C
│   │   ├── Key insight
│   │   ├── Example / Story
│   │   └── Transition
│   └── Mid-roll Ad Read (opsiyonel, ~60sn)
│
├── Segment 3 — Guest Interview (30:00–45:00)
│   ├── Guest Introduction (60sn)
│   │   ├── "Bu haftaki konuğumuz..."
│   │   ├── Credentials / Why this person?
│   │   └── How we met / Why now?
│   │
│   ├── Opening Warm-up (5 dk)
│   │   ├── Easy opener questions
│   │   └── Build rapport
│   │
│   ├── Core Questions (30 dk)
│   │   ├── Background & Story (5dk)
│   │   ├── Expertise Deep-dive (15dk)
│   │   ├── Personal Angle (5dk)
│   │   └── Controversial / Provocative (5dk)
│   │
│   ├── Rapid Fire Round (5 dk)
│   │   ├── 5 quick questions
│   │   └── Fun / unexpected answers
│   │
│   └── Closing (3 dk)
│       ├── Key takeaway from guest
│       ├── Where to find them
│       └── Tease next content
│
├── Segment 4 — Expert Interview (No Guest)
│   ├── Quick News Round (10 dk)
│   │   └── Haftanın 3 önemli gelişmesi
│   ├── Deep Topic Expansion (15 dk)
│   │   └── Detaylı açıklama, karşı görüş
│   └── Listener Q&A (10 dk)
│       └── Sosyal medyadan seçilen sorular
│
├── Ad Read (15–60sn)
│   ├── Sponsor Introduction
│   │   └── "Bugün sponsorumuz [brand]..."
│   ├── Value Proposition
│   │   └── "Neden harika? Çünkü..."
│   ├── Call to Action
│   │   └── "[URL] — kodu [CODE] ile %20 indirim"
│   └── Transition phrase
│
├── Outro / Wrap-up (Son 5 dk)
│   ├── Episode Recap
│   │   └── "Bugün öğrendiklerimiz..."
│   ├── Key Takeaway
│   │   └── "Tek cümleyle: ..."
│   ├── Call to Action
│   │   ├── Sosyal medyada paylaş
│   │   ├── Yorum bırak / soru sor
│   │   └── Abone ol / beğen
│   ├── Next Episode Tease
│   │   └── "Gelecek hafta..."
│   ├── Contact / Social Links
│   └── Music Out / Fade out
│
└── Bumper / End Card
    └── "Dinlediğiniz için teşekkürler"
```

---

## Pattern: Guest Question Structure (Konuk Soru Yapısı)

```
Guest Question Architecture
├── Warm-up (Rapor Kurma)
│   ├── "Bize kendinizi kısaca tanıtabilir misiniz?"
│   ├── "Bugüne kadar olan yolculuğunuzda en heyecanlı an?"
│   └── "O sektöre girmenizin hikayesi nedir?"
│
├── Expertise Questions (Uzmanlık)
│   ├── "Son dönemde üzerinde çalıştığınız proje?"
│   ├── "Bu alanda en büyük yanılgı nedir?"
│   ├── "Girişimciler genelde neyi atlıyor?"
│   └── "Sektörün geleceği hakkında ne düşünüyorsunuz?"
│
├── Insight Questions (Derin Analiz)
│   ├── "Bunu nasıl başardınız? Adım adım"
│   ├── "Başarısızlıktan ne öğrendiniz?"
│   ├── "Size ilham veren kim/komplo/kitap?"
│   └── "Önerdiğiniz 3 kaynak / alışkanlık?"
│
├── Personal Angle (Kişisel Boyut)
│   ├── "Günlük rutininiz nedir?"
│   ├── "Motivasyonunuz düştüğünde ne yapıyorsunuz?"
│   ├── "İş-yaşam dengesi nasıl?"
│   └── "Genç versiyonunuza ne söylerdiniz?"
│
├── Provocative / Hot Take (Provokatif)
│   ├── "[sektör] hakkında tartışmalı bir görüş?"
│   ├── "En sevdiğiniz 'kötü' alışkanlık?"
│   ├── "İnsanların yanlış bildiği bir şey?"
│   └── "Herkesin yapması gereken ama kimsenin yapmadığı?"
│
└── Rapid Fire
    ├── "Kitap / Film / Podcast önerisi?"
    ├── "Tek kelimeyle hayat?"
    ├── "Sabah kaçta kalkıyorsunuz?"
    └── "LinkedIn / Twitter / Website?"
```

---

## Pattern: Show Notes Template (Bölüm Notları)

```
Show Notes Template
├── Episode Meta
│   ├── Episode Number & Title
│   ├── Publication Date
│   ├── Duration
│   ├── Episode Summary (3-4 cümle)
│   └── Key Topics Covered (bulleted list)
│
├── Timestamps
│   └── 00:00 — Intro
│       01:30 — Today's topic intro
│       10:00 — Deep dive begins
│       ...
│
├── Guest Bio (if applicable)
│   ├── Name / Title
│   ├── Photo (optional)
│   ├── Short bio (2-3 sentences)
│   └── Social media / website links
│
├── Resources & Links Mentioned
│   ├── Books mentioned
│   ├── Tools / products
│   ├── People / organizations
│   └── Articles / studies
│
├── Quotes from Episode
│   └── "Bu bölümden alıntılar"
│
├── Listener Actions
│   ├── Subscribe / Review request
│   ├── Social media handles
│   └── Feedback email
│
└── Sponsor Section
    └── Sponsor messages with tracking links
```

---

## Key Patterns

| Format | Kullanım | Süre |
|---|---|---|
| **Solo (Monologue)** | Uzmanlık, eğitim, opinion | 20–45 dk |
| **Interview (Konuklu)** | İlham, hikaye, uzmanlık paylaşımı | 45–90 dk |
| **Co-host / Duel** | Tartışma, farklı bakış açıları | 30–60 dk |
| **News Round** | Haftalık gündem | 20–30 dk |
| **Q&A / AMA** | Topluluk etkileşimi | 30–45 dk |
| **Storytelling** | Kişisel anlatı, true crime | 30–60 dk |
| **Mini-series** | Derin dive, çok bölümlü seri | 15–25 dk x N |

---

## Anti-Patterns

```
❌ Aşırı uzun vefatmış konuşma — "Şey... Şimdi... Bakın aslında..."
   → Her cümleyi 3 kere düzenle, gereksiz kelimeleri at

❌ Script okuyormuş gibi monoton konuşma
   → Hafif notlar kullan, doğal konuşma tonuna yakınlaştır

❌ "Ve... ve... ve..." bağlaç spami
   → "Ayrıca", "Bunun yanı sıra", "Şimdi geçelim" ile alternatifler

❌ Konuk'u kesintiye uğratma, monologa dönüştürme
   → Sor, dinle, takip sorusu sor — sohbet değil sorgulama

❌ Intro'da spoiler — bölümün sonunu söyleme
   → Merak uyandır, ama sonu kaçırma

❌ Her segmentte aynı geçiş kalıbı
   → "Şimdi", "Peki", "Pekiştirmek için", "Bir de şu var" rotasyonu

✅ Bölüm başında "bugünkü soru" sor — cevabı bölüm sonuna sakla
✅ Her segment sonunda "Neden önemli?" cevabını ver
✅ Konuk sorularını önceden gönder — daha hazır cevaplar alırsın
✅ Sesli oku — akıcı değilse script'te sorun var
```

---

## Quick Reference

| Element | Hedef | Teknik |
|---|---|---|
| **Hook** | İlk 30 saniyede dinleyiciyi tut | Şaşırtıcı iddia, soru, hikaye |
| **Tone** | Samimi, enerjik, doğal | Konuşma dili, kısa cümleler |
| **Pacing** | Ortalama 130–150 kelime/dk | Monologda hızlı, konukta yavaş |
| **Ad Read** | Doğal, değer odaklı | "Şunu kullanıyorum ve..." formatı |
| **Episode Length** | Platform + içerik türüne göre | Spotify 30–45dk, YouTube 20–35dk |
| **Title** | SEO + merak | Sayı + şoke edici anahtar kelime |
| **CTA** | Her bölüm sonu | Tekrar: 1, sosyal: 1, abone: 1 |
| **Guest** | Araştırma + kişiselleştirme | 3 makale oku, 1 podcast dinle |
| **SEO** | Başlık + description + keywords | Podcast platformları için optimize et |
| **Thumbnail** | YouTube'daysan: okunabilir, yüz + metin | Alt text'i de doldur |
