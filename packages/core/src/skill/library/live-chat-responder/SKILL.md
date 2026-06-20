---
name: live-chat-responder
description: "Canlı destek şablonları. Quick replies. Canned responses. Escalation triggers."
triggers:
  keywords: ["live chat responder", "canlı destek şablonları", "hızlı yanıtlar", "sohbet yanıtları", "canned responses"]
auto_load_when: "Kullanıcı canlı destek sohbeti için hızlı yanıt şablonları, canned response veya eskalasyon tetikleyicileri oluşturmayı talep ettiğinde"
agent: content-ops
tools: ["Read", "Write", "Bash", "grep", "glob"]
---

# Live Chat Responder (Canlı Sohbet Yanıtlayıcı)

**Odak Alanı:** Canlı destek sohbetleri için hazır yanıt şablonları, hızlı cevaplar (quick replies), canned responses ve eskalasyon tetikleyicileri oluşturma.

---

## Pattern: Canlı Sohbet Yanıt Sistemi

### Adım 1: Senaryo Tespiti
En yaygın sohbet senaryolarını belirle:
```
Ana Senaryo Kategorileri:
GENEL SORULAR
├── Ürün/Hizmet bilgisi
├── Fiyatlandırma
├── Demo talebi
├── Karşılaştırma soruları
└── "Siz kimsiniz?" soruları

TEKNİK DESTEK
├── Giriş/Kayıt sorunları
├── Ödeme hataları
├── Performans sorunları
├── Entegrasyon sorunları
└── API sorunları

TAKİP VE DURUM
├── Sipariş takibi
├── İade takibi
├── Şikayet takibi
└── Bekleyen işlemler

SATIŞ VE YÜKSELTME
├── Plan yükseltme
├── Özellik sorgusu
├── Custom solution
└── Enterprise teklif
```

### Adım 2: Quick Reply Şablonları
Saniyeler içinde gönderilebilir kısa yanıtlar oluştur:
```
Quick Reply Kategorileri:
SELAMLAMA
├── "Merhaba! Ben [İsim], nasıl yardımcı olabilirim? 👋"
├── "Merhaba! Bugün sizinle konuşmak güzel. Ne üzerinde çalışıyorsunuz?"
└── "Selam! Sorununuzla ilgili hemen yardımcı oluyorum."

BEKLETME
├── "Biraz araştırmam gerekiyor, 1-2 dakika içinde yanılıyorum."
├── "Bu konuyu ekibimize soruyorum, lütfen biraz bekleyin."
└── "Detaylı bilgi için araştırma yapıyorum, kısa bir süre içinde yanıtlayacağım."

YÖNLENDİRME
├── "Bu konu için size özel bir makale gösterebilirim: [Link]"
├── "Daha detaylı bilgi için dokümantasyon sayfamıza bakabilirsiniz."
└── "Size en iyi yardımcı olabilecek kişi [İsim] - biraz sabırlı olur musunuz?"

KAPANIŞ
├── "Başka bir sorunuz var mı? Yardımcı olmaktan memnuniyet duyarım!"
├── "Başka bir konuda yardımcı olabildiysem ne güzel! İyi günler dilerim."
└── "Sorununuz çözüldüyse ne mutlu! Başka bir şey için buradayım."
```

