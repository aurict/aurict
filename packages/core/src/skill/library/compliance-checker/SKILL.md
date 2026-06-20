---
name: compliance-checker
description: "Sektörel regülasyon kontrolü, BDDK, BTK, SPK uyumluluk, uyumluluk matrix ve gap analysis."
triggers:
  keywords: ["uyumluluk", "regülasyon", "BDDK", "BTK", "SPK", "KKM", "düzenleyici kurum", "compliance checker", "gap analysis"]
auto_load_when: "Kullanıcı sektörel düzenleyici kurallara uyum kontrolü, BDDK/BTK/SPK denetimlerine hazırlık, gap analysis veya uyumluluk matrix talep eder"
agent: content-ops
tools: ["Read", "Write", "WebFetch", "WebSearch"]
---

# Compliance Checker

**Odağ Alanı:** Türkiye'deki düzenleyici kurumların (BDDK, BTK, SPK, EPDK, SHWK) sektörel regülasyonlarına kurumsal uyum kontrolü, gap analysis ve uyumluluk matrix oluşturma.

## Pattern 1: Düzenleyici Kurum Haritası ve Kapsam

```
1. SEKTÖR — DÜZENLEYİCİ KURUM EŞLEŞTİRME
├── FİNANSAL HİZMETLER → BDDK
│   ├── Bankalar ( Ticari, katılım, yatırım)
│   ├── Finansman şirketleri
│   ├── Faktoring şirketleri
│   ├── Leasing şirketleri
│   ├── Sigorta şirketleri (SSDF denetimi)
│   ├── Bireysel emeklilik şirketleri (BES)
│   └── Ödeme kuruluşları (PSP)
│   └── Referans: 5411 sayılı Bankacılık Kanunu, BDDK mevzuatı
│
├── TELEKOMÜNİKASYON VE DİJİTAL → BTK
│   ├── Operatörler ( Turkcell, Türk Telekom, Vodafone)
│   ├── İSS (İnternet Servis Sağlayıcıları)
│   ├── E-みlata servis sağlayıcıları
│   ├── Hosting ve domain sağlayıcıları
│   └── Call center / iletişim merkezi işletmeleri
│   └── Referans: 5651 sayılı İnternet Ortamında Yapılan Yayınların
│       Düzenlenmesi ve Bu Yayınlar Yoluyla İşlenen Suçların
│       Ceza Sorumluluğuna İlişkin Kanun, E-Ticaret Kanunu
│
├── SERMAYE PİYASASI → SPK
│   ├── Yatırım kuruluşları ( aracı kurum, yatırım bankası)
│   ├── Yatırım fonları ve portföy yönetim şirketleri
│   ├── Gayrimenkul yatırım fonları (GYF)
│   ├── Portföy yönetim şirketleri
│   ├── Kitle fonlaması platformları
│   └── Kripto varlık hizmet sağlayıcıları (yeni düzenleme)
│   └── Referans: 6362 sayılı SPK Kanunu, III serisi tebliğler
│
├── ENERJİ → EPDK
│   ├── Elektrik üretim/perakende satış/dağıtım şirketleri
│   ├── Doğal gaz dağıtım/şehir içi gaz
│   ├── Akaryakıt ve LPG distribütörlük/istasyonları
│   └── Enerji ticareti
│   └── Referans: 4628 sayılı Enerji Piyasası Düzenleme Kanunu
│
├── SAĞLIK VE İLAÇ → SHWK (SAGLIK KURUMU)
│   ├── İlaç üreticileri ve dağıtıcıları
│   ├── Tıbbi cihaz şirketleri
│   ├── Özel sağlık kuruluşları
│   └── Ecza depolanma ve lojistik şirketleri
│   └── Referans: 1262 sayılı İlaç ve Eczacılık Kanunu,
│       3359 sayılı Sağlık Hizmetleri Kanunu
│
├── DEMİRYOLU VE ULAŞIM → UDHB
│   ├── Demiryolu operatörleri
│   ├── Liman işletmeleri
│   ├── Havayolu şirketleri
│   └── Karayolu taşımacılık
│   └── Referans: 6461 sayılı Demiryolu Kanunu, UDHB yönetmelikleri
│
└── OLAGANÜSTÜ DURUMLAR VE İNSANİ YARDIM → AFAD / S济
    ├── Acil müdahale planları
    └── İş sağlığı ve güvenliği (6331 sayılı Kanun)
```

