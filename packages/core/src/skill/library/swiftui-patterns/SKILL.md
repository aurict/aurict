---
name: swiftui-patterns
description: "SwiftUI Patterns: Declarative UI, State management, Navigation, Composability, Animations." 
triggers:
  extensions: [".swift"]
  directories: ["ios/", "macos/", "swift/", "apple/"]
  keywords: ["swiftui", "swift", "xcode", "ios", "macos", "watchos", "apple", "@State", "@Binding", "@ObservedObject", "@Environment"]
auto_load_when: "Building Apple native apps with SwiftUI"
agent: swift-developer
tools: ["Read", "Write", "Bash"]
---

# SwiftUI Architecture Patterns

**Focus:** Declarative UI, state management, modern Swift

## 1. SwiftUI Core Concepts

```
State Management:
├── @State - Local view state
│   └── struct ContentView: View {
│       @State private var isPresented = false
│   }
│
├── @Binding - Two-way binding
│   └── Child receives reference, can modify parent
│
├── @ObservedObject - External reference type
│   └── class MyViewModel: ObservableObject
│   └── @Published properties trigger view update
│
├── @Environment - Injected dependencies
│   └── @Environment(\.colorScheme) var colorScheme
│   └── @Environment(\.dismiss) var dismiss
│
└── @StateObject - View-owned lifecycle
    └── @StateObject var viewModel = MyViewModel()
```

---

## 2. Modern Swift (5.9+)

```
Concurrency:
├── async/await
│   └── func fetchData() async throws -> Data
│
├── Task and TaskGroup
│   └── await withTaskGroup(of: Void.self) { group in
│       group.addTask { await self.fetchA() }
│       group.addTask { await self.fetchB() }
│   }
│
├── Actor for thread safety
│   └── actor DataStore { ... }
│
└── @MainActor for UI updates
    └── @MainActor func updateUI() // runs on main thread
```

---

## 3. Navigation Patterns

```
Navigation Types:
├── NavigationStack (iOS 16+)
│   └── NavigationLink(value:) → NavigationDestination
│   └── Type-safe navigation with path
│
├── NavigationPath
│   └── let path = NavigationPath()
│   └── path.append(Destination.detail)
│
├── Sheet and FullScreenCover
│   └── .sheet(isPresented:) { SheetContent() }
│
└── TabView
    └── TabView { ... }
    └── .tabViewStyle(.page) for carousel
```

---

## 4. Data Flow

```
Data Flow Patterns:
├── @FetchRequest for Core Data
│   └── @FetchRequest(sortDescriptors: ...) var items: FetchedResults<Item>
│
├── @Query for SwiftData (iOS 17+)
│   └── @Query var items: [Item]
│
└── Networking with async/await
    └── struct API {
        static func fetch() async throws -> [Model]
    }
    └── URLSession.shared.data(from: url)
```

---

## Key Patterns

1. **Single source of truth** - ObservableObject or SwiftData
2. **Immutable views** - @State for local, @Binding for passed
3. **Lazy loading** - LazyVStack, LazyVGrid for performance
4. **Type-safe navigation** - NavigationStack over NavigationView
5. **Modern concurrency** - async/await over completion handlers

---

## Anti-Patterns

```
❌ Using @StateObject in structs — only in views
✅ Class conforms to ObservableObject, use @ObservedObject or @StateObject in view

❌ Mixing UIKit and SwiftUI unnecessarily
✅ Use UIViewRepresentable only when needed

❌ Not handling loading/error states
✅ Use @State var isLoading: Bool = false, show Alert on error

❌ Hardcoded frames — breaks accessibility
✅ Use .frame(maxWidth: .infinity) not fixed widths

❌ Not supporting Dynamic Type
✅ Use .font(.body) not .font(.system(size: 17))
```

---

## Quick Reference

| Pattern | SwiftUI | UIKit equivalent |
|---|---|---|
| List | List {} | UITableView |
| ScrollView | ScrollView {} | UIScrollView |
| Button | Button("Title") {} | UIButton |
| TextField | TextField("Label", text: $var) | UITextField |
| Image | Image("name") | UIImageView |
| Navigation | NavigationStack {} | UINavigationController |
| Tab | TabView {} | UITabBarController |
