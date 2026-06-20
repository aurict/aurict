---
name: diy-project-planner
description: DIY proje planlama aracı. Malzeme listesi, adım adım talimatlar, güvenlik uyarıları ve zaman tahmini ile kapsamlı DIY projeleri planlar.
triggers:
  - "DIY proje planla"
  - "kendin yap projesi"
  - "marangozluk projesi"
  - "ev tadilatı"
  - "diy planning"
  - "project instructions"
auto_load_when:
  - home_improvement
  - craft_projects
  - renovation_planning
  - maker_skills
  - woodworking
agent: content-ops
tools:
  - markdown_writer
  - template_generator
  - checklist_generator
---

# DIY Project Planner — Kendin Yap Proje Planlayıcı

Başarılı DIY projeleri rastlantıya değil, plana bağlıdır. Bu skill; malzeme hesabından adım adım talimata, güvenlikten zaman planlamasına kadar profesyonel düzeyde proje planları üretir.

---

## Pattern: Project Initiation (Proje Başlatma)

```
Project Initiation
├── Step 1: Scope Definition
│   ├── Project type
│   │   ├── Woodworking / marangozluk
│   │   ├── Home repair / onarım
│   │   ├── Decor / dekorasyon
│   │   ├── Electrical / elektrik
│   │   ├── Plumbing / tesisat
│   │   ├── Painting / boyama
│   │   ├── Upholstery / döşeme
│   │   └── Textile / kumaş / dikiş
│   │
│   ├── Scope parameters
│   │   ├── Boyutlar (cm veya m)
│   │   ├── Malzeme hedefi (meşe, MDF, metal vb.)
│   │   ├── Kullanım amacı
│   │   ├── Yer / uygulama alanı
│   │   └── Hedef maliyet
│   │
│   └── Constraints
│       ├── Bütçe
│       ├── Zaman
│       ├── Beceri seviyesi
│       └── Araç erişilebilirliği
│
├── Step 2: Skill Assessment
│   ├── Beginner
│   │   └── Basit kesme, yapıştırma, montaj
│   ├── Intermediate
│   │   └── Ölçme, hizalama, karmaşık montaj
│   └── Advanced
│       └── Precision work, joinery, electrical
│
└── Step 3: Risk Assessment
    ├── Physical hazards
    ├── Material hazards
    ├── Tool hazards
    └── Environmental hazards
```

---

## Pattern: Material List Generation (Malzeme Listesi Oluşturma)

```
Material List Generation
├── Primary Materials (Ana Malzemeler)
│   ├── Material name
│   │   └── Örnek: Gürgen kereste
│   ├── Quantity
│   │   └── Örnek: 4 adet, 2.5m uzunluğunda
│   ├── Dimensions
│   │   └── Örnek: 5cm × 10cm × 250cm
│   ├── Grade / quality
│   │   └── Örnek: A sınıfı, düğümsüz
│   └── Estimated cost
│       └── Örnek: ~450 TL
│
├── Hardware / Fitting (Aksamlari)
│   ├── Sabit aksamlari
│   │   ├── Vida (boyuta göre)
│   │   ├── Civata / somun
│   │   ├── Menteşe
│   │   ├── Kulp / tutamak
│   │   └── Zımba / çivi
│   │
│   ├── Bağlayıcılar
│   │   ├── Tutkal (tahta, metal, epoksi)
│   │   ├── Macun / silikon
│   │   └── Kaynak çubuğu (varsa)
│   │
│   └── Yüzey işleme
│       ├── Vernik / lake
│       ├── Boya
│       ├── Ahşap yağı / cila
│       └── Zımpara (kademeli: 80–320)
│
├── Consumables (Sarf Malzemeleri)
│   ├── Zımpara kâğıdı (kademeli: 80, 120, 220, 320)
│   ├── Bez / bez parçaları
│   ├── Masking tape / bant
│   ├── Koruyucu ekipman
│   └── Temizlik malzemeleri
│
├── Tools Required (Gerekli Aletler)
│   ├── Measuring
│   │   ├── Şerit metre
│   │   ├── Kumpas
│   │   ├── Gönye
│   │   ├── Su terazisi
│   │   └── Gönye cetveli
│   │
│   ├── Cutting
│   │   ├── Testere (türü belirt)
│   │   ├── Dairesel testere
│   │   ├── Miter saw (gönyeli testere)
│   │   └── El testeresi
│   │
│   ├── Assembly
│   │   ├── Matkap + uçlar
│   │   ├── Tornavida / vidalama
│   │   ├── Penseler
│   │   ├── Kelepçeler (F-clamps)
│   │   └── Çekiç
│   │
│   ├── Finishing
│   │   ├── Boya fırçası / rulo
│   │   ├── Püskült / tabanca
│   │   ├── Spatula
│   │   └── Zımpara makinesi (opsiyonel)
│   └── Safety
│       ├── Gözlük
│       ├── Eldiven
│       ├── Toz maskesi
│       ├── Kulaklık
│       └── İlk yardım kiti
│
└── Cost Summary Table
    ├── Ana malzemeler: X TL
    ├── Aksamlar: Y TL
    ├── Sarf malzemesi: Z TL
    └── TOPLAM: X+Y+Z TL
```

