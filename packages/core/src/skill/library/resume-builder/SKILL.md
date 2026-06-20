---
name: resume-builder
description: CV oluşturma aracı. ATS optimization, sections, achievement quantification ve formatting best practices ile profesyonel özgeçmişler üretir.
triggers:
  - "CV yaz"
  - "özgeçmiş hazırla"
  - "resume oluştur"
  - "iş başvurusu"
  - "ATS uyumlu CV"
  - "career document"
auto_load_when:
  - job_search
  - career_development
  - professional_branding
  - recruitment
agent: content-ops
tools:
  - markdown_writer
  - template_generator
  - keyword_analyzer
---

# Resume Builder — CV Oluşturucu

Bir CV, kariyer hikayenizin 2 sayfalık bir özetidir. Bu skill; ATS uyumluluğu, etkili bölümleme, başarıların ölçümlenmesi ve profesyonel formatlama ile dikkat çeken özgeçmişler üretir.

---

## Pattern: ATS Optimization (ATS Optimizasyonu)

```
ATS (Applicant Tracking System) Optimization
├── What ATS Reads
│   ├── Plain text (no tables, columns, graphics)
│   ├── Keywords from job description
│   ├── Contact information (name, email, phone, location)
│   ├── Section headers (Education, Experience, Skills)
│   └── Consistent formatting
│
├── Keyword Strategy
│   ├── Job description analysis
│   │   ├── "En az 10 kritik kelimeyi bul"
│   │   ├── Teknik beceriler (Python, SQL, Project Management)
│   │   ├── Sektör terimleri (Agile, KPI, ROI)
│   │   └── Soft skills (Leadership, Communication)
│   │
│   ├── Placement strategy
│   │   ├── Skills section: hard skills
│   │   ├── Work experience: action verbs + skills
│   │   ├── Summary: 3–5 anahtar kelime
│   │   └── Avoid: keyword stuffing
│   │
│   └── Hidden keywords
│       ├── Abbreviations (SEO = Search Engine Optimization)
│       ├── Variations (Mgmt = Management)
│       └── Synonyms (Built = Developed = Created)
│
├── Formatting Rules for ATS
│   ├── DO
│   │   ├── Simple fonts: Arial, Calibri, Garamond (10–12pt)
│   │   ├── Clean layouts — single column preferred
│   │   ├── Standard section headers (ALL CAPS or Title Case)
│   │   ├── .docx format (PDF only if specified)
│   │   └── Consistent date format: MM/YYYY
│   │
│   └── DON'T
│       ├── Tables, text boxes, columns (often misread)
│       ├── Headers / footers (ATS skips)
│       ├── Images, icons, infographics
│       ├── Special characters, symbols (✓ ✗ instead of bullets)
│       └── Multiple fonts / colors
│
└── Keyword Mapping Template
    ├── Job posting keywords:
    │   ├── [keyword 1] → [CV'de nerede kullanıldı]
    │   ├── [keyword 2] → [CV'de nerede kullanıldı]
    │   └── [keyword 3] → [CV'de nerede kullanıldı]
    ├── Coverage: X / 10 keywords
    └── Missing: [list]
```

---

## Pattern: Resume Sections (CV Bölümleri)

```
Resume Section Architecture
├── Header / Contact Info
│   ├── Full name (14–16pt, bold)
│   │   └── No titles (Dr., Prof. unless relevant)
│   ├── Professional title (current / target)
│   ├── Phone number
│   ├── Professional email
│   ├── LinkedIn URL (customized slug)
│   ├── Location (City, Country — no full address)
│   └── Optional:
│       ├── Portfolio / personal website
│       ├── GitHub (for tech roles)
│       └── Twitter / blog (for content roles)
│
├── Professional Summary (3–5 lines)
│   ├── Statement 1: Experience level + area
│   │   └── "8 yıllık deneyimli yazılım mühendisi"
│   ├── Statement 2: Key specialization
│   │   └── "Full-stack development ve mikroservis mimarisi uzmanı"
│   ├── Statement 3: Key achievement
│   │   └── "Ölçeklenebilir sistemler tasarlayarak %40 performans artışı sağladı"
│   └── Statement 4: Career goal / fit
│       └── "Hızlı büyüyen bir fintech şirketinde katkı sunmak"
│
├── Core Competencies / Skills (2–3 column grid)
│   ├── Technical skills
│   │   └── Python, SQL, AWS, Docker, CI/CD
│   ├── Tools & Platforms
│   │   └── Jira, Confluence, GitHub, Figma
│   ├── Languages
│   │   └── Türkçe (native), İngilizce (C1), Almanca (A2)
│   └── Certifications (if applicable)
│       └── AWS Solutions Architect, PMP
│
├── Work Experience
│   ├── Company name + Location
│   ├── Job title (bold)
│   ├── Employment dates (MM/YYYY – MM/YYYY or Present)
│   ├── 3–5 bullet points per role
│   │   ├── Action verb + Task + Result (quantified)
│   │   └── "Led a 5-person team that delivered X"
│   └── STAR format for achievements
│       └── "Situation → Task → Action → Result"
│
├── Education
│   ├── Degree, Major (bold)
│   ├── University name
│   ├── Graduation date or expected
│   ├── GPA (if 3.5+)
│   └── Relevant coursework / thesis
│
├── Certifications & Training
│   ├── Certification name
│   ├── Issuing organization
│   └── Date
│
├── Additional Sections (optional)
│   ├── Projects (for fresh grads or career changers)
│   ├── Publications (akademik CV'ler için)
│   ├── Volunteer work
│   ├── Languages
│   ├── Interests (kısa, alakalıysa)
│   └── References (note: "Available upon request")
│
└── Page Setup
    ├── Page size: A4
    ├── Margins: 1.5–2 cm
    ├── Length: 1–2 pages (mid-career: 2)
    └── File name: Name_Surname_Resume_YYYY.pdf
```

