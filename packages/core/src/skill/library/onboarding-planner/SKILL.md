---
name: onboarding-planner
description: "İlk 30-60-90 günlük oryantasyon planı, buddy atama, eğitim takvimi ve KPI tanımlama"
triggers:
  keywords: ["onboarding planner", "oryantasyon planı", "30-60-90 gün", "yeni çalışan", "buddy atama"]
auto_load_when: "Kullanıcı yeni çalışan oryantasyon planı, eğitim takvimi veya onboarding süreci ister"
agent: content-ops
tools: ["Read", "Write", "grep", "glob"]
---

# Onboarding Planner (Oryantasyon Planlayıcı)

**Odak Alanı:** İlk 30-60-90 günlük oryantasyon planı, buddy atama, eğitim takvimi ve KPI tanımlama

## 1. Pattern: 30-60-90 Gün Planı Yapısı

```
30_60_90_planı
├── ilk_30_gün (Keşif ve Uyum)
│   ├── Hafta 1-2
│   │   ├── Şirket kültürü tanıtımı
│   │   ├── Temel süreçler öğrenme
│   │   ├── Ekip üyeleri tanıma
│   │   └── Araçlara erişim
│   ├── Hafta 3-4
│   │   ├── Rol tanımı detayları
│   │   ├── İlk görevler
│   │   ├── Buddy ile çalışma
│   │   └── İlk geri bildirim
│   └── Çıktılar
│       ├── Uyum tamamlama oranı
│       ├── Tanışma listesi
│       └── İlk izlenim raporu
├── 31-60_gün (Öğrenme ve Katkı)
│   ├── Hafta 5-6
│   │   ├── Projelere dahil olma
│   │   ├── Bağımsız görevler
│   │   ├── Ekip toplantılarına katılım
│   │   └── Kritik süreçleri öğrenme
│   ├── Hafta 7-8
│   │   ├── Orta seviye sorumluluk
│   │   ├── Hata öğrenme
│   │   ├── İlk katkılar
│   │   └── Performans beklentileri
│   └── Çıktılar
│       ├── Tamamlanan projeler
│       ├── Yetkinlik gelişimi
│       └── 60. gün değerlendirmesi
└── 61-90_gün (Başarı ve Konumlandırma)
    ├── Hafta 9-10
    │   ├── Bağımsız çalışma
    │   ├── İyileştirme önerileri
    │   ├── Ekip katkısı
    │   └── Kariyer hedefi belirleme
    ├── Hafta 11-12
    │   ├── Tam performans modunda
    │   ├── Sonraki dönem hedefleri
    │   └── Uzun vadeli planlar
    └── Ç_ktılar
        ├── 90. gün performansı
        ├── KPI değerlendirmesi
        └── Gelişim planı
```

## 2. Pattern: Oryantasyon Checklist'i

```
oryantasyon_checklist
├── İlk Gün (Day 0)
│   ├── Hoş geldin e-postası
│   ├── IT ekipmanları
│   ├── Erişim bilgileri (mail, Slack, system)
│   ├── Çalışan el kitabı
│   ├── Organizasyon şeması
│   ├── Buddy tanıştırma
│   └── Ofis turu / Remote araçlar
├── İlk Hafta (Day 1-5)
│   ├── Zorunlu eğitimler (GDPR, compliance)
│   ├── Güvenlik eğitimi
│   ├── Ürün/Hizmet eğitimi
│   ├── Satış/Operasyon süreçleri
│   ├── Araç/Platform eğitimi
│   └── İlk 1:1 toplantı
├── İlk Ay (Day 1-30)
│   ├── Tüm departman tanıtımları
│   ├── Kritik stakeholder toplantıları
│   ├── İlk proje devir teslimi
│   ├── Haftalık 1:1
│   ├── 30. gün değerlendirmesi
│   └── Geri bildirim toplama
└── Devam Eden
    ├── Aylık check-in'ler
    ├── 60. gün değerlendirmesi
    ├── 90. gün değerlendirmesi
    └── Yıllık performans değerlendirmesi
```

## 3. Pattern: Eğitim Takvimi

