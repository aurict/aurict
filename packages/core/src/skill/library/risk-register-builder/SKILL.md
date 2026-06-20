---
name: risk-register-builder
description: "Risk kayıt sistemi: Risk skorlama, mitigation planları, risk dashboard ve proaktif risk yönetimi."
triggers:
  keywords: ["risk register", "risk matrix", "risk assessment", "mitigation plan", "risk yönetimi"]
  contexts: ["project risk", "operational risk", "strategic risk", "compliance risk"]
auto_load_when: "Kullanıcı risk kayıt sistemi oluşturma, risk değerlendirme veya mitigation planlama istediğinde"
agent: content-ops
tools: ["Read", "Write", "Bash", "Grep", "Glob"]
---

# Risk Register Builder — Risk Yönetim Uzmanı

**Odak Alanı:** Proje ve operasyonel riskleri tanımlama, skorlama, mitigation planları oluşturma ve risk dashboard yönetimi.

---

## Pattern Bölümleri

### 1. Risk Register Yapısı

```
Risk Register Bileşenleri
├── Risk ID ( Benzersiz tanımlayıcı )
│   ├── Format: R-001, R-002
│   ├── Sequential numbering
│   └── Category prefix (TECH, OPS, FIN)
├── Risk Title ( Kısa açıklama )
├── Description ( Detaylı açıklama )
│   ├── What: Risk nedir?
│   ├── Why: Neden oluşur?
│   └── Impact: Etkisi ne?
├── Category ( Tür )
│   ├── Technical
│   ├── Operational
│   ├── Financial
│   ├── Strategic
│   ├── Compliance
│   └── External
├── Probability ( Olasılık )
│   └── 1-5 veya % olarak
├── Impact ( Etki )
│   └── 1-5 veya $ olarak
├── Risk Score ( Skor )
│   └── Probability × Impact
├── Risk Level ( Seviye )
│   ├── Low / Medium / High / Critical
│   └── Heat map göre
├── Root Cause ( Kök neden )
├── Triggers ( Tetikleyiciler )
├── Mitigation Plan ( Azaltma planı )
├── Contingency Plan ( Acil durum planı )
├── Owner ( Sorumlu )
├── Due Date ( Termin )
├── Status ( Durum )
│   ├── Open / In Progress / Mitigated / Closed
│   └── Last Update
└── Related Risks ( İlişkili riskler )
```

### 2. Risk Skorlama Matrisi

```
5x5 Risk Matrix
       | Impact      |
       | 1   2   3   4   5 |
-------+-------------------|
Prob-1 | 1   2   3   4   5  |
Prob-2 | 2   4   6   8  10 |
Prob-3 | 3   6   9  12  15 |
Prob-4 | 4   8  12  16  20 |
Prob-5 | 5  10  15  20  25 |

Risk Seviyeleri:
- Critical (20-25): Acil action
- High (12-19): Öncelikli
- Medium (5-11): Monitor et
- Low (1-4): Kabul edilebilir

Alternatif: 3x3 Matrix
       | Low | Med | High |
-------|-----|-----|------|
High   | 3   | 6   | 9    |
Med    | 2   | 4   | 6    |
Low    | 1   | 2   | 3    |
```

### 3. Risk Kategorileri ve Örnekler

```
Risk Kategorileri ve Örnekler
├── Technical Risks
│   ├── Technology obsolescence
│   ├── Integration failures
│   ├── Performance issues
│   ├── Security vulnerabilities
│   └── Data quality problems
├── Operational Risks
│   ├── Process failures
│   ├── System downtime
│   ├── Staff turnover
│   ├── Supply chain disruption
│   └── Equipment failure
├── Financial Risks
│   ├── Budget overrun
│   ├── Currency fluctuation
│   ├── Cash flow problems
│   ├── Credit risk
│   └── Cost escalation
├── Strategic Risks
│   ├── Market changes
│   ├── Competitive threats
│   ├── Regulatory changes
│   ├── Reputational damage
│   └── Partnership failure
├── Compliance Risks
│   ├── Legal violations
│   ├── Regulatory penalties
│   ├── Data privacy breaches
│   ├── Contract breaches
│   └── Audit findings
└── External Risks
    ├── Natural disasters
    ├── Economic downturn
    ├── Political instability
    ├── Pandemics
    └── Cyber attacks
```

