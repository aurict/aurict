---
name: citation-formatter
description: "Atıf formatlama: APA 7, MLA 9, Chicago, Harvard. Reference manager entegrasyonu ve DOI kullanımı."
triggers:
  keywords: ["citation", "apa", "mla", "chicago", "harvard", "atıf formatı", "referans", "bibliyografya", "doi"]
auto_load_when: "User asks to format citations, create bibliography, or generate references in a specific citation style"
agent: content-ops
tools: ["Read", "Write", "Bash", "WebFetch"]
---

# Citation Formatter — Atıf ve Referans Formatlama

**Focus:** Akademik ve profesyonel belgelerde tüm atıf formatlarının (APA 7, MLA 9, Chicago, Harvard, IEEE, Vancouver) doğru üretimi, DOI/URL yönetimi ve reference manager uyumluluğu.

## 1. Atıf Formatları (Citation Styles)

### A. APA 7th Edition

```
A. Kitap
   Yazar, A. A. & Yazar, B. B. (Yıl). Kitabın başlığı italik. Yayınevi.

   Örnek:
   Smith, J. D. & Brown, L. M. (2023). Cognitive psychology in practice.
   Routledge.

B. Dergi Makalesi
   Yazar, A. A., Yazar, B. B., & Yazar, C. C. (Yıl). Makale başlığı.
   Dergi Adı italic, Cilt(Sayı), Sayfa-Sayfa. https://doi.org/xxxxx

   Örnek:
   Johnson, R., Chen, W., & Lopez, M. (2022). Neural networks in education.
   Journal of Educational Psychology, 114(3), 445-458.
   https://doi.org/10.1037/edu0000782

C. Web Sayfası
   Yazar, A. A. (Yıl, Gün Ay Yıl). Sayfa başlığı. Site Adı.
   URL

   Örnek:
   World Health Organization. (2023, March 15). Mental health guidelines.
   https://www.who.int/mental-health
```

### B. MLA 9th Edition

```
A. Kitap
   Yazar Soyadı, Yazar Adı. Kitabın Başlığı italik. Yayınevi, Yıl.

B. Dergi Makalesi
   Yazar Soyadı, Yazar Adı. "Makale Başlığı." Dergi Adı italik, cilt, no:
   Sayı, Yıl, ss. Sayfa-Sayfa.

C. Web Sayfası
   Yazar Soyadı, Yazar Adı. "Sayfa Başlığı." Web Sitesi Adı, Gün Ay Yıl,
   URL. Erişim Tarihi.
```

### C. Chicago (Author-Date ve Notes-Bibliography)

```
Author-Date:
   Yazar Soyadı, Yazar Adı. Yıl. "Makale Başlığı." Dergi Adı italik
   Cilt (Sayı): Sayfa-Sayfa. DOI/URL.

Notes-Bibliography:
   Yazar Soyadı, Yazar Adı. Başlık. Yayın Yeri: Yayınevi, Yıl.
```

### D. Harvard

```
Yazar Soyadı, Yazar İlk Harfi. (Yıl) 'Makale başlığı', Dergi Adı
italik, Cilt(Sayı), ss. Sayfa-Sayfa. Erişim adresi: URL (Erişim:
Gün Ay Yıl).
```

## 2. DOI ve URL Yönetimi

```
A. DOI Kullanım Protokolü
   ├─ DOI varsa HER ZAMAN kullan (URL yerine tercih et)
   ├─ doi.org/ prefix ile standartlaştır
   │  → DOI: 10.1037/edu0000782
   │  → URL: https://doi.org/10.1037/edu0000782
   └─ APA 7: https://doi.org/xxxxx formatı zorunlu
```

```
B. URL Kısaltma ve Güvenlik
   ├─ Kısa URL servisleri kullanma (link kırılabilir)
   ├─ Erişim tarihi ekle (son güncelleme tarihi bilinmiyorsa)
   ├─ Güvenli bağlantı (https://) tercih et
   └─ Arşivlinkler: WebCite veya Wayback Machine ekle
```

## 3. Reference Manager Entegrasyonu

```
A. Zotero Format Çıktıları
   ├─ BibTeX (.bib)           → LaTeX/Overleaf
   ├─ RIS (.ris)              → EndNote, Mendeley
   ├─ CSL JSON                → Pandoc, citation processors
   └─ BIBLIOGRAPHY (.bib)     → Markdown/MDX
```

