---
name: watchos-patterns
description: "watchOS Patterns: Digital Crown, complications, glances, Haptic feedback, background tasks." 
triggers:
  extensions: [".swift"]
  directories: ["watchos/", "watch/", "applewatch/"]
  keywords: ["watchos", "apple watch", "crown", "complication", "haptic", "wkinterfacerunner", "siri intent"]
auto_load_when: "Building Apple Watch apps or watchOS complications"
agent: swift-developer
tools: ["Read", "Write", "Bash"]
---

# watchOS Architecture Patterns

**Focus:** Watch-specific UI, sensors, complications, background tasks

## 1. Watch UI Patterns

```
Watch-Specific UI:
├── WKInterfaceObject subclasses
│   ├── WKInterfaceGroup - container
│   ├── WKInterfaceSeparator - divider
│   ├── WKInterfaceTimer - countdown
│   └── WKInterfaceImage - animated images
│
├── Digital Crown
│   └── CrownSequencer for scroll
│   └── picker style .sequence
│
├── Haptic Feedback
│   └── WKInterfaceDevice.current().play(.click)
│   └── .success, .warning, .error, .directionUp/Down
│
└── Context Menu
    └── .contextMenu {} for long press
```

---

## 2. Layout Patterns

```
Layout on Watch:
├── WKHostingController for SwiftUI
│   └── import WatchKit
│   └── class InterfaceController: WKHostingController<Content>
│
├── Size Classes
│   └── .horizontalSizeClass == .compact
│   └── .verticalSizeClass == .compact
│
├── Automatic Table
│   └── Use Group for non-scrolling layouts
│   └── UseWKInterfaceTable for lists
│
└── Corner Radius
    └── Watch has rounded corners
    └── Use .clipShape(RoundedRectangle(cornerRadius: 8))
```

---

## 3. Complications

```
Complication Types:
├── CLKComplication
│   ├── .circularSmall, .circularMedium, .circularLarge
│   ├── .modularSmall, .modularLarge
│   ├── .utilitarianSmall, .utilitarianLarge
│   └── .graphic (watchOS 7+)
│
├── Timeline Provider
│   └── func getTimeline() async -> Timeline<Entry>
│   └──func getPlaceholder() -> ComplicationBundle
│
└── Background Refresh
    └── Schedule timeline updates
    └── BackgroundTasks framework
```

---

## 4. Watch Connectivity

```
Phone ↔ Watch Communication:
├── WCSession
│   └── session: WCSession = .default
│   └── sendMessage(_:replyHandler:) for immediate
│   └── transferUserInfo() for guaranteed
│
├── WatchKit Extension Delegate
│   └── applicationDidEnterBackground()
│   └── handle(_:) for Siri intents
│
└── Parent Application
    └── openURL() to launch iOS app
    └── iOS handles complex processing
```

---

## 5. Background Tasks

```
Background Refresh:
├── WKBackgroundTaskScheduler
│   └── registerForBackgroundTasks()
│
├── Types
│   ├── WKApplicationRefreshBackgroundTask
│   ├── WKWatchConnectivityRefreshBackgroundTask
│   └── WKSnapshotBackgroundTask
│
└── Schedule
    └── BGTaskScheduler.shared.submit()
    └── Keep background tasks under 30 seconds
```

---

## Key Patterns

1. **Minimal UI** - Show critical info only, scrolling is harder on watch
2. **Glanceable** - Quick info at a glance, no interaction needed
3. **Haptic-first** - Use haptics for feedback, screen is small
4. **Battery conscious** - Reduce network calls, batch updates
5. **Complications** - Provide at-a-glance info without opening app

---

## Anti-Patterns

```
❌ Full-screen scrolling lists — slow on small screen
✅ Use pagination, show limited items

❌ No haptic feedback — user can't feel success/error
✅ Play haptics: .success on completion, .error on failure

❌ Large tap targets — watch screen is tiny
✅ Keep tappable areas at least 44pt

❌ Complex gestures — hard to do on wrist
✅ Prefer taps, Digital Crown for lists only

❌ Not handling glance state — user sees stale data
✅ Use WKSnapshotBackgroundTask for glance updates
```

---

## Quick Reference

| Feature | API | Note |
|---|---|---|
| Layout | SwiftUI on Watch | Same as iOS |
| Navigation | NavigationStack | iOS 16+ pattern |
| Table | WKInterfaceTable | Legacy WatchKit |
| Haptic | WKInterfaceDevice | .play(.click) |
| Crown | CrownSequencer | Scrolling |
| Background | BGTaskScheduler | < 30 sec |
| Complication | CLKComplicationProvider | Timeline |
