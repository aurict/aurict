---
name: thesis-structurer
description: "Tez yapısı oluşturma, bölüm organizasyonu, methodology taslağı ve timeline planı."
triggers:
  keywords: ["thesis", "tez", "tez yapısı", "dissertation", "methodology", "bölüm organizasyonu", "academic writing"]
auto_load_when: "User asks to structure a thesis, outline chapters, draft a methodology, or create an academic writing timeline"
agent: content-ops
tools: ["Read", "Write", "Bash"]
---

# Thesis Structurer — Akademik Tez ve Dissertasyon Organizasyonu

**Focus:** Lisansüstü tez ve dissertasyonların yapılandırılması, bölüm organizasyonu, metodoloji taslağı, literature review çerçevesi, timeline planı ve yazım rehberliği.

## 1. Tez Yapısı Genel Mimarisi (Qualitative/Quantitative)

```
A. Geleneksel Beş Bölümlü Yapı (Sosyal Bilimler)
   ├─ Chapter 1: Introduction
   │  ├─ Background / Problem Statement
   │  ├─ Research Questions / Hypotheses
   │  ├─ Significance of the Study
   │  └─ Definitions
   │
   ├─ Chapter 2: Literature Review
   │  ├─ Theoretical Framework
   │  ├─ Empirical Literature
   │  └─ Research Gap Identification
   │
   ├─ Chapter 3: Methodology
   │  ├─ Research Design
   │  ├─ Population & Sampling
   │  ├─ Data Collection Instruments
   │  ├─ Data Analysis Procedures
   │  └─ Validity & Reliability / Trustworthiness
   │
   ├─ Chapter 4: Findings / Results
   │  ├─ Descriptive Statistics
   │  ├─ Inferential Statistics / Theme Analysis
   │  └─ Findings Summary
   │
   └─ Chapter 5: Discussion & Conclusion
      ├─ Interpretation of Findings
      ├─ Implications
      ├─ Limitations
      └─ Future Research
```

```
B. STEM/Mühendislik Yapısı
   ├─ Chapter 1: Introduction
   ├─ Chapter 2: Background & Literature Review
   ├─ Chapter 3: Proposed Method / System Design
   ├─ Chapter 4: Implementation & Experiments
   ├─ Chapter 5: Results & Analysis
   └─ Chapter 6: Conclusion & Future Work
```

```
C. Sanat/Beşeri Bilimler Yapısı
   ├─ Chapter 1: Introduction
   ├─ Chapter 2-N: Essays / Analysis Sections
   └─ Chapter N+1: Conclusion
```

## 2. Her Bölüm Detaylı Taslağı

```
A. Chapter 1: Introduction Template
   ┌──────────────────────────────────────────────────────────────────┐
   │ 1.1 Background                                                     │
   │     → Genel bağlam, alanın önemi, tarihsel gelişim               │
   ├──────────────────────────────────────────────────────────────────┤
   │ 1.2 Problem Statement                                             │
   │     → Araştırılacak spesifik problem, boşluk                     │
   ├──────────────────────────────────────────────────────────────────┤
   │ 1.3 Research Questions / Hypotheses                                │
   │     → RQ1: ...                                                   │
   │     → RQ2: ...                                                   │
   │     → H1: ...                                                    │
   ├──────────────────────────────────────────────────────────────────┤
   │ 1.4 Purpose of the Study                                          │
   │     → Study aims to... [infinitive clause]                        │
   ├──────────────────────────────────────────────────────────────────┤
   │ 1.5 Significance / Contributions                                  │
   │     → Theoretical contribution                                    │
   │     → Practical/policy implications                              │
   ├──────────────────────────────────────────────────────────────────┤
   │ 1.6 Definitions of Key Terms                                     │
   │     → Operational definitions                                     │
   │     → Conceptual definitions                                      │
   └──────────────────────────────────────────────────────────────────┘
```

