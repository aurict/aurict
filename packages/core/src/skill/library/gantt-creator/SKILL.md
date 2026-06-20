---
name: gantt-creator
description: "Gantt şeması oluşturma: Kritik yol hesaplama, kaynak atama, milestone tanımlama ve proje zamanlama."
triggers:
  keywords: ["gantt", "proje takvimi", "kritik yol", "milestone", "timeline", "şemapanı"]
  contexts: ["project planning", "delivery schedule", "resource allocation", "deadline management"]
auto_load_when: "Kullanıcı proje takvimi, Gantt şeması veya kritik yol analizi istediğinde"
agent: content-ops
tools: ["Read", "Write", "Bash", "Grep", "Glob"]
---

# Gantt Creator — Gantt Şeması Uzmanı

**Odak Alanı:** Proje zamanlamalarını Gantt şeması olarak görselleştirme, kritik yolu hesaplama, kaynakları atama ve milestone'ları tanımlama.

---

## Pattern Bölümleri

### 1. Gantt Şeması Temel Bileşenleri

```
Gantt Şeması Anatomisi
├── Zaman Ekseni
│   ├── Gün
│   ├── Hafta
│   ├── Ay
│   └── Çeyrek
├── Görev Yapısı (WBS)
│   ├── Ana görev (Phase)
│   ├── Alt görev (Task)
│   ├── Alt-alt görev (Sub-task)
│   └── Work package
├── Süre Tanımlama
│   ├── Başlangıç tarihi
│   ├── Bitiş tarihi
│   ├── Süre (duration)
│   └── Tamamlanma %
├── Bağımlılıklar
│   ├── Finish-to-Start (FS)
│   ├── Start-to-Start (SS)
│   ├── Finish-to-Finish (FF)
│   └── Start-to-Finish (SF)
└── Kaynak Atama
    ├── Kişi/ekip
    ├── Rol
    └── Capacity %
```

### 2. Kritik Yol Hesaplama Algorithmı

```
Kritik Yol Analizi
├── Adım 1: Forward Pass (İleri Geçiş)
│   ├── ES (Early Start) = max(EF tüm pred)
│   ├── EF (Early Finish) = ES + Duration
│   └── İlk görev için ES = 0
├── Adım 2: Backward Pass (Geri Geçiş)
│   ├── LF (Late Finish) = min(LS tüm succ)
│   ├── LS (Late Start) = LF - Duration
│   └── Son görev için LF = Project End
├── Adım 3: Float/Slack Hesaplama
│   ├── Total Float = LS - ES
│   └── Critical Path = Float = 0 olan görevler
├── Adım 4: Kritik Yolu Görselleştirme
│   ├── Kırmızı çizgi ile göster
│   ├── Risk analizi yap
│   └── Buffer ekle
└── Adım 5: Güncelleme
    ├── Progress ile yeniden hesapla
    └── Değişiklikleri raporla
```

### 3. Milestone Tanımlama Patterns

```
Milestone Türleri
├── Project Milestone
│   ├── Project Kickoff
│   ├── Design Complete
│   ├── Development Complete
│   ├── UAT Complete
│   └── Go-Live
├── Phase Milestone
│   ├── Phase 1 Complete
│   ├── Phase 2 Complete
│   └── ...
├── External Milestone
│   ├── Client approval
│   ├── Vendor delivery
│   └── Regulatory deadline
├── Dependency Milestone
│   ├── External dependency met
│   ├── Internal dependency met
│   └── Cross-team dependency met
└── Review Milestone
    ├── Code review complete
    ├── QA sign-off
    └── Stakeholder acceptance
```

### 4. Kaynak Atama Matrisi

```
Kaynak Matrisi
├── Kaynak Türleri
│   ├── İnsan kaynağı
│   ├── Ekipman
│   ├── Bütçe
│   └── Araç/yazılım
├── Atama Modelleri
│   ├── Dedicated (Tam zamanlı)
│   ├── Shared (Paylaşımlı)
│   ├── Partial (Yarı zamanlı)
│   └── On-demand (İsteğe bağlı)
├── Conflict Resolution
│   ├── Priority-based
│   ├── Time-slicing
│   ├── Resource leveling
│   └── Scope adjustment
└── Capacity Check
    ├── Overallocation (>100%)
    ├── Underallocation (<50%)
    └── Optimal range (70-90%)
```

### 5. Gantt Türleri

```
Gantt Şeması Çeşitleri
├── Manual Gantt
│   ├── Excel/Sheets template
│   └── Basit, esnek
├── Tool-Based Gantt
│   ├── MS Project
│   ├── Jira/GreenHopper
│   ├── Monday/Asana
│   └── Smartsheet
├── Enterprise Gantt
│   ├── Oracle Primavera
│   ├── SAP PS
│   └── PowerPlant
└── Custom/Interactive
    ├── Mermaid.js diagram
    ├── SVG/Web-based
    └── API-driven real-time
```

---

## Key Patterns

