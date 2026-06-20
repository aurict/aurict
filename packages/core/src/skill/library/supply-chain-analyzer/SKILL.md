---
name: supply-chain-analyzer
description: "Tedarik zinciri analizi: Bottleneck tespiti, stok optimizasyonu, tedarikçi risk yönetimi ve lojistik iyileştirme."
triggers:
  keywords: ["supply chain", "bottleneck", "stok optimizasyonu", "tedarikçi risk", "logistics", "inventory"]
  contexts: ["supply chain optimization", "vendor management", "logistics planning", "demand planning"]
auto_load_when: "Kullanıcı tedarik zinciri analizi, bottleneck tespiti veya stok optimizasyonu istediğinde"
agent: content-ops
tools: ["Read", "Write", "Bash", "Grep", "Glob"]
---

# Supply Chain Analyzer — Tedarik Zinciri Uzmanı

**Odak Alanı:** Tedarik zinciri optimizasyonu, bottleneck tespiti, stok yönetimi ve tedarikçi risk değerlendirmesi.

---

## Pattern Bölümleri

### 1. Tedarik Zinciri Haritası

```
End-to-End Supply Chain
├── Suppliers (Tier N → Tier 1)
│   ├── Raw material providers
│   ├── Component manufacturers
│   └── Sub-assembly suppliers
├── Inbound Logistics
│   ├── Transportation
│   ├── Customs/import
│   └── Warehouse receiving
├── Manufacturing/Production
│   ├── Production planning
│   ├── Quality control
│   └── Work-in-progress (WIP)
├── Outbound Logistics
│   ├── Finished goods storage
│   ├── Distribution centers
│   └── Transportation to customers
├── Distribution Network
│   ├── Regional warehouses
│   ├── Retail/fulfillment
│   └── Last-mile delivery
└── Customer
    ├── B2B customers
    └── B2C customers
```

### 2. Bottleneck Tespit Yöntemleri

```
Bottleneck Analysis Methods
├── Throughput Analysis
│   ├── Identify slowest step
│   ├── Calculate cycle time per step
│   ├── Find lowest capacity point
│   └── Compare to demand rate
├── Root Cause Analysis (5 Whys)
│   ├── Why production slow?
│   ├── Why machine slow?
│   ├── Why maintenance delayed?
│   ├── Why parts not available?
│   └── Why supplier delayed?
├── Constraint Theory (TOC)
│   ├── Identify constraint
│   ├── Exploit constraint
│   ├── Subordinate everything
│   └── Elevate constraint
└── Visual Analysis
    ├── Value stream mapping
    ├── Gantt charts
    ├── Kanban boards
    └── Throughput dashboards
```

### 3. Stok Optimizasyon Modelleri

```
Inventory Optimization Models
├── Safety Stock Calculation
│   ├── Formula: Z × σ × LT
│   ├── Z = Service level factor (95%=1.65)
│   ├── σ = Demand standard deviation
│   └── LT = Lead time
├── Economic Order Quantity (EOQ)
│   ├── Formula: √(2DS/H)
│   ├── D = Annual demand
│   ├── S = Ordering cost
│   └── H = Holding cost per unit
├── Reorder Point (ROP)
│   ├── Formula: (D × LT) + Safety Stock
│   ├── When to reorder
│   ├── Automatic triggers
│   └── Continuous monitoring
├── ABC Analysis
│   ├── A items: Top 20%, 80% value
│   ├── B items: Middle 30%, 15% value
│   └── C items: Bottom 50%, 5% value
└── Vendor-Managed Inventory (VMI)
    ├── Supplier manages stock levels
    ├── Automated replenishment
    └── Consignment model
```

### 4. Tedarikçi Risk Kategorileri

