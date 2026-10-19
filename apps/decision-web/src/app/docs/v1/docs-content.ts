export type DocSection = { heading: string; body: string; code?: string };
export type DocPage = { slug: string; group: string; title: string; summary: string; sections: DocSection[] };

export const DOC_PAGES: DocPage[] = [
  {
    slug: "getting-started",
    group: "Quickstart",
    title: "Getting started",
    summary: "Create an account, app and first verified event.",
    sections: [
      { heading: "1. Create an account", body: "Register at decision.aurict.com. Verify your work email, then follow the backend-verified onboarding wizard." },
      { heading: "2. Create an app", body: "Choose the actual client platform. The console returns one public API key once; store it in your deployment secret manager." },
      { heading: "3. Verify", body: "Install the SDK, send onboarding_test and use Check connection. Aurict completes onboarding only after a recent event or device signal is observed." },
    ],
  },
  {
    slug: "sdk/web",
    group: "SDK",
    title: "Web SDK",
    summary: "Install @aurict/web-sdk and initialize the static client.",
    sections: [
      { heading: "Install", body: "The published package name is @aurict/web-sdk.", code: "npm install @aurict/web-sdk@1" },
      { heading: "Initialize", body: "Initialization performs a regional handshake and continues safely with local defaults when the network is unavailable.", code: "import { MicroTarget } from '@aurict/web-sdk';\n\nawait MicroTarget.initialize('mt_live_YOUR_KEY');\nMicroTarget.logEvent('page_view', { path: location.pathname });\nawait MicroTarget.flush();" },
      { heading: "Consent", body: "Do not enable optional behavioral categories before the user’s consent choice. Keep direct identifiers out of event properties." },
    ],
  },
  {
    slug: "sdk/react-native",
    group: "SDK",
    title: "React Native SDK",
    summary: "Signed requests and on-device scoring for React Native.",
    sections: [
      { heading: "Install", body: "Use the v1 React Native package and complete the native platform steps in its README.", code: "npm install @aurict/react-native-sdk@1" },
      { heading: "Initialize", body: "Use the public API key issued for the same app/environment.", code: "import { MicroTarget } from '@aurict/react-native-sdk';\n\nawait MicroTarget.initialize({ apiKey: 'mt_live_YOUR_KEY' });" },
    ],
  },
  {
    slug: "sdk/ios",
    group: "SDK",
    title: "iOS SDK",
    summary: "Swift Package Manager setup and event delivery.",
    sections: [
      { heading: "Package", body: "Add the MicroTargetSDK package to the application target. Pin an immutable release tag in production." },
      { heading: "Initialize", body: "Initialize once in AppDelegate or SceneDelegate.", code: "import MicroTargetSDK\n\nMicroTarget.initialize(apiKey: \"mt_live_YOUR_KEY\")\nMicroTarget.logEvent(name: \"onboarding_test\", properties: [:])" },
    ],
  },
  {
    slug: "sdk/android",
    group: "SDK",
    title: "Android SDK",
    summary: "Gradle module setup and first event.",
    sections: [
      { heading: "Dependency", body: "The current repository distribution is a Gradle module. Use a signed Maven artifact only after its release job publishes one." },
      { heading: "Initialize", body: "Initialize from Application before tracking.", code: "MicroTarget.init(context = applicationContext, apiKey = \"mt_live_YOUR_KEY\")\nMicroTarget.logEvent(\"onboarding_test\", mapOf(\"source\" to \"quickstart\"))" },
    ],
  },
  {
    slug: "api",
    group: "Reference",
    title: "HTTP API",
    summary: "Authentication, idempotency and machine-readable specifications.",
    sections: [
      { heading: "Specifications", body: "The authoritative decision REST contract is docs/decision-api.yaml. Event contracts are in docs/decision-events.asyncapi.yaml. Generated reference pages must use those checked-in files." },
      { heading: "Authentication", body: "Dashboard sessions use HttpOnly cookies. SDK endpoints use app-scoped keys and request signatures where required. Never expose admin or service credentials to clients." },
      { heading: "Idempotency", body: "Billing provider event IDs, usage events and purchase/order events must keep stable idempotency keys across retries." },
    ],
  },
  {
    slug: "webhooks",
    group: "Integration",
    title: "Webhooks and connectors",
    summary: "Signed delivery, retry behavior and provider handoff.",
    sections: [
      { heading: "Outbound connector signatures", body: "Aurict binds the timestamp and exact request bytes in the connector signature. Verify before parsing and reject stale timestamps." },
      { heading: "Retries", body: "Handlers must be idempotent. Return a 2xx only after durable acceptance. Repeated failures are visible in the admin control plane and can disable the connector." },
      { heading: "Billing webhook", body: "The Stripe endpoint is /api/billing/webhooks/stripe. It verifies the exact raw body, enforces a five-minute signature tolerance and records provider event IDs uniquely." },
    ],
  },
  {
    slug: "self-host/install",
    group: "Self-host",
    title: "Self-host installation",
    summary: "Prerequisites, license activation and fail-closed configuration.",
    sections: [
      { heading: "Prerequisites", body: "Use a supported Linux host with Docker Engine and Compose v2. Obtain a self-host license through the architecture review before installation." },
      { heading: "Configure", body: "Run infra/self-host/install.sh. It generates unique secrets and validates placeholders. Do not copy development secrets into production.", code: "cd infra/self-host\n./install.sh\n./scripts/health-check.sh" },
      { heading: "License", body: "Online installations use LICENSE_KEY and the Aurict control plane heartbeat. Air-gapped installations use a signed license.lic and the configured public verification key." },
    ],
  },
  {
    slug: "self-host/upgrade",
    group: "Self-host",
    title: "Self-host upgrades",
    summary: "Backup, immutable images, migrations and rollback.",
    sections: [
      { heading: "Before upgrading", body: "Read release notes, verify the supported upgrade path, take and verify a database backup, and record the currently deployed image digests." },
      { heading: "Upgrade", body: "Pull immutable version tags, run the idempotent migration job and wait for health checks before shifting traffic. Never deploy latest in regulated production." },
      { heading: "Rollback", body: "Roll application images back only when migrations are backward compatible. Otherwise restore the verified backup under the documented recovery procedure." },
    ],
  },
  {
    slug: "self-host/backup-restore",
    group: "Self-host",
    title: "Backup and restore",
    summary: "Encrypted PostgreSQL backups and recovery drills.",
    sections: [
      { heading: "Backup", body: "Use scripts/ops/backup-postgres.sh with a restricted destination and encryption at rest. Retain backup logs separately from the database host." },
      { heading: "Verify", body: "A backup is not complete until scripts/ops/verify-postgres-backup.sh succeeds and a scheduled restore drill meets the agreed RPO/RTO." },
      { heading: "Restore", body: "Stop writers, validate the exact target database, restore, run migrations, start services and verify tenant-level smoke checks." },
    ],
  },
  {
    slug: "security",
    group: "Operations",
    title: "Security baseline",
    summary: "Secrets, identity, tenant isolation and production evidence.",
    sections: [
      { heading: "Secrets", body: "Compose rejects missing core secrets. Use a production secret manager, unique values per environment and documented rotation. Never put raw license, API or connector secrets in logs." },
      { heading: "Identity", body: "Customer sessions use Secure HttpOnly cookies with refresh rotation. Admin MFA is mandatory. Enterprise SSO/SCIM remains a contract-scoped provisioning option." },
      { heading: "Model governance", body: "A checked-in artifact is not production evidence. Activate only a model with an immutable real-temporal evaluation, independent reviewer, exact hash and randomized holdout." },
    ],
  },
  {
    slug: "troubleshooting",
    group: "Operations",
    title: "Troubleshooting",
    summary: "Build, SDK connection, license and billing checks.",
    sections: [
      { heading: "SDK not verified", body: "Confirm the key belongs to the app, system time is correct, consent permits the event, the endpoint is reachable and a signal arrived within five minutes." },
      { heading: "License degraded", body: "Check license expiry, machine binding, control-plane reachability and heartbeat timestamps. Do not bypass grace/lock enforcement." },
      { heading: "Billing not active", body: "The redirect is not authoritative. Inspect the signed webhook event, subscription mapping and entitlement update in the admin commercial view." },
    ],
  },
  {
    slug: "releases",
    group: "Reference",
    title: "Release policy",
    summary: "Version compatibility and artifact provenance.",
    sections: [
      { heading: "Versioning", body: "SDKs and APIs use semantic versions. Self-host customers receive a compatibility matrix, signed checksums, SBOM and supported upgrade path per release." },
      { heading: "Channels", body: "Stable is the production default. Preview releases must not share production data or credentials and carry no production SLA." },
    ],
  },
];

export function findDoc(slug: string): DocPage | undefined {
  return DOC_PAGES.find((page) => page.slug === slug);
}
