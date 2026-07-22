export interface FirstResponseDeadline {
  signal: AbortSignal
  markResponse(): void
  dispose(): void
  isArmed(): boolean
}

/**
 * Streaming requests have an observable first event, so a TTFT deadline is
 * meaningful. Non-streaming calls only resolve at completion and must never be
 * aborted by that deadline.
 */
export function createFirstResponseDeadline(options: {
  enabled: boolean
  timeoutMs: number
  parentSignal?: AbortSignal
}): FirstResponseDeadline {
  if (!options.enabled) {
    const signal = options.parentSignal ?? new AbortController().signal
    return {
      signal,
      markResponse: () => undefined,
      dispose: () => undefined,
      isArmed: () => false,
    }
  }

  const controller = new AbortController()
  let armed = true
  const timer = setTimeout(() => {
    armed = false
    controller.abort(new Error("Provider did not start responding in time."))
  }, options.timeoutMs)
  const signal = options.parentSignal
    ? AbortSignal.any([options.parentSignal, controller.signal])
    : controller.signal
  const disarm = () => {
    if (!armed) return
    armed = false
    clearTimeout(timer)
  }

  return {
    signal,
    markResponse: disarm,
    dispose: disarm,
    isArmed: () => armed,
  }
}
