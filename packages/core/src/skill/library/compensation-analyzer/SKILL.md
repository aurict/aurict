---
name: compensation-analyzer
description: "Maaş karşılaştırması, pazar verileri, yan haklar analizi, total reward hesaplama ve esneklik önerileri"
triggers:
  keywords: ["compensation analyzer", "maaş karşılaştırma", "total reward", "pazar verileri", "yan haklar"]
auto_load_when: "Kullanıcı maaş karşılaştırma, pazar benchmark veya kompanzasyon analizi ister"
agent: content-ops
tools: ["Read", "Write", "grep", "glob"]
---

# Compensation Analyzer (Ücret Analizcisi)

**Odak Alanı:** Maaş karşılaştırması, pazar verileri, yan haklar analizi, total reward hesaplama ve esneklik önerileri

## 1. Pattern: Maaş Karşılaştırma Yapısı

```
maaş_karşılaştırma
├── mevcut_paket
│   ├── Base salary
│   ├── Bonus (sabit %)
│   ├── Variable pay
│   ├── Equity/hisse
│   └── Toplam anual
├── pazar_verileri
│   ├── Salary survey verileri
│   │   ├── Industry benchmark
│   │   ├── Location adjustment
│   │   ├── Company size factor
│   │   └── Experience level
│   ├── Public data
│   │   ├── Glassdoor / levels.fyi
│   │   ├── LinkedIn Salary
│   │   ├── Indeed
│   │   └── Payscale
│   └── Custom data
│       ├── Internal equity
│       ├── Historical data
│       └── Referral data
├── karşılaştırma_matrisi
│   ├── Percentile comparison
│   │   ├── P25 (Low)
│   │   ├── P50 (Median)
│   │   ├── P75 (High)
│   │   └── P90 (Top)
│   ├── Role matching
│   │   ├── Level alignment
│   │   ├── Scope alignment
│   │   └── Skills match
│   └── Gap analysis
│       ├── Salary gap %
│       ├── Total compensation gap
│       └── Lag/Lead indicator
└── iç_adalet
    ├── Internal equity ratio
    ├── Tenure-based comparison
    ├── Performance-based comparison
    └── Level-based comparison
```

## 2. Pattern: Pazar Verileri Analizi

```
pazar_verileri
├── veri_kaynakları
│   ├── Industry surveys
│   │   ├── Radford
│   │   ├── Mercer
│   │   ├── Willis Towers Watson
│   │   └── Hewitt
│   ├── Online platforms
│   │   ├── Glassdoor
│   │   ├── Payscale
│   │   ├── LinkedIn Salary
│   │   └── levels.fyi
│   └── Public filings
│       ├── SEC filings (public companies)
│       ├── Government data
│       └── Union data
├── adjustment_faktörleri
│   ├── Location factor
│   │   ├── Tier 1 cities (NYC, SF, London)
│   │   ├── Tier 2 cities
│   │   └── Remote adjustments
│   ├── Company size
│   │   ├── Startup (<50)
│   │   ├── Mid-size (50-500)
│   │   └── Enterprise (500+)
│   ├── Industry premium
│   │   ├── Tech premium
│   │   ├── Finance premium
│   │   └── Healthcare premium
│   └── Economic conditions
│       ├── Inflation adjustment
│       ├── Market trends
│       └── Supply/demand
└── benchmark_süreci
    ├── Role mapping
    ├── Data cleaning
    ├── Statistical analysis
    ├── Range building
    └── Recommendation
```

## 3. Pattern: Yan Haklar Analizi

```
yan_haklar
├── sigorta_faydaları
│   ├── Health insurance
│   │   ├── Medical (premium)
│   │   ├── Dental
│   │   └── Vision
│   ├── Life insurance
│   ├── Disability (STD/LTD)
│   └── EAP programı
├── finansal_faydalar
│   ├── 401K / Pension
│   ├── Equity options
│   ├── Bonus programı
│   ├── Stock purchase plan
│   └── Financial planning
├── zaman_faydaları
│   ├── PTO / Annual leave
│   ├── Sick leave
│   ├── Parental leave
│   ├── Bereavement
│   └── Sabbatical
├── gelişim_faydaları
│   ├── Learning budget
│   ├── Conference attendance
│   ├── Tuition reimbursement
│   └── Certification
├── yaşam_kalitesi
│   ├── Remote work
│   ├── Flexible hours
│   ├── Commuter benefits
│   ├── Wellness programs
│   └── Home office stipend
└── özel_faydalar
    ├── Free meals / snacks
    ├── Transportation
    ├── Gym membership
    ├── Equipment allowance
    └── Relocation
```

## 4. Pattern: Total Reward Hesaplama

```
total_reward
├── bileşenler
│   ├── Direct compensation
│   │   ├── Base salary
│   │   ├── Overtime/Total cash
│   │   ├── Short-term incentive
│   │   ├── Long-term incentive
│   │   └── Sign-on bonus
│   ├── Indirect compensation
│   │   ├── All benefits value
│   │   ├── Perks value
│   │   ├── Learning value
│   │   └── Wellness value
│   └── Non-financial
│       ├── Work-life balance
│       ├── Career growth
│       ├── Location flexibility
│       └── Company culture
├── hesaplama_formülü
│   ├── Total Cash = Base + Bonus + STI
│   ├── Total Comp = Cash + LTI + Equity
│   ├── Total Rewards = Comp + Benefits + Perks
│   └── Fully-loaded cost = Total + Taxes + Benefits
└── görselleştirme
    ├── Compensation breakdown chart
│   ├── Benchmark comparison chart
│   ├── Year-over-year trend
    └── Total rewards statement
```

## 5. Pattern: Esneklik Önerileri

```
esneklik_önerileri
├── maaş_esnekliği
│   ├── Salary flexibility
│   │   ├── Range midpoint
│   │   ├── Range spread (%15-25)
│   │   └── Red circle / Green circle
│   ├── Market adjustment
│   │   ├── Off-cycle adjustment
│   │   ├── Promotion adjustment
│   └── Retention adjustment
├── paket_esnekliği
│   ├── Component mix
│   │   ├── More cash vs equity
│   │   ├── More salary vs bonus
│   │   └── Immediate vs future
│   ├── Vehicle options
│       ├── Cash bonus
│       ├── RSUs / Options
│       ├── Performance shares
│       └── Deferred comp
└── yan_hak_esnekliği
    ├── Customizable benefits
    │   ├── Benefits allowance
    │   ├── Flex credit system
    │   └── Cafeteria plan
    ├── Unique perks
        ├── Pet insurance
        ├── Student loan assistance
        └── Family benefits
└── uygulama_stratejisi
    ├── Budget analysis
    ├── Market timing
    ├── Comp philosophy alignment
    └── Communication plan
```

---

## Quick Reference

| Percentile | Karşılık | Kariyer Aşaması |
|-----------|----------|----------------|
| P25 | Alt çeyrek | Yeni başlayan |
| P50 | Medyan | Deneyimli |
| P75 | Üst çeyrek | Senior |
| P90 | Tepe | Lider |

| Bileşen | Tipik Değer | Not |
|---------|----------|-----|
| Base salary | %70-80 | Nakit |
| STI (Bonus) | %10-20 | Nakit |
| LTI | %10-20 | Hisse |
| Benefits | %20-30 | Değer |

| Benchmark | İyi | Orta | Dikkat |
|-----------|-----|------|-------|
| P50+ | %10-20 above | At median | %10 below |
| Total comp | %25 above | At median | %15 below |
| Benefits | Above market | At market | Below market |