---

## Pattern: Step-by-Step Instructions (Adım Adım Talimatlar)

```
Step-by-Step Instructions
├── Phase 1: Preparation (Hazırlık)
│   ├── Step 1: Workspace setup
│   │   ├── "Çalışma alanını temizleyip düzleştirin"
│   │   ├── "Yeterli ışık sağlayın"
│   │   └── "Gereken aletleri masaya dizin"
│   │
│   ├── Step 2: Material preparation
│   │   ├── "Keresteleri işaretleyin"
│   │   ├── "Kesim çizgilerini çizin"
│   │   └── "Önceden zımparalayın (opsiyonel)"
│   │
│   └── Step 3: Safety check
│       ├── "Güvenlik ekipmanınızı takın"
│       ├── "Aletlerin kontrolünü yapın"
│       └── "Havalandırmayı sağlayın"
│
├── Phase 2: Cutting (Kesim)
│   ├── Step N: First cut
│   │   ├── "Ölçü: X cm"
│   │   ├── "Kesim hattını çizin"
│   │   ├── "Güvenli kesim tekniği:"
│   │   └── ⚠️ UYARI: "Elinizi kesim hattından uzak tutun"
│   │
│   ├── Step N+1: Second cut
│   │   └── (same structure)
│   │
│   └── Step N+2: Angled cuts
│       └── "Gönye açısı: 45°" — kesim şablonu kullanın
│
├── Phase 3: Assembly (Montaj)
│   ├── Dry fit (kuru deneme)
│   │   ├── "Parçaları tutkulsız birleştirin"
│   │   ├── "Hizalamayı kontrol edin"
│   │   └── "Gerekirse zımparalayın / düzeltin"
│   │
│   ├── Gluing (yapıştırma)
│   │   ├── "Tutkalı eşit tabaka halinde sürün"
│   │   ├── "Parçaları hizalayın"
│   │   ├── "Kelepçe ile sabitleyin"
│   │   └── "Kuruma süresi: 24 saat"
│   │
│   ├── Screw / bolt assembly
│   │   ├── "Ön delik açın (zıplama önlemek için)"
│   │   ├── "Vidayı dikkatlice sıkın"
│   │   └── "Aşırı sıkmaktan kaçının"
│   │
│   └── Reinforcement
│       └── "Köşebent / metal bağlantı ekleyin (gerekirse)"
│
├── Phase 4: Finishing (Yüzey İşlemi)
│   ├── Sanding (zımparalama)
│   │   ├── "Kademeli zımparalama: 120 → 180 → 220"
│   │   ├── "Her kademe arasında tozu temizleyin"
│   │   └── "Köşeleri yuvarlatın (chamfer)"
│   │
│   ├── Staining / painting
│   │   ├── "İnce tabaka uygulayın"
│   │   ├── "Kurumasını bekleyin"
│   │   ├── "Hafifçe zımparalayın (220)"
│   │   └── "İkinci kat uygulayın"
│   │
│   └── Sealing
│       ├── "Vernik / cila katmanları"
│       └── "Kuruma süresi: her kat 24 saat"
│
└── Phase 5: Installation (Kurulum)
    └── "Yüzeye montaj / yerleştirme"
        └── "Seviye kontrolü yapın"
        └── "Sabitleme işlemleri"
```

---

## Pattern: Safety Warnings System (Güvenlik Uyarı Sistemi)

```
Safety Warning System
├── ⚠️ ALWAYS (Her zaman)
│   ├── "Koruyucu gözlük takın — flying debris riski"
│   ├── "Toz maskesi kullanın — özellikle zımparalama sırasında"
│   ├── "İyi havalandırılmış alanda çalışın"
│   ├── "Çalışırken dikkatli olun — alkol / ilaç etkisinde DEĞİL"
│   └── "Çalışma tezgahı sabit ve sağlam olsun"
│
├── ⚠️ Power Tools (Elektrikli Aletler)
│   ├── "Kabloya basmayın — trip hazard"
│   ├── "Koruyucu kapağı açmayın — kesim sırasında asla"
│   ├── "Malzemeyi kesinlikle elinizle tutmayın — klemp kullanın"
│   ├── "Testere bıçağı tamamen durmadan malzemeye dokunmayın"
│   └── "Hasarlı kablo / fiş kullanmayın — elektrik çarpması riski"
│
├── ⚠️ Chemical Safety (Kimyasallar)
│   ├── "Tutkal / vernik / tiner: Eldiven + gözlük gerekli"
│   ├── "Havalandırma şart — asla kapalı alanda"
│   ├── "Yanıcı maddeleri ısı kaynağından uzak tutun"
│   ├── "Cilt temasında bol su ile yıkayın"
│   └── "Yutmayın — çocuklardan uzak tutun"
│
├── ⚠️ Sharp Tools (Keskin Aletler)
│   ├── "Bıçak / maket bıçağı: kesme yönüne dikkat"
│   ├── "Kesim sonrası bıçağı hemen kapatın / kılıfla kapatın"
│   ├── "Zımba tabancası: parmağınızı tetikten uzak tutun"
│   └── "Şerit metre / cetvel kullanırken bıçak kaydırmayın"
│
├── ⚠️ Heavy Lifting (Ağır Kaldırma)
│   ├── "50 kg üstü: iki kişi veya ekipman kullanın"
│   ├── "Sırt düz, dizler bükük prensibi"
│   └── "Dengesiz yük: devrilme riskine karşı sabitleyin"
│
└── 🚨 Emergency Protocol
    ├── Yaralanma: İlk yardım + gerekirse 112
    ├── Elektrik çarpması: Elektriği kapat, 112
    ├── Yangın: Yangın söndürücü kullan, 110
    └── Kimyasal temas: Bol su, tıbbi yardım alın
```

