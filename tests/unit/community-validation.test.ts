import { describe, expect, it } from 'vitest'

import {
  aggregateCommunityReports,
  parseExactNpmSpec,
  sanitizeCommunityEnvironment,
} from '../../src/community/validation.js'

describe('community validation protocol', () => {
  it('accepts only exact immutable npm versions', () => {
    expect(parseExactNpmSpec('example-plugin@1.2.3')).toEqual({
      name: 'example-plugin',
      version: '1.2.3',
    })
    expect(parseExactNpmSpec('@scope/example-plugin@1.2.3-rc.4')).toEqual({
      name: '@scope/example-plugin',
      version: '1.2.3-rc.4',
    })
    for (const mutable of ['example-plugin', 'example-plugin@latest', 'example-plugin@^1.2.3', 'github:owner/repo']) {
      expect(() => parseExactNpmSpec(mutable)).toThrow('exact npm version')
    }
  })

  it('constructs a credential-free child environment with an isolated home', () => {
    const environment = sanitizeCommunityEnvironment({
      PATH: '/usr/bin',
      HOME: '/home/user',
      NPM_TOKEN: 'secret',
      NODE_AUTH_TOKEN: 'secret',
      GH_TOKEN: 'secret',
      OPENAI_API_KEY: 'secret',
      DOCKER_AUTH_CONFIG: 'secret',
      DOCKER_HOST: 'tcp://remote.example:2376',
      DOCKER_CERT_PATH: '/secret/certs',
    }, '/tmp/cohort-home')

    expect(environment).toMatchObject({
      PATH: '/usr/bin',
      HOME: '/tmp/cohort-home',
      DSH_HOME: '/tmp/cohort-home/.dsh',
      DSH_TELEMETRY_DISABLED: '1',
      NPM_CONFIG_REGISTRY: 'https://registry.npmjs.org/',
    })
    expect(JSON.stringify(environment)).not.toContain('secret')
    expect(environment).not.toHaveProperty('DOCKER_HOST')
    expect(environment).not.toHaveProperty('DOCKER_CERT_PATH')
  })

  it('publishes aggregate verdicts without subject identities', () => {
    const summary = aggregateCommunityReports([
      { subject: 'alpha@1.0.0', verdict: 'passed', firstFailureStage: null },
      { subject: 'beta@2.0.0', verdict: 'failed', firstFailureStage: 'boot' },
      { subject: 'gamma@3.0.0', verdict: 'failed', firstFailureStage: 'boot' },
    ], {
      dshVersion: '0.1.0-rc.6',
      testkitVersion: '0.2.1',
      completedAt: '2026-08-15T00:00:00.000Z',
    })

    expect(summary).toMatchObject({
      schemaVersion: 1,
      cohortSize: 3,
      verdicts: { passed: 1, failed: 2 },
      firstFailureStages: { boot: 2 },
    })
    expect(JSON.stringify(summary)).not.toMatch(/alpha|beta|gamma/)
  })
})
