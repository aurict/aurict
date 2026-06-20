---
name: vendor-evaluator
description: "Tedarikçi değerlendirme: Scoring matrix, RFI/RFP süreçleri, contract negotiation ve tedarikçi seçimi."
triggers:
  keywords: ["vendor evaluation", "supplier selection", "RFI", "RFP", "scoring matrix", "tedarikçi"]
  contexts: ["vendor comparison", "procurement", "contract negotiation", "supplier management"]
auto_load_when: "Kullanıcı tedarikçi değerlendirme, RFI/RFP süreci veya vendor scoring matrix istediğinde"
agent: content-ops
tools: ["Read", "Write", "Bash", "Grep", "Glob"]
---

# Vendor Evaluator — Tedarikçi Değerlendirme Uzmanı

**Odak Alanı:** Tedarikçi değerlendirme süreçleri, scoring matrix oluşturma, RFI/RFP yönetimi ve contract negotiation.

---

## Pattern Bölümleri

### 1. Vendor Evaluation Süreci

```
Vendor Selection Lifecycle
├── Phase 1: Needs Assessment
│   ├── Requirements definition
│   ├── Budget confirmation
│   ├── Timeline requirements
│   └── Selection criteria weight
├── Phase 2: Market Research
│   ├── Potential vendors list
│   ├── Market analysis
│   ├── Benchmark pricing
│   └── Category overview
├── Phase 3: RFI Process
│   ├── RFI preparation
│   ├── Vendor distribution
│   ├── Response collection
│   └── Qualification filter
├── Phase 4: RFP Process
│   ├── Detailed RFP
│   ├── Proposal requests
│   ├── Evaluation period
│   └── Shortlist creation
├── Phase 5: Evaluation & Selection
│   ├── Scoring matrix application
│   ├── Demo/pilot sessions
│   ├── Reference checks
│   └── Final selection
└── Phase 6: Negotiation & Contract
    ├── Terms negotiation
    ├── Contract finalization
    ├── Onboarding setup
    └── Ongoing management
```

### 2. Scoring Matrix Template

```
Vendor Scoring Matrix
├── Evaluation Categories
│   ├── Technical Capability (25%)
│   ├── Price/Cost (25%)
│   ├── Vendor Stability (15%)
│   ├── Support/Service (15%)
│   ├── Implementation (10%)
│   └── Compliance (10%)
├── Scoring Scale
│   ├── 1: Poor - Requirements not met
│   ├── 2: Fair - Partially meets
│   ├── 3: Good - Meets requirements
│   ├── 4: Very Good - Exceeds slightly
│   └── 5: Excellent - Far exceeds
├── Weighted Score Formula
│   └── Score = Σ(Category Score × Weight)
├── Final Score
│   ├── Max: 5.0
│   ├── Min: 1.0
│   └── Decision threshold: >3.5
└── Categories Detail
    ├── Technical: Features, integration, security
    ├── Price: TCO, ROI, payment terms
    ├── Stability: Financials, market position, history
    ├── Support: SLA, response time, account manager
    ├── Implementation: Timeline, training, migration
    └── Compliance: Certifications, data handling, legal
```

### 3. RFI vs RFP Karşılaştırması

```
RFI (Request for Information)
├── Purpose
│   ├── Market research
│   ├── Vendor discovery
│   ├── Capability assessment
│   └── Qualification
├── When to Use
│   ├── New category exploration
│   ├── Vendor pool creation
│   └── Initial screening
├── Format
│   ├── Open-ended questions
│   ├── Company overview
│   ├── Capabilities summary
│   └── General pricing ranges
├── Timeline: 1-2 weeks
└── Response: Basic info, capabilities

RFP (Request for Proposal)
├── Purpose
│   ├── Detailed requirements
│   ├── Specific solution proposals
│   ├── Detailed pricing
│   └── Comparison basis
├── When to Use
│   ├── Requirements clearly defined
│   ├── Competitive evaluation
│   └── Contract ready
├── Format
│   ├── Detailed requirements
│   ├── Response templates
│   ├── Evaluation criteria
│   └── Timeline/terms
├── Timeline: 4-8 weeks
└── Response: Full proposal
```

