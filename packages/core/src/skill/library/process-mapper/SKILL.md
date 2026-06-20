---
name: process-mapper
description: "Süreç haritalama: BPMN standartları, RACI matrisi, gap analizi ve süreç optimizasyonu."
triggers:
  keywords: ["process mapper", "süreç haritası", "BPMN", "RACI", "sop", "akış şeması"]
  contexts: ["process design", "workflow optimization", "procedure documentation", "gap analysis"]
auto_load_when: "Kullanıcı süreç haritalama, SOP oluşturma veya RACI matrisi istediğinde"
agent: content-ops
tools: ["Read", "Write", "Bash", "Grep", "Glob"]
---

# Process Mapper — Süreç Haritalama Uzmanı

**Odak Alanı:** İş süreçlerini haritalama, BPMN standartlarına uygun akış şemaları oluşturma, RACI matrisi hazırlama ve gap analizi yapma.

---

## Pattern Bölümleri

### 1. BPMN Temel Elementleri

```
BPMN 2.0 Element Kategorileri
├── Flow Objects (Akış Nesneleri)
│   ├── Events (Olaylar)
│   │   ├── Start (Başlangıç) → ○
│   │   ├── Intermediate (Ara) → ◐
│   │   └── End (Bitiş) → ●
│   ├── Activities (Faaliyetler)
│   │   ├── Task (Tek görev) → □
│   │   ├── Sub-process (Alt süreç) → ━
│   │   └── Transaction (İşlem) → ╪
│   └── Gateways (Kapılar)
│       ├── Exclusive (XOR) → ✕
│       ├── Parallel (AND) → +
│       ├── Inclusive (OR) → O
│       └── Complex (▷)
├── Connecting Objects (Bağlayıcılar)
│   ├── Sequence Flow (Sıra Akışı) → ──→
│   ├── Message Flow (Mesaj Akışı) → - - ->
│   └── Association (İlişki) → ──
├── Swimlanes (Yüzme Şeritleri)
│   ├── Pool (Havuz)
│   ├── Lane (Şerit)
│   └── Participant (Katılımcı)
└── Artifacts (Yapıtlar)
    ├── Data Object (Veri Nesnesi)
    ├── Data Store (Veri Deposu)
    └── Annotation (Açıklama)
```

### 2. Süreç Düzeyleri

```
Süreç Hiyerarşisi
├── Level 1: Process Architecture
│   ├── End-to-end süreçler
│   ├── Value chain gösterimi
│   └── 5-10 ana süreç
│       └── Örnek: Order-to-Cash
├── Level 2: Process Flow
│   ├── Ana alt süreçler
│   ├── Swimlane'lar
│   └── 15-30 görev
│       └── Örnek: Order Processing
├── Level 3: Activity Diagram
│   ├── Detaylı aktiviteler
│   ├── Decision points
│   └── 30-100 adım
│       └── Örnek: Order Validation
└── Level 4: Work Instructions
    ├── Step-by-step talimatlar
    ├── Screenshots/videolar
    └── Checklists
        └── Örnek: Order Entry SOP
```

### 3. RACI Matrisi Yapısı

```
RACI Tanımları
├── R = Responsible (Sorumlu)
│   ├── İşi yapan
│   ├── Eksik/sonuçtan sorumlu
│   └── Birden fazla olabilir
├── A = Accountable (Sorumlu Yetkili)
│   ├── Son karar yetkisi
│   ├── Sadece BİR tane olmalı
│   └── Her satırda zorunlu
├── C = Consulted (Danışılan)
│   ├── Bilgi/donanim alınır
│   ├── Two-way communication
│   └── Giriş sağlayan
├── I = Informed (Bilgilendirilen)
│   ├── Sonuçtan haberdar
│   ├── One-way notification
│   └── Değişiklikten etkilenen
└── Boş = Not Involved
    ├── Süreçte rolü yok
    └── Gerek yok
```

### 4. Gap Analizi Framework

