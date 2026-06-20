---
name: web-rtc-patterns
description: "WebRTC: Peer-to-peer communication, Signaling, STUN/TURN, Media streams, Data channels, Connection handling."
triggers:
  files: ["webrtc.config.ts"]
  directories: ["webrtc/", "signaling/", "p2p/"]
  keywords: ["WebRTC", "RTCPeerConnection", "RTCSessionDescription", "ICE", "signaling", "peer"]
auto_load_when: "Building real-time peer-to-peer features like video calling, screen sharing, or data transfer"
agent: frontend-ops
tools: ["Read", "Write", "Bash"]
---

# WebRTC Patterns

**Focus:** P2P communication, media streams, signaling

## 1. Basic Connection

```
Create Peer Connection:
const pc = new RTCPeerConnection({
  iceServers: [
    { urls: 'stun:stun.l.google.com:19302' },
    { urls: 'stun:stun1.l.google.com:19302' }
  ]
})

pc.onicecandidate = (event) => {
  if (event.candidate) {
    sendToSignalingServer(event.candidate)
  }
}

pc.ontrack = (event) => {
  remoteVideo.srcObject = event.streams[0]
}

pc.onconnectionstatechange = () => {
  console.log('Connection state:', pc.connectionState)
}

Create Offer:
const offer = await pc.createOffer()
await pc.setLocalDescription(offer)
sendToSignalingServer({ type: 'offer', sdp: offer })

Handle Answer:
await pc.setRemoteDescription(new RTCSessionDescription(data.sdp))
```

---

## 2. Signaling Server

```
Simple WebSocket Signaling:
const wss = new WebSocket.Server({ port: 8080 })

const rooms = new Map()

wss.on('connection', (ws) => {
  ws.on('message', async (message) => {
    const data = JSON.parse(message)

    switch (data.type) {
      case 'join':
        joinRoom(ws, data.roomId, data.userId)
        break

      case 'offer':
        sendToRoom(data.roomId, data.targetId, { type: 'offer', sdp: data.sdp })
        break

      case 'answer':
        sendToRoom(data.roomId, data.targetId, { type: 'answer', sdp: data.sdp })
        break

      case 'ice-candidate':
        sendToRoom(data.roomId, data.targetId, { type: 'ice-candidate', candidate: data.candidate })
        break
    }
  })
})

Room Management:
function joinRoom(ws, roomId, userId) {
  if (!rooms.has(roomId)) {
    rooms.set(roomId, new Map())
  }
  rooms.get(roomId).set(userId, ws)
}
```

---

## 3. Media Streams

```
Get User Media:
const stream = await navigator.mediaDevices.getUserMedia({
  video: {
    width: { ideal: 1280 },
    height: { ideal: 720 },
    frameRate: { ideal: 30 }
  },
  audio: {
    echoCancellation: true,
    noiseSuppression: true
  }
})

localVideo.srcObject = stream
stream.getTracks().forEach(track => pc.addTrack(track, stream))

Screen Sharing:
const screenStream = await navigator.mediaDevices.getDisplayMedia({
  video: { cursor: 'always' },
  audio: false
})

const screenTrack = screenStream.getVideoTracks()[0]
const sender = pc.getSenders().find(s => s.track?.kind === 'video')
sender.replaceTrack(screenTrack)

screenTrack.onended = () => {
  sender.replaceTrack(stream.getVideoTracks()[0])
}
```

---

## 4. Data Channels

```
Create Data Channel:
const dataChannel = pc.createDataChannel('chat', {
  ordered: true  // Guarantee order
})

dataChannel.onopen = () => console.log('Data channel open')
dataChannel.onmessage = (event) => console.log('Message:', event.data)
dataChannel.onclose = () => console.log('Data channel closed')

// On remote side
pc.ondatachannel = (event) => {
  const receiveChannel = event.channel
  receiveChannel.onmessage = handleMessage
}

Send Messages:
dataChannel.send(JSON.stringify({
  type: 'chat',
  message: 'Hello!',
  timestamp: Date.now()
}))

Binary Data:
// Send blob
dataChannel.send(blob)

// Send array buffer
dataChannel.send(arrayBuffer)
```

---

## 5. STUN/TURN Servers

```
ICE Servers Configuration:
const iceServers = [
  // STUN servers (free, for discovery)
  { urls: 'stun:stun.l.google.com:19302' },
  { urls: 'stun:stun1.l.google.com:19302' },
  { urls: 'stun:stun2.l.google.com:19302' },

  // TURN servers (relay, for connectivity behind NAT)
  {
    urls: 'turn:your-turn-server.com:3478',
    username: 'user',
    credential: 'password'
  }
]

RTCPeerConnection({ iceServers })

TURN Server (coturn config):
# /etc/coturn/turnserver.conf
listening-port=3478
external-ip=YOUR_PUBLIC_IP
user=username:password
realm=your-domain.com
```

---

## 6. Connection States

```
Connection State Machine:
new → connecting → connected → disconnected → failed → closed

Handle State Changes:
pc.onconnectionstatechange = () => {
  switch (pc.connectionState) {
    case 'new':
      console.log('Connection created')
      break
    case 'connecting':
      console.log('Establishing connection...')
      break
    case 'connected':
      console.log('Connected!')
      break
    case 'disconnected':
      console.log('Connection lost, attempting reconnect...')
      attemptReconnect()
      break
    case 'failed':
      console.log('Connection failed')
      break
    case 'closed':
      console.log('Connection closed')
      break
  }
}

Reconnection Logic:
async function attemptReconnect() {
  pc.close()
  pc = new RTCPeerConnection({ iceServers })
  // Recreate offer and send to peer
}
```

---

## Key Patterns

1. **Signaling first** — Establish WebSocket before RTC
2. **STUN for discovery** — Use free STUN servers
3. **TURN for reliability** — Add TURN for NAT traversal
4. **Track ICE candidates** — Send all candidates to peer
5. **Handle disconnect** — Plan for reconnection
6. **Data channels for chat** — Use for text, not signaling

---

## Anti-Patterns

```
❌ No signaling server
✅ Need WebSocket for offer/answer exchange

❌ Only STUN in production
✅ Add TURN for reliable connections

❌ Not handling connection state
✅ Monitor and handle failures

❌ No fallback for failed calls
✅ Have PSTN or chat fallback

❌ Not cleaning up streams/tracks
✅ Call stream.getTracks().stop() on leave

❌ No ICE candidate timeout
✅ Set reasonable timeouts
```

---

## Quick Reference

| Feature | API | Note |
|---|---|---|
| Create connection | new RTCPeerConnection() | Main API |
| Add track | addTrack(track, stream) | Send media |
| On remote track | pc.ontrack | Receive media |
| Data channel | createDataChannel() | P2P data |
| ICE servers | iceServers config | STUN/TURN |
| Signaling | WebSocket | Offer/answer exchange |
