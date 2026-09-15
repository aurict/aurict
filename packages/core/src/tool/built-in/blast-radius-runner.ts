import type { BlastRadiusAnalysis, BlastRadiusRequest, BlastRadiusWorkerResponse } from "./blast-radius-contracts.js"

declare const __AURICT_COMPILED__: boolean | undefined

export class BlastRadiusCancelledError extends Error {
  constructor() {
    super("Blast-radius analysis cancelled")
    this.name = "BlastRadiusCancelledError"
  }
}

export function runBlastRadiusWorker(request: BlastRadiusRequest, signal: AbortSignal): Promise<BlastRadiusAnalysis> {
  if (signal.aborted) return Promise.reject(new BlastRadiusCancelledError())
  const worker = createWorker()
  return new Promise((resolve, reject) => {
    let settled = false
    const finish = (callback: () => void) => {
      if (settled) return
      settled = true
      signal.removeEventListener("abort", onAbort)
      worker.terminate()
      callback()
    }
    const onAbort = () => finish(() => reject(new BlastRadiusCancelledError()))
    signal.addEventListener("abort", onAbort, { once: true })
    worker.onmessage = (event: MessageEvent<BlastRadiusWorkerResponse>) => finish(() => event.data.ok ? resolve(event.data.analysis) : reject(new Error(event.data.error)))
    worker.onerror = event => finish(() => reject(new Error(`Blast-radius worker failed: ${event.message}`)))
    worker.postMessage(request)
  })
}

function createWorker(): Worker {
  if (typeof __AURICT_COMPILED__ === "boolean" && __AURICT_COMPILED__) {
    return new Worker("./packages/core/src/tool/built-in/blast-radius-worker.ts", { type: "module" })
  }
  return new Worker(new URL("./blast-radius-worker.ts", import.meta.url), { type: "module" })
}
