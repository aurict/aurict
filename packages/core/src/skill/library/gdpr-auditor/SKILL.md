---
name: gdpr-auditor
description: "GDPR/KVKK uyumluluk denetimi, veri envanteri, düzenleme matris, risk değerlendirme ve politika şablonları."
triggers:
  keywords: ["KVKK", "GDPR", "veri koruma", "kişisel veri", "uyumluluk denetimi", "veri envanteri", "privacy audit"]
auto_load_when: "Kullanıcı kişisel verilerin korunması, KVKK/GDPR uyumluluk denetimi, veri işleme envanteri veya politika oluşturma talep eder"
agent: content-ops
tools: ["Read", "Write", "WebFetch", "WebSearch"]
---

# GDPR Auditor

**Odağ Alanı:** Avrupa Birliği Genel Veri Koruma Tüzüğü (GDPR) ve Türkiye Kişisel Verilerin Korunması Kanunu (KVKK) kapsamında kurumsal uyumluluk denetimi, veri işleme envanteri oluşturma, risk değerlendirmesi ve politika şablonları geliştirme.

## Pattern 1: Uyumluluk Denetim Protokolü

```
1. UYGULAMA KAPSAMI BELİRLEME (Scoping)
├── KURULUŞ TİPİ TESPİTİ
│   ├── AB merkezli kuruluş (GDPR m. 3 – coğrafi kapsam)
│   │   └── AB'de yerleşik tüm işleme faaliyetleri
│   ├── AB dışı kuruluş (GDPR m. 3/2 – hedefleme kuralı)
│   │   └── AB vatandaşlarına mal/hizmet sunan veya izlenen
│   └── Türkiye merkezli (KVKK kapsamı)
│       └── Türkiye'de yerleşik gerçek kişilere ait veriler
│
├── VERİ İŞLEME TİPİNİ SINIFLANDIR
│   ├── Genel veri işleme (izinsiz işleme)
│   ├── Özel nitelikli veri işleme (GDPR m. 9 – ırk, sağlık, biyometrik)
│   ├── Otomatik karar verme (profil kümele, scoring)
│   └── Çapraz sınır veri aktarımı (AB → üçüncü ülke)
│
└── DENETİM KAPSAMINI TANIMLA
    ├── Tam kapsamlı denetim (kurumsal genel)
    ├── Konu bazlı denetim (tek ürün/ süreç)
    └── Paydaş bazlı denetim (üçüncü taraf tedarikçiler)

2. YASAL DAYANAK ANALİZİ (Legal Basis)
┌─────────────────────────────────────────────────────────────────┐
│ GDPR Makul Dayanak Seçenekleri                                   │
├──────────────────────────────┬──────────────────────────────────┤
│ Açık rıza (Consent) m. 6/1(a)│ • Belirli, bilgilendirilmiş,     │
│                              │   açık ve aktif onay              │
│                              │ • Her zaman geri çekilebilir      │
├──────────────────────────────┼──────────────────────────────────┤
│ Sözleşme ifası m. 6/1(b)     │ • Veri işlenmesi sözleşmenin      │
│                              │   gerekli unsuru olmalı            │
├──────────────────────────────┼──────────────────────────────────┤
│ Hukuki yükümlülük m. 6/1(c)  │ • Yasal düzenleme gereği          │
│                              │   ( vergi kaydı, muhasebe)         │
├──────────────────────────────┼──────────────────────────────────┤
│ Meşru menfaat m. 6/1(f)      │ • Düzenleyici test uygulanır      │
│                              │   ( meşru menfaat > veri sahibinin │
│                              │   çıkarları ve bekletilenler)      │
├──────────────────────────────┼──────────────────────────────────┤
│ Hayati önem m. 6/1(d)        │ • Veri sahibinin veya başkasının  │
│                              │   hayatını koruma                   │
├──────────────────────────────┼──────────────────────────────────┤
│ Kamu yaran m. 6/1(e)         │ • Resmi otoriteye veri aktarım     │
└──────────────────────────────┴──────────────────────────────────┘
```

