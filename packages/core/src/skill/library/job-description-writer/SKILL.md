---
name: job-description-writer
description: "İş ilanı yazımı, anahtar kelime yerleştirme, şirket kültürü tanımı, AR/VR gereksinimleri ve işe alım pazarlaması"
triggers:
  keywords: ["job description writer", "iş ilanı", "iş tanımı", "job posting", "yetenek pazarlaması"]
auto_load_when: "Kullanıcı iş ilanı yazımı, iş tanımı veya işe alım içeriği ister"
agent: content-ops
tools: ["Read", "Write", "grep", "glob"]
---

# Job Description Writer (İş İlanı Yazarı)

**Odak Alanı:** İş ilanı yazımı, anahtar kelime yerleştirme, şirket kültürü tanımı, AR/VR gereksinimleri ve ATS optimizasyonu

## 1. Pattern: İş İlanı Bölümleri

```
iş_ilanı_yapısı
├── başlık (Title)
│   ├── Doğru pozisyon ismi
│   ├── Seviye belirteci
│   ├── ATS uyumlu format
│   └── AR/VR ek disiplini
├── özet (Summary)
│   ├── 2-3 cümle özet
│   ├── Büyüleyici hook
│   ├── Değer önerisi
│   └── Lokasyon ve tip
├── sorumluluklar (Responsibilities)
│   ├── Günlük görevler
│   ├── Haftalık hedefler
│   ├── Proje bazlı sorumluluklar
│   └── Liderlik unsurları
├── nitelikler (Qualifications)
│   ├── Zorunlu (Required)
│   │   ├── Eğitim
│   │   ├── Deneyim
│   │   └── Sertifikalar
│   ├── Tercih Nedeni (Preferred)
│   │   ├── Ek deneyim
│   │   ├── Dil yeteneği
│   │   └── Sertifikalar
│   └── Yetenekler (Soft Skills)
├── şirket_kültürü (Culture)
│   ├── Değerler
│   ├── Çalışma ortamı
│   ├── Faydalar
│   └── DEI-commitment
├── kompanzasyon (Compensation)
│   ├── Aralık (mümkünse)
│   ├── Bonus/ yan haklar
│   └── Growth potential
└── başvuru_ctası (CTA)
    ├── Açık başvuru adımları
    ├── Timeline
    └── Eşit fırsat beyanı
```

## 2. Pattern: Anahtar Kelime Yerleştirme

```
anahtar_kelime_stratejisi
├── rol_specifik_keywords
│   ├── Teknik yetkinlikler
│   │   ├── "TypeScript", "React", "Node.js"
│   │   ├── "Agile", "Scrum", "CI/CD"
│   │   └── "AWS", "Kubernetes"
│   ├── Yönetim yetkinlikleri
│   │   ├── "Ekip liderliği"
│   │   ├── "Bütçe yönetimi"
│   │   └── "Stakeholder yönetimi"
│   └── Soft skill keywords
│       ├── "Problem çözme"
│       ├── "İletişim becerileri"
│       └── "Analitik düşünce"
├── ats_optimizasyonu
│   ├── Doğru başlık formatı
│   ├── Standart alan adları
│   ├── Eşanlamlı kelime kullanımı
│   ├── Yoğunluk oranı %2-5
│   └── Stop words排除
├── seo_anahtar_kelimeleri
│   ├──Uzun kuyruk anahtar kelimeler
│   │   ├── "Senior React Developer İstanbul"
│   │   └── "Remote Product Manager iş ilanı"
│   ├── Lokasyon + rol kombinasyonu
│   └── Skills + level kombinasyonu
└── erişilebilirlik
    ├── Gender-neutral dil
    ├── Yaş tarafsız ifadeler
    ├── Engellilik dostu
    └── Kapsayıcı dil
```

## 3. Pattern: Şirket Kültürü Tanımı

