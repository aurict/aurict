---
name: apology-email-writer
description: "Kriz iletişimi. Empathetic response. Recovery actions. Compensation offers."
triggers:
  keywords: ["apology email writer", "özür mektubu", "kriz iletişimi", "müşteri özür e-postası", "empatik yanıt"]
auto_load_when: "Kullanıcı kriz durumlarında özür e-postası yazmayı, empatik yanıt oluşturmayı veya müşteri kurtarma aksiyonları talep ettiğinde"
agent: content-ops
tools: ["Read", "Write", "Bash", "grep", "glob"]
---

# Apology Email Writer (Özür E-postası Yazarı)

**Odak Alanı:** Kriz iletişimi, empatik özür mesajları oluşturma, kurtarma aksiyonları belirleme ve tazminat teklifleri hazırlama.

---

## Pattern: Özür E-postası Oluşturma Süreci

### Adım 1: Durum Analizi
Krizin ciddiyetini ve bağlamını değerlendir:
```
Kriz Seviyesi Değerlendirmesi:
KRİTİK (Level 5)
├── Veri kaybı/veri ihlali
├── Sistem tamamen kapalı
├── Finansal kayıp (müşteri için)
└── Güvenlik endişesi

YÜKSEK (Level 4)
├── Uzun süreli hizmet kesintisi
├── Ciddi performans düşüşü
├── Hatalı faturalama
└── Yanlış veri işleme

ORTA (Level 3)
├── Özellik hatası (iş etkili değil)
├── Beklenmeyen davranış
├── Dokümantasyon hatası
└── Geçici kesinti

DÜŞÜK (Level 2)
├── Görsel/format hatası
├── Minor UI bug
├── Küçük gecikme
└── İletişim karmaşası

ŞİKAYET (Level 1)
├── Müşteri beklentisi karşılanmadı
├── Kozmetik şikayet
├── Kişisel tercih farkı
└── Genel memnuniyetsizlik
```

### Adım 2: Empatik Çerçeve Oluşturma
Müşterinin yaşadığı sorunu anladığınızı gösterin:
```
Empatik Çerçeve Bileşenleri:
1. DUYGU TANIMA
   → "Sorununuzu yaşadığınızı anlıyoruz"
   → "Bu deneyimin sizi ne kadar hayal kırıklığına uğrattığını biliyoruz"

2. OLAYI KABUL ETME
   → "Evet, bu bizim hatamızdır"
   → "Sisteminizde yaşanan kesinti doğrudur"

3. SORUMLULUK ALMA
   → "Bu durumdan dolayı sorumluluğumuzu kabul ediyoruz"
   → "Sizin veya işletmenizin etkilendiği için üzgünüz"

4. İMPACT'İ ANLAMA
   → "Bekleme süresinin sizin için ne ifade ettiğini anlıyoruz"
   → "Sunduğunuz hizmetlerin aksamış olabileceğinin farkındayız"
```

### Adım 3: Kurtarma Aksiyonu Bildir
Somut düzeltme adımlarını paylaşın:
```
Aksiyon Bildirimi:
HEMEN YAPILANLAR
├── "Sistem ekibimiz konuyu inceliyor"
├── "Mühendislerimiz durumu çözmek için çalışıyor"
└── "Şu anda aldığımız önlemler..."

ORTA VADELİ (1-7 GÜN)
├── "Bu tür sorunların önüne geçmek için..."
├── "Altyapı iyileştirmeleri yapıyoruz"
└── "Daha sıkı izleme sistemleri kuruyoruz"

UZUN VADELİ (SÜREKLİ)
├── "Kalıcı çözüm olarak..."
├── "Gelecekte benzer sorunları önlemek için..."
└── "Bu deneyimden öğrendiklerimizi paylaşıyoruz"
```