---

## Pattern: Achievement Quantification (Başarı Ölçümlendirme)

```
Achievement Quantification Framework
├── The CAR Framework
│   ├── Context: "Neydi? Nerede? Kimin için?"
│   ├── Action: "Ne yaptınız? Nasıl yaptınız?"
│   └── Result: "Ne oldu? Rakamsal olarak ne fark etti?"
│
├── Quantification Methods
│   ├── Revenue impact
│   │   ├── "+%25 gelir artışı sağladı"
│   │   ├── "Yıllık 2M TL tasarruf"
│   │   └── "Satış pipeline'ını 3 kat büyüttü"
│   │
│   ├── Cost reduction
│   │   ├── "%30 operasyonel maliyet düşürdü"
│   │   ├── "Süreç otomasyonu ile haftada 20 saat tasarruf"
│   │   └── "Ofis giderlerini 15.000 TL/ay azalttı"
│   │
│   ├── Efficiency / productivity
│   │   ├── "%40 daha hızlı teslimat"
│   │   ├── "Sprint velocity'yi 32 → 48 story point'e çıkardı"
│   │   └── "Müşteri yanıt süresini 48 saat → 4 saate düşürdü"
│   │
│   ├── Team / leadership
│   │   ├── "12 kişilik ekibi yönettim"
│   │   ├── "Departman turnover'unu %30 düşürdüm"
│   │   └── "3 stajyer yetiştirdim — 2'si şirketiçi istihdam edildi"
│   │
│   ├── Scale / scope
│   │   ├── "1M+ kullanıcıya hizmet veren platform"
│   │   ├── "5 ülkede deployment"
│   │   └── "500+ dahili kullanıcıya eğitim verdim"
│   │
│   └── Quality / accuracy
│       ├── "%99.8 doğruluk oranı"
│       ├── "Bug raporlarını %50 azalttı"
│       └── "Customer satisfaction score: 4.8/5"
│
├── Before / After Transformation
│   ├── BEFORE: "Müşteri hizmetleri departmanını iyileştirdim"
│   ├── AFTER: "Müşteri hizmetleri süreçlerini yeniden tasarladım —
│   │          NPS skorunu 32 → 68'e yükseltip, ilk yanıt süresini
│   │          48 saatten 6 saate düşürdüm"
│   │
│   ├── BEFORE: "Sosyal medya hesabını yönettim"
│   └── AFTER: "Instagram takipçisini 5K → 85K'ya (17x) büyüttüm;
│               engagement rate'i %1.2 → %4.5'e yükseltti;
│               affiliate gelirine 45.000 TL katkı sağladı"
│
└── Best Practices
    ├── Use % when possible (relative change)
    ├── Use TL/£/$ for financial impact
    ├── Use time units for efficiency (hours, days saved)
    ├── Use numbers at start of bullet (1M, 25%, 3x)
    └── Round numbers unless precision is critical
```

---

## Pattern: Resume Formatting (Format Best Practices)

```
Resume Formatting System
├── Typography
│   ├── Name: 14–16pt, bold, unique font
│   ├── Section headers: 11–12pt, ALL CAPS or Title Case, bold
│   ├── Job titles: 11–12pt, bold
│   ├── Body text: 10–11pt, regular
│   └── Font family: One font throughout (Calibri, Garamond, Arial)
│
├── Visual Hierarchy
│   ├── Primary: Name + section headers
│   ├── Secondary: Job titles + company names
│   └── Tertiary: Bullets + descriptions
│
├── Spacing & Layout
│   ├── Margins: 1.5–2 cm all sides
│   ├── Line spacing: 1.15–1.5
│   ├── Section gaps: 1.5–2 lines
│   ├── Bullet indent: 0.5–1 cm
│   └── Consistent spacing between all elements
│
├── Bullet Style
│   ├── Use "•" or "-" (ATS compatible)
│   ├── NOT special characters like "→" or "✓"
│   ├── One idea per bullet
│   ├── Max 2 lines per bullet
│   └── Start with action verb
│
├── Dates & Timeline
│   ├── Format: MM/YYYY or Month YYYY
│   ├── Consistent across entire resume
│   ├── Most recent experience first
│   └── Gaps: address if >6 months, use simple format
│
├── File Formatting
│   ├── Format: .docx (unless PDF specified)
│   ├── Name: Name_Surname_Resume_YYYY.pdf
│   ├── Size: max 500 KB
│   └── Quality: check in Google Docs viewer
│
└── Quality Checklist
    ├── □ Max 2 pages
    ├── □ No spelling / grammar errors
    ├── □ Consistent date format
    ├── □ Consistent bullet style
    ├── □ Keywords from job description
    ├── □ Measurable achievements
    ├── □ No personal info (photo, birthdate, TC Kimlik)
    ├── □ ATS-friendly format
    └── □ Customized for each application
```

