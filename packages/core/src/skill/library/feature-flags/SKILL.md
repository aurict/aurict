---
name: feature-flags
description: "Feature Flags: Gradual rollouts, A/B testing, Kill switches, Feature management, Remote config."
triggers:
  files: ["feature-flags.json", "flags.config.js"]
  directories: ["flags/", "config/"]
  keywords: ["feature flag", "feature toggle", "launchdarkly", "split.io", "unleash"]
auto_load_when: "Implementing feature rollouts, A/B testing, or kill switches"
agent: platform-engineer
tools: ["Read", "Write", "Bash"]
---

# Feature Flags Patterns

**Focus:** Gradual rollouts, A/B testing, remote config

## 1. Flag Types

```
Release Flags (Kill Switches):
- Disable features without deploying
- Emergency rollbacks
- Example: Disable new payment flow

Experiment Flags (A/B Testing):
- Split traffic between variants
- Measure impact on metrics
- Example: Test new checkout flow

Operational Flags:
- Toggle features for specific users
- Percentage rollouts
- Example: Enable for 10% of users

Permission Flags:
- Enable for specific roles/users
- Internal testing
- Example: Enable beta for team
```

---

## 2. Implementation

```
Simple Flag Hook:
import { useFeature } from './flags'

function MyComponent() {
  const { enabled } = useFeature('new-checkout')

  if (!enabled) {
    return <OldCheckout />
  }

  return <NewCheckout />
}

Flag Provider:
<FeatureFlagsProvider>
  <App />
</FeatureFlagsProvider>

// useFeature reads from context
export function useFeature(flag: string) {
  const flags = useContext(FlagsContext)
  return flags[flag]
}

Client-side Evaluation:
// Use LaunchDarkly SDK
const ld = await launchdarkly.initialize('client-id')
const showFeature = await ld.variation('feature-key')

Server-side Evaluation:
// API returns enabled features
const features = await fetch('/api/features').then(r => r.json())
```

---

## 3. Gradual Rollout

```
Percentage Rollout:
{
  "flag": "new-dashboard",
  "rollout": {
    "percentage": 10,  // 10% of users
    "sticky": true     // Same user always gets same variant
  }
}

Targeting Rules:
{
  "flag": "beta-feature",
  "rules": [
    { "attribute": "email", "operator": "endsWith", "value": "@company.com" },
    { "attribute": "country", "operator": "in", "value": ["US", "CA"] },
    { "attribute": "customAttribute", "operator": "contains", "value": "beta" }
  ]
}

Sticky Sessions:
- Use user ID for consistent experience
- Hash user ID to bucket
- Store bucket in cookie/session
```

---

## 4. Flag Management

```
Admin Dashboard:
- View all flags and their status
- Toggle flags on/off
- Set targeting rules
- View analytics

API Endpoints:
GET /api/flags                    // List all flags
POST /api/flags                   // Create flag
PUT /api/flags/:name              // Update flag
DELETE /api/flags/:name           // Delete flag
POST /api/flags/:name/evaluate    // Evaluate for user

Evaluation:
{
  "flags": {
    "new-feature": { "enabled": true, "variant": "b" },
    "beta-dashboard": { "enabled": false }
  }
}
```

---

## Key Patterns

1. **Keep it simple** — Don't over-engineer flags
2. **Use unique keys** — Namespaced flag names
3. **Default to off** — New features off by default
4. **Monitor impact** — Track metrics when rolling out
5. **Clean up old flags** — Remove after full rollout

---

## Anti-Patterns

```
❌ Hardcoding flags in code
✅ Use config file or remote service

❌ Forgetting to clean up old flags
✅ Remove after 100% rollout

❌ No monitoring
✅ Track metrics for each flag

❌ Too many flags
✅ Keep flags to minimum necessary

❌ Not using sticky sessions
✅ Same user gets same variant

❌ Flags without documentation
✅ Document purpose and expected outcome
```

---

## Quick Reference

| Pattern | Tool | Note |
|---|---|---|
| SaaS | LaunchDarkly, Split.io | Managed service |
| Open Source | Unleash, Flagd | Self-hosted |
| Simple | JSON config file | For small projects |
| Rollout | Percentage based | Gradual release |
| A/B Test | Variants | Test variants |