### Adım 4: Tazminat/Çözüm Teklifi
Uygun tazminat belirleyin:
```
Tazminat Matrisi:
Kriz Seviyesi × Müşteri Değeri
─────────────────────────────────────────────────
KRİTİK + YÜKSEK DEĞER
→ Tam iade veya 12 aylık ücretsiz kullanım
→ Özel account manager ataması
→ Executive özür call'u
→ Özelleştirilmiş çözüm paketi

YÜKSEK + ORTA DEĞER
→ 3-6 aylık ücretsiz kullanım
→ Ücretsiz upgrade
→ Öncelikli destek hattı

ORTA + HER DEĞER
→ 1 aylık ücretsiz kullanım veya kupon
→ Ücretsiz ek hizmet (danışmanlık, training)
→ Gelecek indirim garantisi

DÜŞÜK
→ Kupon (%10-20)
→ Minik hediye/benefit
→ Minnettarlık ifadesi

ŞİKAYET
→ Dürüst özür + "Teşekkür ederiz"
→ İsteğe bağlı küçük jest
→ Gelecekte öncelikli hatırlatma
```

### Adım 5: Gelecek Güvencesi Verme
Müşterinin güvenini yeniden kazanmak için somut adımlar:
```
Güvence Bileşenleri:
SOMUT ADIMLAR
├── "Artık X özelliği şu şekilde korunuyor"
├── "24/7 izleme sistemimiz aktif"
└── "Yedekleme süremiz X dakikaya düşürüldü"

SLA GARANTİSİ
├── "Bir daha böyle bir kesinti yaşanmaması için..."
├── "SLA garantimizi X'e yükseltiyoruz"
└── "Bu konudaki taahhüdümüz..."

İLETİŞİM VAADİ
├── "Sizi proaktif olarak bilgilendireceğiz"
├── "Status page'mizi güncelliyoruz"
└── "Size özel bildirim kanalları açıyoruz"
```

### Adım 6: Email Yapısı
Standart özür email formatı:
```
Email Bölümleri:
1. BAŞLIK (Subject)
   → Kısa, dürüst, aciliyet belirten
   → Örnek: "Yaşanan Kesinti İçin Dürüst Özürümüz"

2. AÇILIŞ (1-2 cümle)
   → Empatik başlangıç
   → Krizi kısaca tanımla

3. OLAY AÇIKLAMASI (2-3 cümle)
   → Ne olduğunu açıkla
   → Ne kadar sürdüğünü belirt
   → Nedenini kısaca açıkla (detay yok)

4. ETKİ KABULÜ (1-2 cümle)
   → Müşterinin etkilendiğini kabul et
   → Empatik ifade

5. ÇÖZÜM VE AKSIYONLAR (3-5 cümle)
   → Hemen yapılanlar
   → Gelecek önlemler
   → Somut detaylar

6. TAZMİNAT (1-2 cümle)
   → Ne sunduğunuzu açıkça belirt
   → Nasıl kullanılacağını açıkla

7. TAKİP SÖZÜ (1 cümle)
   → "Herhangi bir sorunuz varsa bize ulaşın"
   → İletişim bilgisi

8. İMZA
   → Gerçek isim + pozisyon
   → Şirket logosu (varsa)
```

---

## Key Patterns (Ana Kalıplar)

| Pattern | Açıklama | Etki |
|---|---|---|
| **HUMBLE Framework** | Humility + Understanding + Morale + Benefit + Leverage | Güven yenileme |
| **Recovery Narrative** | Olay → Aksiyon → Gelecek | Anlamlı anlatım |
| **Specific Apology** | Genel değil, spesifik özür | Dürüst izlenim |
| **Future Commitment** | Somut gelecek garantisi | Güven inşası |
| **Compensation Transparency** | Tazminat açık ve net | Adalet hissi |

---

## Anti-Patterns (Kaçınılması Gerekenler)

### ❌ Yanlış Uygulamalar