### Adım 3: Canned Response (Hazır Yanıtlar)
Uzun ve detaylı hazır yanıtlar oluştur:
```
Canned Response Yapısı:
FORMAT:
[Durum] | [Yanıt]

---DETAYLI ŞABLONLAR---

YARIŞ YAPILIRKEN:
"Merhaba [İsim],

Sorununuzu anlıyorum ve hemen yardımcı olmak istiyorum.

Şu anda yapabileceğimiz birkaç şey var:

1️⃣ [İlk olası çözüm]
Bunu denemek için: [adımlar]

2️⃣ [İkinci olası çözüm]
Alternatif olarak: [adımlar]

3️⃣ Eğer bunlar işe yaramazsa
[Kalan adımlar] konusunda yardımcı olabilirim.

Bu çözümlerden birini deneyebilir misiniz? Sonucu bana bildirin."

ŞİKAYET ALINDIĞINDA:
"Öncelikle yaşadığınız sorundan dolayı çok özür dileriz. [Müşteri yaşadığı sorunu tekrar ifade etme] tamamen bizim hatamızdır ve düzeltmek için buradayız.

Şu an yapabileceklerimiz:
• [Hızlı çözüm adımı]
• [Tazminat/teklif]

Bunu hemen halledelim. Size nasıl yardımcı olabilirim?"

ÖDEME SORUNLARINDA:
"Ödeme işleminizde bir sorun olduğunu görüyorum. Bu sinir bozucu bir durum, yardımcı oluyorum.

Olası sebepler:
• Kartınızın网上购买 etkin olup olmadığı
• Bankanızın güvenlik kontrolü
• Yetersiz bakiye

Şu adımları deneyebilirsiniz:
1. Farklı bir kart deneyin
2. 5 dakika bekleyip tekrar deneyin
3. Bankanızı arayıp onay alın

Hâlâ sorun yaşıyorsanız, manuel olarak işleminizi alabilirim. Hangisini deneyelim?"
```

### Adım 4: Eskalasyon Tetikleyicileri
Ne zaman insan devreye girmeli belirle:
```
Eskalasyon Kural Matrisi:
OTOMATİK ESKALASYON TETİKLEYİCİLERİ
─────────────────────────────────────

DUYGUSAL TETİKLEYİCİLER
├── Müşteri "sinirli", "kızgın", "hayal kırıklığı" ifade ediyor
├── Negatif duygu kelimeleri tespit edildi
├── Müşteri tekrarlayan soru soruyor (aynı soru 3+ kez)
└── Müşteri başka kanala geçme tehdidinde bulunuyor

TEKNİK TETİKLEYİCİLER
├── 5+ mesajdan sonra çözüme ulaşılamadı
├── API/sistem hatası tespit edildi
├── Veri kaybı şüphesi var
├── Güvenlik ihlali şüphesi var
└── Üçüncü taraf entegrasyon sorunu

İŞ TETİKLEYİCİLER
├── Müşteri VIP veya Enterprise tier
├── İşlem tutarı >[X] TL
├── Hassas veri işleniyor
├── Sözleşme/yasal konu
└── Medya/gazeteci müşteri

ZAMAN TETİKLEYİCİLER
├── Yanıt süresi >[X] dakika (mesajlar arası)
├── Toplam sohbet süresi >[Y] dakika
├── Müşteri "aciliyet" belirtiyor
└── SLA deadline yaklaşıyor
```

### Adım 5: Eskalasyon Scriptleri
Nasıl eskalasyon yapılacağını yaz:
```
ESKALASYON KONVERSASYONLARI:

AKTARIM:
"Bu noktada sizin için en iyi çözümü sağlayabilecek uzman 
arkadaşımıza aktarıyorum. Biraz bekletmek zorunda kalacağım, 
ancak [İsim] konuyu daha derinlemesine inceleyecek."

BEKLEME YÖNETİMİ:
"Birkaç dakika içinde yanılıyorum. Bu sırada şunları yapabilirsiniz:
• [Kısa workaround]
• [İlgili makale]

Dönüşümde hemen yardımcı oluyorum."

AGENT DEĞİŞİMİ:
"[İsim] sizinle görüşecek. Kısa bir özet hazırlıyorum:
• Sorununuz: [kısa özet]
• Yapılanlar: [adımlar]
• Durum: [şu an ne aşamada]

[İsim] sizi 5 dakika içinde arayacak veya mesaj atacak."

HİÇ ÇÖZÜLEMİYORSA:
"Bu sorunu burada çözemiyoruz, üzgünüm. Şu seçenekleri sunabiliyorum:
• [Uzman takım randevusu]
• [Telefon desteği]
• [E-piya ile devam]

Size en uygun hangisi?"
```