```
B. CSL (Citation Style Language) Zinciri
   ├─ Input: Raw metadata (DOI, ISBN, PMID)
   ├─ Processor: citeproc-js / Citation.js
   └─ Output: Seçili formata çıktı
```

```
C. DOI'dan Otomatik Metadata
   ├─ CrossRef API: https://api.crossref.org/works/{doi}
   ├─ DataCite: https://api.datacite.org/dois/{doi}
   ├─ BibTeX key format: SoyadıYılİlkKelim
   │  → johnson2022neural → johnson2022neural
   └─ Otomatik alan doldurma (ISBN, ORCID, ISSN)
```

## 4. In-Text Citation ve Parantez Kuralları

```
A. Doğrudan Alıntı
   ├─ Kısa (<40 kelime): Çift tırnak içinde, sayfa no ile
   │  → "Deep learning is transforming education" (Johnson, 2022, s. 34).
   │
   └─ Uzun (≥40 kelime): Blok alıntı, 1.25 in. indent, sayfa no zorunlu
```

```
B. Atıf Gruplama
   ├─ Aynı cümlede birden fazla: Alfabetik sırayla
   │  → (Johnson, 2022; Lee, 2021; Wang, 2023)
   ├─ Yazar aynı soyadı: İlk harf ile ayrıştır
   │  → (Johnson, A., 2022; Johnson, B., 2021)
   └─ 3+ yazar: İlk atıfta tüm liste, sonraki et al.
```

## Key Patterns

| Format | In-text | Bibliography | DOI |
|--------|---------|-------------|-----|
| APA 7 | (Yazar, Yıl, s. N) | Sonunda references | Zorunlu |
| MLA 9 | (Yazar Sayfa) | Works Cited | Tercih edilir |
| Chicago | Footnote veya (Yazar, Yıl) | Bibliography | Önerilir |
| Harvard | (Yazar, Yıl) | Reference List | Tercih edilir |
| IEEE | [1] formatı | References | Önerilir |
| Vancouver | (1) formatı | References | Tercih edilir |

## Anti-Patterns

```
❌ DOI yerine sadece URL kullanmak
   → DOI her zaman daha güvenilir ve kalıcıdır

❌ Yazar isimlerini yanlış sıralamak
   → 3+ yazarlıda, sonraki atıflarda "et al." doğru yazılmalı

❌ Başlıkları tırnak içine almak (APA'da dergi makaleleri için)
   → Sadece kısa alıntılar tırnak içinde; makale başlıkları italik

❌ Erişim tarihini unutmak (web kaynakları için)
   → Harvard ve birçok formatta zorunlu

❌ Çıkar çatışması bildirimini atlamak
   → Akademik dergilerde (CONSORT vb.) zorunlu bölüm

❌ DOI prefixi yanlış: dx.doi.org yerine doi.org/
   → APA 7 kesin olarak doi.org/ kullanır
```

## Quick Reference

| Kaynak Türü | APA 7 Format | Önemli Not |
|-------------|-------------|------------|
| Kitap | Yazar. (Yıl). *Başlık.* Yayınevi. | Italik, başlık büyük harf |
| Editörlü Kitap | Yazar (Ed.). | (Ed.) tek, (Eds.) çoğul |
| Dergi Makalesi | Yazar. (Yıl). *Başlık.* Dergi, *cilt*(sayı), ss. | Dergi italik |
| Konferans Bildirisi | Yazar. (Yıl, Ay). *Başlık.* In *Proceedings*... | In + italik |
| Tez | Yazar. (Yıl). *Başlık* [Doktora Tezi, Üniversite]. | Derece, Üniversite |
| Web Sayfası | Yazar. (Yıl, Gün Ay Yıl). *Başlık.* Site. URL | Erişim tarihi gerekli |
| Rapor | Kurum. (Yıl). *Başlık.* Yayın No. URL | Kurum yazar yerine |

| Araç | Format Desteği | Platform |
|------|--------------|----------|
| Zotero | Tüm major formatlar | Browser + Word |
| Mendeley | APA, MLA, others | Desktop + Word |
| EndNote | 6000+ stil | Desktop |
| Citation.js | APA, MLA, BibTeX | JavaScript |
| DOI.org | DOI resolver | Web |
| CrossRef API | Metadata çekme | REST API |
