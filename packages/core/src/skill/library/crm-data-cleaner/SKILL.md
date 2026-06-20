---
name: crm-data-cleaner
description: "CRM veri temizleme. Duplicate detection, data standardization ve validation rules."
triggers:
  keywords: ["CRM cleaning", "veri temizleme", "duplicate detection", "data deduplication", "data standardization", "CRM hygiene"]
auto_load_when: "Kullanıcı CRM veri kalitesi, duplicate temizleme, veri standardizasyonu veya validation kuralları talep ettiğinde"
agent: content-ops
tools: ["Read", "Write", "Grep", "Glob"]
---

# CRM Data Cleaner (CRM Veri Temizleme Uzmanı)

**Odak Alanı:** CRM sistemlerindeki veri kalitesini artırmak, duplicate'ları tespit etmek, verileri standardize etmek ve validation kuralları oluşturmak.

---

## Pattern 1: Duplicate Detection (Tekrar Tespiti)

### 1.1 Duplicate Türleri ve Tespit Yöntemleri

```
Duplicate Categories:
├── Hard Duplicates (Exact Match)
│   ├── Identical email address
│   ├── Identical company name
│   └── Identical phone number
│
├── Soft Duplicates (Fuzzy Match)
│   ├── Similar company names (typos, variations)
│   ├── Similar names (first/last name variations)
│   └── Similar emails (domain variations)
│
├── Partial Duplicates
│   ├── Same company, multiple contacts
│   ├── Same person, multiple records
│   └── Same lead, different sources
│
└── Phantom Duplicates
    ├── Same real entity, different spelling
    ├── Acquired company variations
    └── International character variations
```

### 1.2 Duplicate Detection Tree

```
Detection Algorithm:
├── Exact Match Rules
│   ├── Email = [exact match] → Mark as duplicate
│   ├── Phone = [exact match] → Flag for review
│   └── Company + Name = [exact] → Hard merge candidate
│
├── Fuzzy Match Rules
│   ├── Company name >80% similarity → Manual review
│   ├── Contact name >85% similarity → Review required
│   ├── Email domain match + name similarity → Flag
│   └── Address >70% match → Merge candidate
│
└── Pattern-Based Rules
    ├── Multiple records from same domain (5+) → Company dedup
    ├── Same email different timestamps → Merge
    └── Multiple records with no email → Review needed
```

### 1.3 Duplicate Resolution Framework

```
Merge Decision Tree:
├── Auto-Merge (Safe)
│   ├── All fields match exactly
│   ├── No conflicting data
│   └── Same source attribution
│
├── Auto-Merge (Smart)
│   ├── Non-conflicting fields combine
│   ├── Most recent data wins
│   ├── More complete record wins
│   └── Activity history merges
│
├── Manual Review
│   ├── Conflicting critical fields
│   ├── Same email different names
│   └── Similar but uncertain matches
│
└── Don't Merge
    ├── Different companies (similar names)
    ├── Different people (similar names)
    └── Same person, different companies
```

---

## Pattern 2: Data Standardization (Veri Standardizasyonu)

### 2.1 Company Name Standardization

```
Company Name Rules:
├── Standardization Steps
│   ├── Remove legal entities: Inc, LLC, Ltd, Corp, GmbH
│   ├── Standardize case: Title Case
│   ├── Remove punctuation: & → and, - → space
│   ├── Fix spacing: Double spaces → single
│   └── Handle special chars: ä→a, ö→o, etc.
│
├── Examples
│   ├── "ABC Corporation, Inc." → "ABC Corporation"
│   ├── "Smith & Jones LLC" → "Smith and Jones"
│   ├── "XYZ-Corp" → "XYZ Corp"
│   └── "Müller GmbH" → "Muller"
│
└── Special Cases
    ├── "Google Inc" → Keep "Google" as standard
    ├── "Microsoft Corporation" → Keep full
    └── "The Walt Disney Company" → Keep full
```

### 2.2 Contact Data Standardization

