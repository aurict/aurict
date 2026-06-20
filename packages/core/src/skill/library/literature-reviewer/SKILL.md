---
name: literature-reviewer
description: "Akademik makale tarama, meta-analysis, critical appraisal ve bulgular sentezi."
triggers:
  keywords: ["literature reviewer", "literature review", "meta-analysis", "systematic review", "akademik tarama", "makale sentezi", "critical appraisal"]
auto_load_when: "User requests literature review, systematic review, meta-analysis, or academic paper synthesis"
agent: content-ops
tools: ["Read", "Write", "Bash", "WebFetch", "WebSearch"]
---

# Literature Reviewer — Akademik Makale Tarama ve Sentez

**Focus:** Akademik veritabanlarında kapsamlı makale taraması, kalite değerlendirmesi, bulgular sentezi ve sistematik/meta-analiz hazırlığı.

## 1. Tarama Stratejisi (Search Strategy)

```
A. Araştırma Sorusu Formülasyonu (PICO/PIO Formatı)
   ├─ P (Population/Population): Hedef popülasyon kim?
   ├─ I (Intervention): Müdahale/tedavi nedir?
   ├─ C (Comparison): Karşılaştırma grubu var mı?
   └─ O (Outcome): Sonuç/çıktı ölçütü ne?
```

```
B. Veritabanı Seçimi
   ├─ PubMed/MEDLINE          → Biyomedikal
   ├─ Scopus                  → Çok disiplinli
   ├─ Web of Science          → Atıf odaklı
   ├─ ERIC                    → Eğitim bilimleri
   ├─ PsycINFO                → Psikoloji
   ├─ Cochrane Library        → Sistematik review
   ├─ Google Scholar         → Geniş tarama
   └─ ProQuest                → Tez/dissertasyonlar
```

```
C. Arama Terimleri ve Bool Operatörleri
   ├─ AND → Her iki terim de bulunmalı (daraltır)
   ├─ OR  → En az bir terim bulunmalı (genişletir)
   ├─ NOT → Terim dışlanmalı (daraltır)
   └─ proximity: (near/N) → Terimler N kelime yakınında
```

## 2. Dahil etme/Dışlama Kriterleri (Eligibility Criteria)

```
A. Dahil Etme (Inclusion)
   ├─ Yayın yılı aralığı
   ├─ Dil kısıtlaması
   ├─ Yayın türü (RCT, cohort, case-control, review...)
   ├─ Peer-reviewed olma şartı
   └─ Tam metin erişilebilirliği
```

```
B. Dışlama (Exclusion)
   ├─ Düşük metodolojik kalite
   ├─ Çalışma popülasyonu uyumsuzluğu
   ├─ Yetersiz veri raporlaması
   └─ Çıkar çatışması olan çalışmalar (şeffaflık gerekli)
```

## 3. Critical Appraisal (Kalite Değerlendirmesi)

```
A. Risk of Bias Değerlendirmesi
   ├─ RCT → Cochrane RoB 2.0
   │  ├─ Random sequence generation
   │  ├─ Allocation concealment
   │  ├─ Blinding of participants/personnel
   │  ├─ Blinding of outcome assessment
   │  └─ Incomplete outcome data
   │
   ├─ Cohort → Newcastle-Ottawa Scale (NOS)
   │  ├─ Selection
   │  ├─ Comparability
   │  └─ Outcome
   │
   └─ Cross-sectional → JBI Critical Appraisal Checklist
```

```
B. Kalite Skoru Hesaplama
   ├─ Düşük Risk (Low)       → Yeşil
   ├─ Belirsiz Risk (Some Concerns) → Sarı
   └─ Yüksek Risk (High)     → Kırmızı
```

## 4. Veri Çıkarımı ve Sentez (Data Extraction & Synthesis)

```
A. Veri Çıkarım Formu
   ├─ Bibliyografik bilgiler
   ├─ Çalışma tasarımı
   ├─ Popülasyon özellikleri (n, yaş, cinsiyet)
   ├─ Müdahale detayları
   ├─ Sonuç ölçütleri (primary/secondary outcomes)
   ├─ İstatistiksel analiz sonuçları
   └─ Yazar sonuçları
```

```
B. Bulgular Sentezi
   ├─ Narrative Synthesis → Tematik gruplama, kalıp tanıma
   ├─ Meta-Analysis       → Heterogeneity analizi ile yüzde havuzlaması
   │  ├─ Fixed-effect model  → Düşük heterogeneity (I² < 50%)
   │  └─ Random-effects model → Yüksek heterogeneity (I² ≥ 50%)
   └─ Subgroup Analysis   → Önceden belirlenmiş alt gruplar
```

## Key Patterns

| Aşama | Çıktı | Araç |
|-------|-------|------|
| Tarama | Arama sorgusu + sonuç sayısı | PubMed advanced search |
| Seçim | PRISMA akış diyagramı | Rayyan, Covidence |
| Kalite | Risk of bias özeti | Robvis, RevMan |
| Sentez | Tablo + meta-analiz grafiği | Cochrane Review Manager |

## Anti-Patterns

```
❌ PubMed'te sadece tek veritabanı kullanmak
   → Eksik tarama: en az 2-3 veritabanı zorunlu

❌ Dahil etme kriterlerini sonradan değiştirmek (publication bias)
   → Protokolde önceden tanımla, sapma kaydet

❌ Kalite değerlendirmesini atlamak
   → Düşük kaliteli çalışmalar sonuçları çarpıtır

❌ Sadece "statistically significant" sonuçları raporlamak
   → Tüm bulgular, güven aralıkları ile raporlanmalı

❌ PRISMA akış diyagramı eksikliği
   → Sistematik review zorunlu çıktısıdır
```

## Quick Reference

| Araç/Kaynak | Kullanım | Link |
|-------------|---------|------|
| PubMed | Biyomedikal tarama | pubmed.ncbi.nlm.nih.gov |
| Rayyan | Bağımsız tarama | rayyan.qcri.org |
| Covidence | Tam metin seçimi | covidence.org |
| Zotero | Referans yönetimi | zotero.org |
| RevMan | Meta-analiz + RoB | revman.cochrane.org |
| Robvis | Risk of bias görselleştirme | robvis.massguo.com |
| PRISMA | Raporlama standardı | prisma-statement.org |

| Kalite Değerlendirme | Araç | Kullanım |
|---------------------|------|---------|
| RCT | Cochrane RoB 2.0 | Interventional studies |
| Cohort | Newcastle-Ottawa Scale | Observational |
| Cross-sectional | JBI Checklist | Prevalence |
| Qualitative | CASP Qualitative | Interpretive |