## Pattern 2: Veri Envanteri Oluşturma (DPIA)

```
VERİ İŞLEME ENVENTERİ MATRİSİ
┌────────────┬──────────────┬─────────────┬─────────────┬───────────────┬──────────────┬──────────────┐
│ Veri Türü  │ Toplama     │ İşleme     │ Saklama     │ Aktarım       │ Hukuki      │ Güvenlik    │
│            │ Yöntemi     │ Amacı      │ Süresi      │ (Ülke/Taraf)  │ Dayanak      │ Önlemi       │
├────────────┼──────────────┼─────────────┼─────────────┼───────────────┼──────────────┼──────────────┤
│ Ad Soyad   │ Web form    │ CRM        │ Sözleşme    │ AB ülkeleri   │ Sözleşme    │ Şifreleme   │
│            │             │ yönetimi   │ süresi +3yıl │ (SCC)         │ ifası       │ (AES-256)   │
├────────────┼──────────────┼─────────────┼─────────────┼───────────────┼──────────────┼──────────────┤
│ E-posta    │ Kayıt form  │ Pazarlama  │ Açık rıza   │ Mailchimp     │ Açık rıza   │ TLS 1.3     │
│            │             │            │ geri        │ (ABD)         │            │             │
├────────────┼──────────────┼─────────────┼─────────────┼───────────────┼──────────────┼──────────────┤
│ IP adresi  │ Web sunucusu│ Analitik  │ 12 ay       │ Google        │ Meşru      │ Maskeleme   │
│            │ logları     │            │             │ Analytics    │ menfaat     │ (anonimleştir│
│            │             │            │             │ (ABD)        │            │ 25. aydan itibaren│
├────────────┼──────────────┼─────────────┼─────────────┼───────────────┼──────────────┼──────────────┤
│ Biyometrik │ Mobil       │ Kimlik     │ Sözleşme    │ YOK          │ Açık rıza   │ Biyometrik  │
│ veri (yüz  │ uygulama    │ doğrulama  │ süresi      │             │ (özel      │ şifreleme   │
│ tanıma)    │             │            │             │             │ kategori)  │             │
└────────────┴──────────────┴─────────────┴─────────────┴───────────────┴──────────────┴──────────────┘

VERİ KATEGORİ MATRİSİ
├── 🔴 ÖZEL NİTELİKLİ VERİ (GDPR m. 9 / KVKK m. 6)
│   ├── Irksal/etnik köken, siyasi görüş, dini inanç
│   ├── Sendika üyeliği, genetik/biyometrik veri
│   ├── Sağlık verileri, cinsel yaşam veya yönelim
│   └── İşlem: Açık rıza GEREKLİ + Ek koruma önlemleri
│
├── 🟡 Kişisel Veriler (standart)
│   ├── Ad, soyad, e-posta, telefon, adres
│   ├── IP adresi, cookie verileri, davranışsal veri
│   └── İşlem: Meşru menfaat veya sözleşme ifası yeterli
│
└── ⚪ Anonimleştirilmiş Veri
    ├── Yeniden kimliklendirme riski < %0.01 (k-Anonymity test)
    └── GDPR/KVKK kapsamı DIŞINDA
```

## Pattern 3: Risk Değerlendirme Matrisi

