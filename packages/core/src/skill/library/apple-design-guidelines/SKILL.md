---
name: apple-design-guidelines
description: "Apple Design Guidelines: Human Interface Guidelines, Accessibility, Dark Mode, SF Symbols, Dynamic Type." 
triggers:
  extensions: [".swift", ".swiftui"]
  directories: ["ios/design/", "apple/design/"]
  keywords: ["HIG", "human interface", "accessibility", "dynamic type", "dark mode", "sf symbols", "accessibilityvoiceover"]
auto_load_when: "Designing Apple apps following Apple's design standards"
agent: swift-developer
tools: ["Read", "Write", "Bash"]
---

# Apple Design Guidelines (HIG)

**Focus:** Human Interface Guidelines, accessibility, platform consistency

## 1. Design Principles

```
Apple's 6 Design Principles:
├── Clarity
│   └── Text at readable sizes
│   └── Minimal UI chrome
│   └── Use system colors for text
│
├── Deference
│   └── Content fills screen
│   └── Translucent backgrounds (material)
│   └── Reveal content on scroll
│
├── Depth
│   └── Visual layers and hierarchy
│   └── Motion shows relationships
│   └── Use blur for depth
│
├── Color
│   └── Adaptive colors (light/dark)
│   └── Use semantic colors (primary, secondary)
│   └── Don't hardcode colors
│
├── Typography
│   └── Use SF Pro (system font)
│   └── Dynamic Type support (all sizes)
│   └── Use text styles, not fixed sizes
│
└── Icons
    └── SF Symbols (always)
    └── Use symbol configuration
    └── Custom icons only when necessary
```

---

## 2. Dynamic Type

```
Dynamic Type Support:
├── Text Styles (preferred sizes)
│   └── .largeTitle, .title1-3, .headline
│   └── .body, .callout, .subheadline
│   └── .footnote, .caption1-2
│
├── Implementation
│   └── @ScaledMetric for custom fonts
│   └── .font(.body) automatically scales
│   └── Never use .font(.system(size: 17))
│
└── Accessibility
    └── Test at all sizes (XS to XXXL)
    └── Ensure no truncation
    └── Layout adapts to larger text
```

---

## 3. Dark Mode

```
Dark Mode Implementation:
├── Semantic Colors (use these)
│   └── .primary, .secondary, .tertiary
│   └── .background, .groupedBackground
│   └── .label, .secondaryLabel
│
├── Custom Colors
│   └── Add to Asset Catalog
│   └── Set Appearances: "Any, Light, Dark"
│   └── Define values for each mode
│
└── Environment Check
    └── @Environment(\.colorScheme) var colorScheme
    └── colorScheme == .dark for custom behavior
    || Prefer adaptive colors
```

---

## 4. SF Symbols

```
SF Symbols Usage:
├── Symbol Style
│   └── Image(systemName: "star")
│   └── Use .symbolRenderingMode(.hierarchical)
│
├── Configuration
│   └── .font(.title2)
│   └── .foregroundStyle(.primary)
│   └── .symbolEffect(.pulse)
│
├── Custom Symbols
│   └── Create in SF Symbols app
│   └── Export as SVG
│   └── Add to asset catalog
│
└── Never use image files for icons
    └── SF Symbols has 5000+ symbols
```

---

## 5. Accessibility (VoiceOver)

```
Accessibility Implementation:
├── Basic
│   └── .accessibilityLabel("Description")
│   └── .accessibilityHint("What happens when tapped")
│   && .accessibilityAddTraits(.isButton)
│
├── Custom Accessible Views
│   └── accessibilityElement(children: .ignore)
│   └── accessibilityAdjustValue(action:) for sliders
│
├── Semantic Views
│   └── Use native controls (they're accessible)
│   && Group related content
│   && Meaningful order
│
└── Testing
    └── VoiceOver on device
    && Test with Switch Control
    && Test with Dynamic Type (largest)
```

---

## 6. Gesture Support

```
Platform-Specific Gestures:
├── iOS Gestures
│   └── Tap, Long Press, Swipe, Pan, Pinch, Rotation
│   └── Edge swipe for navigation
│
├── iPad Gestures
│   └── Multi-task (4 finger swipe)
│   && Slide Over, Split View
│   && Pointer/trackpad support
│
├── Watch Gestures
│   └── Tap, Swipe, Long Press
│   && Digital Crown, Force Touch (legacy)
│
└── Mac Gestures
    └── Pointer, click, scroll
    && Trackpad gestures, Force Touch
```

---

## Key Patterns

1. **Use semantic colors** - Adapt to light/dark automatically
2. **Support all Dynamic Type sizes** - Layout must adapt
3. **SF Symbols always** - Never use custom images for icons
4. **Accessibility from start** - VoiceOver, Switch Control
5. **Test on real device** - Simulators miss haptic and performance

---

## Anti-Patterns

```
❌ Hardcoded colors — breaks in Dark Mode
✅ Use semantic colors or adaptive colors in asset catalog

❌ Fixed font sizes — won't scale with Dynamic Type
✅ Use .font(.body) or .font(.title2) (system styles)

❌ No accessibility labels — VoiceOver won't work
✅ Add .accessibilityLabel("Delete item") to custom views

❌ Using PNG/SVG for icons — not themable
✅ Use SF Symbols with .symbolRenderingMode

❌ Complex gestures on watch — hard to perform
✅ Prefer taps, minimal gestures
```

---

## Quick Reference

| Category | Use |
|---|---|
| Colors | Asset Catalog with Any/Light/Dark |
| Fonts | SF Pro, text styles, Dynamic Type |
| Icons | SF Symbols only |
| Layout | Adaptive, safe areas, Dynamic Type |
| Navigation | System patterns (tab, nav) |
| Accessibility | VoiceOver, Switch Control |
