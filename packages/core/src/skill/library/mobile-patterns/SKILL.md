---
name: mobile-patterns
description: "Mobile: React Native, PWA, native features, offline-first, app store" 
triggers:
  extensions: [".tsx"]
  keywords: ["React Native", "Expo", "mobile", "iOS", "Android", "native", "FlashList", "expo-router"]
auto_load_when: "Building React Native or Expo mobile apps"
agent: mobile-ops
tools: ["Read", "Write", "Bash"]
---

# Mobile Patterns

**Focus:** Mobile strategy, React Native vs PWA, native features, offline

## 1. Strategy Decision Tree

```
Choose React Native when:
├── Need native performance
├── Platform-specific UI
├── Access device APIs
└── Existing JS team

Choose PWA when:
├── Web-only is acceptable
├── No app store review
├── Low development budget
├── Target all platforms equally

Choose Native (Swift/Kotlin) when:
├── Complex graphics (games)
├── Heavy processing
├── Platform-first requirements
└── Deep OS integration
```

---

## 2. PWA Patterns

```
Manifest requirements:
├── name, short_name
├── icons: 192x192, 512x512
├── theme_color
├── display: standalone
└── start_url

Service Worker:
├── Cache-first for assets
├── Network-first for API
└── Background sync for offline

Web capabilities:
├── Push notifications
├── Add to home screen
└── Full-screen experience
```

---

## 3. Offline-First Patterns

```
Data sync strategy:
├── Local-first: read from local
├── Queue writes when offline
├── Sync on connectivity
└── Conflict resolution

Storage options:
├── IndexedDB: large structured data
├── Cache API: HTTP responses
└── localStorage: simple key-value

Sync patterns:
├── Optimistic updates
├── Background sync
└── Periodic sync (when charging)
```

---

## 4. Native Features Pattern Map

```
Camera/Photo:
├── React Native: react-native-camera
├── PWA: <input type="file" capture>
└── Consider: permissions, quality

Location:
├── Geolocation API (PWA)
├── Geolocation native (RN)
└── Background tracking: platform-specific

Push Notifications:
├── Web Push (PWA): VAPID keys
├── Native: APNs/FCM tokens
└── Handle: permissions, states

Biometrics:
├── Face ID / Touch ID
├── WebAuthn (newer browsers)
└── Native bridge for older
```

---

## 5. App Store Patterns

```
iOS App Store:
├── App Store Review Guidelines
├── Privacy nutrition labels
└── TestFlight for beta

Google Play:
├── Play Console
├── Internal testing tracks
└── Material Design guidelines

Cross-platform tools:
├── EAS Build (Expo)
├── React Native CLI
└── Capacitor (PWA to app)
```

---

## 6. Performance Patterns

```
React Native optimization:
├── FlatList for long lists
├── useMemo/useCallback
├── Native modules for heavy ops
└── Hermes JS engine

PWA optimization:
├── Lazy loading
├── Image optimization
└── Code splitting

Metrics:
├── Core Web Vitals
├── App startup time
└── Memory usage
```

---

## Key Patterns

1. **PWA first** - Cross-platform, no review
2. **React Native** - Native feel, JS team
3. **Offline-first** - Queue writes, sync later
4. **IndexedDB over localStorage** - Size limit
5. **Test on real devices** - Not emulator only
6. **App-specific UX** - Not just responsive web

---

## Anti-Patterns

```
❌ Using web-style touch handlers instead of Gesture Responder
✅ Use React Native PanResponder or Gesture Handler for touch

❌ Large JS bundle causing slow TTI on mobile
✅ Hermes engine + Metro bundler tree-shaking; lazy load screens

❌ Platform-specific code scattered everywhere
✅ Platform.select() or .ios.tsx / .android.tsx file extensions

❌ ScrollView wrapping FlatList (double scroll)
✅ FlatList / SectionList for any dynamic list — not ScrollView

❌ No deep link handling
✅ React Navigation linking config + universal links setup
```

---

## Quick Reference

| Need | React Native API | Expo |
|---|---|---|
| Navigation | React Navigation | expo-router |
| Camera | react-native-vision-camera | expo-camera |
| Storage | MMKV / AsyncStorage | expo-secure-store |
| Push notifications | notifee | expo-notifications |
| OTA update | CodePush | expo-updates |
| Device info | react-native-device-info | expo-device |
