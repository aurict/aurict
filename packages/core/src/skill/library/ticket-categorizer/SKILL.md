---
name: ticket-categorizer
description: "Destek ticket kategorileme. Auto-tagging. Routing rules. Priority classification."
triggers:
  keywords: ["ticket categorizer", "ticket etiketleme", "otomatik etiketleme", "destek sınıflandırma", "ticket routing", "öncelik sınıflandırma"]
auto_load_when: "Kullanıcı destek ticket'larını kategorize etmeyi veya sınıflandırmayı talep ettiğinde"
agent: content-ops
tools: ["Read", "Write", "Bash", "grep", "glob"]
---

# Ticket Categorizer (Destek Ticket Kategorizasyonu)

**Odak Alanı:** Destek ticket'larını otomatik olarak kategorize etme, etiketleme, yönlendirme kuralları oluşturma ve öncelik sınıflandırması yapma.

---

## Pattern: Ticket Kategorizasyon Süreci

### Adım 1: Ticket Analizi
Ticket metnini ve bağlamını analiz et:
- Müşteri ifadelerini oku
- Hangi konuyu/ürünü/hizmeti ilgilendirdiğini belirle
- Aciliyet ipuçlarını tespit et

### Adım 2: Kategori Eşleştirme
Tanımlı kategori havuzundan en uygun kategoriyi seç:
```
Yaygın Kategoriler:
├── Teknik Sorun (Teknik destek gerektiren)
│   ├── Yazılım Hatası
│   ├── Entegrasyon Sorunu
│   └── API Problemi
├── Faturalandırma (Ödeme ve fatura ile ilgili)
│   ├── Yanlış Fatura
│   ├── Ödeme Hatası
│   └── Plan/Yükseltme
├── Hesap Yönetimi (Account ile ilgili)
│   ├── Şifre Sıfırlama
│   ├── Erişim Sorunu
│   └── Hesap Kilitlenmesi
├── Ürün Bilgisi (Ürün özellikleri ile ilgili)
│   ├── Nasıl Yapılır
│   ├── Özellik Sorgusu
│   └── Karşılaştırma
└── Geri Bildirim (Ürün iyileştirme ile ilgili)
    ├── Özellik Talebi
    ├── Şikayet
    └── Memnuniyet
```

### Adım 3: Alt-Kategori Belirleme
Ana kategoriden sonra spesifik alt-kategori atama:
- Ürün adı/version
- İşlevsellik alanı
- Müşteri segmenti

### Adım 4: Öncelik Atama
İş kurallarına göre öncelik seviyesi belirle:
```
Öncelik Seviyeleri:
P1 - Kritik (Sistem kapalı, veri kaybı)
P2 - Yüksek (Ana fonksiyon çalışmıyor)
P3 - Orta (Yan etki, workaround var)
P4 - Düşük (Kozmetik, bilgi talebi)
```

### Adım 5: Routing Kuralları Uygulama
Doğru ekibe/ajan'a yönlendirme:
- Yetenek tabanlı (skill-based routing)
- Dil bazlı
- Müşteri tier'ı bazlı
- Ürün hattı bazlı

### Adım 6: SLA Timer Başlatma
Atanan önceliğe göre SLA süresini başlat:
- İlk yanıt süresi
- Çözüm süresi
- Yeniden açma süresi

---

## Key Patterns (Ana Kalıplar)

| Pattern | Açıklama | Kullanım Senaryosu |
|---|---|---|
| **Keyword Matching** | Anahtar kelime eşleştirme ile kategori atama | Hızlı, kural tabanlı kategorizasyon |
| **Intent Classification** | NLP ile niyet sınıflandırma | Karmaşık, çok katmanlı ticket'lar |
| **Hierarchical Tagging** | Çoklu etiketleme (ana + alt + alt-alt) | Detaylı raporlama ihtiyacı |
| **Confidence Threshold** | Belirli eşik değerin altında insan onayı | Düşük güvenilirlik durumları |
| **Adaptive Learning** | Geçmiş kararlardan öğrenme | Model iyileştirme |

---

## Anti-Patterns (Kaçınılması Gerekenler)

### ❌ Yanlış Uygulamalar

