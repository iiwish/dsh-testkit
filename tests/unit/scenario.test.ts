import { describe, expect, it } from 'vitest'

import {
  buildScenario,
  parseScenario,
  validateRunnerSelection,
} from '../../src/config/scenario.js'
import { renderScenarioSnapshot, scenarioDigest } from '../../src/domain/scenario.js'

describe('scenario contract', () => {
  it('binds the exact published scenario snapshot with SHA-256', () => {
    const scenario = buildScenario({ source: '.', dshVersion: '0.1.0-rc.6' })
    const snapshot = renderScenarioSnapshot(scenario)

    expect(snapshot.endsWith('\n')).toBe(true)
    expect(scenarioDigest(scenario)).toMatch(/^sha256:[0-9a-f]{64}$/)
    expect(scenarioDigest(JSON.parse(snapshot))).toBe(scenarioDigest(scenario))
  })

  it('builds the quick defaults from the two required inputs', () => {
    const scenario = buildScenario({
      source: '.',
      dshVersion: '0.1.0-rc.6',
    })

    expect(scenario).toMatchObject({
      schemaVersion: 1,
      name: 'dsh-plugin-quick',
      suite: 'quick',
      subject: { source: '.' },
      dsh: { version: '0.1.0-rc.6' },
      profile: 'dsh-testkit',
      expect: { boot: 'success', rows: [], services: [], tools: [] },
    })
  })

  it.each(['latest', 'next', '^0.1.0', '0.1.x', 'github:deepseek-ai/deepseek-harness'])
  ('rejects a mutable or non-exact DSH target: %s', (version) => {
    expect(() => buildScenario({ source: '.', dshVersion: version }))
      .toThrow(/exact npm version/i)
  })

  it('parses a declared exercise and observer requirements', () => {
    const scenario = parseScenario({
      schemaVersion: 1,
      name: 'tool-smoke',
      subject: { source: './plugin' },
      dsh: { version: '0.1.0-rc.6' },
      expect: { tools: ['echo'] },
      exercise: [{ tool: 'echo', arguments: { value: 'hello' } }],
      observers: { filesystem: 'required', network: 'off' },
    })

    expect(scenario.exercise).toEqual([{ tool: 'echo', arguments: { value: 'hello' } }])
    expect(scenario.observers).toMatchObject({ filesystem: 'required', network: 'off' })
  })

  it('parses a Docker-only loopback HTTP route contract', () => {
    const scenario = parseScenario({
      schemaVersion: 1,
      name: 'http-smoke',
      subject: { source: './plugin' },
      dsh: { version: '0.1.0-rc.6' },
      profile: 'web',
      http: {
        routes: [{
          id: 'dsh-market.status',
          path: '/dsh-market/status',
          expect: {
            status: 200,
            json: { version: '$subject.packageVersion', status: 'ok' },
          },
        }],
      },
    })

    expect(scenario.http?.routes[0]).toMatchObject({
      method: 'GET',
      path: '/dsh-market/status',
      expect: { status: 200 },
    })
  })

  it.each([
    'https://example.test/status',
    '/status?token=secret',
    '/status#fragment',
    '/status/../admin',
    '/status\\admin',
  ])('rejects unsafe HTTP route paths: %s', (path) => {
    expect(() => parseScenario({
      schemaVersion: 1,
      name: 'unsafe-http',
      subject: { source: '.' },
      dsh: { version: '0.1.0-rc.6' },
      http: { routes: [{ id: 'unsafe', path, expect: { status: 200, json: {} } }] },
    })).toThrow()
  })

  it('rejects non-GET HTTP methods and duplicate route identifiers', () => {
    expect(() => parseScenario({
      schemaVersion: 1,
      name: 'post-http',
      subject: { source: '.' },
      dsh: { version: '0.1.0-rc.6' },
      http: { routes: [{ id: 'post', method: 'POST', path: '/status' }] },
    })).toThrow()
    expect(() => parseScenario({
      schemaVersion: 1,
      name: 'duplicate-http',
      subject: { source: '.' },
      dsh: { version: '0.1.0-rc.6' },
      http: { routes: [
        { id: 'status', path: '/status' },
        { id: 'status', path: '/other' },
      ] },
    })).toThrow(/unique/i)
  })

  it('rejects local execution without explicit unsafe consent', () => {
    expect(() => validateRunnerSelection({ runner: 'local', unsafeLocal: false }))
      .toThrow(/unsafe-local/i)
    expect(validateRunnerSelection({ runner: 'local', unsafeLocal: true }))
      .toEqual({ runner: 'local', unsafeLocal: true })
  })

  it('rejects HTTP route scenarios on the unsafe-local runner', () => {
    const httpScenario = parseScenario({
      schemaVersion: 1,
      name: 'http-local',
      subject: { source: '.' },
      dsh: { version: '0.1.0-rc.6' },
      profile: 'web',
      http: { routes: [{ id: 'status', path: '/status' }] },
    })
    expect(() => validateRunnerSelection({
      runner: 'local',
      unsafeLocal: true,
      scenario: httpScenario,
    })).toThrow(/Docker/i)
  })

  it('rejects duplicate expected capability identifiers', () => {
    expect(() => parseScenario({
      schemaVersion: 1,
      name: 'duplicates',
      subject: { source: '.' },
      dsh: { version: '0.1.0-rc.6' },
      expect: { tools: ['echo', 'echo'] },
    })).toThrow(/unique/i)
  })
})
