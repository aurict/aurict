---
name: webhook-handling
description: "Webhook Handling: Signature verification, Retry patterns, Idempotency, Event processing, Error handling."
triggers:
  extensions: [".ts", ".js"]
  directories: ["webhooks/", "hooks/", "events/"]
  keywords: ["webhook", "callback", "event", "signature", "stripe", "github", "webhook"]
auto_load_when: "Building webhook endpoints or processing external events"
agent: architect
tools: ["Read", "Write", "Bash"]
---

# Webhook Handling Patterns

**Focus:** Security, reliability, idempotency, event processing

## 1. Signature Verification

```
Why Verify Signatures:
├── Prevents fake webhook requests
├── Ensures request came from expected provider
├── Protects against replay attacks
└── Mandatory for production systems

Stripe-style HMAC (Most Common):
import { createHmac } from 'crypto'

function verifyStripeSignature(payload: string, signature: string, secret: string) {
  const signedPayload = `${payload}.${signature}`
  const expected = createHmac('sha256', secret)
    .update(signedPayload)
    .digest('hex')

  return signature === expected
}

// In handler:
const payload = await req.text()
const signature = req.headers.get('stripe-signature')

if (!verifyStripeSignature(payload, signature, process.env.STRIPE_SECRET)) {
  return new Response('Invalid signature', { status: 401 })
}

GitHub Webhook:
import { createHmac } from 'crypto'

function verifyGitHubSignature(payload: string, signature: string, secret: string) {
  const hmac = createHmac('sha256', secret)
  const digest = hmac.update(payload).digest('hex')
  return `sha256=${digest}` === signature
}

const signature = req.headers.get('x-hub-signature-256')
const body = await req.text()

if (!verifyGitHubSignature(body, signature, process.env.GITHUB_SECRET)) {
  return new Response('Invalid signature', { status: 401 })
}

Amazon SNS Signature:
├── Verify certificate chain
├── Check topic ARN matches
├── Verify HMAC-SHA1 signature
└── Use AWS SDK: sns.verifyMessage(message)
```

---

## 2. Request Parsing & Validation

```
Parse Event Payload:
app.post('/webhooks/stripe', async (c) => {
  const body = await c.req.json()
  const eventType = body.type
  const eventData = body.data.object
})

Validate Required Fields:
function validateStripeEvent(event: any): event is StripeEvent {
  return event &&
    typeof event.type === 'string' &&
    typeof event.data === 'object' &&
    typeof event.data.object === 'object'
}

app.post('/webhooks/stripe', async (c) => {
  const event = await c.req.json()

  if (!validateStripeEvent(event)) {
    return c.json({ error: 'Invalid event' }, 400)
  }

  // Process event...
})

Type-safe Event Handling:
type StripeEvent =
  | { type: 'checkout.session.completed'; data: CheckoutSessionData }
  | { type: 'customer.subscription.updated'; data: SubscriptionData }
  | { type: 'invoice.payment_succeeded'; data: InvoiceData }

app.post('/webhooks/stripe', async (c) => {
  const event = await c.req.json() as StripeEvent

  switch (event.type) {
    case 'checkout.session.completed':
      await handleCheckoutComplete(event.data)
      break
    case 'customer.subscription.updated':
      await handleSubscriptionUpdate(event.data)
      break
    default:
      console.log('Unhandled event type:', event.type)
  }
})
```

---

## 3. Idempotency

```
Why Idempotency:
├── Webhooks can be sent multiple times (network retries)
├── Processing same event twice causes duplicate actions
└── Must handle duplicates gracefully

Idempotency Keys:
├── Use event ID as idempotency key (if unique)
├── Use webhook ID + timestamp
├── Or generate deterministic key from event content

Implementation:
async function processWebhook(event: WebhookEvent): Promise<void> {
  const idempotencyKey = `webhook:${event.id}`

  // Check if already processed
  const existing = await redis.get(idempotencyKey)
  if (existing) {
    console.log('Duplicate webhook:', event.id)
    return
  }

  // Process event
  await processEvent(event)

  // Mark as processed (with TTL)
  await redis.set(idempotencyKey, 'processed', { EX: 86400 })
}

Database Idempotency:
async function processOrderWebhook(event: WebhookEvent) {
  const existingOrder = await db.orders.findUnique({
    where: { externalId: event.data.order_id }
  })

  if (existingOrder) {
    return // Already created
  }

  await db.orders.create({
    data: { ... }
  })
}

Idempotency in Event Handler:
const handler = async (event: Event) => {
  await withLock(`event:${event.id}`, async () => {
    // Process only once
    await doProcessing(event)
  })
}
```

