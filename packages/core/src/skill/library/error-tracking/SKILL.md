---
name: error-tracking
description: "Error Tracking: Sentry, Bugsnag integration, Error boundaries, Source maps, Performance monitoring."
triggers:
  files: ["sentry.config.ts", "bugsnag.config.js"]
  directories: ["monitoring/", "error-tracking/"]
  keywords: ["Sentry", "Bugsnag", "error tracking", "crash reporting", "source map"]
auto_load_when: "Setting up error monitoring or analyzing production errors"
agent: devops-engineer
tools: ["Read", "Write", "Bash"]
---

# Error Tracking Patterns

**Focus:** Error collection, source maps, monitoring

## 1. Basic Setup

```
Sentry SDK:
import * as Sentry from '@sentry/svelte'

Sentry.init({
  dsn: process.env.SENTRY_DSN,
  environment: process.env.NODE_ENV,
  release: 'my-app@1.0.0',
  integrations: [
    Sentry.browserTracingIntegration(),
    Sentry.replayIntegration()
  ],
  tracesSampleRate: 0.1,
  replaysSessionSampleRate: 0.1,
  replaysOnErrorSampleRate: 1.0
})

Capture Errors:
try {
  await riskyOperation()
} catch (error) {
  Sentry.captureException(error)
}

Sentry.captureMessage('Something happened', 'warning')

Custom Context:
Sentry.setUser({ id: user.id, email: user.email })
Sentry.setTags({ environment: 'production' })
Sentry.setExtra({ key: 'value' })
```

---

## 2. Error Boundaries

```
Svelte Error Boundary:
<script>
  import { onError } from '@sveltejs/kit'

  onError(({ error, cause }) => {
    Sentry.captureException(error, { extra: { cause } })
  })
</script>

React Error Boundary:
class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props)
    this.state = { hasError: false }
  }

  static getDerivedStateFromError(error) {
    return { hasError: true }
  }

  componentDidCatch(error, errorInfo) {
    Sentry.captureException(error, { extra: errorInfo })
  }

  render() {
    if (this.state.hasError) {
      return <FallbackUI />
    }
    return this.props.children
  }
}
```

---

## 3. Source Maps

```
Webpack Source Maps:
// webpack.config.js
production: {
  devtool: 'source-map',
  plugins: [
    new SentryPlugin({
      org: 'my-org',
      project: 'my-project',
      authToken: process.env.SENTRY_AUTH_TOKEN,
      release: 'my-app@1.0.0',
      include: './dist'
    })
  ]
}

Vite Source Maps:
export default defineConfig({
  build: {
    sourcemap: true
  },
  plugins: [
    sentryVitePlugin({
      org: 'my-org',
      project: 'my-project',
      authToken: process.env.SENTRY_AUTH_TOKEN
    })
  ]
})

Uploads After Build:
sentry-cli releases files ./dist/*.map upload-sourcemaps
```

---

## 4. Performance Monitoring

```
Sentry Performance:
Sentry.startTransaction({
  op: 'pageload',
  name: 'My Page'
})

// In React
<SentryTracing>
  <App />
</SentryTracing>

Custom Spans:
const transaction = Sentry.startTransaction({ name: 'my-task' })
const span = transaction.startChild({ op: 'database' })

try {
  await db.query(...)
  span.setStatus('ok')
} catch (e) {
  span.setStatus('internal_error')
  throw e
} finally {
  span.finish()
  transaction.finish()
}

Web Vitals:
import { onCLS, onFID, onLCP } from 'web-vitals'

onCLS(metric => Sentry.addBreadcrumb({ category: 'webvital', message: `CLS: ${metric.value}` }))
onFID(metric => Sentry.addBreadcrumb({ category: 'webvital', message: `FID: ${metric.value}` }))
onLCP(metric => Sentry.addBreadcrumb({ category: 'webvital', message: `LCP: ${metric.value}` }))
```

---

## Key Patterns

1. **Set context** — User ID, tags, extra data
2. **Use source maps** — For readable stack traces
3. **Track performance** — Monitor slow transactions
4. **Alert wisely** — Only alert on critical errors
5. **Triage properly** — Mark resolved issues

---

## Anti-Patterns

```
❌ No error tracking in production
✅ Always use error monitoring

❌ Capturing too much data
✅ Only capture relevant context

❌ No source maps
✅ Upload source maps for debugging

❌ Ignoring errors
✅ Triage and mark as resolved

❌ Too many alerts
✅ Filter noise, only alert critical

❌ Not tracking performance
✅ Monitor slow transactions
```

---

## Quick Reference

| Tool | SDK | Note |
|---|---|---|
| Sentry | @sentry/svelte, @sentry/node | Most popular |
| Bugsnag | @bugsnag/js | Good for React |
| Rollbar | rollbar.js | Simpler setup |
| Datadog | dd-trace | APM + errors |
