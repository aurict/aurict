# Permission UI Redesign — OpenClaude Parity Plan

## Hedef

Aurict'in mevcut `PermissionPrompt.tsx` bileşenini OpenClaude'un izin UI'ı ile 1:1 eşleştirmek;
Aurict renk paleti ve mevcut veri modeli korunarak yapı, yerleşim ve etkileşim OpenClaude'a birebir uyarlanır.

---

## Mevcut Durum (Aurict)

| Özellik | Durum |
|---|---|
| Dış çerçeve | Tam `borderStyle="round"` (4 kenar) |
| Başlık | `DANGER / WARNING / NOTICE` risk badge |
| Komut alanı | `tool / cmd / sandbox / diff` satırları, `paddingLeft={2}` |
| Seçenekler | Manuel `useInput` + `▶` imleç, key hint satırı |
| Feedback girişi | Yok |
| Bileşen yapısı | Tek monolitik `PermissionPrompt.tsx` |

---

## Hedef Durum (OpenClaude referans)

| Özellik | OpenClaude | Aurict Adaptasyonu |
|---|---|---|
| Dış çerçeve | Sadece üst kenar (`borderLeft/Right/Bottom={false}`) | Aynı |
| Başlık | `<Text bold color="permission">{title}</Text>` | `theme.accent` / `theme.warning` / `theme.error` |
| Alt başlık | `<Text dimColor>{subtitle}</Text>` | Komut özeti veya tehlike seviyesi |
| İçerik alanı | `paddingX={2} paddingY={1}` blok | Aynı |
| Seçenekler | `<Select>` + `inlineDescriptions` | `useInput` + mevcut `▶` imleç yapısı |
| Tab to amend | Feedback metin girişi modu | **1. Aşamada atla**, yapı hazır kalır |
| Footer | `Esc to cancel \| Tab to amend` | `Esc deny \| ↑↓ seç \| Enter onayla` |
| Alt bileşenler | `PermissionDialog` + `PermissionScaffold` | Aynı isimlerde yeni dosyalar |

---

## Bileşen Mimarisi

```
PermissionPrompt (route)
│
├── isBashTool → BashPermissionRequest
│   └── PermissionScaffold
│       └── PermissionDialog
│           ├── PermissionRequestTitle  (bold title + subtitle)
│           ├── [header: komut preview]
│           └── [children: seçenek listesi + footer]
│
└── diğer tool → FallbackPermissionRequest
    └── PermissionScaffold
        └── PermissionDialog
            └── ...
```

---

## Yeni Dosyalar

### 1. `PermissionDialog.tsx`

```tsx
// Sadece üst kenar — OpenClaude'un PermissionDialog'u
export function PermissionDialog({ title, subtitle, color, innerPaddingX = 1, children }) {
  return (
    <Box
      flexDirection="column"
      borderStyle="round"
      borderColor={color}
      borderLeft={false}
      borderRight={false}
      borderBottom={false}
      marginTop={1}
    >
      <Box paddingX={1} flexDirection="column">
        <PermissionRequestTitle title={title} subtitle={subtitle} color={color} />
      </Box>
      <Box flexDirection="column" paddingX={innerPaddingX}>
        {children}
      </Box>
    </Box>
  )
}
```

### 2. `PermissionRequestTitle.tsx`

```tsx
// Bold başlık + dimmed alt başlık
export function PermissionRequestTitle({ title, subtitle, color }) {
  return (
    <Box flexDirection="column">
      <Text bold color={color}>{title}</Text>
      {subtitle && <Text dimColor>{subtitle}</Text>}
    </Box>
  )
}
```

### 3. `PermissionScaffold.tsx`

```tsx
// PermissionDialog etrafında ince wrapper
export function PermissionScaffold({ title, subtitle, color, header, children }) {
  return (
    <PermissionDialog title={title} subtitle={subtitle} color={color}>
      {header}
      {children}
    </PermissionDialog>
  )
}
```

---

## Mevcut PermissionPrompt Refactor

### Yapısal Değişiklikler

**Kaldırılacak:**
- Tam çerçeveli `<Box borderStyle="round" paddingX={2} paddingY={1}>` dış kutu
- Risk `text/detail` satır bloğu (risk/sandbox/why metadata)
- `DANGER / WARNING / NOTICE` badge başlıkları

**Korunacak + taşınacak:**
- Komut/dosya preview alanı → `paddingX={2} paddingY={1}` blok olarak `header` prop'una
- Seçenek listesi → aynı `useInput` mantığı, sadece görsel güncellenecek
- Patch preview (`d` tuşu toggle) → `header` içinde kalır
- Granular file selection → aynı şekilde `header` içinde kalır
- `diff`, `files` bilgisi → preview bloğa taşınır

### Yeni Görsel Yerleşim

```
╭── Bash command ──────────────────────────────── (sadece üst kenar)
   rm -rf ./node_modules && npm install           (paddingX=2, paddingY=1)
   Remove node_modules and reinstall deps

   ⚠ This command removes files permanently      (sadece danger'da)

   Do you want to proceed?
   ▶ Yes, allow once
     Yes, allow for session
     No

   Esc deny · ↑↓ select · Enter confirm
```

---

## Renk Eşleşmesi

| OpenClaude | Aurict |
|---|---|
| `"permission"` (theme key) | `theme.accent` (varsayılan) |
| `"error"` | `theme.error` |
| `"warning"` | `theme.warning` |
| `"success"` | `theme.success` |
| `dimColor` | `dimColor` (aynı) |

---

## BashPermissionRequest Adaptasyonu

OpenClaude'un `BashPermissionRequest` → `SharedShellPermissionRequest` zincirinden alınanlar:

- **Başlık:** `"Bash command"` (veya `"Bash command (unsandboxed)"` sandbox yoksa)
- **Alt başlık:** `undefined` → şimdilik boş, ileride classifier state eklenebilir
- **Komut gösterimi:** `paddingX={2}` blok içinde `$ {command}` mono görünüm
- **Description satırı:** `<Text dimColor>{description}</Text>` altında
- **Destructive warning:** `<Text color={theme.warning}>` komutun üstünde
- **"Do you want to proceed?" satırı:** Seçenek listesinin hemen üstünde

---

## FallbackPermissionRequest Adaptasyonu

Diğer tool'lar için basitleştirilmiş versiyonu:

```
╭── Tool use ──────────────────────────────────── (sadece üst kenar)
   write_file("/path/to/file.ts")                 (paddingX=2, paddingY=1)
   Update the configuration file

   ▶ Yes, allow once
     Yes, allow for session
     No

   Esc deny · ↑↓ select · Enter confirm
```

---

## Uygulama Sırası

1. `PermissionRequestTitle.tsx` oluştur (en bağımsız)
2. `PermissionDialog.tsx` oluştur (PermissionRequestTitle kullanır)
3. `PermissionScaffold.tsx` oluştur (PermissionDialog wrapper)
4. `PermissionPrompt.tsx` refactor — route bileşen olarak sadele, iç mantık seçenek listesine taşı
5. `BashPermissionRequest.tsx` oluştur — Bash'e özel başlık/preview/destructive warning
6. `FallbackPermissionRequest.tsx` oluştur — diğer tool'lar için basit yes/no

## Scope Dışı (şimdilik)

- Tab to amend (feedback metin girişi modu) — Select refactor gerektirir
- Classifier auto-approve shimmer animasyonu — OpenClaude'a özgü
- `PermissionRuleExplanation` (izin kuralı açıklama) — altyapı yok
- Worker badge — multi-agent badge sistemi yok
- Ctrl+E explain modu — LLM açıklama akışı gerektirir
