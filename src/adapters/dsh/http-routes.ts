import { createHash } from 'node:crypto'

import type { Assertion } from '../../domain/report.js'
import type { HttpRoute } from '../../domain/scenario.js'

const MAX_RESPONSE_BYTES = 1024 * 1024
const MAX_RETRIES = 20
const RETRY_DELAY_MS = 50
const SENSITIVE_KEY = /(?:token|secret|password|authorization|credential|api[-_]?key)/i

export interface HttpRouteEvidenceRequest {
  id: string
  method: 'GET'
  path: string
  status: number | null
  expectedStatus: number
  responseDigest: string | null
  selectedJson: Record<string, unknown>
  expectedJson: Record<string, unknown>
  headersRedacted: true
  bodyRedacted: true
  error?: string
}

export interface HttpRouteEvidence {
  schemaVersion: 1
  host: '127.0.0.1'
  port: number
  requests: HttpRouteEvidenceRequest[]
}

export interface LoopbackHttpRouteOptions {
  port: number
  subjectVersion: string | null
  fetchImpl?: typeof fetch
  requestTimeoutMs?: number
}

export interface LoopbackHttpRouteResult {
  assertions: Assertion[]
  evidence: HttpRouteEvidence
}

function digest(value: Buffer): string {
  return `sha256:${createHash('sha256').update(value).digest('hex')}`
}

function resolveExpected(value: unknown, subjectVersion: string | null): unknown {
  if (value === '$subject.packageVersion') return subjectVersion
  if (Array.isArray(value)) return value.map(item => resolveExpected(item, subjectVersion))
  if (value !== null && typeof value === 'object') {
    return Object.fromEntries(Object.entries(value).map(([key, child]) => [key, resolveExpected(child, subjectVersion)]))
  }
  return value
}

function readSelectedJson(value: unknown, path: string): unknown {
  return path.split('.').reduce<unknown>((current, segment) => (
    current !== null && typeof current === 'object' && Object.prototype.hasOwnProperty.call(current, segment)
      ? (current as Record<string, unknown>)[segment]
      : undefined
  ), value)
}

function safeValue(value: unknown, key: string): unknown {
  if (SENSITIVE_KEY.test(key)) return '[REDACTED]'
  if (Array.isArray(value)) return value.map(child => safeValue(child, key))
  if (value !== null && typeof value === 'object') {
    return Object.fromEntries(Object.entries(value).map(([childKey, child]) => [
      childKey,
      safeValue(child, childKey),
    ]))
  }
  return value
}

function safeRecord(values: Record<string, unknown>): Record<string, unknown> {
  return Object.fromEntries(Object.entries(values).map(([key, value]) => [key, safeValue(value, key)]))
}

function sameValue(actual: unknown, expected: unknown): boolean {
  return JSON.stringify(actual) === JSON.stringify(expected)
}

function sleep(milliseconds: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, milliseconds))
}

async function requestRoute(
  route: HttpRoute,
  options: Required<Pick<LoopbackHttpRouteOptions, 'port' | 'subjectVersion' | 'requestTimeoutMs'>> & { fetchImpl: typeof fetch },
): Promise<{ response: Response | null, body: Buffer | null, error: string | null }> {
  const url = `http://127.0.0.1:${options.port}${route.path}`
  let lastError = 'request failed'
  for (let attempt = 0; attempt < MAX_RETRIES; attempt += 1) {
    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), options.requestTimeoutMs)
    try {
      const response = await options.fetchImpl(url, {
        method: 'GET',
        redirect: 'manual',
        signal: controller.signal,
      })
      const reader = response.body?.getReader()
      if (reader === undefined) return { response, body: Buffer.alloc(0), error: null }
      const chunks: Buffer[] = []
      let total = 0
      while (true) {
        const chunk = await reader.read()
        if (chunk.done) break
        const bytes = Buffer.from(chunk.value)
        total += bytes.length
        if (total > MAX_RESPONSE_BYTES) {
          await reader.cancel()
          return { response, body: null, error: `response exceeded ${MAX_RESPONSE_BYTES} bytes` }
        }
        chunks.push(bytes)
      }
      return { response, body: Buffer.concat(chunks), error: null }
    } catch (error) {
      lastError = error instanceof Error ? error.message : String(error)
      if (attempt + 1 < MAX_RETRIES) await sleep(RETRY_DELAY_MS)
    } finally {
      clearTimeout(timeout)
    }
  }
  return { response: null, body: null, error: lastError }
}

export async function checkLoopbackHttpRoutes(
  routes: readonly HttpRoute[],
  input: LoopbackHttpRouteOptions,
): Promise<LoopbackHttpRouteResult> {
  const options = {
    port: input.port,
    subjectVersion: input.subjectVersion,
    requestTimeoutMs: input.requestTimeoutMs ?? 2_000,
    fetchImpl: input.fetchImpl ?? fetch,
  }
  const assertions: Assertion[] = []
  const requests: HttpRouteEvidenceRequest[] = []

  for (const route of routes) {
    const expectedStatus = route.expect.status
    const expectedJson = Object.fromEntries(Object.entries(route.expect.json).map(([key, value]) => [
      key,
      resolveExpected(value, options.subjectVersion),
    ]))
    const responseResult = await requestRoute(route, options)
    const response = responseResult.response
    const body = responseResult.body
    const responseDigest = body === null ? null : digest(body)
    let parsed: unknown = undefined
    let parseError: string | null = null
    if (body !== null && Object.keys(expectedJson).length > 0) {
      try {
        parsed = JSON.parse(body.toString('utf8')) as unknown
      } catch (error) {
        parseError = error instanceof Error ? error.message : String(error)
      }
    }
    const selectedJson = Object.fromEntries(Object.keys(expectedJson).map(key => [
      key,
      safeValue(readSelectedJson(parsed, key), key),
    ]))
    const requestEvidence: HttpRouteEvidenceRequest = {
      id: route.id,
      method: 'GET',
      path: route.path,
      status: response?.status ?? null,
      expectedStatus,
      responseDigest,
      selectedJson,
      expectedJson: safeRecord(expectedJson),
      headersRedacted: true,
      bodyRedacted: true,
      ...(responseResult.error === null ? {} : { error: responseResult.error }),
    }
    requests.push(requestEvidence)

    const statusPass = response?.status === expectedStatus && responseResult.error === null
    assertions.push({
      id: `http.${route.id}.status`,
      status: statusPass ? 'passed' : 'failed',
      message: statusPass ? `HTTP ${route.path} returned the expected status` : `HTTP ${route.path} returned an unexpected status`,
      expected: expectedStatus,
      actual: response === null
        ? { status: null, responseDigest, error: responseResult.error }
        : { status: response.status, responseDigest, ...(responseResult.error === null ? {} : { error: responseResult.error }) },
    })
    for (const [key, expected] of Object.entries(expectedJson)) {
      const actual = readSelectedJson(parsed, key)
      const passed = parseError === null && sameValue(actual, expected)
      assertions.push({
        id: `http.${route.id}.json.${key}`,
        status: passed ? 'passed' : 'failed',
        message: passed ? `JSON field ${key} matched` : `JSON field ${key} did not match`,
        expected: safeValue(expected, key),
        actual: safeValue(actual, key),
      })
    }
    if (parseError !== null) {
      assertions.push({
        id: `http.${route.id}.json.parse`,
        status: 'failed',
        message: `HTTP ${route.path} did not return parseable JSON`,
        expected: 'JSON object',
        actual: parseError,
      })
    }
  }

  return {
    assertions,
    evidence: { schemaVersion: 1, host: '127.0.0.1', port: options.port, requests },
  }
}
