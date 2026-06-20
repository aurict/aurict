---
name: file-handling
description: "File handling: Upload strategy, storage patterns, CDN integration, processing." 
triggers:
  extensions: [".ts"]
  keywords: ["fs", "file", "upload", "stream", "multer", "S3", "storage", "download", "blob"]
auto_load_when: "Implementing file upload/download or storage"
agent: architect
tools: ["Read", "Write", "Bash"]
---

# File Handling Patterns

**Focus:** Upload, storage, CDN, processing

---

## 1. When to Use What Storage

```
When to use local storage:

├── Development only
├── Single server, no scaling
└── Small files, low traffic

When to use object storage:

├── Production (S3, GCS, Blob)
├── Any production workload
├── Built-in redundancy, CDN integration
└── Scale infinitely
```

```
Storage selection:

├── S3/GCS/Blob → Most cases, production
├── Local → Dev only, never prod
├── Database (BLOB) → Small files, rare access
└── CDN origin → Large media, high traffic
```

---

## 2. Upload Strategy

```
Upload approaches:

├── Direct upload (client → storage)
    && Best for large files
    && Server doesn't bottleneck
    && Presigned URLs
│
├── Proxy upload (client → server → storage)
    && Validate before storage
    && Transform/process
    && Easier to control
│
└── Form upload
    && Simple
    || File goes through server
    || Not for large files
```

```
When to use each:

├── Large files → Direct (presigned URL)
├── Small files, validation needed → Proxy
├── Very simple → Form upload
└── Mobile → Direct (bandwidth)
```

---

## 3. Processing Patterns

```
When to process files:

├── Immediate (synchronous)
    && Small files
    && Fast processing
    && User waits for result
│
├── Background (asynchronous)
    && Large files
    && Slow processing
    && User notified when done
│
└── On-demand (lazy)
    && Process when accessed
    && Save storage
    && First access slower
```

```
Processing location:

├── Before storage → Virus scan, validate
├── At access → Resize images, generate thumbnails
└── Background → Transcode video, OCR
```

---

## 4. CDN Strategy

```
When to use CDN:

├── Static assets (images, videos, documents)
├── Global users
└── High traffic, reduce origin load

When NOT to use CDN:

├── Dynamic content
├── Real-time data
└── Very low traffic
```

```
CDN patterns:

├── Cache everything public
├── Invalidate on updates
├── Signed URLs for private
└── Regional edges for global
```

---

## 5. File Validation

```
What to validate:

├── Type
    && Check MIME type, not extension
    && Use magic numbers
│
├── Size
    && Max file size limit
    && Min size (prevent empty)
│
├── Content
    && Virus/malware scan
    && Image validity
    || Document structure
│
└── Name
    && Sanitize characters
    && Limit length
    || Avoid path traversal
```

---

## 6. Cleanup Strategy

```
When to clean up:

├── Failed uploads → Immediate
├── Expired documents → Scheduled
├── Old versions → Policy-based
└── User deletion → Immediate
```

```
Cleanup methods:

├── Immediate: on failed upload
├── Scheduled: nightly/weekend job
├── Policy: TTL-based cleanup
└── Manual: user-triggered delete
```

---

## Key Patterns

1. **Presigned URLs** — Direct upload to cloud
2. **Background processing** — Don't block user
3. **CDN for static** — Not for dynamic
4. **Validate before storage** — Save resources
5. **Cleanup strategy** — Don't let files accumulate

---

## Anti-Patterns

```
❌ Reading entire large file into memory (fs.readFileSync)
✅ Stream large files: createReadStream + pipe

❌ User-controlled file paths without sanitization (path traversal)
✅ path.basename() + restrict to allowed directory

❌ Storing uploaded files on server disk (ephemeral in serverless)
✅ Stream directly to S3 / object storage

❌ No file type validation (accept any extension)
✅ Check magic bytes (file-type library), not just extension

❌ Synchronous file operations in hot paths
✅ Always async: fs.promises / streams in API handlers
```

---

## Quick Reference

| Scenario | API | Note |
|---|---|---|
| Read small file | fs.promises.readFile | Await |
| Read large file | fs.createReadStream | Streaming |
| Write atomically | write to tmp then rename | Prevents corruption |
| Upload to S3 | @aws-sdk/lib-storage | Multipart auto |
| Temp file | tmp / os.tmpdir | Clean up on close |
| Watch file | fs.watch / chokidar | chokidar more reliable |