```
Gap Analiz Süreci
├── Phase 1: Current State (Mevcut Durum)
│   ├── Süreç haritalama
│   ├── Mevcut KPI'lar
│   ├── Pain points
│   └── Benchmark'lar
├── Phase 2: Future State (Hedef Durum)
│   ├── Target süreç
│   ├── Hedef KPI'lar
│   ├── Best practice referans
│   └── Strategic alignment
├── Phase 3: Gap Identification
│   ├── Process gaps
│   ├── Technology gaps
│   ├── Skill gaps
│   └── Policy gaps
├── Phase 4: Gap Prioritization
│   ├── Impact analysis
│   ├── Effort estimation
│   ├── Quick wins vs long-term
│   └── Dependencies
└── Phase 5: Action Planning
    ├── Quick wins (0-3 ay)
    ├── Medium-term (3-6 ay)
    └── Long-term (6-12 ay)
```

### 5. Süreç Dokumentasyon Şablonu

```
SOP (Standard Operating Procedure) Formatı
├── Header
│   ├── Document ID
│   ├── Version
│   ├── Owner
│   └── Last Updated
├── 1. Amaç (Purpose)
│   ├── Why this process exists
│   └── Business objective
├── 2. Kapsam (Scope)
│   ├── What it covers
│   └── Exclusions
├── 3. Tanımlar (Definitions)
│   ├── Key terms
│   └── Acronyms
├── 4. Roller (Roles)
│   ├── Stakeholders
│   └── Responsibilities
├── 5. Adımlar (Procedure)
│   ├── Step-by-step instructions
│   ├── Decision points
│   └── Exceptions
├── 6. Akış Şeması (Flowchart)
│   ├── Visual representation
│   └── Swimlane version
├── 7. KPI'lar
│   ├── Metrics to track
│   └── Target values
├── 8. Exceptions
│   ├── What can go wrong
│   └── How to handle
├── 9. Referanslar (References)
│   ├── Related documents
│   └── External links
└── 10. Revision History
    ├── Version history
    └── Change log
```

---

## Key Patterns

| Pattern | Açıklama | Uygulama |
|---------|----------|----------|
| **Top-Down Decomposition** | Üst seviyeden detaya inme | Level 1 → 4 |
| **Swimlane by Role** | Her rol için ayrı şerit | RACI alignment |
| **Standard Symbols** | BPMN standartlarına uygunluk | Resmi gösterim |
| **Decision Diamond** | Karar noktalarını net göster | Her branching'de |
| **Exception Handling** | Hata/yönlendirme senaryolarını ekle | Her süreçte |
| **Start/End Events Clear** | Başlangıç ve bitiş net | Process边界 |
| **One-way Arrows** | Akış yönü tek yönlü | Karışıklık önleme |

---

## Anti-Patterns

### ❌ Yanlış Uygulamalar

```markdown
# SPAGHETTI DIAGRAM
Tüm süreçler tek diyagramda
- 200+ aktivite
- Crossed lines everywhere
- Okunamaz, kullanılamaz
- Kimse bakmaz

✅ Solution: Her süreç ayrı diagram, 
   gereksiz yere detaylandırma
```

```markdown
# RACI WITHOUT ACCOUNTABLE
Süreç: Sipariş Onayı
| Aktivite         | Ahmet | Ayşe | Mehmet | Burak |
|------------------|-------|------|--------|-------|
| Sipariş kontrolü | C     | R    | I      |       |
| Onay             |       | R    | C      | I      |

Problem: Her satırda A (Accountable) yok
- Kim son karar verecek belli değil
- Karar çıkmazsa ne olacak?

✅ Her satırda bir A olmalı
```

```markdown
# DECISION WITHOUT OUTPUT
Gateway: "Yeterli stok var mı?"
Evet ──────→ [Devam]
Hayır ─────→ [??]

Problem: Hayır durumunda ne olacak?
- Süreç kırılıyor
- Next step belirsiz

✅ Her branch için sonraki adım yazılmalı
```

```markdown
# PROCESS VS PROCEDURE CONFUSION
Süreç haritasında:
"Excel'de rapor hazırla ve 
 müşteriye email gönder"

Problem: Bu procedure, süreç değil
- Çok detaylı
- Başka bir sürecin parçası
- Tek başına anlamsız

✅ Ayrı "Work Instructions" dokümanında
```