```yaml
# Suçluyu müşteriye yüklemek
problem: "'Bazı kullanıcılar sistemi yanlış kullandı'"
result: "Savunmacı duruş, öfke artışı"

# Yüzeysel özür
problem: "'Üzgünüz' deyip geçmek"
result: "Samimiyetsiz, geçiştirilmiş hissi"

# Aşırı teknik detay
problem: "3 paragraf sunucu log'ları açıklamak"
result: "Müşteri sıkılır, ana mesaj kaybolur"

# Absürt büyük tazminat
problem: "Minor bug için 1 yıl ücretsiz"
result: "Brand value düşer, beklenti şişer"

# Boş vaatler
problem: "'Her zaman en iyi hizmeti sunacağız'"
result: "Somut yok, güven artmaz"

# Geç özür
problem: "10 gün sonra özür email'i"
result: "Çok geç, müşteri zaten gitmiş"
```

### ✅ Doğru Uygulamalar

```yaml
# Tam sorumluluk alma
approach: "'Bu tamamen bizim hatamızdır ve üzgünüz'"
result: "Samimi, müşteri dinlenmiş hisseder"

# Spesifik ve somut özür
approach: "'Sunucu yedekleme sisteminin başarısızlığı nedeniyle 2 saat erişim' + 'Bu asla olmamalıydı'"
result: "Dürüst, detaylı, güvenilir"

# Kısa ve etkili
approach: "Maksimum 10 cümle, net mesaj"
result: "Okunur, akılda kalır"

# Orantılı tazminat
approach: "Kriz seviyesine göre tazminat belirleme"
result: "Adaletli, brand değeri korunur"

# Somut gelecek garantisi
approach: "'Artık 3 farklı sunucuda yedekliyoruz ve 24/7 izliyoruz'"
result: "Güvenilir, somut, ikna edici"

# Hızlı müdahale
approach: "Kriz sonrası 4 saat içinde ilk özür"
result: "Proaktif, müşteri değer verildiğini hisseder"
```

---

## Quick Reference (Hızlı Başvuru)

| Kriz Seviyesi | Yanıt Süresi | Tazminat | Ton |
|---|---|---|---|
| Kritik (Level 5) | <2 saat | Tam iade + 12 ay ücretsiz | Çok ciddi, executive imza |
| Yüksek (Level 4) | <4 saat | 3-6 ay ücretsiz | Ciddi, senior imza |
| Orta (Level 3) | <24 saat | 1 ay ücretsiz veya kupon | Samimi, yetkili imza |
| Düşük (Level 2) | <48 saat | Kupon (%15-20) | Anlayışlı |
| Şikayet (Level 1) | <1 hafta | Teşekkür + jest | Kişisel, sıcak |

| Email Bölümü | Max Cümle | İçerik Türü |
|---|---|---|
| Başlık | 1 | Öz ve dürüst |
| Açılış | 1-2 | Empatik |
| Olay | 2-3 | Somut, kısa |
| Etki kabul | 1-2 | Empatik |
| Aksiyonlar | 4-6 | Somut, listeli |
| Tazminat | 1-2 | Net, açık |
| Kapanış | 1 | Güven + iletişim |
| İmza | 1 | Gerçek kişi |

| Şablon Anahtar Kelimeleri | Kullanım |
|---|---|
| "Yaşadığınız sorundan dolayı" | Empati giriş |
| "Tamamen bizim sorumluluğumuzdur" | Kabullenme |
| "Bunun gibi olmamalıydı" | Dürüst pişmanlık |
| "Sizin için şunları yapıyoruz" | Aksiyon |
| "Gelecekte şunları garantiliyoruz" | Güvence |

| Ton Ayarları | Durum |
|---|---|
| Çok ciddi/kurumsal | Veri ihlali, büyük finansal kayıp |
| Ciddi/samimi | Sistem kesintisi, ciddi hata |
| Anlayışlı/sıcak | Minör hata, gecikme |
| Kişisel/ samimi | Genel şikayet, beklenti karşılanmadı |