---

## Pattern: Time Estimation (Zaman Tahmini)

```
Time Estimation
├── Project Phases & Time Allocation
│   ├── Planning & shopping
│   │   └── Araştırma + malzeme temini: X saat
│   ├── Preparation
│   │   └── Alan hazırlama, malzeme kesme: X saat
│   ├── Assembly
│   │   └── Montaj: X saat
│   ├── Finishing
│   │   └── Zımparalama, boyama, vernik: X saat
│   ├── Drying / curing
│   │   └── Bekleme süresi (kritik!): X saat / gece
│   └── Installation
│       └── Kurulum: X saat
│
├── Total Project Time
│   └── Active work: X saat
│       Waiting time: Y saat
│       Total: X + Y saat
│
├── Buffer Time (%20–30)
│   └── Her aşamaya %20 ek buffer ekle
│
└── Milestone Schedule
    ├── Milestone 1: [Tarih] — Malzemeler hazır
    ├── Milestone 2: [Tarih] — Kesim tamamlandı
    ├── Milestone 3: [Tarih] — Montaj tamamlandı
    ├── Milestone 4: [Tarih] — Finishing başladı
    └── Milestone 5: [Tarih] — Proje tamamlandı
```

---

## Key Patterns

| Proje Türü | Zorluk | Ortalama Süre | Başlangıç Malzeme Maliyeti |
|---|---|---|---|
| **Raf / dolap** | Başlangıç | 4–8 saat | 200–800 TL |
| **Masa** | Orta | 8–16 saat | 500–2.000 TL |
| **Sandalye** | Orta | 6–12 saat | 300–1.000 TL |
| **TV ünitesi** | Orta-İleri | 12–24 saat | 800–3.000 TL |
| **Yatak çerçevesi** | İleri | 16–32 saat | 1.500–5.000 TL |
| **Bahçe mobilya** | Başlangıç-Orta | 8–20 saat | 400–2.000 TL |
| **Duvara raf** | Başlangıç | 2–4 saat | 100–300 TL |
| **Baskıılı ahşap sanat** | Başlangıç | 3–6 saat | 150–500 TL |

---

## Anti-Patterns

```
❌ Ölçmeden kesme — "yaklaşık olur" düşüncesi
   → İki kez ölç, bir kez kes

❌ Yeterli ışık olmadan çalışma — kaza riski
   → İş yerini aydınlat

❌ "Bu aleti bilmiyorum ama deneyeyim" — eğitim almadan riskli alet kullanma
   → YouTube tutorial + güvenlik videosu izle

❌ Hızlı kuruma isteği — vernik / tutkal kuruma süresini atlama
   → Bekleme süresi = kalite. Asla atlamayın

❌ Güvenlik ekipmanını ihmal etme
   → Gözlük, maske, kulaklık = zorunlu

❌ Malzeme eksikliği — yarıda bırakma
   → Alışveriş listesini 2 kez kontrol et

✅ Her aşamadan önce araç setini hazırla
✅ "Dry fit" (kuru montaj) her zaman yap
✅ Proje günlüğü tut — hataları not al, gelecekte yararlan
✅ Komşulara / aileye haber ver (gürültülü işler)
✅ İlk proje olarak basit bir şeyle başla
```

---

## Quick Reference

| Element | Kural | Örnek |
|---|---|---|
| **Ölçüm** | 2× ölç, 1× kes | "3 defa kontrol ettim" |
| **Güvenlik** | Ekipman = zorunlu | Gözlük, maske, eldiven |
| **Kuruma** | Belirtilen sürenin en az %100'ü | Tutkal: 24 saat minimum |
| **Tutarlılık** | Kademeli zımparalama | 120 → 180 → 220 |
| **Bütçe** | %20–30 buffer ekle | 1000 TL = 1200–1300 TL hazırla |
| **Zaman** | Her aşamaya buffer | Hesaplanan × 1.3 |
| **Malzeme** | Fazla al = israf | Ama eksik = yarıda kalma |
| **Klemp** | El yerine alet | Malzemeyi sabit tut, eli serbest bırak |
| **Drying** | Hızlandırmayın | Isı + fan = çatlama riski |
| **Test** | Her aşamayı test et | Sonra montaj yap |
