---
name: hr-policy-drafter
description: "İK prosedürleri, çalışan el kitabı, off-boarding süreci, gizlilik politikaları, yasal gereksinimler ve uyumluluk"
triggers:
  keywords: ["hr policy drafter", "ik politikası", "çalışan el kitabı", "off-boarding", "gizlilik politikası"]
auto_load_when: "Kullanıcı IK politikası, çalışan el kitabı veya off-boarding prosedürü ister"
agent: content-ops
tools: ["Read", "Write", "grep", "glob"]
---

# HR Policy Drafter (İK Politika Oluşturucu)

**Odak Alanı:** İK prosedürleri, çalışan el kitabı, off-boarding süreci, gizlilik politikaları, yasal gereksinimler ve uyumluluk

## 1. Pattern: İK Prosedürleri Yapısı

```
ik_prosedürleri
├── işe_alım_prosedürleri
│   ├── İş ilanı yayınlama
│   ├── Başvuru süreci
│   ├── Ön eleme kriterleri
│   ├── Mülakat süreci
│   ├── Referans kontrolü
│   ├── Teklif ve kabul
│   └── İşe başlama
├── çalışma_süreci_prosedürleri
│   ├── Çalışma saatleri
│   ├── Esnek çalışma
│   ├── Uzaktan çalışma
│   ├── Permission yönetimi
│   ├── Fazla mesai
│   ├── Seyahat politikası
│   └── Equipment kullanımı
├── performans_yönetimi
│   ├── Hedef belirleme
│   ├── Ara değerlendirme
│   ├── Yıllık değerlendirme
│   ├── Geri bildirim süreci
│   └── Gelişim planı
├── disiplin_prosedürü
│   ├── Uyarı süreci
│   ├── Disiplin kurulu
│   ├── İşten çıkarma
│   ├── İtiraz mekanizması
│   └── Kayıt tutma
└── şikayet_cozümü
    ├── Şikayet mekanizması
    ├── Escalation süreci
    ├── Çözüm zaman çizelgesi
    └── Gizlilik koruma
```

## 2. Pattern: Çalışan El Kitabı

```
çalışan_el_kitabı
├── hoş_geldiniz
│   ├── CEO mesajı
│   ├── Şirket tarihi
│   ├── Misyon ve vizyon
│   ├── Değerlerimiz
├── şirket_yapısı
│   ├── Organizasyon şeması
│   ├── Departman tanıtımları
│   ├── İletişim bilgileri
│   └── Location bilgileri
├── İstihdam_koşulları
│   ├── İş sözleşmesi
│   ├── Deneme süresi
│   ├── Çalışma saatleri
│   ├── Ücret ve ödeme
│   ├── Benefits
│   └── Development fırsatları
├── policies_and_procedures
│   ├── Attendance politikası
│   ├── PTO ve izin politikası
│   ├──remote çalışma politikası
│   ├── Device kullanım
│   ├── Social media politikası
│   ├── Code of conduct
│   └── Anti-discrimination
├── sağlık_ve_güvenlik
│   ├── İş sağlığı
│   ├── Acil durum prosedürü
│   ├── Ergonomi
│   ├── Wellness programı
│   └── Security
├── yasal_haklar
│   ├── Çalışma hakları
│   ├── Eşit fırsatlar
│   ├── Privacy rights
│   └── Whistleblower policy
└── onay_ve_imza
    ├── Policy acknowledgment
    └── Düzenli güncelleme
```

## 3. Pattern: Off-boarding Süreci

