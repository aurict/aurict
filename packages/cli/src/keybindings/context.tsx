/**
 * Keybindings — React context + hooks
 *
 * useInput'u sarmalayıp action-based API sağlar.
 * Context stack (push/pop) ile modal/permission gibi durumlar desteklenir.
 *
 * Kullanım:
 *   const { useBinding, useBindingHints, currentContext } = useKeybindings()
 *   useBinding("submit", "ready", () => onSubmit(value))
 *   const hints = useBindingHints([{ action: "submit", label: "send" }])
 */

import React, { createContext, useContext, useEffect, useMemo, useState, useRef } from "react"
import { useInput } from "ink"
import { buildResolvedStore, matchInkEvent, resolveDisplayKey } from "./resolver.js"
import { loadKeybindings } from "./persistence.js"
import type {
  Action, Context, BindingOverride, UseBindingOptions,
  UseBindingHintsOptions, UseBindingHintsResult,
} from "./types.js"

// ── Store Context ────────────────────────────────────────────────────────────

interface KeybindingsContextValue {
  store:       ReturnType<typeof buildResolvedStore>
  /** Şu an aktif context (en üstteki) */
  currentContext: Context
  /** Yeni context push et (modal açılınca) */
  pushContext: (ctx: Context) => void
  /** En üstteki context'i pop et (modal kapanınca) */
  popContext:  () => void
  /** Context'i doğrudan set et (replace) */
  setContext:  (ctx: Context) => void
  /** Kullanıcı override'larını döner (debug / display için) */
  overrides:   BindingOverride
  /** Hata varsa (load sırasında) */
  loadError?:  string | undefined
  /** Override'ları güncelle (config reload için) */
  reload:      () => void
}

const KeybindingsContext = createContext<KeybindingsContextValue | null>(null)

// ── Provider ────────────────────────────────────────────────────────────────

export interface KeybindingsProviderProps {
  /** İlk context (default: "ready") */
  initialContext?: Context
  /** Override'ları manuel geç (test için) */
  overrides?:     BindingOverride
  children:       React.ReactNode
}

export function KeybindingsProvider({
  initialContext = "ready",
  overrides: propOverrides,
  children,
}: KeybindingsProviderProps) {
  const [contextStack, setContextStack] = useState<Context[]>([initialContext])
  const [loadResult, setLoadResult]     = useState(() => loadKeybindings())
  const [version, setVersion]           = useState(0)

  useEffect(() => {
    setContextStack([initialContext])
  }, [initialContext])

  // Overrides: prop > dosyadan yüklenen
  const overrides = propOverrides ?? loadResult.bindings
  const store = useMemo(() => buildResolvedStore(overrides), [overrides, version])

  const currentContext = contextStack[contextStack.length - 1] ?? "global"

  const pushContext = (ctx: Context) => {
    setContextStack(prev => [...prev, ctx])
  }

  const popContext = () => {
    setContextStack(prev => prev.length > 1 ? prev.slice(0, -1) : prev)
  }

  const setContext = (ctx: Context) => {
    setContextStack([ctx])
  }

  const reload = () => {
    setLoadResult(loadKeybindings())
    setVersion(v => v + 1)
  }

  return (
    <KeybindingsContext.Provider
      value={{
        store,
        currentContext,
        pushContext,
        popContext,
        setContext,
        overrides,
        ...(loadResult.error !== undefined ? { loadError: loadResult.error } : {}),
        reload,
      }}
    >
      {children}
    </KeybindingsContext.Provider>
  )
}

// ── useKeybindings ──────────────────────────────────────────────────────────

export function useKeybindings(): KeybindingsContextValue {
  const ctx = useContext(KeybindingsContext)
  if (!ctx) {
    throw new Error("useKeybindings must be used within <KeybindingsProvider>")
  }
  return ctx
}

// ── useBinding (per-component useInput wrapper) ─────────────────────────────

/**
 * Belirli bir action tetiklendiğinde callback çağırır.
 * useInput Ink hook'unu sarmalar, action matching yapar.
 *
 * Kullanım:
 *   useBinding({
 *     action: "submit",
 *     context: "ready",
 *     onTrigger: () => onSubmit(value),
 *   })
 */
export function useBinding({
  action,
  context: propContext,
  onTrigger,
  passive = false,
}: UseBindingOptions) {
  const { store, currentContext } = useKeybindings()
  const context = propContext ?? currentContext
  const handlerRef = useRef(onTrigger)
  handlerRef.current = onTrigger

  // passive: sadece display için, input handling yapma
  useInput((input, key) => {
    if (passive) return
    const matched = matchInkEvent({ input, key }, context, store)
    if (matched === action) {
      handlerRef.current()
    }
  })
}

// ── useBindingHints (display için) ──────────────────────────────────────────

/**
 * Verilen action'lar için display key'leri döner (örn. status bar'da göstermek).
 *
 * Kullanım:
 *   const hints = useBindingHints([
 *     { action: "submit", label: "send" },
 *     { action: "abort",  label: "abort" },
 *   ])
 *   // hints: [{ action: "submit", label: "send", key: "ctrl+c", display: "ctrl+c" }, ...]
 */
export function useBindingHints(
  options: UseBindingHintsOptions,
): UseBindingHintsResult {
  const { store, currentContext } = useKeybindings()

  return useMemo(() => {
    const hints = options.actions.map(({ action, label, context }) => {
      const ctx = context ?? currentContext
      const key = resolveDisplayKey(action, ctx, store) ?? ""
      return {
        action,
        label: label ?? action,
        key,
        display: key, // platform-aware göstermek için display.tsx'te zenginleştirilir
      }
    })
    return { hints }
  }, [store, currentContext, options.actions])
}

// ── useBindingMeta (debug) ──────────────────────────────────────────────────

/**
 * Action için tüm meta bilgiyi döner (display, source, context).
 */
export function useBindingMeta(action: Action, context?: Context) {
  const { store, currentContext } = useKeybindings()
  const ctx = context ?? currentContext
  return useMemo(() => ({
    display: resolveDisplayKey(action, ctx, store),
    source:  store.sources[ctx]?.[action] ?? "default",
    context: ctx,
  }), [store, ctx, action])
}