| Metrik | Hedef | Uyarı |
|---|---|---|
| Yanıt Süresi (Kritik) | <2 saat | >4 saat |
| Müşteri Retainasyonu (kriz sonrası) | >%60 | <%50 |
| Follow-up complaint oranı | <%10 | >%20 |
| Social mention dönüşümü | Negatif → Nötr | Negatif sabit |
| NPS değişimi (kriz sonrası) | ±5 puan | >10 puan düşüş |

---

## Email Templates

### Template 1: Kritik Kriz (Veri Kaybı/Sistem Çökmesi)
```
Subject: [acil] Yaşanan Sistem Kesintisi Hakkında Dürüst Açıklama

Müşterimiz [Ad],

Yaşadığınız kesintiden dolayı derinden üzgünüz. Dün saat [X]'de başlayan 
ve [Y] saat süren sistem kesintisi, [işlevinizi] kullanamamanıza neden oldu.

Bu tamamen bizim sorumluluğumuzdur. [Teknik sebep kısa açıklama]Bu asla 
yaşanmaması gereken bir hataydı ve işletmenizin ne kadar etkilendiğinin 
farkındayız.

Şu anda yapılanlar:
• Sistem tamamen恢复了
• Root cause analizi tamamlandı
• [X] yedekleme katmanı eklendi

Sunduğumuz çözüm:
• [Z] aylık ücretsiz kullanım
• Öncelikli destek hattı erişimi
• Hesabınıza özel [İsim] atandı

Gelecekte garantilerimiz:
• 24/7 aktif izleme
• [X] dakika yedekleme aralığı
• Bu tür kesintileri [%99.9] önleme taahhüdü

Herhangi bir sorunuz varsa doğrudan bana ulaşabilirsiniz.

Saygılarımla,
[İsim] | [Unvan]
[Telefon] | [E-piya]
```

### Template 2: Minor Şikayet
```
Subject: Geri Bildiriminiz İçin Teşekkür Ederiz - Takip

[Ad],

[Girdiğiniz geri bildirimi] için teşekkür ederiz. [Ürün/hizmet] 
deneyiminizin beklediğiniz gibi olmamasından dolayı üzgünüz.

[Belirli konu] hakkındaki endişenizi anlıyoruz. [Bunu düzeltmek için 
şu adımları atıyoruz]:

• [Aksiyon 1]
• [Aksiyon 2]

Gelecekte [ilgili özellik] deneyimini geliştirmek için ekibimiz 
üzerinde çalışıyoruz. Geri bildiriminiz doğrudan ürün ekibimize iletildi.

Size şu küçük jestimizi sunmak istiyoruz: [Kupon/kod]. 
[Kod/geçerli olduğu süre]

Tekrar geri bildiriminiz için teşekkür ederiz. Gelecekte 
deneyiminizi iyileştirmek için buradayız.

Sevgiler,
[İsim]
```

---

## Otomasyon Parametreleri

```typescript
interface ApologyEmailConfig {
  responseTimeSLAs: {
    [severity: number]: number;      // Dakika bazlı
  };
  compensationRules: {
    [severity: string]: {
      type: 'refund' | 'credit' | 'upgrade' | 'custom';
      duration?: number;             // Ay
      percentage?: number;           // %
      conditions: string[];
    };
  };
  templates: {
    [severity: string]: {
      subject: string;
      openingTone: string;
      bodyStructure: string[];
      compensationMention: string;
      closingTone: string;
    };
  };
  escalationRules: {
    sentimentBelow: number;          // Otomatik eskalasyon eşiği
    requireApprovalAbove: number;     // Üst onay gereken tutar
    executiveInvolvementAbove: string;  // Executive dahil etme eşiği
  };
  toneAdjustment: {
    customerTier: string;             // Müşteri tier'ı
    language: string;                // Müşteri dili
    previousTickets: number;         // Önceki şikayet sayısı
  };
}
```