```
VERİ KORUMA RİSK DEĞERLENDİRME MATRİSİ (DPIA)
┌──────────────────────────────┬──────────────────────┬────────────────────┐
│ Risk Kategorisi               │ Etki (1-5)          │ Olasılık (1-5)     │
├──────────────────────────────┼──────────────────────┼────────────────────┤
│ Veri ihlali (sızıntı)         │ 🔴 5 – Kritik        │ 🟡 3 – Orta        │
│ Yetkisiz erişim               │ 🔴 4 – Yüksek        │ 🟡 3 – Orta        │
│ Veri kalitesi kaybı           │ 🟡 3 – Orta           │ 🟡 4 – Yüksek      │
│ Yanlış amaçla işleme           │ 🔴 5 – Kritik        │ ⚪ 1 – Düşük       │
│ Çapraz sınır aktarım           │ 🔴 4 – Yüksek        │ 🟡 3 – Orta        │
│ Otomatik karar verme           │ 🟡 3 – Orta           │ 🟡 3 – Orta        │
│ Profil oluşturma               │ 🟡 3 – Orta           │ 🟡 4 – Yüksek      │
│ Veri sahibi hakları ihlali     │ 🟡 3 – Orta           │ 🟡 3 – Orta        │
└──────────────────────────────┴──────────────────────┴────────────────────┘

RİSK PUANLAMASI: Etki × Olasılık = Toplam Risk
├── >15: 🔴 KRITIK → Hemen müdahale (72 saat içinde aksiyon)
├── 8-15: 🟡 YÜKSEK → 30 gün içinde aksiyon planı
├── 3-7: 🟢 ORTA → 90 gün içinde iyileştirme
└── <3: ⚪ DÜŞÜK → Gözlem altında tut

HER RİSK İÇİN AZALTIM STRATEJİSİ:
├── Teknik önlem: Şifreleme (AES-256), erişim kontrolü (RBAC), denetim günlüğü
├── Organizasyonel önlem: Veri koruma eğitimi, prosedürler, görev tanımları
├── Sözleşmesel önlem: DPA (Veri İşleme Anlaşması), SCC (Standart Sözleşme Maddeleri)
└── Sigorta: Cyberspace sigortası (veri ihlali kapsamında)
```

## Pattern 4: Politika Şablonları

```
DOKÜMAN ŞABLONLARI - GEREKLİ DOKÜMANLAR
├── 1. VERİ KORUMA POLİTİKASI (Data Protection Policy)
│   ├── Amaç ve kapsam
│   ├── Tanımlar (kişisel veri, veri işleyen, veri sorumlusu)
│   ├── İşlenen veri kategorileri ve amaçları
│   ├── Hukuki dayanaklar
│   ├── Veri sahibi hakları
│   └── Organizasyonel sorumluluklar
│
├── 2. AYDINLATMA METNİ (Privacy Notice)
│   ├── Veri sorumlusunun kimliği ve iletişim bilgileri
│   ├── İşlenen veri kategorileri
│   ├── İşleme amaçları ve hukuki dayanaklar
│   ├── Verilerin aktarıldığı üçüncü taraflar
│   ├── Saklama süreleri
│   └── Veri sahibi hakları ve başvuru yöntemi
│
├── 3. ÇEREZ POLİTİKASI (Cookie Policy)
│   ├── Kullanılan çerez kategorileri (zorunlu/analitik/pazarlama)
│   ├── Her çerezin amacı ve saklama süresi
│   ├── Kullanıcı onay mekanizması
│   └── Üçüncü taraf çerezleri (Google Analytics, Pixel vb.)
│
├── 4. VERİ İŞLEME ANLAŞMASI (DPA – Data Processing Agreement)
│   ├── Veri işleyenin yükümlülükleri
│   ├── Güvenlik önlemleri (teknik ve organizasyonel)
│   ├── Alt veri işleyen kullanımı (alt işlemeci onayı)
│   ├── Veri ihlali bildirim prosedürü
│   └── Denetim hakları
│
├── 5. VERİ İHLALİ MÜDAHALE PLANI (Breach Response Plan)
│   ├── 72 saat içinde denetleyiciye bildirim (GDPR m. 33)
│   ├── Veri sahiplerine bildirim (GDPR m. 34 – yüksek risk durumunda)
│   ├── İhlal tespit ve sınıflandırma prosedürü
│   └── Kayıt ve dokümantasyon (GDPR m. 33/5)
│
└── 6. VERİ SAHİBİ BAŞVURU FORMU
    ├── Kimlik doğrulama prosedürü
    ├── Başvuru değerlendirme süresi (30 gün)
    ├── Yanıt formatı ve içeriği
    └── Ücretsiz işlem garantisi
```

