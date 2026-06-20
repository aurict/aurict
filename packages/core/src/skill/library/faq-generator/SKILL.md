---
name: faq-generator
description: "SSS oluşturma. Soru gruplama. Search optimization. Content structure."
triggers:
  keywords: ["faq generator", "sss oluşturucu", "sıkça sorulan sorular", "destek dokümantasyon", "faq sayfası"]
auto_load_when: "Kullanıcı SSS (Sıkça Sorulan Sorular) dokümantasyonu oluşturmayı veya mevcut ticket'lardan FAQ çıkarmayı talep ettiğinde"
agent: content-ops
tools: ["Read", "Write", "Bash", "grep", "glob"]
---

# FAQ Generator (SSS Oluşturucu)

**Odak Alanı:** Destek ticket'ları, müşteri görüşleri ve ürün dokümantasyonundan otomatik SSS sayfaları oluşturma, soru gruplama ve arama optimizasyonu.

---

## Pattern: FAQ Oluşturma Süreci

### Adım 1: Veri Toplama
Kaynaklardan soru ve cevap materyallerini topla:
```
Veri Kaynakları:
├── Destek Ticket'ları
│   ├── En sık açılan konular
│   ├── Çözüme ulaşan sorular
│   └── Müşteri ifadeleri (sorulan sorular)
├── Canlı Sohbet Kayıtları
│   ├── Tekrar eden sorular
│   └── Anlaşılması zor konseptler
├── E-posta Trafiği
│   ├── Gelen sorular
│   └── Yanıtlanan konular
├── Ürün Dokümantasyonu
│   ├── Karmaşık adımlar
│   └── Sıkça karıştırılan noktalar
└── Müşteri Görüşleri / Anketler
    ├── Karşılaşılan zorluklar
    └── Öğrenilmek istenen konular
```

### Adım 2: Soru Çıkarımı ve Gruplama
Benzer soruları gruplandır ve ortak cevaplar oluştur:
```
Gruplama Hiyerarşisi:
Ana Konu (örn. "Faturalandırma")
├── Alt Konu 1: Ödeme Yöntemleri
│   ├── Soru: "Hangi ödeme yöntemlerini kabul ediyorsunuz?"
│   ├── Soru: "Kredi kartı ile nasıl ödeme yapabilirim?"
│   └── Birleşik Cevap: "Kabul ettiğimiz yöntemler ve ödeme adımları"
├── Alt Konu 2: Fatura İndirme
│   ├── Soru: "Faturamı nasıl indirebilirim?"
│   ├── Soru: "E-fatura mı alabilirim?"
│   └── Birleşik Cevap: "Fatura indirme ve e-fatura işlemleri"
└── Alt Konu 3: İade ve Ücret İadesi
    ├── Soru: "Paramı ne zaman geri alabilirim?"
    └── [İade prosedürüne yönlendir]
```

### Adım 3: Soru Formülasyonu
Müşteri perspektifinden doğal sorular yaz:
- "Nasıl yapabilirim?" formatı
- Müşteri terminolojisi kullan
- Kısa ve net sorular
- Tek konu başına bir soru

### Adım 4: Cevap Yazımı
Kısa, eyleme yönlendiren ve SEO-dostu cevaplar yaz:
```
Cevap Yapısı:
1. Direkt cevap (1-2 cümle)
2. Adım adım talimat (gerekirse)
3. İlgili kaynaklara linkler
4. "Daha fazla yardım" CTA
```

### Adım 5: Organizasyon ve Yapı
Mantıksal bir düzende sayfayı organize et:
```
FAQ Sayfa Yapısı:
├── Genel Bakış (Ürün/Hizmet tanımı)
├── Başlarken (Quick start rehberi)
├── Hesap ve Faturalandırma
│   ├── Hesap oluşturma
│   ├── Şifre ve güvenlik
│   └── Ödeme ve fatura
├── Ürün Kullanımı
│   ├── [Ürün/Özellik bazlı bölümler]
│   └── [Kullanım senaryoları]
├── Sorun Giderme
│   ├── [Sık karşılaşılan hatalar]
│   └── [Hata kodları ve çözümleri]
└── İletişim ve Destek
    ├── Destek kanalları
    └── Çalışma saatleri
```

### Adım 6: Arama Optimizasyonu (SEO)
Her soru ve cevabı arama motorları için optimize et:
- Anahtar kelimeleri doğal olarak dahil et
- "People also ask" formatını kullan
- Schema.org FAQ markup ekle
- Başlıkları H2/H3 olarak yapılandır

---

## Key Patterns (Ana Kalıplar)

| Pattern | Açıklama | Uygulama |
|---|---|---|
| **Frequency-Based Prioritization** | En sık sorulan soruları en üste koy | Ticket hacmi analizi ile sıralama |
| **Intent Grouping** | Aynı niyete sahip soruları birleştir | Niyet haritası çıkarma |
| **Progressive Disclosure** | Temel sorular açık, detaylar gizli | Accordion yapısı kullanımı |
| **Cross-Linking** | İlgili sorular arasında bağlantı | İç link ağı kurma |
| **Question Transformation** | Farklı kelimelerle aynı soruyu sunma | LSI (Latent Semantic Indexing) |

---

