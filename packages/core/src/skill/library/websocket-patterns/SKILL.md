---
name: websocket-patterns
description: "WebSockets: Connection management, reconnection, rooms, and real-time communication." 
triggers:
  keywords: ["WebSocket", "ws", "socket", "connection", "reconnect", "heartbeat", "room", "namespace"]
auto_load_when: "Implementing WebSocket communication"
agent: infra-specialist
tools: ["Read", "Write", "Bash"]
---

# WebSocket Patterns

**Focus:** Real-time bidirectional communication

---

## 1. Connection Lifecycle

```
Connection states:

├── Connecting
│   └── Handshake in progress
│   └── After: HTTP upgrade request
│   └── Timeout: 10-30 seconds
│
├── Connected
│   └── Full-duplex channel open
│   └── Keep-alive: ping/pong every 30s
│   └── Bi-directional messaging
│
├── Closing
│   └── Graceful shutdown initiated
│   └── Code 1000 (normal) or error codes
│   └── Clean-up: release resources
│
└── Disconnected
    └── Connection lost
    └── Trigger reconnection
```

---

## 2. Reconnection Strategy

```
When reconnect:

├── Immediate retry
    └── First attempt after disconnect
    └── 0-1 second delay
│
├── Exponential backoff
    └── Delay: 1s, 2s, 4s, 8s, 30s (max)
    └── Jitter: random +/- 1 second
    └── Reset on successful connection
│
├── Max retries
    └── After 5-10 failures, stop
    └── Notify user: "connection lost"
    └── Offer manual reconnect button
│
└── Always include
    └── Random jitter (prevent thundering herd)
    └── Backoff on server errors
    └── Immediate retry on network change
```

---

## 3. Rooms and Channels

```
When to use rooms:

├── User-specific
│   └── Private messages
│   └── Per-user notification stream
│   └── Join room: user:{userId}
│
├── Group-based
│   └── Team chat, group conversations
│   └── Join room: team:{teamId}
│   └── Broadcast to group
│
├── Broadcast
│   └── All connected clients
│   └── Announcements, system updates
│   └── No room needed, send to all
│
└── Topic-based (pub/sub)
    └── Multiple interests per user
    └── Subscribe: notifications, updates, alerts
    └── Pattern: MQTT-style routing
```

---

## 4. Message Patterns

```
Message types:

├── Client → Server
│   ├── ACTION: user performed action
│   ├── SUBSCRIBE: join room/channel
│   ├── UNSUBSCRIBE: leave room/channel
│   └── PING: keep-alive (optional)
│
└── Server → Client
    ├── EVENT: real-time update
    ├── BROADCAST: room-wide message
    ├── ACK: confirm message received
    └── PONG: keep-alive response
```

```
Protocol design:
├── Include message type/enum
├── Include payload (JSON)
├── Include timestamp (server-side)
├── Include correlation ID (request/response)
└── Include message ID (for ACKs)
```

---

## 5. Scaling Considerations

```
Single server (start here):
├── In-memory connection storage
├── Works for < 10k concurrent connections
└── Simple, no external dependencies

Redis pub/sub (horizontal scaling):
├── Store connections in Redis
├── Route messages through Redis
├── Can scale to millions
├── Add: Redis adapter for Socket.io
└── Trade-off: latency increase

WebSocket gateway (production):
├── Dedicated WS servers
├── Route via load balancer
├── Sticky sessions required
└── Shared state via Redis
```

---

## Key Patterns

1. **Heartbeat** — Detect dead connections early
2. **Auto-reconnect** — Seamless recovery
3. **Graceful degradation** — Fallback to polling if needed
4. **Message queue** — Buffer during disconnect
5. **Rate limiting** — Prevent flooding

---

## Anti-Patterns

```
❌ No reconnection logic — broken connection = dead client
✅ Exponential backoff reconnect with jitter

❌ Sending full state on every update
✅ Send diffs/patches; client reconciles

❌ No authentication on WebSocket upgrade
✅ Validate JWT/cookie on HTTP upgrade handshake

❌ Unlimited connections per user
✅ Enforce max connections per user; close old on new connect

❌ Ignoring WebSocket close codes
✅ Handle 1000 (normal), 1001 (going away), 4xxx (app errors)
```

---

## Quick Reference

| Scenario | Solution | Note |
|---|---|---|
| Reconnect | Exponential backoff | 1s, 2s, 4s, 8s... max 60s |
| Auth | Token in query or upgrade header | Not in URL for prod |
| Rooms | Map<roomId, Set<socket>> | Server-side routing |
| Broadcast | Iterate room sockets | Or Redis Pub/Sub for multi-node |
| Heartbeat | ping/pong interval | 30s; close if no pong |
| Compression | permessage-deflate | Header negotiation |