### 4. Mitigation Plan Template

```
Mitigation Plan Yapısı
├── Primary Mitigation (Birincil Önlem)
│   ├── Action: Ne yapılacak?
│   ├── Owner: Kim sorumlu?
│   ├── Due Date: Ne zaman?
│   ├── Cost: Maliyet?
│   └── Effectiveness: Ne kadar etkili?
├── Trigger (Tetikleyici)
│   ├── Warning signs
│   ├── Early indicators
│   └── Monitoring metrics
├── Contingency Plan (Acil Durum)
│   ├── Trigger: Ne zaman aktif?
│   ├── Action: Ne yapılacak?
│   ├── Resources: Hangi kaynaklar?
│   └── Communication plan
├── Progress Tracking
│   ├── Status
│   ├── Completion %
│   ├── Issues
│   └── Next steps
└── Success Criteria
    ├── What does success look like?
    ├── How will we measure?
    └── Validation method
```

### 5. Risk Response Strategies

```
Risk Response Options
├── Avoid (Önleme)
│   ├── Change the plan to eliminate risk
│   ├── "Proje yerine farklı yaklaşım"
│   └── Applicable: High impact, high probability
├── Mitigate (Azaltma)
│   ├── Reduce probability or impact
│   ├── "Backup sistemi kur"
│   └── Applicable: Most risks
├── Transfer (Transfer)
│   ├── Shift risk to another party
│   ├── "Sigorta, outsourcing"
│   └── Applicable: High cost of mitigation
├── Accept (Kabul)
│   ├── Acknowledge and prepare response
│   ├── "Impact çok düşük, kabul et"
│   └── Applicable: Low impact, low probability
├── Exploit (Fırsata çevirme)
│   ├── If positive risk (opportunity)
│   ├── "Risk değil fırsat olarak değerlendir"
│   └── Applicable: Upside risks
└── Enhance (Güçlendirme)
│   ├── Increase probability of positive
│   ├── "Fırsatı maximize et"
│   └── Applicable: Opportunities
```

---

## Key Patterns

| Pattern | Açıklama | Uygulama |
|---------|----------|----------|
| **Probability × Impact** | Risk skorlama standardı | Her risk için hesapla |
| **Owner Assignment** | Her riskin sahibi olmalı | RACI mantığı |
| **Root Cause Analysis** | Kök nedeni bulma | 5 Whys, Fishbone |
| **Trigger Monitoring** | Erken uyarı sistemi | KPI takibi |
| **Escalation Path** | Risk seviyesine göre yükseltme | Seviye bazlı action |
| **Regular Review** | Periyodik risk gözden geçirme | Haftalık/aylık |
| **Risk Appetite** | Kurumsal risk iştahı | Threshold belirleme |

---

## Anti-Patterns

### ❌ Yanlış Uygulamalar

```markdown
# RISK WITHOUT OWNER
Risk: "Teknoloji deprecate olabilir"
- Probability: 4/5
- Impact: 5/5
- Score: 20 (Critical)
- Owner: ???

Problem: Kim takip edecek, kimin action 
alması gerekiyor belirsiz
→ Kimse sorumluluk almaz

✅ Her risk için mutlaka owner atanmalı
```

```markdown
# MITIGATION WITHOUT TRIGGER
Mitigation Plan:
"Yedek sistem kurulacak"

Problem:
- Ne zaman başlanacak?
- Hangi koşulda aktif olacak?
- How do we know it's working?

✅ Trigger'lar ve milestone'lar belirle
```

```markdown
# STATIC RISK REGISTER
Q1'de oluşturulan risk register
Q3'te hiç güncellenmedi
- Status değişmedi
- New risks eklenmedi
- Mitigation progress yok

Problem: Register artık gerçeği yansıtmıyor
→ Sürekli güncelleme gerekli
```