```
şirket_kültürü
├── değerler_hikayesi
│   ├── Vizyon ve misyon
│   ├── Temel değerler (3-5 adet)
│   ├── Değerler hikayeleri
│   └── "Neden biz?" cevabı
├── çalışma_ortamı
│   ├── Ofis/Remote/Esnek
│   ├── Çalışma saatleri
│   ├── Ekip yapısı
│   └── Decision-making süreci
├── büyüme_fırsatları
│   ├── Kariyer yolları
│   ├── Eğitim bütçesi
│   ├── Mentorluk programı
│   └── Internal mobility
├── çeşitlilik_ve_kapsayıcılık
│   ├── DEI beyanı
│   ├── Eşit fırsat politikası
│   ├── Çalışan kaynak grupları
│   └── Accomodation taahhüdü
├── faydalar_ve_yan_haklar
│   ├── Saglık sigortası
│   ├── Unlimited PTO
│   ├── Home office bütçesi
│   ├── Learning budget
│   ├── Hisse opsiyonları / Equity
│   └── Wellness programı
└── topluluk_katılımı
    ├── Şirket etkinlikleri
    ├── Volunteering
    └── Social events
```

## 4. Pattern: AR/VR ve Yeni Medya Gereksinimleri

```
ar_vr_gereksinimleri
├── genişletilmiş_pozisyonlar
│   ├── AR/VR Developer
│   │   ├── Unity / Unreal deneyimi
│   │   ├── 3D modelleme
│   │   ├── XR interaction design
│   │   └── Spatial computing
│   ├── Metaverse Architect
│   │   ├── Virtual world design
│   │   ├── NFT/gaming economics
│   │   └── Avatar systems
│   └── Spatial Designer
│       ├── 3D modeling tools
│       ├── VR fundamentals
│       └── User experience
├── dijital_dönüşüm_entegrasyonu
│   ├── Remote collaboration tools
│   ├── Digital workspace
│   ├── VR meeting rooms
│   └── Digital onboarding
└── yeni_yetenekler
    ├── Gamification
    ├── Virtual events
    ├── Digital community management
    └── Web3 / Blockchain
```

## 5. Pattern: İşe Alım Pazarlaması

```
işe_alım_pazarlaması
├── kariyer_sayfası_optimizasyonu
│   ├── SEO dostu içerik
│   ├── Mobil uyumlu
│   ├── Video içerikler
│   └── Employee testimonials
├── sosyal_medya_stratejisi
│   ├── LinkedIn job posting
│   ├── Twitter/X career thread
│   ├── Instagram behind scenes
│   └── TikTok day-in-the-life
├── employee_referral
    ├── Referral bonusu
    │   ├── $1,000-5,000
    │   └── Tiered rewards
│   ├── Referral süreci kolaylığı
│   └── Recognition programı
├── universite_ortaklıkları
│   ├── Kariyer fuarları
│   ├── Staj programları
│   └── Capstone projeleri
└── talent_pool
    ├── Nurture sequence
    ├── Newsletter
    └── Community building
```

---

## Quick Reference

| Bölüm | Uzunluk | Özellik |
|-------|---------|--------|
| Başlık | 1 satır | Anahtar kelime + seviye |
| Özet | 2-3 cümle | Hook + değer önerisi |
| Sorumluluklar | 6-8 madde | Eylem odaklı |
| Nitelikler | 8-12 madde | Zorunlu + tercih |
| Kültür | 4-6 cümle | Benzersiz farklılıklar |

| ATS Optimizasyon | Kritere | Örnek |
|--------------|-------|-------|
| Başlık formatı | Rol + Seviye | "Senior Product Manager" |
| Anahtar kelime | %2-5 yoğunluk | "React, TypeScript, Agile" |
| Stop words | Min %20 | "the", "a", "an" hariç |
| Karakter limit | <8000 | Jobal scale uyumu |

| Pozisyon Seviyesi | Deneyim | Anahtar Kelimeler |
|-----------------|---------|---------------|
| Entry | 0-2 yıl | Öğrenme, gelişim, mentorluk |
| Mid | 2-5 yıl | Bağımsızlık, uzmanlık |
| Senior | 5-8 yıl | Liderlik, strateji |
| Lead/Director | 8+ yıl | Strategik, yönetim |