```
Vendor Risk Categories
├── Financial Risk
│   ├── Company stability
│   ├── Payment history
│   ├── Credit rating
│   └── Bankruptcy risk
├── Operational Risk
│   ├── Production capacity
│   ├── Quality consistency
│   ├── Lead time reliability
│   └── Capacity utilization
├── Geographic Risk
│   ├── Political stability
│   ├── Natural disaster exposure
│   ├── Transportation routes
│   └── Port/infrastructure
├── Compliance Risk
│   ├── Labor standards
│   ├── Environmental
│   ├── Certifications
│   └── Legal/regulatory
└── Strategic Risk
    ├── Dependency level
    ├── Switching cost
    ├── Competitive position
    └── Technology roadmap
```

### 5. Demand Forecasting Methods

```
Demand Forecasting Approaches
├── Qualitative Methods
│   ├── Market research
│   ├── Expert opinions
│   ├── Sales team input
│   └── Delphi method
├── Time Series
│   ├── Moving average
│   ├── Exponential smoothing
│   ├── Seasonal decomposition
│   └── ARIMA models
├── Causal Models
│   ├── Regression analysis
│   ├── Econometric models
│   └── Market factors correlation
├── Machine Learning
│   ├── Neural networks
│   ├── Ensemble methods
│   └── Demand sensing
└── Collaborative Forecasting
    ├── Vendor input (S&OP)
    ├── Customer order history
    └── Consensus planning
```

---

## Key Patterns

| Pattern | Açıklama | Uygulama |
|---------|----------|----------|
| **End-to-End Visibility** | Tam zincir görünürlüğü | Data integration |
| **Demand-Supply Balance** | Talep-üretim dengesi | S&OP process |
| **Safety Stock Optimization** | Optimal güvenlik stoku | Statistical models |
| **Lead Time Reduction** | Tedarik süresi kısaltma |供应商 improvement |
| **Multi-Sourcing** | Birden fazla tedarikçi | Risk diversification |
| **VMI Implementation** | Vendor-managed inventory | Automated replenishment |
| **Continuous Improvement** | Sürekli iyileştirme | Kaizen, lean |

---

## Anti-Patterns

### ❌ Yanlış Uygulamalar

```markdown
# SINGLE SOURCING
Tüm parçalar tek vendor'dan
- Risk集中
- Tedarikçi sorunu = üretim durması
- Negotiation gücü yok

✅ Multi-sourcing strategy
```

```markdown
# EXCESSIVE INVENTORY
"Stok olsun, eksik olmasın"
- Yüksek holding cost
- Depo maliyeti
- Obsolescence risk
- Cash flow problem

✅ Optimize: Just-in-time, safety stock
```

```markdown
# NO SAFETY STOCK
"Sıfır stok ideal"
- Herhangi bir kesinti = üretim durması
- Müşteri memnuniyeti düşer
- Emergency ordering pahalı

✅ Risk-based safety stock hesapla
```

```markdown
# IGNORING LEAD TIME VARIABILITY
Vendor: "3 hafta" dedi
- Always exactly 3 weeks değil
- Variance yok sayıldı
- Buffer yok

✅ Lead time distribution analiz et
```

```markdown
# REACTIVE SUPPLY CHAIN
Problem olduktan sonra çözüm
- Proaktif değil
- Kesintiler önlenemiyor
- Müşteri memnuniyeti düşer

✅ Predictive analytics kullan
```

```markdown
# SILOSED OPTIMIZATION
Her departman kendini optimize ediyor
- Purchasing: Min price
- Production: Max utilization
- Warehouse: Min space
- Overall: Suboptimal

✅ End-to-end optimization
```

### ✅ Doğru Uygulamalar

```markdown
# BOTTLENECK ANALYSIS ÖRNEĞİ
Production Line Analysis:

| Station | Cycle Time | Capacity/hr | Status |
|---------|------------|-------------|--------|
| A: Cutting | 45s | 80 units | 🟢 Available |
| B: Welding | 60s | 60 units | 🔴 BOTTLENECK |
| C: Assembly | 50s | 72 units | 🟢 Available |
| D: Testing | 40s | 90 units | 🟢 Available |

Bottleneck: Welding station
- Demand: 65 units/hour
- Current: 60 units/hour
- Gap: 5 units/hour

Solution Options:
1. Add second welding station
2. Overtime to increase capacity
3. Outsource welding
4. Improve cycle time through training

Recommendation: Option 1 (long-term)
```