```
B. Chapter 2: Literature Review Template
   ┌──────────────────────────────────────────────────────────────────┐
   │ 2.1 Introduction                                                  │
   │     → Scope, organization of the chapter                         │
   ├──────────────────────────────────────────────────────────────────┤
   │ 2.2 Theoretical Framework                                        │
   │     → [Theory Name]: temel ilkeler, şemalar                      │
   │     → Visual model (diagram)                                     │
   ├──────────────────────────────────────────────────────────────────┤
   │ 2.3 [Subtopic 1]                                                 │
   │     → Empirical bulgular                                        │
   │     → Metodolojik desenler                                       │
   ├──────────────────────────────────────────────────────────────────┤
   │ 2.4 [Subtopic 2]                                                 │
   │     → ...                                                        │
   ├──────────────────────────────────────────────────────────────────┤
   │ 2.5 Synthesis & Research Gap                                     │
   │     → Ne biliniyor? Ne bilinmiyor?                               │
   │     → Bu çalışma nasıl bir boşluk dolduruyor?                    │
   └──────────────────────────────────────────────────────────────────┘
```

```
C. Chapter 3: Methodology Template
   ┌──────────────────────────────────────────────────────────────────┐
   │ 3.1 Research Design                                              │
   │     → Quantitative / Qualitative / Mixed Methods               │
   │     → Justification                                             │
   ├──────────────────────────────────────────────────────────────────┤
   │ 3.2 Population & Sampling                                       │
   │     → Target population: ...                                    │
   │     → Sampling strategy: ...                                    │
   │     → Sample size: ... (power analysis if applicable)         │
   │     → Inclusion/Exclusion criteria                             │
   ├──────────────────────────────────────────────────────────────────┤
   │ 3.3 Data Collection                                             │
   │     → Instruments (validated scales, interview protocol)       │
   │     → Pilot testing results                                     │
   │     → Data collection procedure                                │
   ├──────────────────────────────────────────────────────────────────┤
   │ 3.4 Data Analysis                                                │
   │     → Analysis methods (SPSS, NVivo, etc.)                     │
   │     → Statistical tests / coding framework                     │
   │     → Validity & reliability (Cronbach's α, inter-coder)       │
   ├──────────────────────────────────────────────────────────────────┤
   │ 3.5 Ethical Considerations                                      │
   │     → IRB approval, informed consent                           │
   │     → Confidentiality, data security                            │
   └──────────────────────────────────────────────────────────────────┘
```

## 3. Research Question Geliştirme

```
A. PICO/PICo Formatı (Quantitative)
   ├─ P: Population (Örneklem/Hedef kitle)
   ├─ I: Intervention (Müdahale)
   ├─ C: Comparison (Kontrol grubu)
   └─ O: Outcome (Sonuç/Çıktı)
   Örnek: "P: lise öğrencileri, I: proje tabanlı öğrenme,
           C: geleneksel öğretim, O: akademik başarı"
```

```
B. SPIDER Formatı (Qualitative/Smixed)
   ├─ S: Sample
   ├─ P: Phenomenon of Interest
   ├─ I: Design
   ├─ D: Evaluation
   └─ R: Research Type
```

```
C. Araştırma Sorusu Türleri
   ├─ Descriptive → "What is...?" (Tanımlayıcı)
   ├─ Relational → "What is the relationship between X and Y?"
   ├─ Comparative → "How does X differ from Y in terms of...?"
   ├─ Causal → "Does X cause Y?" (Deneysel)
   └─ Exploratory → "How do participants experience...?" (Fenomenoloji)
```

## 4. Timeline ve Milestone Planı

```
A. Tipik Lisansüstü Tez Zaman Çizelgesi (Yüksek Lisans 2 yıl)
   ├─ Dönem 1, Ay 1-4:   Literatür taraması + Araştırma sorusu
   ├─ Dönem 1, Ay 5-7:   Metodoloji taslağı + Etik kurul başvurusu
   ├─ Dönem 2, Ay 1-3:   Pilot çalışma + Araç geliştirme
   ├─ Dönem 2, Ay 4-8:   Veri toplama ( fieldwork)
   ├─ Dönem 2, Ay 9-12:  Veri analizi
   ├─ Dönem 3, Ay 1-6:   Yazım (chapter by chapter)
   ├─ Dönem 3, Ay 7-10:  Revizyon + Danışman geri bildirimi
   └─ Dönem 3, Ay 11-12: Final düzeltmeleri + Savunma hazırlığı
```

