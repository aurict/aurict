import { describe, expect, it, beforeAll, afterAll } from 'bun:test'
import { callAurictApi, describeAurictApiFailure } from '../src/tool/built-in/_shared/aurict-api.js'
import type { ToolContext } from '../src/tool/types.js'

function fakeCtx(overrides: Partial<ToolContext> = {}): ToolContext {
  return {
    sessionId: 'test-session',
    workdir: '/tmp',
    signal: new AbortController().signal,
    backendAccessToken: 'test-token',
    ...overrides,
  }
}

let server: ReturnType<typeof Bun.serve>

beforeAll(() => {
  server = Bun.serve({
    port: 0,
    fetch(req) {
      const url = new URL(req.url)
      const auth = req.headers.get('authorization')
      if (url.pathname === '/unauthorized') return new Response(null, { status: 401 })
      if (url.pathname === '/unavailable') return new Response(null, { status: 502 })
      if (url.pathname === '/broken-json') return new Response('not json', { status: 200 })
      if (url.pathname === '/error-with-body') {
        return Response.json({ error: 'boom' }, { status: 400 })
      }
      if (url.pathname === '/fastapi-error') {
        return Response.json({ detail: 'Bond not found' }, { status: 404 })
      }
      if (url.pathname === '/hono-error') {
        return Response.json({ error: { code: 'not_found', message: 'Legal unit not found.' } }, { status: 404 })
      }
      if (url.pathname === '/success') {
        return Response.json({ auth, items: [1, 2, 3] })
      }
      return new Response(null, { status: 404 })
    },
  })
  process.env['AURICT_BACKEND_URL'] = `http://127.0.0.1:${server.port}`
})

afterAll(() => {
  server.stop(true)
  delete process.env['AURICT_BACKEND_URL']
})

describe('callAurictApi', () => {
  it('returns not_authenticated without making a request when token is missing', async () => {
    const result = await callAurictApi(fakeCtx({ backendAccessToken: undefined }), '/success')
    expect(result.kind).toBe('not_authenticated')
  })

  it('resolves a backend token only when an Aurict API tool actually runs', async () => {
    let calls = 0
    const result = await callAurictApi(fakeCtx({
      backendAccessToken: undefined,
      backendAccessTokenResolver: async () => {
        calls++
        return 'resolved-token'
      },
    }), '/success')
    expect(calls).toBe(1)
    expect(result.kind).toBe('success')
    if (result.kind === 'success') expect((result.data as { auth: string }).auth).toBe('Bearer resolved-token')
  })

  it('surfaces token refresh failures as unavailable instead of hanging the tool', async () => {
    const result = await callAurictApi(fakeCtx({
      backendAccessToken: undefined,
      backendAccessTokenResolver: async () => { throw new Error('request_timeout') },
    }), '/success')
    expect(result).toEqual({ kind: 'unavailable', detail: 'request_timeout' })
  })

  it('distinguishes an HTTP 401 from a missing local session token', async () => {
    const result = await callAurictApi(fakeCtx(), '/unauthorized')
    expect(result).toEqual({ kind: 'authorization_rejected' })
  })

  it('returns unavailable on 502/503/504', async () => {
    const result = await callAurictApi(fakeCtx(), '/unavailable')
    expect(result.kind).toBe('unavailable')
  })

  it('returns unavailable when the network request fails', async () => {
    const result = await callAurictApi(fakeCtx(), 'http://127.0.0.1:1/unreachable')
    expect(result.kind).toBe('unavailable')
  })

  it('returns error for non-JSON success-range responses', async () => {
    const result = await callAurictApi(fakeCtx(), '/broken-json')
    expect(result.kind).toBe('error')
  })

  it('returns error with the server-provided detail for other failure statuses', async () => {
    const result = await callAurictApi(fakeCtx(), '/error-with-body')
    expect(result.kind).toBe('error')
    if (result.kind === 'error') {
      expect(result.status).toBe(400)
      expect(result.detail).toBe('boom')
    }
  })

  it('extracts FastAPI-style {"detail": "..."} error bodies', async () => {
    const result = await callAurictApi(fakeCtx(), '/fastapi-error')
    expect(result.kind).toBe('error')
    if (result.kind === 'error') {
      expect(result.status).toBe(404)
      expect(result.detail).toBe('Bond not found')
    }
  })

  it('extracts Hono-style {"error":{"message":"..."}} error bodies (legal)', async () => {
    const result = await callAurictApi(fakeCtx(), '/hono-error')
    expect(result.kind).toBe('error')
    if (result.kind === 'error') {
      expect(result.detail).toBe('Legal unit not found.')
    }
  })

  it('returns success with the parsed body and forwards the Bearer token', async () => {
    const result = await callAurictApi(fakeCtx({ backendAccessToken: 'abc123' }), '/success')
    expect(result.kind).toBe('success')
    if (result.kind === 'success') {
      const data = result.data as { auth: string; items: number[] }
      expect(data.auth).toBe('Bearer abc123')
      expect(data.items).toEqual([1, 2, 3])
    }
  })
})

describe('describeAurictApiFailure', () => {
  it('produces a distinct, human-readable message per failure kind', () => {
    const notAuth = describeAurictApiFailure({ kind: 'not_authenticated' })
    const rejected = describeAurictApiFailure({ kind: 'authorization_rejected' })
    const unavailable = describeAurictApiFailure({ kind: 'unavailable', detail: 'timeout' })
    const error = describeAurictApiFailure({ kind: 'error', status: 500, detail: 'oops' })
    expect(notAuth).toContain('giriş yapmamış')
    expect(rejected).toContain('oturum açmış')
    expect(unavailable).toContain('ulaşılamıyor')
    expect(error).toContain('500')
    expect(new Set([notAuth, rejected, unavailable, error]).size).toBe(4)
  })
})
