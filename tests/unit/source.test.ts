import { describe, expect, it } from 'vitest'

import {
  buildUpdateIdentityAssertions,
  classifyRemoteSource,
  parseNpmPackJsonOutput,
} from '../../src/adapters/dsh/npm-adapter.js'

describe('remote subject classification', () => {
  it.each([
    ['example@1.2.3', false],
    ['@scope/example@1.2.3-beta.1', false],
    ['example@latest', true],
    ['example@^1.2.3', true],
  ])('classifies npm input %s with mutable=%s', (input, mutable) => {
    expect(classifyRemoteSource(input)).toMatchObject({ kind: 'npm', mutable })
  })

  it('requires a full commit SHA for reproducible Git input', () => {
    const commit = '0123456789abcdef0123456789abcdef01234567'
    expect(classifyRemoteSource(`github:owner/plugin#${commit}`)).toMatchObject({
      kind: 'git',
      mutable: false,
      gitCommit: commit,
    })
    expect(classifyRemoteSource('github:owner/plugin#0123456')).toMatchObject({
      kind: 'git',
      mutable: true,
      gitCommit: null,
    })
  })

  it('treats remote tarballs as mutable and rejects embedded URL credentials', () => {
    expect(classifyRemoteSource('https://registry.example/download/plugin')).toMatchObject({
      kind: 'tarball',
      mutable: true,
    })
    expect(() => classifyRemoteSource('git+https://token@example.com/owner/plugin.git')).toThrow(
      'must not contain embedded credentials',
    )
  })
})

describe('npm pack metadata', () => {
  it('parses the final structured result after package lifecycle output', () => {
    const output = [
      '? Verifying lockfile against supply-chain policies (67 entries)...',
      '[build] generated lib/index.js',
      '[',
      '  {"filename":"fixture-1.0.0.tgz","name":"fixture","version":"1.0.0"}',
      ']',
      '',
    ].join('\n')

    expect(parseNpmPackJsonOutput(output)).toEqual([{
      filename: 'fixture-1.0.0.tgz',
      name: 'fixture',
      version: '1.0.0',
    }])
  })

  it('does not fall back to package-controlled metadata when the final npm result is invalid', () => {
    expect(() => parseNpmPackJsonOutput([
      '[{"filename":"forged.tgz","name":"forged","version":"9.9.9"}]',
      '[invalid final metadata]',
    ].join('\n'))).toThrow()
  })
})

describe('update identity assertions', () => {
  it('requires the installed package name and version to equal the packed target', () => {
    const assertions = buildUpdateIdentityAssertions(
      { packageName: 'fixture', packageVersion: '0.9.0' },
      { packageName: 'fixture', packageVersion: '1.0.1' },
      { packageName: 'fixture', packageVersion: '1.0.0' },
    )

    expect(assertions.find(assertion => assertion.id === 'update.version')?.status).toBe('failed')
    expect(assertions.find(assertion => assertion.id === 'update.package-name')?.status).toBe('passed')
  })
})