```
Name Standardization:
├── First Name
│   ├── All lowercase → Title Case
│   ├── Remove prefixes: Mr., Ms., Dr.
│   ├── Handle nicknames: "Bill" → "William"
│   └── Standardize international: "Jean-Pierre" → "Jean Pierre"
│
├── Last Name
│   ├── Handle suffixes: Jr., Sr., III
│   ├── Handle prefixes: von, van, de
│   └── Keep compound names intact
│
└── Email Address
    ├── All lowercase
    ├── Remove . in Gmail (john.smith = johnsmith)
    └── Handle + addressing (keep as-is)
```

### 2.3 Industry ve Title Standardization

```
Industry Classification:
├── Standard Industry List
│   ├── Technology → SaaS, Hardware, IT Services
│   ├── Finance → Banking, Insurance, Fintech
│   ├── Healthcare → Provider, Pharma, Biotech
│   ├── Manufacturing → Industrial, Automotive
│   └── Retail → E-commerce, Brick & Mortar
│
├── Job Title Standardization
│   ├── C-Level → CEO, CFO, CTO, COO, CMO
│   ├── VP-Level → VP, SVP, EVP
│   ├── Director → Director, Sr. Director
│   ├── Manager → Manager, Senior Manager
│   └── IC → Individual Contributor titles
│
└── Level Mapping
    ├── Decision Maker → C-Level, VP, Director
    ├── Influencer → Manager, Senior IC
    └── User → IC, Specialist
```

---

## Pattern 3: Validation Rules (Doğrulama Kuralları)

### 3.1 Field Validation Matrix

```
Required Fields (Minimum):
├── Contact
│   ├── Email (valid format + deliverable)
│   ├── First name (required)
│   └── Last name (required)
│
├── Company
│   ├── Company name (required)
│   ├── Industry (required)
│   └── Company size (required if available)
│
└── Lead
    ├── Lead source (required)
    ├── Status (required)
    └── Created date (auto)
```

### 3.2 Data Quality Rules

```
Validation Check List:
├── Email Validation
│   ├── Format check: @domain.extension
│   ├── Domain exists: DNS lookup
│   ├── Disposable email: Block known disposables
│   ├── Role-based: catch-all, info@, support@
│   └── Role check: Ceo, admin, sales@ (flag)
│
├── Phone Validation
│   ├── Format: +[country][area][number]
│   ├── Country code presence
│   ├── Valid digit count
│   └── Phone carrier lookup (optional)
│
├── Company Validation
│   ├── Employee count reasonable
│   ├── Industry code valid
│   ├── Website resolves (optional)
│   └── LinkedIn company exists (optional)
│
└── Address Validation
    ├── Postal code format
    ├── City-State match
    └── Country format (ISO code)
```

### 3.3 Data Quality Scoring

```
Record Quality Score (/100):
├── Completeness (30 points)
│   ├── All required fields: +15
│   ├── Optional fields filled: +10
│   └── Custom fields filled: +5
│
├── Validity (30 points)
│   ├── Email valid: +10
│   ├── Phone valid: +5
│   ├── Company verified: +10
│   └── Address valid: +5
│
├── Freshness (20 points)
│   ├── Updated <30 days: +10
│   ├── Updated <90 days: +5
│   └── Activity <180 days: +5
│
└── Uniqueness (20 points)
    ├── No duplicates: +10
    ├── Single record: +5
    └── De-duped: +5
```

---

## Pattern 4: Data Cleaning Workflow

### 4.1 Cleaning Process Steps

```
Standard Cleaning Workflow:
├── Step 1: Assessment
│   ├── Total records count
│   ├── Duplicate percentage
│   ├── Missing data by field
│   ├── Stale records percentage
│   └── Data source quality
│
├── Step 2: Quick Wins
│   ├── Remove obvious duplicates
│   ├── Fix formatting errors
│   ├── Fill obvious missing data
│   └── Standardize obvious variations
│
├── Step 3: Deep Clean
│   ├── Fuzzy matching and resolution
│   ├── Data enrichment
│   ├── Validation fixes
│   └── Quality scoring
│
├── Step 4: Prevention
│   ├── Set up validation rules
│   ├── Create dedup workflows
│   ├── Establish data entry standards
│   └── Set up regular cleaning schedule
│
└── Step 5: Ongoing Maintenance
    ├── Weekly duplicate review
    ├── Monthly quality check
    ├── Quarterly deep clean
    └── Annual complete audit
```