## Pattern 2: Uyumluluk Matrix Oluşturma

```
UYGUNLUK MATRİSİ ŞABLONU (Compliance Matrix Template)
┌──────────────┬─────────────────┬──────────────┬─────────────┬──────────────┬──────────────┬────────────┐
│ Düzenleme    │ Hüküm / Madde  │ Yükümlülük  │ Mevcut      │ Durum       │ Kanıt/       │ Sorumlu   │
│ Adı          │                 │             │ Durum       │             │ Doküman      │ Departman │
├──────────────┼─────────────────┼──────────────┼─────────────┼──────────────┼──────────────┼────────────┤
│ BDDK m. 54   │ İç kontrol      │ Yazılı pros. │ Prosedür    │ ✅ Uyumlu   │ ICI-2024-001 │ Uyum      │
│              │ sistemi kurulumu│ mevcut       │ var         │             │              │           │
├──────────────┼─────────────────┼──────────────┼─────────────┼──────────────┼──────────────┼────────────┤
│ BDDK m. 55   │ İç denetim      │ Yıllık plan  │ Plan yapıldı│ ⚠️ Kısmi  │ IDP-2024-Q1  │ İç Denetim │
│              │                 │             │             │            │             │           │
├──────────────┼─────────────────┼──────────────┼─────────────┼──────────────┼──────────────┼────────────┤
│ SPK III-37.1 │ Müşteri tanıma  │ KYC prosedürü│ Sistem     │ ✅ Uyumlu   │ KYC-POL-003  │ AML/CC    │
│              │ (KYC)           │             │ otomasyonu  │             │              │           │
├──────────────┼─────────────────┼──────────────┼─────────────┼──────────────┼──────────────┼────────────┤
│ BTK 5651/8   │ İçerik bildirimi│ 24 saat      │ Sistem yok │ ❌ Uyumsuz  │ —            │ IT + Hukuk │
│              │                 │ bildirim     │             │            │              │           │
├──────────────┼─────────────────┼──────────────┼─────────────┼──────────────┼──────────────┼────────────┤
│ EPDK          │ Lisans yükümlülük│ Lisans alma │ Başvuru    │ ⚠️ Başvuru  │ LIS-BASV-024 │ Hukuk +   │
│ (elektrik)   │                 │ sürecinde    │ yapıldı     │ yapıldı     │              │ Operasyon  │
└──────────────┴─────────────────┴──────────────┴─────────────┴──────────────┴──────────────┴────────────┘

DURUM KODLARI:
✅ Uyumlu (Compliant)        → Tüm gereklilikler karşılanıyor
⚠️ Kısmi Uyumlu (Partial)    → Gereklilikler kısmen karşılanıyor, iyileştirme gerekli
❌ Uyumsuz (Non-Compliant)    → Gereklilikler karşılanmıyor, acil aksiyon gerekli
🔄 İnceleme Altında (Review)  → Değerlendirme devam ediyor
NA  Uygulanamaz (N/A)         → Düzenleme ilgili değil
```

## Pattern 3: Gap Analysis Protokolü

