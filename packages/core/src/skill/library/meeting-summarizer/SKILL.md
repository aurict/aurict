---
name: meeting-summarizer
description: "Toplantı özetleme: Transkriptlerden action item çıkarma, karar defteri oluşturma, takip mekanizmaları kurma."
triggers:
  keywords: ["toplantı özet", "action item", "karar defteri", "meeting summarizer", "meeting minutes", "toplantı tutanak"]
  contexts: ["team meeting", "project review", "standup", "one-on-one", "town hall"]
auto_load_when: "Kullanıcı toplantı özetleme, action item çıkarma veya takip mekanizması oluşturma görevi istediğinde"
agent: content-ops
tools: ["Read", "Write", "Bash", "Grep", "Glob"]
---

# Meeting Summarizer — Toplantı Özetleme Uzmanı

**Odak Alanı:** Toplantı transkriptlerinden ve notlarından anlamlı çıktılar üretme, action item'ları netleştirme, kararları belgeleme ve takip sistemi kurma.

---

## Pattern Bölümleri

### 1. Toplantı Türü Tanımlama

```
Türü Belirleme
├── Standup (Günlük kısa)
│   ├── Dün yapılan
│   ├── Bugün yapılacak
│   └── Blocker'lar
├── Weekly Review (Haftalık)
│   ├── Geçen hafta özet
│   ├── Bu hafta hedefler
│   └── Risk/issue'lar
├── Planning (Planlama)
│   ├── Scope tanımı
│   ├── Kaynak ihtiyacı
│   └── Timeline
├── Retrospective (İyileştirme)
│   ├── Ne iyi gitti
│   ├── Ne geliştirilmeli
│   └── Action item'lar
├── Brainstorming (Fikir üretme)
│   ├── Öneriler
│   ├── Evalüasyon
│   └── Sonraki adımlar
└── Decision Meeting (Karar)
    ├── Seçenekler
    ├── Karar gerekçesi
    └── Uygulama planı
```

### 2. Action Item Çıkarma Algorithmı

```
Action Item Çıkarma
├── Kim? (Sorumlu)
│   ├── İsim/rol belirleme
│   ├── Atama doğrulama
│   └── Tekrar atama kontrolü
├── Ne? (Görev)
│   ├── Net tanım
│   ├── Deliverable belirleme
│   └── Acceptance criteria
├── Ne Zaman? (Deadline)
│   ├── Mutlak tarih
│   ├── Relative (1 hafta içinde)
│   └── Milestone'a bağlı
├── Neden? (Bağlam)
│   ├── İş değeri
│   ├── Bağımlılıklar
│   └── Priorite
└── Doğrulama
    ├── SMART kontrolü
    ├── Çakışma kontrolü
    └── Kaynak kontrolü
```

### 3. Karar Defteri Yapısı

```
Karar Defteri
├── Karar Numarası (D-001)
├── Başlık
├── Tarih
├── Katılımcılar
├── Konu Özeti
│   ├── Problem/Tartışma
│   ├── Seçenekler
│   └── Karar Gerekçesi
├── Sonuç
├── Uygulama
│   ├── Sorumlu
│   ├── Timeline
│   └── Başarı Kriteri
├── Takip
│   ├── Review tarihi
│   └── Status
└── İlişkili Kararlar
```

### 4. Takip Mekanizması Türleri

```
Takip Sistemi
├── Reminder Sistemi
│   ├── 1 gün önce
│   ├── Deadline günü
│   └── Overdue uyarısı
├── Escalation Path
│   ├── 1. uyarı → Sorumlu
│   ├── 2. uyarı → Manager
│   └── 3. uyarı → Leadership
├── Status Check-in
│   ├── Daily standup
│   ├── Weekly review
│   └── Monthly checkpoint
└── Eskalasyon Kriteri
    ├── Deadline aşıldı
    ├── Scope değişti
    ├── Blocker oluştu
    └── Resource kaybı
```

---

## Key Patterns

| Pattern | Açıklama | Uygulama |
|---------|----------|----------|
| **3-Pass Reading** | 1. Genel okuma 2. Detaylı analiz 3. Çıktı üretme | Transkriptler için sistematik yaklaşım |
| **Voice-of-Customer** | Müşteri ifadelerini doğrudan alıntılama | Alıntı blockları ile zenginleştirme |
| **Decision Rationale Chain** | Kararın arkasındaki mantığı açıklama | "Because ... therefore ..." formatı |
| **Time-Boxed Action** | Action item'lara kesin zaman kutusu verme | Kesin tarih/saat ile tanımlama |
| **RACI Assignment** | Her action için net sorumluluk atama | R: Responsible, A: Accountable |
| **Dependency Mapping** | Action item'lar arası bağımlılıkları görselleştirme | DAG veya flowchart ile gösterim |
| **Status Traffic Light** | Kolor kodlu ilerleme takibi | 🟢 Tamamlandı, 🟡 Devam, 🔴 Blocker |

