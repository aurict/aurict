---
name: incident-response
description: "Incident Response: On-call, Incident management, Post-mortem, Runbooks, Escalation, War room protocols."
triggers:
  directories: ["runbooks/", "incidents/"]
  keywords: ["incident", "on-call", "runbook", "postmortem", "war room", "escalation", "outage"]
auto_load_when: "Handling production incidents or setting up on-call processes"
agent: devops-engineer
tools: ["Read", "Write", "Bash"]
---

# Incident Response Patterns

**Focus:** On-call management, incident lifecycle, post-mortems, runbooks

## 1. Incident Classification

```
Severity Levels:
├── SEV1 (Critical): Full service outage, data loss, security breach
│   ├── Impact: All users affected
│   ├── Response: Immediate, all hands
│   └── Target: Restore within 1 hour
│
├── SEV2 (High): Major feature unavailable, significant degradation
│   ├── Impact: Large subset of users
│   ├── Response: Urgent, team lead + on-call
│   └── Target: Restore within 4 hours
│
├── SEV3 (Medium): Feature partially working, minor impact
│   ├── Impact: Small subset of users
│   ├── Response: During business hours
│   └── Target: Restore within 24 hours
│
└── SEV4 (Low): Minor issues, cosmetic, documentation
    ├── Impact: Individual users
    ├── Response: Next business day
    └── Target: Next release

Incident Types:
├── Outage: Service completely unavailable
├── Degradation: Service working but slow/unreliable
├── Data: Data loss, corruption, privacy breach
├── Security: Unauthorized access, vulnerability
└── Partial: Specific feature/region affected
```

---

## 2. On-Call Operations

```
On-Call Responsibilities:
├── Respond to alerts within SLA (usually 15 min for SEV1)
├── Acknowledge alerts to stop escalation
├── Diagnose the issue using runbooks
├── Escalate if needed
├── Communicate status to stakeholders
├── Document actions taken
└── Hand off to next shift

On-Call Best Practices:
├── Only page for actionable alerts
├── Provide runbooks for every alert
├── Use escalation policies
├── Have fallback for when you can't respond
└── Take notes during incident

Escalation Policy:
Level 1 (On-call Engineer):
├── Response time: 15 min
├── Can handle: Minor incidents, questions
└── Escalate to: Team lead

Level 2 (Team Lead):
├── Response time: 30 min
├── Can handle: Major incidents, resource coordination
└── Escalate to: Engineering Manager

Level 3 (Engineering Manager):
├── Response time: 1 hour
├── Can handle: SEV1, cross-team coordination
└── Escalate to: VP Engineering

Level 4 (VP/CTO):
├── Response time: Immediate
├── Can handle: Business-critical, PR/commms
└── External: PR team, legal
```

---

## 3. Incident Workflow

```
Detection & Triage:
1. Alert triggers
2. On-call receives page
3. Acknowledge (stops escalation)
4. Initial assessment:
   - What's broken?
   - Who is affected?
   - Severity level?
5. Create incident ticket

Communication:
├── Status page update: "We are investigating"
├── Slack/Teams channel: #incident-123
├── Stakeholder notification:
│   ├── SEV1: All stakeholders immediately
│   ├── SEV2: Team + manager
│   └── SEV3: Team only
└── Handoff notes if shifting to someone else

War Room:
├── Dedicated Zoom/Teams link
├── Incident commander: coords response
├── Scribe: documents timeline
├── Roles: ops, comms, lead
└── Update every 15-30 min

Resolution:
1. Identify root cause
2. Implement fix (or rollback)
3. Verify recovery
4. Close incident
5. Update stakeholders
```

---

## 4. Runbooks

```
Runbook Structure:
# Runbook: High Error Rate on Payment Service

## Symptoms
- Alert: error_rate > 5% for payment-service
- Increased failed transactions

## Impact
- Users cannot complete purchases
- Revenue impact

## Diagnosis Steps
1. Check payment-service logs for errors
2. Verify database connection
3. Check payment provider status
4. Review recent deployments

## Resolution Steps
1. If database issue:
   - Check connection pool
   - Restart service if needed
   
2. If payment provider down:
   - Check status.page
   - Switch to backup provider if available

## Rollback
- Revert recent deployment: `kubectl rollout undo deployment/payment`

## References
- Dashboard: grafana.app/payment-service
- On-call: 555-0123

Runbook Checklist:
├── Clear trigger conditions
├── Step-by-step diagnosis
├── Step-by-step fix
├── Rollback procedure
├── Links to dashboards/logs
├── Contact info
└── Tested and working
```

---

## 5. Post-Mortem