### 4. Vendor Risk Assessment

```
Vendor Risk Categories
├── Financial Risk
│   ├── Company financial health
│   ├── Revenue/Profit trends
│   ├── Credit rating
│   └── Funding status
├── Operational Risk
│   ├── Delivery capability
│   ├── Quality history
│   ├── References
│   └── Track record
├── Strategic Risk
│   ├── Market position
│   ├── Competition level
│   └── Long-term viability
├── Compliance Risk
│   ├── Regulatory certifications
│   ├── Data handling
│   ├── Security practices
│   └── Legal compliance
├── Reputational Risk
│   ├── Customer reviews
│   ├── Industry reputation
│   ├── Media/News
│   └── Social media
└── Concentration Risk
    ├── Single vendor dependency
    ├── Switch cost
    └── Exit strategy
```

### 5. Contract Negotiation Checklist

```
Contract Negotiation Areas
├── Commercial Terms
│   ├── Pricing model (perpetual/subscription)
│   ├── Payment terms (annual/monthly)
│   ├── Volume discounts
│   ├── Price protection
│   └── TCO clarity
├── SLA & Support
│   ├── Response time guarantees
│   ├── Uptime commitments
│   ├── Support coverage hours
│   ├── Escalation process
│   └── Penalty clauses
├── Data & Security
│   ├── Data ownership
│   ├── Security standards
│   ├── Breach notification
│   ├── Data location
│   └── Deletion/return
├── Terms & Termination
│   ├── Contract duration
│   ├── Renewal terms
│   ├── Termination clauses
│   ├── Exit costs
│   └── Transition support
├── Liability & Warranties
│   ├── Liability caps
│   ├── Indemnification
│   ├── Warranty period
│   └── Limitation of liability
└── Relationship Management
    ├── Account manager
    ├── Quarterly reviews
    ├── Communication cadence
    └── Innovation sharing
```

---

## Key Patterns

| Pattern | Açıklama | Uygulama |
|---------|----------|----------|
| **Weighted Scoring** | Kriter ağırlıklı puanlama | Objective evaluation |
| **RFI First** | Önce RFI ile filtreleme | Efficient process |
| **Reference Check** | Müşteri referansı zorunlu | Real feedback |
| **Total Cost** | TCO odaklı değerlendirme | Hidden costs |
| **Risk-Based** | Risk değerlendirmesi dahil | Due diligence |
| **Multi-Vendor** | En az 3 teklif karşılaştırma | Better negotiation |
| **Pilot/Proof** | Pilot test zorunlu | Proof of concept |

---

## Anti-Patterns

### ❌ Yanlış Uygulamalar

```markdown
# NO CRITERIA WEIGHTING
Tüm kriterler eşit önemli
- "Fiyat önemli" = "destek önemli" = her şey eşit
- Gerçek öncelikler yansımıyor
- Karar subjekif

✅ Her kriter için % ağırlık belirle
```

```markdown
# LOW BALL PRICING
Sadece en düşük fiyat seçildi
- TCO hesaba katılmadı
- Hidden costs yok sayıldı
- Quality risk ignored

Example: $10K upfront, $5K/year hidden
vs $15K upfront, $1K/year (10x cheaper?)
```

```markdown
# NO REFERENCE CHECK
Vendor "güzel referanslar verdi"
- Doğrulama yapılmadı
- Gerçek performans bilinmiyor
- Sürprizler kaçınılmaz

✅ En az 2-3 referansta directly konuş
```

```markdown
# SINGLE VENDOR
Tek vendor ile görüşüldü
- Karşılaştırma yok
- Negotiation zayıf
- Leverage kaybolur

✅ Min 3 vendor competitive
```

```markdown
# IGNORE CONTRACT TERMS
"Demo iyi, alalım" dendi
- Contract terms bakılmadı
- SLA yetersiz
- Termination zor

✅ Legal review zorunlu
```