```
GAP ANALYSIS 5 ADIMLI PROTOKOL

ADIM 1: KURUMSAL KAPSAM BELİRLEME
├── Hangi iş kolları faaliyet gösteriyor?
├── Hangi lisanslar/izinler mevcut?
├── Hangi düzenleyici kurumların denetimi altında?
└── Son denetim tarihi ve bulguları neler?

ADIM 2: MEVZUAT TOPLAMA VE SIRALAMA
├── Birincil kaynak: Resmi gazete / kurum web sitesi
├── İkincil kaynak: Düzenleyici rehberler, sıkça sorulan sorular (FAQ)
├── Güncellemeler: Son 12 ay içindeki değişiklikler
└── Yaptırımlar: Para cezası, lisans iptali, tedbir kararı

ADIM 3: MEVCUT DURUM DEĞERLENDİRME
├── Doküman analizi (politikalar, prosedürler, formlar)
├── Süreç gözlemi (interview, walk-through)
├── Sistem kontrolü (IT güvenlik, erişim logları)
└── Çalışan görüşleri (anket, odak grup)

ADIM 4: BOŞLUK TESPİTİ (Gap Identification)
┌────────────────────────────────────────────────────────────────────────┐
│ BOŞLUK TİPOLOJİSİ                                                     │
├──────────────────┬───────────────────────────────────────────────────┤
│ 🔴 KRITIK BOŞLUK │ Yasal zorunluluk tamamen karşılanmamış             │
│                  │ → Acil aksiyon planı (30 gün), üst yönetim bildirimi│
├──────────────────┼───────────────────────────────────────────────────┤
│ 🟡 OPERASYONEL   │ Süreç var ama yetersiz veya etkin değil            │
│ BOŞLUK          │ → Süreç iyileştirme (90 gün), KPI hedefleri       │
├──────────────────┼───────────────────────────────────────────────────┤
│ 🟢 DOKÜMANTASYON│ Süreç var ama belgelenmemiş veya güncel değil      │
│ BOŞLUK          │ → Dokümantasyon (60 gün), versiyon kontrolü        │
├──────────────────┼───────────────────────────────────────────────────┤
│ ⚪ İZLEME BOŞLUĞU│ Süreç var ama izlenmiyor veya raporlanmıyor        │
│                  │ → İzleme mekanizması kur (45 gün), dashboard      │
└──────────────────┴───────────────────────────────────────────────────┘

ADIM 5: AKSIYON PLANI VE ÖNCELİKLENDİRME
┌────────────────────────────────────────────────────────────────────────────┐
│ AKSIYON PLANI TABLOSU                                                      │
├──────────────┬──────────────┬──────────────┬───────────────┬────────────┤
│ Gap ID        │ Aktion       │ Sorumlu      │ Deadline      │ KPI / Ölçüt │
├──────────────┼──────────────┼──────────────┼───────────────┼────────────┤
│ GAP-BDDK-001  │ KCI pros.    │ Uyum Müdürü │ 2025-06-30    │ %100 kapsam │
│              │ yeniden yazım │              │               │ test geçir │
├──────────────┼──────────────┼──────────────┼───────────────┼────────────┤
│ GAP-SPK-003   │ KYC sistem   │ IT + AML    │ 2025-07-15    │ Sistem      │
│              │ upgrade       │              │               │ devreye girmeli│
├──────────────┼──────────────┼──────────────┼───────────────┼────────────┤
│ GAP-BTK-002   │ İçerik bild. │ IT + Hukuk  │ 2025-06-01    │ 24 saat     │
│              │ sistemi kurulum│             │               │ SLA hedefi │
└──────────────┴──────────────┴──────────────┴───────────────┴────────────┘
```

## Pattern 4: Sektörel Özel Uyumluluk Kontrol Listeleri

```
BDDK UYUMLULUK KONTROL LİSTESİ (Bankalar İçin)
├── YÖNETİŞİM (Governance)
│   ├── Yönetim kurulu yapısı ve bağımsızlık
│   ├── Risk komitesi oluşturulması
│   ├── İç kontrol sistemi (Üçüncü savunma hattı)
│   └── Üst düzey yönetici atama prosedürü (Fit & Proper test)
│
├── RİSK YÖNETİMİ
│   ├── Kredi riski derecelendirme (PD, LGD, EAD)
│   ├── Piyasa riski ölçüm yöntemleri (VaR)
│   ├── Likidite riski oranları (LCR, NSFR)
│   ├── Faiz oranı riski
│   └── Operasyonel risk kayıp veritabanı
│
├── SERMAYELENDİRME
│   ├── Sermaye yeterliliği oranı (CAR ≥ %8 + tampon)
│   ├── Düzenleyici sermaye tamponları
│   ├── Sistemically Important Bank (SIB) gereklilikleri
│   └── Stres test sonuçları
│
├── MÜŞTERİ KORUMA
│   ├── KYC/CDD prosedürleri
│   ├── AML/CFT (Suç gelirlerinin aklanması) kontrolleri
│   ├── Bilgi verilmesi yükümlülüğü (Banking Transparency)
│   └── Tüketici kredisi değerlendirme (KKB sorgusu)
│
└── BİLGİ SİSTEMLERİ
    ├── BT güvenlik politikası
    ├── İş sürekliliği planı (BCP/DRP)
    ├── Dış veri merkezi kullanım bildirimi
    └── Bulut bilişim kullanımı (BDDK onayı)

SPK UYUMLULUK KONTROL LİSTESİ (Yatırım Kurumları İçin)
├── SERMAYE YETERLİLİĞİ
│   ├── Asgari özkaynak gerekliliği
│   ├── Risk ağırlıklı varlıklar hesaplaması
│   └── Likidite tamponu
│
├── İŞLEM VE MUHASEBE STANDARTLARI
│   ├── Alım satım işlem raporlaması
│   ├── Saklama hizmeti ayrımı
│   ├── Müşteri varlıklarının ayrı muhasebesi
│   └── Fiyat tespiti prosedürleri
│
├── PAZAR DÜZENİ
│   ├── İçeriden öğrenenlerin ticareti yasağı (Insider trading)
│   ├── Piyap bozucu işlemler
│   ├──Manipülasyon koruması
│   └── Sıklıkla işlem yapanlar raporlaması
│
└── YATIRIMCI KORUMA
    ├── Risk bildirimi (Risk Disclosure Statement)
    ├── Uygunluk değerlendirmesi (Suitability test)
    └── Şikayet mekanizması
```