```
B. Haftalık Yazım İlerleme Takibi
   ┌────────────────────────────────────────────────────────────────┐
   │ HAFTA  | YAZIM HEDEFİ            | TAMAMLANDI | SORUNLAR       │
   ├────────┼────────────────────────┼────────────┼────────────────┤
   │ Week 1 │ Ch 3 Draft (5000 word) │   60%     │ Veri analizi   │
   │ Week 2 │ Ch 3 Final             │   100%    │                │
   │ Week 3 │ Ch 4 Outline           │           │                │
   └────────┴────────────────────────┴────────────┴────────────────┘
```

## Key Patterns

| Tez Kısmı | Kelime Aralığı (Yüksek Lisans) | Kelime Aralığı (Doktora) |
|-----------|-------------------------------|--------------------------|
| Abstract | 250-350 | 300-500 |
| Chapter 1: Intro | 3000-5000 | 5000-8000 |
| Chapter 2: Lit Review | 5000-8000 | 8000-15000 |
| Chapter 3: Methods | 4000-6000 | 6000-10000 |
| Chapter 4: Results | 5000-8000 | 8000-12000 |
| Chapter 5: Discussion | 4000-6000 | 6000-10000 |
| References | Değişken | Değişken |
| **Toplam** | **25000-35000** | **80000-100000** |

## Anti-Patterns

```
❌ Literature review'u "kaynak listesi" olarak yazmak
   → Tematik sentez, eleştiri ve boşluk tespiti şart

❌ Metodoloji bölümünde sonuçları ifade etmek
   → Sadece yöntem ve prosedür; sonuç Chapter 4'te

❌ Araştırma sorularını "genel" bırakmak
   → Her RQ'nun ölçülebilir ve test edilebilir olması şart

❌ Findings bölümünde yorum yapmak
   → Bulgular salt raporlama; Discussion'da yorum

❌ Timeline olmadan yazmaya başlamak
   → Yığılan iş, stres, kalite düşüşü; milestone takibi şart
```

## Quick Reference

| Bölüm | Odak | Kritik Soru |
|-------|------|-------------|
| Introduction | Problem, motivation, RQ | "Neden bu çalışma yapılmalı?" |
| Lit Review | Teori, bulgular, boşluk | "Literatürde ne eksik?" |
| Methods | Tasarım, analiz yöntemi | "Nasıl yanıtlanacak?" |
| Results | Bulgular, istatistikler | "Ne bulundu?" |
| Discussion | Yorum, imalar, limit | "Ne anlama geliyor?" |

| Metodoloji Türü | Veri Tipi | Analiz Yöntemi |
|----------------|-----------|---------------|
| Experimental | Sayısal | t-test, ANOVA, MANOVA |
| Quasi-experimental | Sayısal | ANCOVA, regression |
| Survey | Sayısal | Regression, SEM |
| Ethnography | Metinsel | Thematic analysis |
| Phenomenology | Metinsel | Colaizzi, IPA |
| Case Study | Karışık | Pattern matching |
| Mixed Methods | Karışık | Sequential/parallel |

| Milestone | Dönem | Çıktı |
|-----------|-------|-------|
| Araştırma önerisi | Dönem 1 | 10-15 sayfa taslak |
| Etik kurul | Dönem 1 | Onay mektubu |
| Veri toplama | Dönem 2 | Ham veri seti |
| İlk taslak | Dönem 3 | Tam tez taslağı |
| Son teslim | Dönem 3 sonu | Revize tez |
| Savunma | Dönem 3 sonu | Sunum + savunma |
