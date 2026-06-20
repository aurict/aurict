---
name: supabase-patterns
description: "Supabase: Auth, Realtime, Storage, Edge Functions, Row Level Security, Postgres integration patterns."
triggers:
  extensions: [".ts", ".tsx"]
  directories: ["supabase/", "lib/supabase/"]
  filenames: ["supabase.ts", "supabase.config.ts"]
  keywords: ["supabase", "createClient", "RLS", "realtime", "storage bucket", "edge function"]
auto_load_when: "Using Supabase as backend (auth, database, storage, realtime)"
agent: infra-specialist
tools: ["Read", "Write", "Bash"]
---

# Supabase Patterns

**Version:** Supabase JS v2 | **Focus:** Auth, RLS, Realtime, Storage, Edge Functions

---

## 1. Client Setup

```ts
// lib/supabase/client.ts — Browser client (use client components)
import { createBrowserClient } from '@supabase/ssr';
export const createClient = () =>
  createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

// lib/supabase/server.ts — Server client (RSC, Server Actions)
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
export const createClient = () => {
  const cookieStore = cookies();
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies: { getAll: () => cookieStore.getAll(), setAll: (c) => c.forEach(({ name, value, options }) => cookieStore.set(name, value, options)) } }
  );
};
```

---

## 2. Auth Patterns

```ts
// Sign up
const { data, error } = await supabase.auth.signUp({ email, password });

// Sign in
const { data, error } = await supabase.auth.signInWithPassword({ email, password });

// OAuth
const { data, error } = await supabase.auth.signInWithOAuth({
  provider: 'google',
  options: { redirectTo: `${origin}/auth/callback` },
});

// Get session (Server Component)
const { data: { user } } = await supabase.auth.getUser();

// Middleware: protect routes
export async function middleware(req: NextRequest) {
  const { supabase, response } = createMiddlewareClient(req);
  await supabase.auth.getSession(); // refreshes session cookie
  return response;
}
```

---

## 3. Row Level Security (RLS)

```sql
-- Enable RLS on every table
ALTER TABLE posts ENABLE ROW LEVEL SECURITY;

-- Users can only read their own rows
CREATE POLICY "own_rows" ON posts
  FOR SELECT USING (auth.uid() = user_id);

-- Users can insert their own rows
CREATE POLICY "insert_own" ON posts
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Service role bypasses RLS (use only in Edge Functions/Server)
-- Never expose service_role key to client
```

**Rule:** Every table needs RLS. Default deny — add explicit ALLOW policies.

---

## 4. Realtime Subscriptions

```ts
// Subscribe to table changes
const channel = supabase
  .channel('posts_changes')
  .on('postgres_changes',
    { event: '*', schema: 'public', table: 'posts', filter: `user_id=eq.${userId}` },
    (payload) => console.log(payload)
  )
  .subscribe();

// Cleanup
return () => supabase.removeChannel(channel);

// Broadcast (presence, cursor tracking)
const room = supabase.channel('room1');
room.on('broadcast', { event: 'cursor' }, ({ payload }) => handleCursor(payload));
room.subscribe(async (status) => {
  if (status === 'SUBSCRIBED') {
    await room.send({ type: 'broadcast', event: 'cursor', payload: { x, y } });
  }
});
```

---

## 5. Storage

```ts
// Upload
const { data, error } = await supabase.storage
  .from('avatars')
  .upload(`${userId}/avatar.png`, file, { upsert: true });

// Get public URL
const { data: { publicUrl } } = supabase.storage
  .from('avatars')
  .getPublicUrl(`${userId}/avatar.png`);

// Download signed URL (private buckets)
const { data, error } = await supabase.storage
  .from('private-docs')
  .createSignedUrl('file.pdf', 3600); // 1 hour
```

---

## 6. Edge Functions

```ts
// supabase/functions/send-email/index.ts
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

serve(async (req) => {
  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')! // service role for admin ops
  );
  const body = await req.json();
  // ... logic
  return new Response(JSON.stringify({ ok: true }), { headers: { 'Content-Type': 'application/json' } });
});
```

---

## Quick Reference

| Need | Approach |
|------|----------|
| Browser auth state | `createBrowserClient` + `onAuthStateChange` |
| Server auth check | `createServerClient` + `getUser()` |
| Protected routes | Middleware with `getSession()` |
| Data access control | RLS policies, not application-level |
| Real-time data | `channel.on('postgres_changes', ...)` |
| File uploads | Storage SDK + bucket policies |
| Cron / webhooks | Edge Functions with Deno |
| Admin operations | Service role key (server-only, never client) |

## Anti-Patterns

```
❌ Using service_role key in browser/client code
✅ Service role only in Edge Functions or trusted server

❌ Skipping RLS, filtering in application code
✅ Always enable RLS; let database enforce access

❌ Fetching data in useEffect with supabase client
✅ Server Components + server client for initial data

❌ One channel per component (creates many connections)
✅ Shared channel per feature; remove on unmount
```