### Adım 6: Makro Kütüphanesi
Tam otomasyon için makro dizileri oluştur:
```
TAM MAKROLAR:

MAKRO: Şifre Sıfırlama
──────────────────────────────────────────
Trigger: "şifre", "parola", "giriş yapamıyorum", "unuttum"
Yanıt: [Detaylı adım adım şifre sıfırlama talimatı]
Otomatik: Şifre sıfırlama linki gönder butonu
Takip: 10 dk sonra "Sorun çözüldü mü?" otomatik mesaj

MAKRO: Ödeme Reddi
──────────────────────────────────────────
Trigger: "ödeme reddedildi", "kart kabul edilmedi", "para çekilmedi"
Yanıt: [Ödeme sorun giderme adımları]
Otomatik: Farklı ödeme yöntemi seçeneği
Takip: Müşteri yanıt vermezse 30 dk sonra tekrar hatırlatma

MAKRO: İade Talebi
──────────────────────────────────────────
Trigger: "iade", "geri para", "ücret iadesi"
Yanıt: [İade politikası özeti + talep formu linki]
Otomatik: İade formu gönder
Takip: Form gönderildikten 48 saat sonra durum kontrolü
```

---

## Key Patterns (Ana Kalıplar)

| Pattern | Açıklama | Uygulama |
|---|---|---|
| **Personalized Quick Reply** | Müşteri adını kullanarak kişiselleştirme | Samimi ton |
| **Problem-Solution Matching** | Soruna özel yanıt seçimi | Relevance artışı |
| **Time-Aware Responses** | Günün saati/yoğunluğu bazlı yanıt | Bekletme yönetimi |
| **Escalation Transparency** | Açık eskalasyon iletişimi | Güven yönetimi |
| **Multi-Turn Context** | Konuşma geçmişini takip etme | Tutarlılık |

---

## Anti-Patterns (Kaçınılması Gerekenler)

### ❌ Yanlış Uygulamalar

```yaml
# Copy-paste mesajlar
problem: "Tüm müşterilere aynı hazır metin"
result: "Müşteri robot gibi hissettirir, samimiyetsiz"

# Uzun mesajlar
problem: "Bir mesajda 500 kelime"
result: "Müşteri okumaz, sıkılır"

# Soru sormadan direkt link
problem: "'Buraya tıklayın' + link"
result: "Müşteri yalnız hissettirilir"

# Aşırı emoji
problem: "Her cümlede emoji!!!"
result: "Profesyonellik kaybı, ciddi konularda uygunsuz"

# Kullanıcı ismini yanlış kullanma
problem: "[İsim]'i birden fazla tekrarlamak"
result: "Sahte ve rahatsız edici"
```

### ✅ Doğru Uygulamalar

```yaml
# Konuşma tonunu kişiselleştirme
approach: "Müşterinin tonuna göre (samimi/resmi) yanıt ayarlama"
result: "Doğal iletişim"

# Kısa ve net mesajlar
approach: "Tek mesajda maks 2-3 cümle, gerekirse seri mesaj"
result: "Kolay okunur, takip edilir"

# Adım adım ilerleme
approach: "Her adımdan sonra onay alma"
result: "Müşteri kontrol eder, hata azalır"

# Moderat emoji kullanımı
approach: "Sadece uygun yerlerde, 1-2 emoji max"
result: "Sıcak ama profesyonel"

# İsim kullanımında dikkat
approach: "Sadece selamlama ve kapanışta bir kez"
result: "Doğal, samimi"
```

---

## Quick Reference (Hızlı Başvuru)

