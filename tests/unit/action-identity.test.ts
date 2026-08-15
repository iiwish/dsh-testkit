import { describe, expect, it } from 'vitest'

import { computeActionIdentity } from '../../src/action/identity.js'
import { buildActionArguments, parseAdditionalActionArgs } from '../../src/action/run.js'

const baseInput = {
  plugin: 'fixtures/healthy-plugin',
  dshVersion: '0.1.0-rc.6',
  output: '',
  artifactName: '',
  checkName: '',
  runId: '12345',
  runAttempt: '1',
  job: 'test-plugins',
  action: '__iiwish_dsh-testkit',
}

describe('GitHub Action identity', () => {
  it('derives unique evidence identities for matrix subjects', () => {
    const first = computeActionIdentity(baseInput)
    const second = computeActionIdentity({ ...baseInput, plugin: 'fixtures/boot-failure-plugin' })

    expect(first.output).not.toBe(second.output)
    expect(first.artifactName).not.toBe(second.artifactName)
    expect(first.checkName).not.toBe(second.checkName)
    expect(first.artifactName).toMatch(/^dsh-testkit-test-plugins-healthy-plugin-[0-9a-f]{12}$/)
  })

  it('distinguishes repeated action invocations in one job', () => {
    const first = computeActionIdentity(baseInput)
    const second = computeActionIdentity({ ...baseInput, action: '__iiwish_dsh-testkit_2' })

    expect(first.artifactName).not.toBe(second.artifactName)
    expect(first.output).not.toBe(second.output)
  })

  it('preserves valid explicit names and rejects output traversal', () => {
    expect(computeActionIdentity({
      ...baseInput,
      output: '.evidence/plugin-a',
      artifactName: 'plugin-a-evidence',
      checkName: 'Plugin A lifecycle',
    })).toMatchObject({
      output: '.evidence/plugin-a',
      artifactName: 'plugin-a-evidence',
      checkName: 'Plugin A lifecycle',
    })

    expect(() => computeActionIdentity({ ...baseInput, output: '../outside' }))
      .toThrow(/relative directory inside the workspace/i)
  })

  it('preserves quoted and spaced CLI values through args-json', () => {
    expect(parseAdditionalActionArgs('["--expect-row","row with spaces"]', ''))
      .toEqual(['--expect-row', 'row with spaces'])
    expect(() => parseAdditionalActionArgs('["--json"]', '--suite full'))
      .toThrow(/not both/i)
    expect(buildActionArguments({
      plugin: 'package-name@1.0.0',
      dshVersion: '0.1.0-rc.6',
      config: '',
      output: '.dsh-testkit/action-a',
      argsJson: '["--expect-row","row with spaces"]',
      legacyArgs: '',
      workspace: '/workspace',
    })).toEqual([
      'package-name@1.0.0', '--dsh', '0.1.0-rc.6',
      '--output', '/workspace/.dsh-testkit/action-a',
      '--expect-row', 'row with spaces',
    ])
  })
})