```markdown
# ACCEPTED RISK NO CONTINGENCY
Risk: "Tedarikçi gecikmeli teslimat yapabilir"
- Decision: Accept (düşük etki)
- Mitigation: None

Problem: Risk gerçekleşirse ne yapılacak?
- Plan yok
- Acil durum hazır değil

✅ Accept kararı bile olsa 
   contingency plan gerekli
```

```markdown
# RISK DRIVEN BY LAST fire
Yeni risk sadece son yaşanan problemden
- Proaktif değil reaktif
- Systematic değil
- Her şeyi yakalayamıyor

✅ Structured risk identification 
   (brainstorm, checklist, expert)
```

### ✅ Doğru Uygulamalar

```markdown
# COMPLETE RISK ENTRY
Risk ID: R-2024-015
Risk: K8s migration gecikmesi

Description:
Orion ekibinin 3 senior developer'ın 
ayrılması nedeniyle migration süresi
uzayabilir. Bu, Q4 hedeflerini 
etkileyebilir.

Category: Technical
Probability: 4/5
Impact: 4/5
Risk Score: 16 (High)

Root Cause: Staff turnover

Triggers:
- 2 hafta içinde replacement yok
- Velocity %30 düşerse

Mitigation:
- Contractor hiring (Owner: CTO, Due: 15 Feb)
- Sprint scope reduction (Owner: PM, Due: 20 Feb)
- External consultant (Owner: Eng Lead, Due: 10 Feb)

Contingency:
- Phase 1 gecikmeyi kabul et
- Go-live'ı 1 ay kaydır
- Müşteriye önceden bilgi ver

Status: In Progress
Last Update: 1 Feb 2024
```

```markdown
# RISK DASHBOARD STRUCTUREUre
| Risk ID | Title | Category | Score | Status | Owner | Due |
|---------|-------|----------|-------|--------|-------|-----|
| R-001   | API  | Technical| 20 🔴 | Open   | Ahmet | 15 Feb|
| R-002   | Bütçe| Financial| 12 🟠 | Mitigat| Ayşe | 1 Mar |
| R-003   | GDPR | Complian | 16 🔴 | Open   | Mehmet| 20 Feb|
| R-004   | Staff| Operatio | 9 🟡  | Monitor| Burak | N/A |

Dashboard Update: Weekly
Review: Every Monday 10:00
Escalation: Score >15 → Weekly leadership
```

---

## Quick Reference

| Probability Seviyesi | Tanım | % Olasılık | Puan |
|---------------------|-------|------------|------|
| Rare | Nadir, beklenmiyor | <10% | 1 |
| Unlikely | Olasılık düşük | 10-30% | 2 |
| Possible | Olasılık var | 30-50% | 3 |
| Likely | Büyük olasılıkla | 50-70% | 4 |
| Almost Certain | Kesin | >70% | 5 |

| Impact Seviyesi | Tanım | Etki | Puan |
|-----------------|-------|------|------|
| Negligible | Önemsiz | <$1K | 1 |
| Minor | Küçük | $1K-$10K | 2 |
| Moderate | Orta | $10K-$100K | 3 |
| Major | Büyük | $100K-$1M | 4 |
| Catastrophic | Felaket | >$1M | 5 |

| Risk Score | Seviye | Action |
|------------|--------|--------|
| 1-4 | Low | Monitor, accept |
| 5-9 | Medium | Active mitigation |
| 10-16 | High | Priority mitigation |
| 17-25 | Critical | Immediate action |

| Response Strategy | Ne Zaman Uygun | Örnek |
|-------------------|----------------|-------|
| Avoid | Yüksek etki + yüksek olasılık | Proje iptali |
| Mitigate | Çoğu durum | Backup, plan B |
| Transfer | Yüksek maliyet + sigorta | Insurance, outsourcing |
| Accept | Düşük etki + düşük maliyet | Small risks |

| Risk Review Cadence | Risk Seviyesi | Sıklık |
|---------------------|---------------|--------|
| Critical | Her gün | Daily standup |
| High | Haftalık | Weekly review |
| Medium | İki haftada | Bi-weekly |
| Low | Aylık | Monthly |
