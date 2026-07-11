import type { BackendEnv } from "./env"
import type { BackendDb } from "./db/client"
import type { RateLimiter } from "./middleware/rate-limit"
import type { MetricsSink } from "./observability/metrics"
import type { BackendRepository } from "./store/repository"
import type { BackendStore, User } from "./store/types"

export type AppBindings = {
  Variables: {
    env: BackendEnv
    store: BackendStore
    repo: BackendRepository
    rateLimiter: RateLimiter
    metrics: MetricsSink
    db?: BackendDb
    requestId: string
    user?: User
  }
}