```yaml
# Her ticket'ı tek kategoriye强迫 etmek
problem: "Müşteri hem fatura hem teknik sorun yaşıyor ama sadece bir kategori seçiliyor"
result: "Ticket yanlış ekibe gidiyor, müşteri iki kez uğraşmak zorunda"

# Öncelik atamadan acil işaretleme
problem: "Tüm şikayetleri P1 olarak işaretlemek"
result: "Gerçek kritik ticket'lar kayboluyor, SLA ihlalleri artıyor"

# Kategori adı tutarsızlığı
problem: "Bazen 'Teknik', bazen 'Tech', bazen 'Yazılım' kullanmak"
result: "Raporlama karışıyor, trend analizi imkansız"

# Manuel kategorizasyonun %100 olması
problem: "AI/otomasyon kullanmadan tüm ticket'ları elle kategorize etmek"
result: "Yavaş yanıt, tutarsızlık, yüksek maliyet"
```

### ✅ Doğru Uygulamalar

```yaml
# Çoklu etiketleme ile tam kapsam
approach: "Bir ticket'a hem 'Teknik Sorun' hem 'API Problemi' hem 'P2' etiketi ver"
result: "Doğru ekip, doğru SLA, doğru raporlama"

# Confidence threshold ile insan kontrollü
approach: "Güvenilirlik <%80 ise insan onayı al, >%80 ise otomatik ata"
result: "Hata oranı düşük, insan zamanı değerli case'lere ayrılıyor"

# Standart kategori hiyerarşisi
approach: "Tüm ekip aynı kategori adlarını ve seviyelerini kullanır"
result: "Tutarlı raporlama, karşılaştırılabilir metrikler"
```

---

## Quick Reference (Hızlı Başvuru)

| Durum | Eylem | Kategori | Öncelik |
|---|---|---|---|
| Sistem tamamen çalışmıyor | Hemen mühendis ekibi | Teknik Sorun > Sistem Hatası | P1 |
| Ödeme geçmiyor | Finans ekibi kontrol etsin | Faturalandırma > Ödeme Hatası | P2 |
| Şifremi unuttum | Otomatik reset gönder | Hesap > Şifre Sıfırlama | P3 |
| X özelliği nasıl çalışır? | KB makalesine yönlendir | Ürün Bilgisi > Nasıl Yapılır | P4 |
| Üründe iyileştirme önerisi | Ürün ekibine ilet | Geri Bildirim > Özellik Talebi | P4 |
| Veri kaybı şüphesi | Acil forensic başlat | Teknik Sorun > Veri Sorunu | P1 |
| Yeni plan yükseltme | Satış ekibine yönlendir | Faturalandırma > Plan Değişikliği | P3 |
| Erişim yetkisi yok | Hesap doğrulama sonrası aç | Hesap > Erişim Sorunu | P2 |

| Metrik | Hedef | Uyarı Eşiği |
|---|---|---|
| Kategorizasyon Doğruluğu | >%90 | <%85 |
| Otomasyon Oranı | >%70 | <%60 |
| Ortalama Kategorize Süresi | <30 sn | >60 sn |
| Yeniden Kategorize Oranı | <%5 | >%10 |

| Routing Kuralı | Hedef Ekip | Koşul |
|---|---|---|
| language:tr + category:billing | Finans-TR | Türkçe + Faturalandırma |
| product:enterprise + priority:P1 | Enterprise-ESK | Enterprise + Kritik |
| sentiment:angry + category:complaint | Supervisor-ESK | Kızgın + Şikayet |

---

## Otomasyon Deki Parametreler

```typescript
interface TicketCategorizerConfig {
  confidenceThreshold: number;      // Minimum güvenilirlik (0.0-1.0)
  maxCategoriesPerTicket: number;  // Maksimum etiket sayısı
  enableAutoRouting: boolean;      // Otomatik yönlendirme aktif mi?
  fallbackAgentId: string;        // Atama başarısızsa kim gönderilsin
  slaOverrides: {
    [priority: string]: number;   // Dakika bazlı SLA süreleri
  };
  categoryHierarchy: {
    name: string;
    subcategories: string[];
    routingRules: string[];
  }[];
}
```