```
eğitim_takvimi
├── zorunlu_eğitimler
│   ├── İlk hafta
│   │   ├── Şirket kültürü ve değerler (2 saat)
│   │   ├── GDPR ve veri güvenliği (2 saat)
│   │   ├── Etik ve uyum (1 saat)
│   │   ├── Çalışan el kitabı (1 saat)
│   │   └── İş sağlığı güvenliği (2 saat)
│   ├── İkinci hafta
│   │   ├── Departman süreçleri (4 saat)
│   │   ├── Kullanılan araçlar (4 saat)
│   │   ├── Ürün/Hizmet bilgisi (4 saat)
│   │   └── Müşteri ilişkileri (2 saat)
│   └── Üçüncü-Dördüncü hafta
│       ├── Rol spesifik eğitimler (8 saat)
│       ├── Sistem eğitimleri (4 saat)
│       └── Mentorluk oturumları (4 saat)
├── opsiyonel_eğitimler
│   ├── İkinci ay
│   │   ├── Gelişim programları
│   │   ├── Liderlik atölyeleri
│   │   ├── Teknik sertifikalar
│   │   └── Soft skills gelişimi
│   └── Devam Eden
│       ├── Yıllık refresh eğitimleri
│       ├── Yeni özellik güncellemeleri
│       └── Sertifika yenileme
└── takip_mekanizması
    ├── Eğitim tamamlama oranı
    ├── Test skorları
    ├── Geri bildirim formları
    └── Sertifika diploması
```

## 4. Pattern: Buddy Atama Sistemi

```
buddy_atama
├── buddy_seçim_kriterleri
│   ├── Deneyim (1-2 yıl daha fazla)
│   ├── Pozisyon yakınlığı
│   ├── İletişim becerisi
│   ├── Mentorluk deneyimi
│   └── Gönüllülük
├── buddy_sorumlulukları
│   ├── İlk 30 gün günlük check-in
│   ├── Soru-cevap oturumları
│   ├── Sosyal entegrasyon
│   ├── Geri bildirim sağlama
│   └── 30. gün referansı
└── takip_sistemi
    ├── Buddy atama onayı
    ├── Haftalık özet raporu
    ├── 30. gün tamamlama
    └── Başarı ölçümü
```

## 5. Pattern: KPI Tanımlama

```
kpi_tanımlama
├── performans_kpi
│   ├── İlk 30 gün
│   │   ├── Uyum tamamlama %100
│   │   ├── Eğitim tamamlama %100
│   │   └── İlk izlenim skoru 4+/5
│   ├── İlk 60 gün
│   │   ├── Tamamlanan proje sayısı
│   │   - En az 1 proje
│   │   ├── Bağımsız çalışma oranı
│   │   - %50 bağımsız
│   │   └── Haftalık 1:1 katılım %100
│   └── İlk 90 gün
│       ├── Performans değerlendirmesi
│       - Ortalama veya üstü
│       ├── Ekip katkısı
│       ├── KPI karşılama %80
│       └── Gelişim planı tamamlanma
├── engagement_kpi
│   ├── 30. gün anket sonucu
│   ├── 90. gün anket sonucu
│   ├── Ekip entegrasyonu
│   └── Net Promoter Score
└── retention_kpi
    ├── 90. gün kalma oranı
    ├── 1 yıl sonra kalma oranı
    └── İlk 2 yıl churn rate
```

---

## Quick Reference

| Dönem | Odak Alanı | Temel Hedefler | Başarı Kriteri |
|-------|------------|---------------|---------------|
| 1-30 Gün | Uyum | Temel süreçler öğrenme, ekip tanıma | %100 uyum + %100 eğitim |
| 31-60 Gün | Katkı | Projelere katılım, bağımsız görev | 1+ proje, %50 bağımsız |
| 61-90 Gün | Başarı | Tam performans, KPI karşılama | %80 KPI + olumlu değerlendirme |

| Checklist Öğesi | Süre | Sorumlu | Durum |
|-----------------|-----|--------|-------|
| IT kurulum | Day 1 | IT | ⬜ |
| Buddy atama | Day 1 | HR | ⬜ |
| Zorunlu eğitimler | Day 1-5 | Eğitim | ⬜ |
|Departman tanıtım | Hafta 1 | Yönetici | ⬜ |
| 30. gün değerlendirme | Day 30 | Yönetici | ⬜ |

| KPI | 30. Gün | 60. Gün | 90. Gün |
|-----|---------|---------|----------|
| Uyum | %100 | - | - |
| Eğitim | %100 | - | - |
| Proje | - | 1 | 2+ |
| Bağımsızlık | %25 | %50 | %80 |
| Performans | - | 3/5 | 4/5 |