## Key Patterns (Özet)

| Adım | Eylem | Çıktı |
|---|---|---|
| 1 | Düzenleyici kurum tespiti | Hangi kurumların denetiminde olduğu |
| 2 | İlgili mevzuat toplama | Düzenleme listesi (güncel) |
| 3 | Uyumluluk matrix oluşturma | Madde-madde uyum tablosu |
| 4 | Gap analysis yapma | Boşluk listesi (öncelik sırası) |
| 5 | Aksiyon planı derleme | Tarihli aksiyon tablosu |
| 6 | Periyodik izleme | Denetim takvimi + KPI dashboard |

## Anti-Patterns

```
❌ YALNIZCA MEVZUAT METNİNE GÜVENME
   Resmi gazetede yayınlanan kanun metni yeterli değildir.
   BDDK/BTK/SPK'nın uygulama rehberleri ve yorumları ayrıca incelenmelidir.
   → Kurum web sitelerindeki güncel rehberleri takip et.

❌ SON DENETİM BULGULARINI GÖZARDI ETME
   Geçmiş denetim bulguları gelecek risklerin en iyi göstergesidir.
   → Bir önceki denetimin izleme listesi birincil başlangıç noktası olmalı.

❌ BİR KEZ YAPIP BIRAKMA
   Düzenlemeler sık güncellenir. Statik bir uyumluluk matrix çöptür.
   → 6 aylık periyodik gözden geçirme takvimi oluştur.

❌ OPERASYONEL EKİBİ EĞİTİMİ GÖZARDI ETME
   En iyi prosedür bile eğitimsiz personel ile işlemez.
   → Uyum eğitimlerini yıllık periyodik program olarak planla.

❌ CEZAI YAPTIRIM RİSKİNİ KÜÇÜMSEME
   BDDK para cezaları büyük ölçekli kurumlar için milyarlarca TL olabilir.
   → Her gap için olası yaptırım tutarını hesapla ve üst yönetime raporla.

✅ DOĞRU YAPI
   Kurum haritası → Mevzuat toplama → Matrix oluştur →
   Gap analizi → Aksiyon planı → Uygulama → Periyodik izleme
```

## Quick Reference

| Sektör | Düzenleyici Kurum | Ana Mevzuat | Güncel Takip |
|---|---|---|---|
| Bankacılık | BDDK | 5411 sayılı Kanun | bddk.org.tr |
| Sermaye Piyasası | SPK | 6362 sayılı Kanun | spk.gov.tr |
| Telekomünikasyon | BTK | 5651 sayılı Kanun | btk.gov.tr |
| Enerji | EPDK | 4628 sayılı Kanun | epdk.gov.tr |
| Sigortacılık | TSB | 5684 sayılı Kanun | tsb.org.tr |
| Sağlık | SHWK | 3359 sayılı Kanun | shgm.saglik.gov.tr |
| demiryolu | UDHB | 6461 sayılı Kanun | uab.gov.tr |
| İş Sağlığı | ÇSGB | 6331 sayılı Kanun | csgb.gov.tr |
| Kişisel Veriler | KVKK | 6698 sayılı Kanun | kisiselverilerinkorunmasi.gov.tr |
| Rekabet | Rekabet Kurumu | 4054 sayılı Kanun | rekabet.gov.tr |

---

*Uyarı: Bu kontrol listesi genel rehberlik amaçlıdır. Denetimlere hazırlık için ilgili düzenleyici kurumun güncel mevzuatı ve uzman danışman görüşü alınmalıdır.*
