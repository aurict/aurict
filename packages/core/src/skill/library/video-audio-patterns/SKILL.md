---
name: video-audio-patterns
description: "Media handling, streaming protocols, transcoding, formats, and WebRTC patterns for web applications." 
triggers:
  keywords: ["video", "audio", "media", "WebRTC", "HLS", "DASH", "streaming", "transcoding", "MediaRecorder"]
auto_load_when: "Implementing video or audio features"
agent: frontend-ops
tools: ["Read", "Write", "Bash"]
---

# Video & Audio Patterns

## 1. Streaming Protocol Selection

```
Which protocol to use?
├── Progressive Download (MP4/HLS)
│   └── Good for: VOD, short clips, simple setup
│   └── Bad for: Live, low latency needs
│
├── HLS (HTTP Live Streaming)
│   └── Good for: Adaptive bitrate, VOD, live
│   └── Bad for: <3s latency required
│
├── DASH (Dynamic Adaptive Streaming)
│   └── Good for: Multi-codec support, complex DRMs
│   └── Bad for: Simpler HLS suffices
│
└── WebRTC
    └── Good for: <500ms latency, real-time互动
    └── Bad for: Simple VOD, CDN caching needed
```

## 2. Format Selection

```
Video codecs:
├── H.264: Max compatibility, larger files
├── H.265/HEVC: Better compression, licensing
├── VP8/VP9: royalty-free, varying browser support
└── AV1: Best compression, limited support

Audio codecs:
├── AAC: Good compatibility, reasonable quality
├── Opus: Best quality/size, wide support
└── MP3: Legacy support only

Container formats:
├── MP4: Web + mobile, H.264/AAC
├── WebM: VP8/VP9 + Vorbis/Opus
└── MKV: Archive quality, not web-native
```

## 3. When to Transcode

```
Transcode when:
├── Input format not supported by target browsers
├── File size too large for bandwidth
├── Need different resolution/quality tiers
├── DRM conversion required
└── Codec not hardware-accelerated

Don't transcode when:
├── Original already optimized
├── Just-in-time transcoding adds latency
├── Storage costs outweigh streaming benefits
└── One format covers 95%+ of users
```

## 4. WebRTC Decision Tree

```
Need WebRTC when:
├── Real-time video/audio (calls, streams)
├── Sub-500ms latency required
├── Peer-to-peer communication needed
├── Low bandwidth adaptation critical
└── Server costs must stay low

Use media servers (SFU/MCU) when:
├── Many-to-many participants (>4)
├── Recording/archive required
├── Complex routing needed
└── Cross-region scaling
```

## 5. Player Architecture

```
Player choice:
├── Native <video>: Simple, no features, good perf
├── Video.js: Features, plugins, HLS/DASH
├── Plyr: Lightweight, accessible, good UX
├── Shaka Player: DASH, offline, complex
└── Bitmovin/mux: Enterprise, analytics
```

## 6. Accessibility Patterns

```
Video accessibility:
├── Captions: WebVTT for web, sidecar or embedded
├── Audio descriptions: Separate track
├── Sign language: Separate video track
└── Keyboard controls: Always enabled

Audio accessibility:
├── Transcripts: Full text alternative
├── Visual indicators: Visual cues for audio events
└── Volume control: Per-track if mixed
```

## 7. Storage & CDN Strategy

```
Where to store:
├── Origin: Master files, archives
├── CDN: Transcoded versions, closest edge
└── Object storage: S3/GCS for scalability

CDN considerations:
├── Signed URLs for private content
├── Token authentication for live
└── Geo-blocking when needed
```

## Key Patterns

1. **Adaptive bitrate** - Always use for variable bandwidth
2. **Progressive enhancement** - Fallback for unsupported codecs
3. **Lazy loading** - Only load player when needed
4. **Preload hints** - Use preload="metadata" for quick start
5. **Error boundaries** - Graceful degradation on failure

---

## Anti-Patterns

```
❌ Autoplay video with sound by default
✅ Autoplay muted only; require user gesture for audio

❌ No preload strategy — loading everything upfront
✅ preload="metadata" for above-fold, preload="none" for offscreen

❌ Single video format (only .mp4)
✅ Serve WebM + MP4 with <source> fallbacks

❌ Blocking main thread with video decode work
✅ Use dedicated codec, offload to GPU

❌ No poster image — blank area before playback
✅ Always set poster attribute for perceived performance
```

---

## Quick Reference

| Scenario | Attribute / API | Note |
|---|---|---|
| Background video | autoplay muted loop | No sound |
| Lazy load video | IntersectionObserver + src swap | Save bandwidth |
| Custom controls | HTMLMediaElement API | play(), pause(), currentTime |
| Adaptive bitrate | HLS.js / dash.js | For long videos |
| Captions | <track kind="captions"> | Accessibility requirement |
| Format priority | WebM → MP4 → fallback | Bandwidth savings |