```
Post-Mortem Template:
# Incident Post-Mortem: Payment Service Outage

## Summary
Payment service was down for 45 minutes, preventing 12,000 transactions.

## Timeline (UTC)
- 14:00 - Deployment v2.3.0 starts
- 14:05 - Alert: Error rate 10%
- 14:10 - On-call acknowledges, starts investigation
- 14:15 - Found regression in payment library
- 14:25 - Rollback initiated
- 14:40 - Service fully recovered
- 14:45 - Incident closed

## Root Cause
v2.3.0 included a breaking change in the payment SDK that was not caught in staging due to incomplete test coverage.

## Impact
- 12,000 failed transactions
- ~$50,000 lost revenue
- Customer support spike

## What Went Well
- Alert triggered quickly
- Rollback worked smoothly
- Team coordinated well

## What Went Wrong
- Missing integration test for payment flow
- Staging environment doesn't use real payment provider
- No canary deployment

## Action Items
- [ ] Add payment integration test to CI (Owner: John, Due: 2024-02-15)
- [ ] Set up staging environment with payment sandbox (Owner: Jane, Due: 2024-02-20)
- [ ] Implement canary deployment for payment service (Owner: Team, Due: 2024-03-01)
- [ ] Review all similar deployments for gaps (Owner: Tech Lead, Due: 2024-02-10)

## Lessons Learned
- Integration tests are critical
- Staging should mirror production
- Canary deployments prevent full-rollout issues
```

---

## 6. Communication Templates

```
Status Page Update:
**Investigating**: We are currently investigating reports of payment failures.
- Impact: Some users may experience failed transactions
- Next update: 15 minutes
- Contact: @oncall-engineer

**Identified**: We've identified the issue and are working on a fix.
- Root cause: Database connection pool exhaustion
- ETA: 30 minutes
- Next update: 15 minutes

**Monitoring**: Fix deployed, monitoring for recovery.
- Service recovering
- Next update: 10 minutes

**Resolved**: Service has been restored.
- Full recovery at 14:40 UTC
- Post-mortem will be published within 5 business days

Internal Update (Slack):
@here Payment Service Incident #2024-001
- Status: Investigating
- Severity: SEV1
- Impact: Payment failures for ~20% of users
- Current action: Rolling back v2.3.0 deployment
- ETA: 30 minutes
- War room: zoom.us/j/123456789

Stakeholder Email:
Subject: [URGENT] Payment Service Incident - Impact to Transactions

We are currently experiencing a payment service outage affecting approximately 20% of transactions. Our engineering team has identified the issue and is actively working on a fix.

Impact: Users may see failed payments
Severity: SEV1
ETA: 30 minutes
Updates: status.example.com
Contact: incident-commander@company.com
```

---

## 7. Post-Incident Review

```
Blameless Culture:
├── Focus on systems and processes, not people
├── Everyone involved is trying to do their best
├── Ask "what" and "how", not "who"
├── Use "contributing factors", not "mistakes"
└── Leadership must model this

Improvement Actions:
├── Concrete: Specific, not vague
├── Assigned: Who owns it
├── Dated: When it's due
├── Verified: How we confirm it worked
└── Prioritized: What matters most

Prevention Strategies:
├── Better alerting: Catch earlier next time
├── Better runbooks: Faster diagnosis
├── Better testing: Catch regressions
├── Better deployment: Canary, rollback
├── Better architecture: Reduce blast radius
└── Better documentation: Share learnings

Metrics to Track:
├── Time to detect (TTD)
├── Time to respond (TTR)
├── Time to resolve (TTRe)
├── Number of incidents per service
├── False positive alert rate
└── Alert response time compliance
```

---

## Key Patterns

1. **Clear severity levels** — Everyone knows what to prioritize
2. **Escalation policy** — Know when to get more help
3. **Runbooks for every alert** — No guessing in crisis
4. **Blame-free post-mortems** — Learn from failures
5. **Concrete action items** — Track and verify improvements
6. **Status communication** — Keep stakeholders informed

---

## Anti-Patterns

```
❌ Blaming individuals in post-mortem
✅ Focus on system failures

❌ No runbooks for alerts
✅ Every alert should have a runbook

❌ Not updating stakeholders
✅ Regular updates, even if "no change"

❌ Post-mortem just for show
✅ Actually implement action items

❌ No follow-up on action items
✅ Track to completion

❌ Setting alerts too sensitive
✅ Alert only on actionable issues

❌ Not testing runbooks
✅ Practice during game days

❌ No on-call rotation backup
✅ Always have secondary on-call
```

---

## Quick Reference

| Phase | Action | Who |
|---|---|---|
| Detect | Alert triggers | Automated |
| Acknowledge | Stop escalation | On-call |
| Assess | Determine severity | On-call |
| Communicate | Status update | Incident lead |
| Fix | Resolution | Engineer(s) |
| Verify | Confirm recovery | On-call |
| Document | Post-mortem | Team |
| Improve | Action items | Owner |
| Close | Stakeholder email | Lead |