---

## 4. Retry Patterns

```
Webhook Retry Strategy:
├── Always respond 200 quickly (acknowledge receipt)
├── Process async (queue the work)
├── Return 200 immediately, even on failure
└── Provider handles retries on non-200

Queue-based Processing:
app.post('/webhooks/stripe', async (c) => {
  const event = await c.req.json()

  // Queue immediately, respond 200
  await redis.lpush('webhook:queue', JSON.stringify(event))

  return new Response('OK', { status: 200 })
})

// Separate worker process:
async function processQueue() {
  while (true) {
    const event = await redis.rpop('webhook:queue')
    if (event) {
      await processWebhook(JSON.parse(event))
    }
  }
}

Retry with Backoff:
async function processWithRetry(event: Event, maxRetries = 3) {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      await processEvent(event)
      return // Success
    } catch (error) {
      if (attempt === maxRetries) throw error
      const delay = Math.pow(2, attempt) * 1000 // 2s, 4s
      await sleep(delay)
    }
  }
}

Dead Letter Queue:
async function processWithDLQ(event: Event) {
  try {
    await processEvent(event)
  } catch (error) {
    // Move to DLQ after max retries
    await redis.lpush('webhook:dlq', JSON.stringify({
      event,
      error: error.message,
      attempts: event.attempts
    }))
    await notifySlack('Webhook failed:', event.id)
  }
}
```

---

## 5. Event Processing Patterns

```
Sequential Processing:
app.post('/webhooks/stripe', async (c) => {
  const event = await c.req.json()

  // Process sequentially
  await handleEvent(event)

  return c.text('OK')
})

Parallel Processing:
app.post('/webhooks/github', async (c) => {
  const event = await c.req.json()
  const deliveries = event.deliveries || []

  await Promise.allSettled(
    deliveries.map(d => handleDelivery(d))
  )

  return c.text('OK')
})

Event Routing:
function routeEvent(event: WebhookEvent): EventHandler {
  switch (event.source) {
    case 'stripe': return handleStripe
    case 'github': return handleGitHub
    case 'slack': return handleSlack
    case 'shopify': return handleShopify
    default: return handleUnknown
  }
}

app.post('/webhooks', async (c) => {
  const event = await c.req.json()
  const handler = routeEvent(event)
  await handler(event)
})

Event Transformation:
function normalizeEvent(provider: string, payload: any): NormalizedEvent {
  const base = {
    id: `${provider}:${payload.id}`,
    timestamp: new Date(),
    provider
  }

  switch (provider) {
    case 'stripe':
      return { ...base, type: payload.type, data: payload.data.object }
    case 'github':
      return { ...base, type: payload.action, data: payload.repository }
    default:
      return base
  }
}
```

---

## 6. Error Handling

```
Webhook Error Handling:
├── Return 200 for all processed events (even errors)
├── Log all failures for debugging
├── Alert on critical failures
├── Never expose internal errors in response

app.post('/webhooks/stripe', async (c) => {
  try {
    const event = await c.req.json()
    await processWebhook(event)
    return c.text('OK')
  } catch (error) {
    console.error('Webhook error:', error)
    // Still return 200 - provider will retry
    return c.text('OK')
  }
})

Critical vs Non-critical:
async function processWebhook(event: WebhookEvent) {
  switch (event.type) {
    case 'payment.succeeded':
      await handlePayment(event) // Critical - must process
      break
    case 'payment.method.updated':
      await handlePaymentMethod(event) // Less critical
      break
    case 'invoice.generated':
      await handleInvoice(event) // Can be processed later
      break
  }
}

Monitoring & Alerting:
- Track webhook processing time
- Alert on high failure rate
- Monitor retry counts
- Log all webhook requests with correlation ID

Webhook Health Check:
- Track success/failure rate per provider
- Alert if failure rate > 5%
- Monitor processing latency
- Track oldest pending webhook
```

---

## 7. Security Best Practices

```
Webhook Security Checklist:
├── Always verify signatures
├── Use HTTPS only
├── Validate webhook source IP (if possible)
├── Add request timeout
├── Log all webhook requests
├── Use idempotency keys
├── Implement retry logic
└── Rotate secrets regularly

Rate Limiting:
app.post('/webhooks', async (c) => {
  const ip = c.req.header('x-forwarded-for')
  const attempts = await redis.incr(`ratelimit:${ip}`)

  if (attempts > 100) {
    return c.text('Too many requests', { status: 429 })
  }

  await redis.expire(`ratelimit:${ip}`, 60)
})

Timeout Handling:
app.post('/webhooks/stripe', async (c) => {
  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), 5000)

  try {
    await processWebhook(await c.req.json(), { signal: controller.signal })
  } catch (e) {
    if (e.name === 'AbortError') {
      return c.text('Timeout', { status: 504 })
    }
    throw e
  } finally {
    clearTimeout(timeout)
  }

  return c.text('OK')
})

Secret Rotation:
- Rotate webhook secrets quarterly
- Keep old secret valid for 24h after rotation
- Update dashboard/webhook URLs immediately
- Document rotation process
```