## Anti-Patterns (Kaçınılması Gerekenler)

### ❌ Yanlış Uygulamalar

```yaml
# Teknik jargondan kaçmamak
problem: "Müşteriye 'API endpoint'ini yeniden başlatın' demek"
result: "Müşteri anlamaz, daha fazla ticket açılır"

# Evet/Hayır cevaplı sorular
problem: "Sadece 'Evet, kredi kartı kabul ediyoruz.' yazmak"
result: "Müşteri sonraki adımı bilmez, işlem yarım kalır"

# Çok uzun cevaplar
problem: "300 kelimelik detaylı açıklama"
result: "Müşteri okumaz, doğrudan destek çağırır"

# Güncel olmayan bilgiler
problem: "2023'te değişen politika 2025'te hâlâ eskisi gibi yazılmış"
result: "Yanlış bilgi = daha fazla şikayet"

# Soru gruplamama
problem: "50 farklı soru tek tek listelenmiş"
result: "Bulunamaz, okunamaz, işe yaramaz"
```

### ✅ Doğru Uygulamalar

```yaml
# Müşteri dili ile yazma
approach: "Önce 'Faturamı nasıl indirebilirim?' sorusu, sonra adımlar"
result: "Müşteri hemen bulur ve uygular"

# Adım adım cevaplar
approach: "1. Giriş yap → 2. Profilime tıkla → 3. Faturalarım → 4. İndir"
result: "Takip edilmesi kolay, hatasız uygulama"

# Gelişigüzel yapı
approach: "En sık 5 soru en üstte, kategorilere ayrılmış alt bölümler"
result: "Kullanıcı hızlıca bulur"

# Düzenli güncelleme
approach: "Her 3 ayda bir içerikleri gözden geçirme takvimi"
result: "Güncel ve doğru bilgi"

# Mantıksal gruplama
approach: "Konu bazlı kategoriler altında ilgili sorular"
result: "Keşfedilebilir yapı"
```

---

## Quick Reference (Hızlı Başvuru)

| Soru Tipi | Cevap Formatı | Uzunluk |
|---|---|---|
| Nasıl yapılır? | Adım listesi + ekran görüntüsü | 5-10 adım |
| Neden? | Açıklama + sebep | 2-3 paragraf |
| Ne zaman? | Zaman çizelgesi + koşullar | 1-2 paragraf |
| Kim? | Yetki matrisi + kontak | 1 paragraf + link |
| Problem çözümü | Sorun → Sebep → Çözüm | 3 bölüm |

| SEO Elementi | Uygulama | Örnek |
|---|---|---|
| H1 Başlık | Sayfa başlığı | "Sıkça Sorulan Sorular - Faturalandırma" |
| H2 Kategoriler | Ana bölümler | "## Ödeme Yöntemleri" |
| H3 Sorular | Soru başlıkları | "### Kredi kartı ile nasıl ödeme yapabilirim?" |
| Meta Description | 155 karakter özet | "Faturalandırma ve ödeme hakkında sıkça sorulan soruların yanıtları." |
| Schema Markup | JSON-LD FAQ | `{ "@type": "FAQPage", "mainEntity": [...] }` |

| Kanal | Soru Kaynağı | Çıkarım Yöntemi |
|---|---|---|
| Ticket'lar | Müşteri ifadeleri | NLP intent extraction |
| Canlı sohbet | Anlık sorular | Session mining |
| E-posta | Yazılı sorular | Keyword clustering |
| Anketler | Açık uçlu yanıtlar | Topic modeling |
| Forum/Topluluk | Tartışmalar | Engagement scoring |

| Metrik | Hedef | Uyarı Eşiği |
|---|---|---|
| FAQ'dan Çözüm Oranı | >%40 | <%30 |
| Ortalama Okuma Süresi | 2-4 dakika | <1 dk veya >10 dk |
| Arama ile Bulunma | >%60 | <%40 |
| İç Link Tıklama Oranı | >%15 | <%5 |
| Yeniden Ziyaret Oranı | >%20 | <%10 |

---

## Template: FAQ Sayfa Yapısı

```markdown
# [Ürün/Hizmet] Sıkça Sorulan Sorular

## Genel Bakış
[1-2 paragraf ürün tanımı]

## 🟢 Başlarken
### [Soru 1]
[Cevap]

### [Soru 2]
[Cevap]

## 💳 Faturalandırma ve Ödeme
### [Soru]
[Cevap]

## 🔧 Sorun Giderme
### [Soru]
[Cevap]

## 📞 Hâlâ Yardıma mı İhtiyacınız Var?
[Destek kanalları ve CTA]
```

---

## Otomasyon Parametreleri

```typescript
interface FAQGeneratorConfig {
  sourceTypes: ('tickets' | 'chat' | 'email' | 'surveys')[];
  minFrequencyThreshold: number;      // Minimum sorulma sayısı
  questionCountTarget: number;        // Hedef soru sayısı (toplam)
  maxAnswerLength: number;           // Maksimum cevap uzunluğu (karakter)
  includeRelatedArticles: boolean;   // İlgili makale linkleri
  applySEOTags: boolean;              // Schema markup ekle
  updateFrequency: 'weekly' | 'monthly' | 'quarterly';
  language: string;
}
```
