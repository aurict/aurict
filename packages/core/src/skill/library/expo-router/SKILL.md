---
name: expo-router
description: "Expo Router v3: File-based navigation, layouts, tabs, modals, deep linking, API routes, typed routes."
triggers:
  extensions: [".tsx", ".ts"]
  directories: ["app/", "app/(tabs)/"]
  filenames: ["app.json", "expo-env.d.ts"]
  keywords: ["expo-router", "useRouter", "useLocalSearchParams", "useSegments", "Stack", "Tabs", "Link", "Slot"]
auto_load_when: "Building a React Native app with Expo Router"
agent: mobile-ops
tools: ["Read", "Write", "Bash"]
---

# Expo Router v3 Patterns

**Version:** Expo Router v3 / Expo SDK 52 | **Focus:** File-based routing, navigation, layouts, auth flows

---

## 1. File-Based Route Structure

```
app/
├── _layout.tsx          ← Root layout (providers, fonts)
├── index.tsx            ← / (home)
├── (tabs)/
│   ├── _layout.tsx      ← Tab bar layout
│   ├── index.tsx        ← /  (first tab)
│   ├── explore.tsx      ← /explore
│   └── profile.tsx      ← /profile
├── (auth)/
│   ├── _layout.tsx      ← Auth layout (no tab bar)
│   ├── login.tsx        ← /login
│   └── register.tsx     ← /register
├── posts/
│   ├── [id].tsx         ← /posts/:id (dynamic)
│   └── [id]/comments.tsx ← /posts/:id/comments
└── +not-found.tsx       ← 404 screen
```

---

## 2. Root Layout & Providers

```tsx
// app/_layout.tsx
import { Stack } from 'expo-router';
import { useFonts } from 'expo-font';
import * as SplashScreen from 'expo-splash-screen';
import { useEffect } from 'react';

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const [loaded] = useFonts({ SpaceMono: require('../assets/fonts/SpaceMono-Regular.ttf') });

  useEffect(() => {
    if (loaded) SplashScreen.hideAsync();
  }, [loaded]);

  if (!loaded) return null;

  return (
    <Stack>
      <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
      <Stack.Screen name="(auth)" options={{ headerShown: false }} />
      <Stack.Screen name="+not-found" />
    </Stack>
  );
}
```

---

## 3. Tab Navigation

```tsx
// app/(tabs)/_layout.tsx
import { Tabs } from 'expo-router';
import { MaterialIcons } from '@expo/vector-icons';

export default function TabLayout() {
  return (
    <Tabs screenOptions={{ tabBarActiveTintColor: '#007AFF' }}>
      <Tabs.Screen name="index" options={{
        title: 'Home',
        tabBarIcon: ({ color }) => <MaterialIcons name="home" size={24} color={color} />,
      }} />
      <Tabs.Screen name="explore" options={{
        title: 'Explore',
        tabBarIcon: ({ color }) => <MaterialIcons name="search" size={24} color={color} />,
      }} />
    </Tabs>
  );
}
```

---

## 4. Navigation & Params

```tsx
import { router, useRouter, useLocalSearchParams, Link } from 'expo-router';

// Declarative navigation
<Link href="/posts/123">View Post</Link>
<Link href={{ pathname: '/posts/[id]', params: { id: post.id } }}>
  <Text>{post.title}</Text>
</Link>

// Programmatic navigation
export function PostCard({ post }) {
  const router = useRouter();
  return (
    <Pressable onPress={() => router.push(`/posts/${post.id}`)}>
      <Text>{post.title}</Text>
    </Pressable>
  );
}

// Read params
export default function PostScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  // id is always a string (or string[] for catch-all routes)
}

// Replace vs push
router.replace('/login');    // no back button
router.push('/details');     // add to stack
router.back();               // go back
```

---

## 5. Auth Flow (Protected Routes)

```tsx
// app/_layout.tsx — auth guard
import { useSegments, router } from 'expo-router';
import { useAuth } from '@/hooks/useAuth';
import { useEffect } from 'react';

export default function RootLayout() {
  const { user, isLoading } = useAuth();
  const segments = useSegments();

  useEffect(() => {
    if (isLoading) return;
    const inAuthGroup = segments[0] === '(auth)';

    if (!user && !inAuthGroup) router.replace('/login');
    if (user && inAuthGroup) router.replace('/');
  }, [user, isLoading, segments]);

  return <Stack />;
}
```

---

## 6. Modal Screen

```tsx
// app/modal.tsx
import { router } from 'expo-router';

export default function Modal() {
  return (
    <View>
      <Text>I'm a modal!</Text>
      <Button onPress={() => router.back()} title="Close" />
    </View>
  );
}

// Register in _layout.tsx
<Stack.Screen name="modal" options={{ presentation: 'modal' }} />

// Open modal
router.push('/modal');
```

---

## Quick Reference

| Need | API |
|------|-----|
| Navigate to screen | `router.push('/path')` |
| Replace (no back) | `router.replace('/path')` |
| Dynamic route params | `useLocalSearchParams<{ id: string }>()` |
| Current route | `useSegments()` / `usePathname()` |
| Back navigation | `router.back()` |
| Typed routes | `import { Href } from 'expo-router'` |

## Anti-Patterns

```
❌ Using React Navigation manually alongside Expo Router
✅ Use Expo Router layouts exclusively — mixing causes conflicts

❌ Passing objects/arrays in URL params
✅ Serialize to string; parse on the other side

❌ Putting auth check inside each screen
✅ Centralize in root layout with useSegments hook

❌ Deep nested folders for simple routes
✅ Groups () are invisible in URL — use for layout only, not nesting depth
```