```markdown
# NO EXCEPTION PATH
Süreç: Fatura Ödeme
Adım 1: Fatura al
Adım 2: Onayla
Adım 3: Öde

Problem: Ya onay reddedilirse?
- Reject senaryosu yok
- Süreç yarım kalıyor

✅ Her "no" path için alternatif akış ekle
```

### ✅ Doğru Uygulamalar

```markdown
# CLEAN BPMN
Sipariş Yönetimi Süreci
├── Pool: Müşteri
├── Pool: Şirket (Lane: Sales, Finance, Ops)
├── Start: Sipariş alındı
├── Activity: Sipariş doğrula (Sales)
├── Decision: Stok kontrol (Ops)
│   ├── Yes → Devam
│   └── No → Activity: Tedarik (Ops)
├── Activity: Fatura kes (Finance)
├── Decision: Ödeme onayı
│   ├── Yes → Activity: Kargo
│   └── No → End: Red
└── End: Tamamlandı

Her aktivite: 1 sorumlu (R), 1 A var
```

```markdown
# COMPLETE RACI MATRİSİ
Proje Onay Süreci
| Aktivite             | Proje M. | Tech Lead | Sponsor | PMO  |
|---------------------|----------|-----------|---------|------|
| İhtiyaç belirleme   | A        | C         | I       | I    |
| Teklif hazırlama    | R        | R         | C       | I    |
| Teknik evalüasyon    | C        | A         | I       | R    |
| Business case       | R        | C         | A       | I    |
| Onay                | I        | I         | A       | C    |

Her satırda bir A, en az bir R ✓
```

```markdown
# GAP ANALYSIS ÖRNEĞİ
Current State: 5 gün teslimat
Future State: 2 gün teslimat

Gap 1: Process (3 puan)
- Mevcut: Manual order entry
- Hedef: Automated order

Gap 2: Technology (5 puan)
- Mevcut: Excel tracking
- Hedef: WMS system

Gap 3: Skill (2 puan)
- Mevcut: Basic training
- Hedef: Advanced certification

Priority: Gap 1 > Gap 2 > Gap 3
(Quick win'den başla)
```

---

## Quick Reference

| BPMN Symbol | Anlam | Kullanım Alanı |
|-------------|-------|---------------|
| ○ | Start Event | Süreç başlangıcı |
| ● | End Event | Süreç bitişi |
| ◐ | Intermediate Event | Ara tetikleyici |
| □ | Task | Tek görev |
| ╪ | Transaction | İşlem grubu |
| ✕ | Exclusive Gateway | XOR (ya/ya da) |
| + | Parallel Gateway | AND (her ikisi de) |
| O | Inclusive Gateway | OR (bir veya daha fazla) |
| ──→ | Sequence Flow | Sıralı akış |
| - - → | Message Flow | Mesaj/katılımcılar arası |

| RACI Kullanım | Kural | Örnek |
|---------------|-------|-------|
| R (Responsible) | İşi yapan | Developer kod yazar |
| A (Accountable) | Son karar veren | Manager onaylar |
| C (Consulted) | Danışılır | Lawyer görüş verir |
| I (Informed) | Bilgilendirilir | Sponsor haberdar |
| Her satır | En az bir A | "Accountable zorunlu" |
| Her aktivite | En az bir R | "İşi yapacak biri olmalı" |

| Gap Türü | Tanım | Analiz Yöntemi |
|----------|-------|---------------|
| Process Gap | Süreç eksik/yetersiz | Process mining |
| Technology Gap | Araç yetersiz | Vendor assessment |
| Skill Gap | Yetkinlik eksik | Capability assessment |
| Policy Gap | Kural/kılavuz yok | Policy gap analysis |
| Data Gap | Veri yok/eksik | Data quality audit |

| Süreç Belgeleme | Detay Seviyesi | Kullanım |
|-----------------|----------------|----------|
| Level 1 | 5-10 süreç | Executive overview |
| Level 2 | 15-30 aktivite | Team understanding |
| Level 3 | 30-100 adım | Detailed process |
| Level 4 | Step-by-step | Training/onboarding |