### 4.2 Tool Integration

```
Cleaning Tools by Platform:
├── HubSpot
│   ├── Native duplicate detection
│   ├── Property validation rules
│   ├── Workflow-based cleaning
│   └── Data quality dashboard
│
├── Salesforce
│   ├── Duplicate rules (matching rules)
│   ├── Data.com enrichment
│   ├── Validation rules
│   └── Duplicate job scheduler
│
├── Pipedrive
│   ├── Manual duplicate merge
│   ├── Custom field validation
│   └── Export/import cleaning
│
└── Custom/Other
    ├── External tools: ZoomInfo, Clearbit
    ├── Dedupe tools: Dedupely, FullEnrich
    └── Cleaning services: CloudSponge
```

---

## Pattern 5: Quality Monitoring

### 5.1 Quality Dashboard Metrics

```
Key Metrics to Track:
├── Volume Metrics
│   ├── Total contacts
│   ├── Total companies
│   ├── Active contacts
│   └── Leads by source
│
├── Quality Metrics
│   ├── Duplicate percentage (target <5%)
│   ├── Complete records % (target >80%)
│   ├── Valid email % (target >90%)
│   └── Freshness score
│
├── Activity Metrics
│   ├── Records updated (30 days)
│   ├── New records by source
│   ├── Stale records (>180 days no activity)
│   └── Bounce rate
│
└── ROI Metrics
    ├── Clean data impact on conversion
    ├── Time saved by sales team
    └── Unqualified lead reduction
```

### 5.2 Automated Maintenance

```
Automation Rules:
├── Duplicate Prevention
│   ├── Block submission if email exists
│   ├── Auto-merge safe duplicates
│   ├── Alert on potential duplicates
│   └── Block import of known duplicates
│
├── Data Entry Standards
│   ├── Required field enforcement
│   ├── Dropdown for standard fields
│   ├── Auto-format on entry
│   └── Auto-capitalize where appropriate
│
├── Stale Data Handling
│   ├── Auto-archive after X months inactive
│   ├── Periodic re-validation emails
│   ├── Re-engagement campaigns
│   └── Lead scoring decay
│
└── Quality Alerts
│   ├── Alert on mass import
│   ├── Alert on quality drop
│   ├── Alert on duplicate spike
│   └── Alert on missing required data
```

---

## Key Patterns (Özet)

| Pattern | Odak | Uygulama |
|---------|------|----------|
| Duplicate Detection | Tespit | Exact + fuzzy matching |
| Data Standardization | Format | Names, emails, companies |
| Validation Rules | Doğrulama | Format + completeness |
| Cleaning Workflow | Süreç | Assessment → Clean → Prevent → Monitor |
| Quality Monitoring | Ölçüm | Dashboard + automated alerts |

---

## Anti-Patterns

### ❌ Yasaklı Yaklaşımlar

```yaml
Process errors:
  - Manual-only cleaning (no automation)
  - No duplicate prevention
  - No ongoing maintenance
  - Ignoring data quality
  
Technical errors:
  - Over-aggressive merging
  - Loss of historical data
  - Deleting instead of archiving
  - Breaking related records
```

### ✅ Doğru Yaklaşımlar

```yaml
Best practices:
  - Always archive before delete
  - Test rules on small batch first
  - Document all changes
  - Regular maintenance schedule
  
Prevention:
  - Validation at entry point
  - Duplicate alerts for sales
  - Source data quality requirements
  - Regular quality audits
```

---

## Quick Reference

| Metric | Target | Warning |
|--------|--------|---------|
| Duplicate rate | <5% | >10% |
| Complete records | >80% | <60% |
| Valid email rate | >90% | <70% |
| Stale records | <20% | >40% |

| Validation | Rule | Action |
|------------|------|--------|
| Email | Format + domain | Reject invalid |
| Phone | International format | Standardize |
| Company | Required field | Block entry if missing |
| Name | Not empty | Reject if blank |

| Schedule | Task | Frequency |
|----------|------|-----------|
| Duplicate check | Scan + merge | Weekly |
| Data validation | Run rules | Real-time |
| Quality audit | Full assessment | Monthly |
| Deep clean | Complete refresh | Quarterly |