| Senaryo | Quick Reply | Canned Response | Otomasyon |
|---|---|---|---|
| Selamlama | "Merhaba! Ben [İsim]..." | - | Otomatik bot |
| Bekletme | "1-2 dakika araştırıyorum" | "Detaylı araştırma..." | Otomatik |
| Teşekkür | "Rica ederim!" | "Öncelikle teşekkür ederiz..." | Template |
| Kapanış | "İyi günler!" | "Sonraki adımlar: [link]..." | Template |
| Şikayet | "Çok üzgünüz..." | [Detaylı özür + çözüm] | Eskalasyon |

| Eskalasyon Türü | Tetikleyici | Hedef Kanal | SLA |
|---|---|---|---|
| Agent transferi | 5+ mesaj çözümsüz | Başka agent | <2 dakika |
| Supervisor | Kızgın müşteri | Supervisor | <5 dakika |
| Teknik ekip | Sistem hatası | Ekip chat | <10 dakika |
| Executive | VIP + kritik | Direct call | <30 dakika |
| Geri arama | Telefon tercih | Call back | <1 saat |

| Kanal | Ortalama Yanıt Süresi | Hedef | Maksimum |
|---|---|---|---|
| İlk mesaj otomatik | <5 saniye | <3 saniye | 10 saniye |
| İnsan yanıtı | <30 saniye | <15 saniye | 1 dakika |
| Takip mesaj | <60 saniye | <30 saniye | 2 dakika |
| Eskalasyon aktarım | <2 dakika | <1 dakika | 5 dakika |

| Durum | Emoji | Kullanım |
|---|---|---|
| Olumlu | ✅ 👍 🎉 | Çözüm bulundu, teşekkür |
| Bekleme | ⏳ 🔄 | Araştırma, işlem devam ediyor |
| Bilgi | ℹ️ 💡 | Bilgi paylaşımı, ipucu |
| Uyarı | ⚠️ | Dikkat gerektiren durum |
| Sorun | ❌ 🔧 | Hata, çözüm gerekiyor |

| Cümle Başlangıçları | Durum |
|---|---|
| "Harika haber!" | Olumlu gelişme |
| "Anlıyorum..." | Empatik anlama |
| "Hemen bakıyorum..." | Hızlı aksiyon |
| "Birkaç dakika..." | Bekletme |
| "Üzgünüm ama..." | Olumsuz haber |
| "Şu seçenekleri var..." | Çözüm sunma |
| "Başka sorunuz?" | Kapanış kontrol |

| Metrik | Hedef | Uyarı |
|---|---|---|
| İlk Yanıt Süresi | <15 sn | >60 sn |
| Ortalama Yanıt Süresi | <30 sn | >2 dk |
| Çözüm Oranı (chat içinde) | >%75 | <%60 |
| Müşteri Memnuniyeti (CSAT) | >%85 | <%70 |
| Eskalasyon Oranı | <%15 | >%25 |

---

## Otomasyon Parametreleri

```typescript
interface LiveChatResponderConfig {
  responseTimeTargets: {
    firstResponseSeconds: number;
    avgResponseSeconds: number;
    maxResponseSeconds: number;
  };
  cannedResponses: {
    [scenario: string]: {
      quickReply: string;              // 1-2 cümle
      fullResponse: string;           // Detaylı yanıt
      macroSteps?: string[];           // Otomasyon adımları
      sentiment: 'neutral' | 'empathetic' | 'positive' | 'apologetic';
    };
  };
  escalationRules: {
    messageCountThreshold: number;      // Kaç mesaj sonra
    sentimentThreshold: number;         // Negatif duygu eşiği
    timeSinceStartMinutes: number;      // Toplam süre
    amountThreshold?: number;           // İşlem tutarı
    priorityCustomerTiers: string[];   // VIP tier'ları
  };
  escalationScripts: {
    transfer: string;                  // Aktarım mesajı
    wait: string;                       // Bekleme mesajı
    unavailable: string;                // Kullanılamaz mesajı
  };
  personalization: {
    useCustomerName: boolean;
    useCustomerTier: boolean;
    matchSentiment: boolean;
    emojiPolicy: 'none' | 'minimal' | 'moderate';
  };
}
```