```
off_boarding
├── istifa_süreci
│   ├── İstifa bildirimi
│   ├── Exit görüşmesi
│   ├── Notice period yönetimi
│   ├── Geçiş planı
│   ├── Devir teslim
│   └── Son ödeme
├── işten_çıkarma
│   ├── Performans/conduct sorunu
│   ├── Ön bildirim
│   ├── Disiplin süreci
���   ├── Yasal yükümlülükler
│   ├── Reference letter
│   └── Final ödeme
├── kısa_sürede_ayrılma
│   ├── Acil ayrılık
│   ├── Yasal prosedür
│   ├── Final compensación
│   └── Gizlilik anlaşması
├── çıkış_süreci
│   ├── Exit görüşmesi
│   ├── Çıkış anketi
│   ├── Equipment iade
│   ├── System erişim kaldırma
│   ├── Benefit sonlandırma
│   ├── Reference politikası
│   └── LinkedIn güncelleme
└── bilgi_koruma
    ├── Confidentiality enforce
    ├── NDARemind
    ├── IP koruma
    └── Post-employment restrictions
```

## 4. Pattern: Gizlilik Politikaları

```
gizlilik_politikaları
├── veri_toplaması
│   ├── Toplanan veri türleri
│   │   ├── Kişisel bilgiler
│   │   ├── İş bilgileri
│   │   ├── Finansal bilgiler
│   │   └── Teknik veriler
│   ├── Toplama yöntemleri
│   │   ├── Direct collection
│   │   ├── Automatic collection
│   │   └── Third-party
├── veri_kullanımı
│   ├── Kullanım amaçları
│   │   ├── İşe alım
│   │   ├── İstihdam yönetimi
│   │   ├── Benefits administration
│   │   └── Compliance
│   ├── Data sharing
│       ├── Internal sharing
│       └── Third-party sharing
├── veri_koruma
│   ├── Security önlemleri
│   │   ├── Encryption
│   │   ├── Access control
│   │   └── Monitoring
│   ├── Incident response
│   └── Breach Bildirim
├── çalışan_hakları
│   ├── Erişim hakkı
│   ├── Düzeltme hakkı
│   ├── Silme hakkı
│   └── Taşınabilirlik
└── yasal_gereksinimler
    ├── GDPR (EU)
    ├── KVKK (Türkiye)
    ├── CCPA (California)
    └── Local regulations
```

## 5. Pattern: Yasal Gereksinimler

```
yasal_gereksinimler
├── çalışma_hukuku
│   ├── İş kanunu
│   ├── SGK mevzuatı
│   ├── Vergi kanunları
│   ├── Sendika hakları
│   └── İş sağlığı güvenliği
├── eşit_fırsatlar
│   ├── Discriminasyon yasağı
│   ├── Equal opportunity
│   ├── Disability accommodation
│   ├── Age diversity
│   └── Gender equality
├── veri_koruma
│   ├── Data protection compliance
│   ├── Privacy by design
│   ├── Consent management
│   └── Retention policies
├── sağlık_sigortası
│   ├── Zorunlu sigorta
│   ├── İşveren sorumlulukları
│   └── Coverage requirements
├── göçmenlik
│   ├── Work permit
│   ├── Visa requirements
│   └── I-9 verification
└── uyumluluk_takibi
    ├── Policy güncelleme
    ├── Audit
    ├── Training
    └── Documentation
```

---

## Quick Reference

| Policy Alanı | Kritik Unsur | Güncelleme Sıklığı |
|-------------|-------------|-------------------|
| Leave policies | PTO, parental, sick | Yıllık |
| Compensation | Salary, bonus, benefits | Yıllık |
| Remote work | Guidelines, equipment | Çeyreklik |
| Code of conduct | Etik, harassment | Yıllık |
| Data privacy | GDPR, KVKK | Gerektiğinde |
| Safety | İSG prosedürleri | Yıllık |

| Off-boarding Adım | Süre | Sorumlu |
|-------------------|------|--------|
| İstifa bildirimi | Day 1 | Çalışan |
| Exit görüşmesi | Day -5 | HR |
| Devir teslim | Last week | Çalışan |
| Equipment iade | Last day | IT |
| Final ödeme | +2 iş günü | Payroll |

| Yasal Uyum | Türkiye | AB/ABD |
|------------|--------|--------|
| Veri koruma | KVKK | GDPR/CCPA |
| İş sağlığı | İSG Kanunu | OSHA |
| Çalışma saatleri | 45 saat/hafta | 40 saat/ABD |
| Deneme süresi | 2 ay (max) | Değişken |