---

## Pattern: Cover Letter Structure (İngilizce / Uluslararası)

```
Cover Letter Structure (Optional but Recommended)
├── Opening Paragraph
│   ├── Position you're applying for
│   ├── Where you found the job
│   └── Hook: why you're excited (1 sentence)
│
├── Body Paragraph 1 — Experience fit
│   ├── Most relevant experience (1–2 bullets)
│   ├── How it connects to the role
│   └── Quantified achievement
│
├── Body Paragraph 2 — Skills / culture fit
│   ├── Key skills match
│   ├── Specific example
│   └── Company-specific knowledge
│
└── Closing Paragraph
    ├── Restate interest
    ├── Call to action
    └── Thank you
```

---

## Key Patterns

| Durum | CV Uzunluğu | Odak |
|---|---|---|
| **Staj / yeni mezun** | 1 sayfa | Eğitim + projeler + beceriler |
| **Junior (1–3 yıl)** | 1 sayfa | Deneyim + beceriler + başarılar |
| **Mid-level (4–8 yıl)** | 2 sayfa | Kapsamlı deneyim + başarılar |
| **Senior / yönetici** | 2–3 sayfa | Liderlik + stratejik başarılar |
| **Kariyer değişikliği** | 1–2 sayfa | Transfer edilebilir beceriler + proje kanıtı |
| **Uluslararası başvuru** | İngilizce, 2 sayfa | Kültürel açıklama + lokal deneyim |

---

## Anti-Patterns

```
❌ "Referans mevcuttur" — bu gereksiz, herkes söyler
   → Kaldırın, alan kazanın

❌ Tüm CV'ye aynı dosyayı gönderme — job hopping değilmiş gibi
   → Her başvuru için özelleştirin (keyword + achievement match)

❌ "Detaylı CV isteyin" — 4 sayfa = okunmaz
   → 2 sayfa max, en ilgili bilgiyi öne koyun

❌ "İş arıyorum" gibi generic özet
   → "8 yıllık deneyimli backend mühendisi, Fintech sektöründe
     mikroservis mimarisi uzmanı" — spesifik ve güçlü

❌ Görsel öğeler, sütunlar, renkler — ATS bunları okuyamaz
   → Düz, tek sütun, siyah beyaz format

❌ Sosyal medya linklerinin hepsi — sadece profesyonel olanı ekleyin
   → LinkedIn + portfolio/website yeterli

✅ Her başvuru öncesi anahtar kelime kontrolü
✅ "Ben" yerine güçlü fiillerle başlayın (Led, Developed, Achieved)
✅ En iyi başarınızı ilk sıraya koyun
✅ İletişim bilgilerinizi kontrol edin — güncel email kullanın
```

---

## Quick Reference

| Element | Kural | Örnek |
|---|---|---|
| **Uzunluk** | Max 2 sayfa | İstisna: akademik / yönetici |
| **Format** | .docx (tercih) veya PDF | Job posting'e bak |
| **E-posta** | Profesyonel (ad.soyad@...com) | İstem@...com = kaldırın |
| **Fotoğraf** | Türkiye'de opsiyonel, yurtdışı: hayır | Kaldırmak güvenli |
| **Doğum tarihi** | Gerekli değil | Silin |
| **Başarı ölçümü** | Her maddede en az 1 rakam | "+%25", "3x", "2M TL" |
| **Action verb** | Her maddeyle başla | Led, Built, Achieved, Reduced |
| **Anahtar kelime** | Job description'dan | Min 10 kritik terim |
| **Tarih formatı** | Tutarlı, MM/YYYY | 01/2022 – 05/2024 |
| **Font** | Tek font, 10–12pt | Calibri, Arial |
| **Margins** | 1.5–2 cm | Kenar boşlukları tutarlı olsun |
| **Dosya adı** | Ad_Soyad_Resume_2026.pdf | Kolay tanımlanır format |
| **ATS kontrol** | Word'e yapıştır, bozulma var mı? | Düzgün görünüyorsa hazır |
