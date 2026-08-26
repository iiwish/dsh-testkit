import { createServer } from 'node:http'

import { describe, expect, it } from 'vitest'

import { checkLoopbackHttpRoutes } from '../../src/adapters/dsh/http-routes.js'
import type { HttpRoute } from '../../src/domain/scenario.js'

describe('loopback HTTP route assertions', () => {
  it('checks status and selected JSON fields while retaining only bounded evidence', async () => {
    const server = createServer((_request, response) => {
      response.setHeader('content-type', 'application/json')
      response.end(JSON.stringify({ status: 'ok', version: '1.2.3', token: 'do-not-persist', metadata: { password: 'nested-secret' } }))
    })
    await new Promise<void>(resolve => server.listen(0, '127.0.0.1', resolve))
    const address = server.address()
    if (address === null || typeof address === 'string') throw new Error('test server has no port')

    try {
      const routes: HttpRoute[] = [{
        id: 'health',
        method: 'GET',
        path: '/health',
        expect: { status: 200, json: { status: 'ok', version: '$subject.packageVersion', token: 'do-not-persist', metadata: { password: 'nested-secret' } } },
      }]
      const result = await checkLoopbackHttpRoutes(routes, {
        port: address.port,
        subjectVersion: '1.2.3',
      })

      expect(result.assertions).toEqual(expect.arrayContaining([
        expect.objectContaining({ id: 'http.health.status', status: 'passed', actual: expect.objectContaining({ status: 200 }) }),
        expect.objectContaining({ id: 'http.health.json.status', status: 'passed', actual: 'ok' }),
        expect.objectContaining({ id: 'http.health.json.version', status: 'passed', actual: '1.2.3' }),
        expect.objectContaining({ id: 'http.health.json.token', status: 'passed', actual: '[REDACTED]' }),
      ]))
      expect(result.evidence.requests[0]).toMatchObject({
        path: '/health',
        method: 'GET',
        status: 200,
        responseDigest: expect.stringMatching(/^sha256:/),
        headersRedacted: true,
        bodyRedacted: true,
      })
      expect(JSON.stringify(result.evidence)).not.toContain('do-not-persist')
      expect(JSON.stringify(result.evidence)).not.toContain('nested-secret')
      expect(JSON.stringify(result.evidence)).not.toContain('content-type')
    } finally {
      await new Promise<void>((resolve, reject) => server.close(error => error ? reject(error) : resolve()))
    }
  })

  it('returns a route-specific failure for a status mismatch without throwing', async () => {
    const server = createServer((_request, response) => { response.statusCode = 404; response.end('missing') })
    await new Promise<void>(resolve => server.listen(0, '127.0.0.1', resolve))
    const address = server.address()
    if (address === null || typeof address === 'string') throw new Error('test server has no port')
    try {
      const result = await checkLoopbackHttpRoutes([
        { id: 'status', method: 'GET', path: '/status', expect: { status: 200, json: {} } },
      ], { port: address.port, subjectVersion: '1.0.0' })
      expect(result.assertions).toContainEqual(expect.objectContaining({
        id: 'http.status.status', status: 'failed', expected: 200,
        actual: expect.objectContaining({ status: 404 }),
      }))
    } finally {
      await new Promise<void>((resolve, reject) => server.close(error => error ? reject(error) : resolve()))
    }
  })

  it('does not follow redirects or accept arbitrary URLs', async () => {
    const server = createServer((_request, response) => {
      response.statusCode = 302
      response.setHeader('location', 'https://example.test/secret')
      response.end()
    })
    await new Promise<void>(resolve => server.listen(0, '127.0.0.1', resolve))
    const address = server.address()
    if (address === null || typeof address === 'string') throw new Error('test server has no port')
    try {
      const result = await checkLoopbackHttpRoutes([
        { id: 'redirect', method: 'GET', path: '/redirect', expect: { status: 200, json: {} } },
      ], { port: address.port, subjectVersion: '1.0.0' })
      expect(result.evidence.requests[0]).toMatchObject({ status: 302 })
      expect(result.evidence.requests[0]).not.toHaveProperty('location')
    } finally {
      await new Promise<void>((resolve, reject) => server.close(error => error ? reject(error) : resolve()))
    }
  })

  it('bounds response reads and fails a route whose body is too large', async () => {
    const server = createServer((_request, response) => {
      response.statusCode = 200
      response.end('x'.repeat(1024 * 1024 + 1))
    })
    await new Promise<void>(resolve => server.listen(0, '127.0.0.1', resolve))
    const address = server.address()
    if (address === null || typeof address === 'string') throw new Error('test server has no port')
    try {
      const result = await checkLoopbackHttpRoutes([
        { id: 'large', method: 'GET', path: '/large', expect: { status: 200, json: {} } },
      ], { port: address.port, subjectVersion: '1.0.0' })
      expect(result.assertions).toContainEqual(expect.objectContaining({
        id: 'http.large.status', status: 'failed',
        actual: expect.objectContaining({ status: 200, responseDigest: null, error: expect.stringContaining('exceeded') }),
      }))
    } finally {
      await new Promise<void>((resolve, reject) => server.close(error => error ? reject(error) : resolve()))
    }
  })
})
