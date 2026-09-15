declare const self: {
  onmessage: (event: MessageEvent<import("./blast-radius-contracts.js").BlastRadiusRequest>) => void
  postMessage(message: import("./blast-radius-contracts.js").BlastRadiusWorkerResponse): void
}

import { analyzeBlastRadius } from "./blast-radius-engine.js"

self.onmessage = event => {
  void analyzeBlastRadius(event.data)
    .then(analysis => self.postMessage({ ok: true, analysis }))
    .catch(error => self.postMessage({ ok: false, error: error instanceof Error ? error.message : String(error) }))
}
