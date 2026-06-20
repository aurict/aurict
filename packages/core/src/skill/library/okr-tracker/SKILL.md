---
name: okr-tracker
description: "OKR takip sistemi: Objective ve Key Result ilerleme, check-in formatları, quarter planning ve hedef ölçümü."
triggers:
  keywords: ["okr", "objective", "key result", "quarter planning", "hedef takip", "performans"]
  contexts: ["quarterly planning", "team OKR", "company OKR", "personal OKR", "check-in"]
auto_load_when: "Kullanıcı OKR sistemi kurma, takip etme veya quarter planlama istediğinde"
agent: content-ops
tools: ["Read", "Write", "Bash", "Grep", "Glob"]
---

# OKR Tracker — OKR Uzmanı

**Odak Alanı:** Objectives and Key Results (OKR) sistemini kurma, ilerlemeyi takip etme, check-in yapma ve quarter planlama.

---

## Pattern Bölümleri

### 1. OKR Yapısı ve Hiyerarşi

```
OKR Hiyerarşisi
├── Company OKR
│   ├── Objective: Şirketin stratejik yönü
│   └── Key Results: Üst düzey metrikler
│       └── 3-5 adet
├── Department/Team OKR
│   ├── Objective: Departman hedefi
│   └── Key Results: Takım metrikleri
│       └── 3-5 adet
├── Individual OKR
│   ├── Objective: Kişisel gelişim/katkı
│   └── Key Results: Bireysel metrikler
│       └── 2-4 adet
└── Alignment (Hizalama)
    ├── Vertical: Company → Team → Individual
    └── Horizontal: Cross-team dependencies
```

### 2. Objective Yazım Patternleri

```
Objective Yazım Kuralları
├── Inspirational (İlham verici)
│   ├── "Ne" değil "Neden" odaklı
│   ├── Vizyonu yansıtmalı
│   └── Ambitious olmalı
├── Qualitative (Nitel)
│   ├── Ölçülebilir olmamalı (KR değil)
│   ├── Yönelim belirtmeli
│   └── Net ve anlaşılır
├── Time-bound (Zamana bağlı)
│   ├── Quarter'a uygun
│   ├── Achievable ama challenging
│   └── Focus sağlamalı
└── Örnek Format
    ├── ❌ "API geliştirmek"
    ├── ✅ "Müşteri deneyimini dönüştürmek"
    └── ✅ "Pazar liderliğini güçlendirmek"
```

### 3. Key Result Yazım Türleri

```
Key Result Türleri
├── Output-Based (Çıktı)
│   ├── Ne üretilecek?
│   ├── "Build X feature"
│   ├── "Launch Y product"
│   └── Ölçü: Bitirme/başlatma
├── Outcome-Based (Sonuç)
│   ├── Ne değişecek?
│   ├── "Increase conversion by 20%"
│   ├── "Reduce churn to 5%"
│   └── Ölçü: Metrik değişimi
├── Metric-Based (Metrik)
│   ├── Hangi sayıya ulaşılacak?
│   ├── "Achieve 100k MAU"
│   ├── "Reach $1M ARR"
│   └── Ölçü: Hard number
├── Milestone-Based (Kilometre Taşı)
│   ├── Hangi noktaya varılacak?
│   ├── "Complete beta with 50 users"
│   ├── "Sign 5 enterprise deals"
│   └── Ölçü: Binary completion
└── Hybrid (Karma)
    ├── Milestone + Metric
    ├── "Launch in March (milestone) 
    │    with 10k signups (metric)"
    └── Ölçü: Her ikisi
```

### 4. Check-in Süreci

```
Check-in Döngüsü
├── Weekly Check-in
│   ├── Progress update (% ilerleme)
│   ├── Confidence level (1-10)
│   ├── Blocker'lar
│   └── Next week plan
├── Bi-weekly Review
│   ├── KR bazında ilerleme
│   ├── Trend analizi
│   ├── Risk değerlendirme
│   └── Support ihtiyacı
├── Monthly Deep-dive
│   ├── Full OKR review
│   ├── Initiative health
│   ├── Resource check
│   └── Course correction
├── Quarterly Retrospective
│   ├── Achievement summary
│   ├── Lessons learned
│   ├── Next quarter prep
│   └── Celebration
└── Scoring
    ├── 0.0-0.3: Challenging but missed
    ├── 0.4-0.6: Made good progress
    ├── 0.7-1.0: Achieved
    └── Grade: Average of KRs
```

### 5. Quarter Planning Akışı

```
Quarter Planning Cycle
├── Phase 1: Analysis (1-2 hafta)
│   ├── Previous quarter results
│   ├── Company strategy update
│   ├── Market/context changes
│   └── Team capacity assessment
├── Phase 2: Drafting (1 hafta)
│   ├── Draft Objectives
│   ├── Draft Key Results
│   ├── Initial alignment check
│   └── Peer feedback
├── Phase 3: Alignment (1 hafta)
│   ├── Vertical alignment review
│   ├── Horizontal dependencies
│   ├── Resource confirmation
│   └── Final approval
├── Phase 4: Launch (1 gün)
│   ├── Company/team communication
│   ├── Tool setup
│   ├── Check-in cadence set
│   └── Kick-off meeting
└── Phase 5: Execution (Quarter boyunca)
    ├── Regular check-ins
    ├── Mid-quarter adjustment
    └── End-quarter review
```

---

## Key Patterns

| Pattern | Açıklama | Uygulama |
|---------|----------|----------|
| **3-5 Rule** | Her Objective için 3-5 Key Result | Odak koruma |
| **Ambitious 70%** | %70 başarı hedefi | Stretch goals |
| **Bottom-up Input** | Ekip katılımı ile oluşturma | Ownership |
| **Weekly Cadence** | Haftalık check-in döngüsü | Momentum |
| **Confidence Tracking** | Güven seviyesi takibi | Early warning |
| **0-1 Grading** | 0.0-1.0 arası puanlama | Objective ölçümü |
| **Cascade Alignment** | Üstten aşağıya hizalama | Strategy execution |