## Key Patterns (Özet)

| Adım | Eylem | Çıktı |
|---|---|---|
| 1 | Kapsam ve yasal dayanak belirleme | Scoping raporu |
| 2 | Veri envanteri çıkarma | DPIA matrisi (tüm veri kategorileri) |
| 3 | Risk değerlendirmesi yapma | Risk matrisi + puanlama |
| 4 | Boşluk analizi (Gap analysis) | Uyumluluk boşlukları listesi |
| 5 | Politika ve prosedür taslağı | Tam doküman seti |
| 6 | Uygulama planı oluşturma | Aksiyon planı + zaman çizelgesi |

## Anti-Patterns

```
❌ VERİ ENVANTERİNİ EKSİK TUTMA
   Bilinmeyen veri işleme faaliyetleri denetlenemez.
   → Tüm departmanlardan (IT, HR, Pazarlama, Satış) veri akışı haritası çıkar.

❌ "Rıza GEREKLİ" DEMEK YETMEZ
   Rızanın her zaman en uygun hukuki dayanak olmadığını unutma.
   → Meşru menfaat testini uygula; rıza yalnızca gerektiğinde kullan.

❌ ÇAPRAZ SINIR AKTARIMI KURALLARINI İHMAL ETME
   ABD'ye veri aktarımı için Shield artık yeterli değil.
   → SCC (Standart Sözleşme Maddeleri) veya adequacy kararı gerekli.

❌ VERİ İHLALİNİ 72 SAATTE BİLDİRMEYİ UNUTMA
   Bildirim yapılmaması GDPR para cezasının en büyük kalemlerinden biri.
   → Otomatik alert sistemi kur ve ihlal müdahale planını önceden test et.

❌ YALNIZCA TEKNİK ÖNLEMLERE GÜVENME
   %90 güvenlik ihlali insan faktöründen kaynaklanır.
   → Organizasyonel önlemler (eğitim, prosedür) teknik önlemlerle eşit ağırlıkta olmalı.

✅ DOĞRU YAPI
   Kapsam belirle → Yasal dayanak analizi → Veri envanteri çıkar →
   Risk değerlendirmesi → Boşluk analizi → Politika seti oluştur →
   Uygulama ve izleme planı → Sürekli iyileştirme
```

## Quick Reference

| Görev | Araç/Kaynak | Detay |
|---|---|---|
| Veri envanteri | DPIA Template (ICO) | Veri akışı, amaç, saklama, aktarım |
| Risk değerlendirme | CIPP/E Risk Framework | Etki × Olasılık matrisi |
| Açık rıza kontrolü | GDPR Consent Form Checker | 5 kriter testi |
| Çerez uyumluluğu | Cookiebot / OneTrust | Otomatik tarama ve etiketleme |
| Çapraz sınır aktarımı | SCC Generator (EU Commission) | Modül 1-4 seçimi |
| Veri ihlali bildirimi | ICO Breach Notification | 72 saat formu |
| KVKK başvurusu | KVKK resmi sitesi | kisiselverilerinkorunmasi.gov.tr |
| Uyumluluk çerçevesi | ISO 27701 (PIMS) | Kişisel bilgi yönetim sistemi |
| Eğitim materyali | IAPP (CIPP/E, CIPM) | Veri koruma profesyonel sertifikası |
| Denetim takibi | Trackers (GDPR tracker) | Periyodik uyumluluk izleme |

---

*Uyarı: Bu denetim rehberi KVKK ve GDPR uyumluluğu için rehberlik sağlar. Hukuki danışmanlık yerine geçmez. Büyük ölçekli veya hassas veri işleme faaliyetleri için uzman denetçi ile çalışılmalıdır.*
