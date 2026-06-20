---
name: email-patterns
description: "Email: Transactional email, templates, delivery patterns, feedback loops." 
triggers:
  keywords: ["email", "SMTP", "SendGrid", "nodemailer", "transactional", "Resend", "template", "newsletter"]
auto_load_when: "Building email sending functionality"
agent: architect
tools: ["Read", "Write", "Bash"]
---

# Email Patterns

**Focus:** Delivery, templates, reliability

---

## 1. When to Use Email

```
When email is appropriate:

├── Transactional
    && Order confirmation
    && Password reset
    && Account notifications
│
├── Notifications
    && Alerts and monitoring
    && Scheduled reports
    && Activity digests
│
└── Marketing (with consent)
    └── Welcome series
    └── Product updates
    └── Opt-in required
```

```
When NOT to use email:

├── Real-time communication
    && Chat is better
    && Users expect instant
│
├── User-to-user messaging
    └── In-app messaging
    || Don't use email for this
│
└── Sensitive alerts
    && Security: in-app + push preferred
    && Don't rely on email alone
```

---

## 2. Email Service Selection

```
When to use what:

├── SendGrid/Mailgun/SES
    && Transactional email
    && Good deliverability
    && API-based
│
├── Postmark
    && Transactional focus
    && High deliverability
    && Good for startups
│
├── Mailchimp/Sendinblue
    && Marketing emphasis
    && Templates, campaigns
    && Less for transactional
│
└── Self-hosted (rarely)
    && Complete control
    && High cost, complexity
    && Only when needed
```

---

## 3. Template Strategy

```
When to use templates:

├── Template engine (SendGrid, Handlebars)
    && Dynamic content needed
    && Multiple email types
    && Non-technical can edit
│
├── Static HTML
    && Simple emails
    && No personalization
    || Lower flexibility
│
└── Code-generated
    && Complex logic
    && Full control
    && Harder to maintain
```

```
Template best practices:

├── Plain text version always
├── Responsive design (mobile)
├── Fallback fonts
├── Clear unsubscribe (required by law)
└── Physical address (required by law)
```

---

## 4. Delivery Reliability

```
How to ensure delivery:

├── Verification
    && SPF, DKIM, DMARC set up
    && Domain verified
    && Test with mail-tester.com
│
├── Error handling
    && Catch bounces
    && Suppress invalid emails
    && Track delivery status
│
├── Rate limiting
    && Respect provider limits
    && Batch sends
    && Exponential backoff on failure
│
└── Monitoring
    && Track open/click rates
    && Bounce rates
    && Deliverability issues
```

---

## 5. Feedback Loop

```
What to track:

├── Delivery metrics
    && Sent, delivered, bounced
    && By email type
│
├── Engagement
    && Open rate (with pixel tracking)
    && Click rate
    && Unsubscribe rate
│
├── Complaints
    && Spam reports
    && If high: review list quality
│
└── Time-based
    && Best send times
    && By user segment
```

```
When to act:

├── High bounce > 5%
    && Clean list
    || Verify addresses before send
│
├── Low engagement < 10% open
    && Review subject lines
    || Segment users differently
│
├── High complaints
    || Immediate list review
    || Consent verification
└── High unsubscribes
    || Too frequent?
    || Content not relevant?
```

---

## Key Patterns

1. **Transactional vs marketing** — Separate services, different rules
2. **Verify everything** — SPF/DKIM/DMARC
3. **Handle bounces** — Suppress invalid, track errors
4. **Monitor engagement** — Act on data
5. **Plain text fallback** — Always have

---

## Anti-Patterns

```
❌ Sending email synchronously inside HTTP request handler
✅ Queue email; deliver async via background worker

❌ Plain-text email only (no HTML template)
✅ Multipart emails: text/plain fallback + text/html styled

❌ Sending bulk email through SMTP directly
✅ Use transactional ESP (Resend, SendGrid, Postmark) for deliverability

❌ No unsubscribe link in marketing emails
✅ CAN-SPAM / GDPR: unsubscribe + physical address required

❌ Not testing email rendering across clients
✅ Litmus / Email on Acid preview before sending
```

---

## Quick Reference

| Service | Use case | SDK |
|---|---|---|
| Resend | Transactional | resend npm |
| SendGrid | Transactional + marketing | @sendgrid/mail |
| Postmark | High deliverability | postmark |
| Mailchimp | Marketing / newsletters | API v3 |
| React Email | Template authoring | react-email |

| Header | Purpose | Required? |
|---|---|---|
| List-Unsubscribe | One-click unsubscribe | Marketing: Yes |
| DKIM | Email authentication | Always |
| SPF | Sender policy | Always |
| DMARC | Alignment policy | Recommended |