```markdown
# SAFETY STOCK CALCULATION
Item: Widget-X
- Annual demand (D): 10,000 units
- Daily demand: 33 units
- Lead time (LT): 14 days
- Demand std dev (σ): 8 units/day
- Desired service level: 95%

Safety Stock = Z × σ × √LT
= 1.65 × 8 × √14
= 1.65 × 8 × 3.74
= 49 units

Reorder Point = (Daily Demand × LT) + SS
= (33 × 14) + 49
= 462 + 49 = 511 units

Policy: Reorder when stock reaches 511
Order quantity: EOQ = 632 units
```

```markdown
# SUPPLIER RISK SCOREBOARD
Q2 2024 Supplier Risk Assessment:

| Supplier | Financial | Ops | Geo | Compl | Total | Risk |
|----------|-----------|-----|-----|-------|-------|------|
| Supplier A | 3 | 4 | 2 | 4 | 13 | 🟡 Medium |
| Supplier B | 5 | 3 | 4 | 5 | 17 | 🔴 High |
| Supplier C | 4 | 5 | 5 | 4 | 18 | 🔴 High |
| Supplier D | 4 | 4 | 4 | 4 | 16 | 🟡 Medium |

Risk Actions:
- Supplier B: Quarterly financial review
- Supplier C: Backup supplier qualification
- Supplier D: Continue monitoring
```

```markdown
# SUPPLY CHAIN METRICS
Key Performance Indicators:
| Metric | Formula | Target | Actual | Status |
|--------|---------|--------|--------|--------|
| Perfect Order | (On-time × Complete) × Accuracy | >95% | 92% | 🟡 |
| Lead Time | Avg supplier delivery | <14 days | 16 days | 🔴 |
| Fill Rate | Orders filled complete | >98% | 96% | 🟡 |
| Inventory Turn | COGS / Avg Inventory | >6x | 4.2x | 🔴 |
| Stockout Rate | Out-of-stock / Total SKUs | <2% | 1.5% | 🟢 |
| Supplier On-time | On-time / Total deliveries | >90% | 85% | 🟡 |
```

---

## Quick Reference

| Bottleneck Türü | Belirti | Çözüm |
|-----------------|---------|-------|
| Equipment | Machine down time | Preventive maintenance |
| Labor | Operator shortage | Cross-training |
| Material | Part shortage | Safety stock, supplier improvement |
| Process | Slow cycle time | Process improvement |
| Quality | Rework rate | Quality management |

| Stok Türü | Tanım | Yönetim |
|-----------|-------|---------|
| Raw Material | Ham madde | Supplier coordination |
| WIP | Yarı mamul | Production smoothing |
| Finished Goods | Mamul | Demand matching |
| Safety Stock | Buffer | Risk-based |
| Consignment | Tedarikçi sahipli | VMI |

| Forecasting Horizon | Yöntem | Accuracy |
|---------------------|--------|----------|
| 0-3 months | Time series, ML | High (MAPE <10%) |
| 3-12 months | Causal, consensus | Medium (MAPE 10-20%) |
| 1-3 years | Market research, ML | Low (MAPE >20%) |
| 3+ years | Scenario planning | Very low |

| Risk Mitigation | Yöntem | Etki |
|-----------------|--------|------|
| Multi-sourcing | Birden fazla tedarikçi | Tedarik kesintisi riski ↓ |
| Safety stock | Buffer inventory | Stokout riski ↓ |
| Vendor development | Performans iyileştirme | Kalite ↑ lead time ↓ |
| Contracts | Long-term agreements | Fiyat dalgalanması ↓ |
| Insurance | Risk transfer | Financial exposure ↓ |