---

## Anti-Patterns

### ❌ Yanlış Uygulamalar

```markdown
# TASK-LIKE OBJECTIVE
Objective: "Backend ekibini yönetmek"

Problem: Bu bir task, hedef değil
- Nitel değil, yönetim işi
- İlham vermiyor
- Ölçülemez

✅ Doğru: "Backend sistem güvenilirliğini %99.9'a çıkarmak"
```

```markdown
# TOO MANY KRs
Objective: "Mükemmel ürün deneyimi"
Key Results:
1. NPS'i 50'ye çıkarmak
2. Response time'ı 200ms'ye düşürmek
3. Load time'ı 1sn'nin altına indirmek
4. Error rate'i %1'in altına düşürmek
5. Mobile conversion'ı %15 artırmak
6. Support satisfaction'ı %90'a çıkarmak

Problem: 6 KR = dikkat dağılımı, öncelik belirsiz
✅ Doğru: Max 5, ideal 3-4
```

```markdown
# OUTPUT ONLY KR
KR: "Yeni dashboard geliştirmek"

Problem: Sadece output, outcome yok
- Ne elde edilecek belli değil
- Başarı nasıl ölçülecek?
- "Geliştirmek" = bitiş, etki yok

✅ Doğru: "Yeni dashboard ile 
          user engagement'ı %30 artırmak"
```

```markdown
# NO CHECK-INS
OKR oluşturuldu, quarter sonuna kadar bakılmadı
- Progress bilinmiyor
- Riskler tespit edilmedi
- Adjustments yapılmadı

Result: Quarter sonu sürprizler (olumlu/olumsuz)
```

```markdown
# SANCTION (CEZA) FEAR
OKR = Performance review ile bağlantılı
- Başarısız = kötü performans = ceza
- Risk alınmaz
- Conservatively hedef koyulur
- Stretch yok, sadece "sure thing"

✅ OKR ayrı, perf review ayrı olmalı
```

### ✅ Doğru Uygulamalar

```markdown
# QUALITY OBJECTIVE
Objective: "Müşterilerin vazgeçilmez 
           iş ortağı olmak"

Key Results:
1. NPS score'u 60'tan 75'e çıkarmak (outcome)
2. Q3'te 3 enterprise deal kapatmak (metric)
3. Customer health score'u %80'in üstüne 
   çıkarmak (outcome)
4. Referral rate'i %25 artırmak (metric)

Toplam: 4 KR, hem outcome hem metric
```

```markdown
# CONFIDENCE SCORING
Week 2 Check-in:
- KR1: %30 ilerleme, confidence: 8/10 🟢
- KR2: %20 ilerleme, confidence: 5/10 🟡
  → Risk: Technical blocker
  → Action: Tech lead ile görüşme
- KR3: %50 ilerleme, confidence: 9/10 🟢

Tracking: Her hafta confidence ile birlikte
```

```markdown
# QUARTERLY GRADING
Q2 Results:
- Objective 1: 0.7 (70%) 
  - KR1: 0.8 ✓
  - KR2: 0.6 ✓
  - KR3: 0.7 ✓
- Objective 2: 0.5 (50%)
  - KR1: 0.4 
  - KR2: 0.6 ✓
- Overall: 0.6 (60%) → "Good progress"

Lessons: Obj2 için daha fazla 
         resource gerekirdi
```

---

## Quick Reference

| OKR Bileşeni | Kurallar | Örnek |
|--------------|----------|-------|
| Objective | İlham verici, nitel, zamanlı | "Pazar liderliğini kazanmak" |
| Key Result | Ölçülebilir, zamanlı, bağımsız | "ARR'yi $2M'ye çıkarmak" |
| İnsani | Maks 5 OKR/kişi | 3 Obj, 3-4 KR/Obj |
| Zaman | Quarter (3 ay) | Q1 2024 |

| Check-in Türü | Sıklık | İçerik | Süre |
|---------------|--------|--------|------|
| Quick Update | Günlük | Progress + blockers | 5 dk |
| Weekly | Haftalık | Full KR update + confidence | 15 dk |
| Bi-weekly | 2 haftada | Deep-dive + support | 30 dk |
| Monthly | Aylık | Full review + course correct | 1 saat |
| Quarterly | 3 ayda | Retrospective + next prep | Yarım gün |

| Confidence Level | Ne Anlama Gelir | Action |
|-----------------|----------------|--------|
| 9-10/10 | Path to success | Continue, celebrate |
| 7-8/10 | Likely to achieve | Monitor |
| 5-6/10 | At risk | Get support |
| 3-4/10 | Likely to miss | Pivot or adjust |
| 1-2/10 | Will miss | Re-evaluate |

| Grade | Puan Aralığı | Ne Anlama Gelir | Next Action |
|-------|--------------|----------------|-------------|
| Exceptional | 0.9-1.0 | Super achieved | Stretch more |
| Exceeded | 0.7-0.89 | Good progress | Maintain |
| On Track | 0.5-0.69 | Some progress | Adjust |
| At Risk | 0.3-0.49 | Struggling | Major pivot |
| Off Track | 0.0-0.29 | Far behind | Re-assess |

| Alignment Türü | Tanım | Örnek |
|---------------|-------|-------|
| Vertical | Üst-alttan aşağıya | Company → Team → Individual |
| Horizontal | Ekipler arası | Engineering ↔ Product ↔ Sales |
| Cross-functional | Çapraz fonksiyonel | Support + Product → Customer Success |