| Pattern | Açıklama | Uygulama |
|---------|----------|----------|
| **WBS (Work Breakdown Structure)** | Projeyi yönetilebilir parçalara bölme | Hiyerarşik görev yapısı |
| **Dependency Chaining** | Görevler arası bağımlılıkları tanımlama | Predecessor/Successor ilişkisi |
| **Critical Chain** | Kaynak kısıtlı kritik yol | Buffer yönetimi ile |
| **Resource Leveling** | Kaynak çakışmalarını çözme | Overallocation düzeltme |
| **Baseline Comparison** | Plan vs Gerçekleşen | Variance analizi |
| **Milestone Gates** | Kilit noktalarda kapı kontrolü | Review/approval noktaları |
| **Rolling Wave** | Yakın dönem detaylı, uzak dönem özet | Adaptive planning |

---

## Anti-Patterns

### ❌ Yanlış Uygulamalar

```markdown
# YETERSİZ BAĞIMLILIK
Görev A: "Backend geliştir" (5 gün)
Görev B: "Frontend geliştir" (10 gün)
Problem: B başlamadan A bitmeli, ama tanımlanmamış
Sonuç: Frontend bekler veya paralel çalışır (hata)
```

```markdown
# OVERALLOCATION
Ahmet'e atanan saatler:
- Proje A: 20 saat/hafta
- Proje B: 15 saat/hafta
- Proje C: 10 saat/hafta
Toplam: 45 saat/hafta (Capacity: 40 saat)
Sonuç: Burnout, gecikmeler, kalite düşüşü
```

```markdown
# MİLESTONESIZ PROJE
Sadece "Development phase" var
- Ne zaman başlayacak? Belirsiz
- Ne zaman bitecek? Belirsiz
- Kontrol noktaları? Yok
Sonuç: Proje kaybolur, kontrolsüz ilerler
```

```markdown
# STATİK PLAN
İlk hafta oluşturulan Gantt, 3 ay değişmedi
- Gerçek ilerleme yansımıyor
- Riskler güncellenmedi
- Kaynak değişiklikleri yok
Sonuç: Plan gerçekten kopuk, güvenilmez
```

### ✅ Doğru Uygulamalar

```markdown
# DOĞRU BAĞIMLILIK TANIMI
Görev A: Backend API Development
- Başlangıç: 15 Ocak
- Süre: 10 iş günü
- Bitiş: 28 Ocak

Görev B: Frontend Entegrasyon
- Predecessor: A (FS)
- Başlangıç: 29 Ocak (A bitince)
- Süre: 15 iş günı
- Bitiş: 18 Şubat

Milestone: API Complete - 28 Ocak
```

```markdown
# KAYNAK OPTİMİZASYONU
Ahmet (Frontend): 40 saat/hafta
- Sprint 1: 32 saat (80%) → optimal
- Buffer: 8 saat (acil durumlar için)

Düzenli check:
- Weekly resource review
- Allocation % ile takip
- Warning threshold: >85%
```

```markdown
# DETAYLI MİLESTONE MATRİSİ
| Milestone | Tarih | Sorumlu | Kriter | Status |
|-----------|-------|---------|--------|--------|
| Kickoff | 1 Şub | PM | Sign-off | 🟢 |
| Design Done | 15 Şub | Arch | Onay | 🟡 |
| Dev Complete | 15 Mar | Dev | Code freeze | 🔴 |
| UAT Done | 1 Nis | QA | %95 pass | ⏳ |
| Go-Live | 15 Nis | Ops | Traffic OK | ⏳ |
```

---

## Quick Reference

| Gantt Öğesi | Minimum Bilgi | Format |
|-------------|---------------|--------|
| Görev | Ad, süre, başlangıç | "Backend: 10 gün, 15 Ocak" |
| Bağımlılık | Type, predecessor | "FS - Görev A'dan sonra" |
| Kaynak | İsim, % allocation | "Ahmet: 80%" |
| Milestone | Ad, tarih, kriter | "Design Complete: 15 Şub" |
| Progress | %, durum | "45% - Devam ediyor" |

| Kritik Yol Hesaplama | Formül | Örnek |
|----------------------|--------|-------|
| Early Start (ES) | max(Predecessor EF) | ES = max(10, 15, 8) = 15 |
| Early Finish (EF) | ES + Duration | EF = 15 + 10 = 25 |
| Late Start (LS) | LF - Duration | LF = 25 → LS = 25 - 10 = 15 |
| Total Float | LS - ES | Float = 15 - 15 = 0 → Kritik |
| Slack | LF - EF | Slack = 25 - 25 = 0 |

| Kaynak Çakışma Çözümü | Ne Zaman Kullanılır | Etki |
|-----------------------|---------------------|------|
| Resource Leveling | Overallocation varsa | Süre uzar |
| Priority Allocation | Çakışan projelerde | Düşük öncelikli ertelenir |
| Time-Slicing | Paylaşımlı kaynak | Parallel tracking |
| Scope Adjust | Kritik kaynak yok | Deliverable azalır |

| Milestone Türü | Tetikleyici | Review Sıklığı |
|----------------|-------------|----------------|
| Project | Phase geçişi | Her milestone'da |
| External | Dış bağımlılık | Haftalık |
| Dependency | Başka ekip | Çift haftada bir |
| Gate | Approval noktası | Gerektiğinde |

| Gantt Tool Seçimi | Proje Büyüklüğü | Önerilen |
|-------------------|-----------------|----------|
| Küçük (<20 görev) | Excel, Sheets | Basit, hızlı |
| Orta (20-100 görev) | Monday, Asana | Cloud, işbirliği |
| Büyük (>100 görev) | MS Project, Jira | Enterprise |
| Enterprise | Primavera, SAP | Full-scale |
