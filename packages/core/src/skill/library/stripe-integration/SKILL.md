---
name: stripe-integration
description: "Stripe: Payment Intents, Subscriptions, Webhooks, Customer Portal, Stripe Elements, idempotency patterns."
triggers:
  extensions: [".ts", ".tsx"]
  directories: ["payments/", "billing/", "stripe/"]
  filenames: ["stripe.ts", "stripe.config.ts"]
  keywords: ["stripe", "PaymentIntent", "Subscription", "webhook", "stripe-js", "loadStripe", "useStripe", "useElements"]
auto_load_when: "Implementing payment flows or subscription billing"
agent: architect
tools: ["Read", "Write", "Bash"]
---

# Stripe Integration Patterns

**Version:** Stripe Node.js v17+ | **Focus:** Payments, subscriptions, webhooks, security

---

## 1. Client Setup

```ts
// lib/stripe.ts — Server-side singleton
import Stripe from 'stripe';
export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2024-06-20',
  typescript: true,
});

// lib/stripe-client.ts — Client-side
import { loadStripe } from '@stripe/stripe-js';
export const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!);
```

---

## 2. Payment Intent (One-time Payment)

```ts
// app/api/checkout/route.ts
export async function POST(req: Request) {
  const { amount, currency = 'usd' } = await req.json();
  const paymentIntent = await stripe.paymentIntents.create({
    amount: Math.round(amount * 100), // always in cents
    currency,
    automatic_payment_methods: { enabled: true },
    metadata: { userId: session.user.id },
    idempotency_key: `pi_${userId}_${Date.now()}`, // prevent duplicates
  });
  return Response.json({ clientSecret: paymentIntent.client_secret });
}

// Client: Stripe Elements
'use client';
import { Elements, PaymentElement, useStripe, useElements } from '@stripe/react-stripe-js';

export function CheckoutForm({ clientSecret }: { clientSecret: string }) {
  const stripe = useStripe();
  const elements = useElements();

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    const { error } = await stripe!.confirmPayment({
      elements: elements!,
      confirmParams: { return_url: `${window.location.origin}/payment/success` },
    });
    if (error) setError(error.message);
  }

  return <form onSubmit={handleSubmit}><PaymentElement /><button>Pay</button></form>;
}
```

---

## 3. Subscriptions

```ts
// Create customer + subscription
const customer = await stripe.customers.create({
  email: user.email,
  metadata: { userId: user.id },
});

const subscription = await stripe.subscriptions.create({
  customer: customer.id,
  items: [{ price: process.env.STRIPE_PRICE_ID }],
  payment_behavior: 'default_incomplete',
  expand: ['latest_invoice.payment_intent'],
});

// Customer Portal (self-service billing management)
const portalSession = await stripe.billingPortal.sessions.create({
  customer: customerId,
  return_url: `${process.env.NEXT_PUBLIC_URL}/settings/billing`,
});
redirect(portalSession.url);
```

---

## 4. Webhooks (Critical — Must Be Correct)

```ts
// app/api/webhooks/stripe/route.ts
export async function POST(req: Request) {
  const body = await req.text(); // raw body — do NOT parse JSON first
  const sig = req.headers.get('stripe-signature')!;

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(body, sig, process.env.STRIPE_WEBHOOK_SECRET!);
  } catch (err) {
    return new Response(`Webhook Error: ${err.message}`, { status: 400 });
  }

  // Idempotent handler — Stripe may retry
  switch (event.type) {
    case 'payment_intent.succeeded': {
      const pi = event.data.object as Stripe.PaymentIntent;
      await db.order.update({ where: { stripeId: pi.id }, data: { status: 'paid' } });
      break;
    }
    case 'customer.subscription.deleted': {
      const sub = event.data.object as Stripe.Subscription;
      await db.user.update({ where: { stripeCustomerId: sub.customer as string }, data: { plan: 'free' } });
      break;
    }
  }

  return new Response('ok', { status: 200 });
}

// Disable body parser for webhook route
export const config = { api: { bodyParser: false } };
```

---

## 5. Checkout Session (Hosted Page)

```ts
const session = await stripe.checkout.sessions.create({
  mode: 'payment', // 'subscription' for recurring
  payment_method_types: ['card'],
  line_items: [{ price: priceId, quantity: 1 }],
  success_url: `${origin}/checkout/success?session_id={CHECKOUT_SESSION_ID}`,
  cancel_url: `${origin}/checkout/cancel`,
  customer_email: user.email,
  metadata: { userId: user.id },
});
redirect(session.url!);
```

---

## Quick Reference

| Need | Approach |
|------|----------|
| One-time payment | PaymentIntent + Stripe Elements |
| Subscriptions | Stripe Checkout or Billing Portal |
| Self-service billing | Customer Portal |
| Verify payment events | Webhook signature verification |
| Prevent duplicate charges | Idempotency keys |
| Test cards | `4242 4242 4242 4242` (success), `4000 0000 0000 9995` (decline) |

## Anti-Patterns

```
❌ Trusting client-side success redirect as payment confirmation
✅ Always confirm payment via webhook event, not redirect

❌ Parsing raw body before webhook signature verification
✅ stripe.webhooks.constructEvent() needs the raw string body

❌ Hardcoding price IDs in frontend code
✅ Price IDs in env vars; never expose secret key to client

❌ Not handling webhook retries idempotently
✅ Check if order already processed before updating DB
```