---

## Key Patterns

1. **Always verify signatures** — HMAC verification mandatory
2. **Respond 200 quickly** — Process async via queue
3. **Implement idempotency** — Use event ID as key
4. **Queue-based processing** — Decouple receipt from processing
5. **Retry with backoff** — Exponential backoff for failures
6. **Dead letter queue** — Handle failed events gracefully

---

## Anti-Patterns

```
❌ Processing synchronously before responding
✅ Respond 200 first, process async

❌ No signature verification
✅ Always verify HMAC signature

❌ Not handling duplicates
✅ Use idempotency keys to prevent duplicates

❌ Returning error codes (causes retries)
✅ Return 200 even on failures, handle retries via queue

❌ Exposing internal errors in response
✅ Log internally, return generic message

❌ No logging
✅ Log all webhooks with correlation ID

❌ No timeout handling
✅ Add request timeout for all webhook handlers

❌ Hardcoded secrets in code
✅ Use environment variables
```

---

## Quick Reference

| Concern | Pattern | Implementation |
|---|---|---|
| Security | HMAC signature | Verify with secret key |
| Idempotency | Event ID key | Check/set in Redis/DB |
| Reliability | Queue processing | Respond 200, queue async |
| Retry | Exponential backoff | 1s, 2s, 4s delays |
| Errors | DLQ | Move failed to dead letter |
| Timeout | AbortController | 5-10s max processing |
| Monitoring | Metrics | Track success/failure rate |

---

## Decision Tree

```
Process synchronously or async?
├── Work < 200ms (quick DB write)      → process inline, respond 200
├── Work > 200ms or might fail         → queue immediately, respond 200, process async
└── Critical (payment, fulfillment)    → queue + DLQ + alert on failure

Response code?
├── Signature invalid                  → 401 (stops retries)
├── Payload malformed                  → 400 (stops retries)
├── Processing error                   → 200 (trigger provider retry later)
└── Duplicate / already processed      → 200 (idempotent, pretend success)

Idempotency storage?
├── Redis available                    → SET webhook:${id} EX 86400
├── Only DB available                  → unique index on externalId column
└── Multi-instance with race risk      → Redis SETNX (atomic)
```

---

## Key Rules

1. Verify HMAC signature before any processing — reject 401 on mismatch
2. Respond 200 immediately for provider retries; queue work async
3. Use event `id` as idempotency key — check before processing, set after
4. Never return 5xx for your processing failures — provider will retry indefinitely
5. Log every webhook with correlation ID for debugging
6. Dead letter queue for failed events after max retries
7. Rate-limit the endpoint by IP (100/min) against DDoS

---

## Implementation

```typescript
// Stripe webhook handler — signature verification + idempotency
import { createHmac, timingSafeEqual } from 'crypto'
import { redis } from '@/lib/redis'
import { queue } from '@/lib/queue'

export async function POST(req: Request) {
  const payload   = await req.text()
  const signature = req.headers.get('stripe-signature') ?? ''

  // 1. Verify signature (timing-safe comparison)
  const [, ts, , v1] = signature.split(/[=,]/)
  const expected = createHmac('sha256', process.env.STRIPE_WEBHOOK_SECRET!)
    .update(`${ts}.${payload}`)
    .digest('hex')
  if (!timingSafeEqual(Buffer.from(expected), Buffer.from(v1 ?? ''))) {
    return new Response('Invalid signature', { status: 401 })
  }

  const event = JSON.parse(payload)

  // 2. Idempotency check
  const key = `webhook:stripe:${event.id}`
  const seen = await redis.set(key, '1', { NX: true, EX: 86400 })
  if (!seen) return new Response('OK')  // duplicate, skip silently

  // 3. Queue async, respond immediately
  await queue.add('stripe-event', event)
  return new Response('OK')
}

// Worker — process with retry + DLQ
async function processStripeEvent(event: StripeEvent) {
  switch (event.type) {
    case 'checkout.session.completed':
      await fulfillOrder(event.data.object)
      break
    case 'customer.subscription.deleted':
      await downgradeUser(event.data.object.customer as string)
      break
    default:
      // Unknown events: no-op (200 already sent)
  }
}
```