---

## Anti-Patterns

### ❌ Yanlış Uygulamalar

```markdown
# YETERSİZ ACTION ITEM
"Şirket için bir şeyler yapılacak"

- Kim? Belirsiz
- Ne? Belirsiz  
- Ne zaman? Belirsiz
- Neden? Belirsiz

Sonuç: Kimse yapmaz, kimse sormaz.
```

```markdown
# EKSİK KARAR DEFTERİ
"Şirket yeni CRM kullanacak"

- Karar gerekçesi: yok
- Seçenekler: değerlendirilmedi
- Kim karar verdi: belirsiz
- Uygulama planı: yok
- Review tarihi: yok
```

```markdown
# TAKİPSİZ TOPLANTI
"Süreç iyileştirilecek" denildi
3 ay sonra hiçbir ilerleme yok
- Kim takip edecek?
- Ne zaman kontrol edilecek?
- Kriter ne?
```

### ✅ Doğru Uygulamalar

```markdown
# TAM ACTION ITEM
"AHMET - Pazartesi saat 17:00'e kadar
Müşteri onboarding sürecinin
yeniden tasarımı için 2 sayfalık
requirement doc'unu Slack'te
paylaşır. Bu doküman,
müşteri memnuniyeti %15 
artırma hedefine doğrudan katkı sağlar."

- Kim: Ahmet (Frontend Lead)
- Ne: Requirement doc (2 sayfa)
- Ne Zaman: Pazartesi 17:00
- Neden: %15 artış hedefi
```

```markdown
# DETAYLI KARAR DEFTERİ
Karar No: D-2024-042
Tarih: 15 Ocak 2024
Konu: CRM Yazılımı Seçimi

Seçenekler:
1. Salesforce ($200/kullanıcı/ay)
2. HubSpot ($50/kullanıcı/ay)
3. Custom ($50K geliştirme + $20K/yıl bakım)

Karar: HubSpot
Gerekçe: En iyi fiyat-performans oranı,
mevcut entegrasyonlar, ekip yetkinliği

Uygulama:
- Sorumlu: IT Manager
- Başlangıç: 1 Şubat
- Go-live: 1 Mart
- Review: 1 Nisan
```

---

## Quick Reference

| Senaryo | Önerilen Format | Çıktı Türü |
|---------|----------------|------------|
| Günlük standup | 3 bölüm (dün/bugün/blocker) | Bullet list |
| Haftalık review | Progress + next + risks | Tablo + metin |
| Planning | Scope + timeline + resources | Markdown + Gantt |
| Retrospective | What went well / Improve / Action | 3-kolonlu tablo |
| Karar toplantısı | Seçenekler + karar + gerekçe | Karar defteri formatı |

| Action Item Elementi | Zorunlu? | Örnek |
|----------------------|-----------|-------|
| Sorumlu (Who) | ✅ | @Ahmet |
| Görev (What) | ✅ | "API dokümantasyonu yaz" |
| Deadline (When) | ✅ | "28 Ocak 2024, 17:00" |
| Bağlam (Why) | ⚠️ Önerilen | "Müşteri demosu için" |
| Kriter (How to measure) | ⚠️ Önerilen | "Dokümanın 5 bölümü tamamlanmış" |
| Bağımlılık (Dependency) | ⚠️ Önerilen | "Backend API tamamlandıktan sonra" |

| Karar Durumu | Takip Sıklığı | Eskalasyon |
|-------------|---------------|------------|
| Yeni | 1 hafta | Ekibi bilgilendir |
| Devam ediyor | 2 hafta | Manager'a raporla |
| Tamamlandı | 3 ay sonra review | KPI'ları ölç |
| Başarısız | Hemen | Kök neden analiz et |

| Toplantı Özet Uzunluğu | Hedef Kitle | Saklama Süresi |
|------------------------|-------------|----------------|
| Standup: 1-2 paragraf | Ekip | 1 ay |
| Weekly: 1 sayfa | Departman | 1 çeyrek |
| Monthly: 2-3 sayfa | Leadership | 1 yıl |
| Strategic: Tam doküman | Executive | 3+ yıl |