```markdown
# RUSHED SELECTION
2 günde vendor seçildi
- Evaluation yetersiz
- Risk analysis yok
- Due diligence skipped

✅ Min 2-4 weeks process
```

### ✅ Doğru Uygulamalar

```markdown
# SCORING MATRIX ÖRNEĞİ
Vendor Evaluation: CRM Selection

| Kriter | Ağırlık | Vendor A | Vendor B | Vendor C |
|--------|---------|----------|----------|----------|
| Özellikler | %25 | 4 | 3 | 5 |
| Fiyat | %25 | 3 | 5 | 2 |
| Entegrasyon | %15 | 4 | 4 | 3 |
| Destek | %15 | 3 | 4 | 3 |
| Güvenlik | %10 | 5 | 4 | 4 |
| Referans | %10 | 4 | 3 | 4 |
| **Toplam** | **100%** | **3.75** | **3.80** | **3.45** |

Sonuç: Vendor B (en yüksek weighted score)
```

```markdown
# RFI SCREENING
RFI Response Analysis:
Vendor A: Eksik cevap, 2/10 soru
Vendor B: Detaylı, 10/10 soru
Vendor C: Kısmi, 6/10 soru

Shortlist: Vendor B only
Reason: Yeterli yetkinlik yok
- Vendor A: Disqualified (exp insufficient)
- Vendor C: Needs more info → RFP'ye çağrılabilir
```

```markdown
# REFERENCE CHECK TEMPLATE
Reference Call Questions:
1. "Bu vendor ile ne kadar çalıştınız?"
2. "Ana deliverable'lar neydi?"
3. "Timeline'a uyuldu mu?"
4. "Quality nasıldı?"
5. "Support response time?"
6. "Problem yaşadınız mı, nasıl çözüldü?"
7. "Başka vendor ile değiştirir misiniz?"
8. "Score verirseniz kaç verirsiniz?"

Result: 8/10 reference → Good to proceed
```

```markdown
# TOTAL COST CALCULATION
Vendor A: $50K one-time + $10K/year
Vendor B: $15K one-time + $20K/year

3-year TCO:
Vendor A: $50K + $10K×3 = $80K
Vendor B: $15K + $20K×3 = $75K

Hidden costs:
- Implementation: A=$5K, B=$15K
- Training: A=$2K, B=$5K
- Integration: A=$10K, B=$5K

Final TCO: A=$97K, B=$100K
Decision: Vendor A (better long-term)
```

---

## Quick Reference

| RFI vs RFP | RFI | RFP |
|------------|-----|-----|
| Amaç | Keşif, filtreleme | Detaylı teklif |
| Sorular | Genel | Spesifik |
| Detay | Sınırlı | Kapsamlı |
| Karşılaştırma | Nitel | Nicel |
| Süre | 1-2 hafta | 4-8 hafta |
| Kullanım | Yeni category | Bilinen gereksinim |

| Scoring Scale | Açıklama | Puan |
|---------------|----------|------|
| Poor | Gereksinimleri karşılamıyor | 1 |
| Fair | Kısmen karşılıyor | 2 |
| Good | Temel karşılıyor | 3 |
| Very Good | Beklentileri aşıyor | 4 |
| Excellent | Fazlasıyla aşıyor | 5 |

| Evaluation Weight | Kategori | Örnek |
|-------------------|----------|-------|
| High (20-30%) | Fiyat, teknik yetenek | Software |
| Medium (10-20%) | Destek, güvenlik | SaaS |
| Low (5-15%) | Referans, uyum | Hardware |

| Contract Key Points | Zorunlu | Notlar |
|---------------------|---------|--------|
| SLA | ✅ | Uptime, response time |
| Termination | ✅ | Notice period, costs |
| Data ownership | ✅ | Exit'te veri iadesi |
| Price cap | ⚠️ | Yıllık max artış |
| Liability cap | ⚠️ | Max 2x annual value |

| Risk Assessment | Method | Frequency |
|-----------------|--------|-----------|
| Financial | Credit check, reports | Annual |
| Operational | Site visits, audits | Bi-annual |
| Compliance | Certification review | Annual |
| Security | Penetration testing | Annual |
