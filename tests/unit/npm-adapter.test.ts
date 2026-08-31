import { describe, expect, it } from 'vitest'

import {
  buildLocalPackageInstallPlan,
  classifyBootFailure,
  DshNpmAdapter,
} from '../../src/adapters/dsh/npm-adapter.js'
import type { AdapterBootObservation } from '../../src/worker/adapter.js'

describe('DshNpmAdapter verdict boundaries', () => {
  it('requires live loopback evidence before attributing a timeout to the DSH host', () => {
    expect(classifyBootFailure('pre-probe-timeout')).toBe('timeout')
    expect(classifyBootFailure('live-loopback-unresponsive')).toBe('dsh')
  })

  it('preserves an unavailable browser runner as an unsupported registration assertion', async () => {
    const adapter = new DshNpmAdapter()
    const observation: AdapterBootObservation = {
      outcome: 'success',
      probe: {
        assertions: [],
        exercises: [],
        browser: [{
          id: 'browser.turn-status.runner',
          status: 'unsupported',
          message: 'Browser runner is unavailable',
        }],
      },
    }

    await expect(adapter.register(observation)).resolves.toMatchObject({
      assertions: [expect.objectContaining({
        id: 'browser.turn-status.runner',
        status: 'unsupported',
      })],
    })
  })
})

describe('local-directory package preparation', () => {
  it('uses the declared pnpm release and frozen lockfile for pack lifecycle scripts', () => {
    expect(buildLocalPackageInstallPlan({
      packageManager: 'pnpm@10.17.0',
      scripts: { prepare: 'pnpm run build' },
    }, ['package.json', 'pnpm-lock.yaml'])).toEqual({
      executable: 'corepack',
      args: ['pnpm@10.17.0', 'install', '--frozen-lockfile'],
      packageManager: 'pnpm@10.17.0',
    })
  })

  it('uses npm ci for a locked npm package with a prepack script', () => {
    expect(buildLocalPackageInstallPlan({
      packageManager: 'npm@11.5.2',
      scripts: { prepack: 'npm run build' },
    }, ['package-lock.json', 'package.json'])).toEqual({
      executable: 'corepack',
      args: ['npm@11.5.2', 'ci'],
      packageManager: 'npm@11.5.2',
    })
  })

  it('does not install a package that has no pack lifecycle script', () => {
    expect(buildLocalPackageInstallPlan({
      packageManager: 'pnpm@10.17.0',
      devDependencies: { typescript: '5.9.2' },
    }, ['package.json', 'pnpm-lock.yaml'])).toBeNull()
  })

  it('rejects an unsupported package manager before running plugin scripts', () => {
    expect(() => buildLocalPackageInstallPlan({
      packageManager: 'bun@1.2.0',
      scripts: { prepare: 'bun run build' },
    }, ['bun.lock', 'package.json'])).toThrow(/unsupported packageManager/i)
  })

  it('rejects a mutable package manager version before running plugin scripts', () => {
    expect(() => buildLocalPackageInstallPlan({
      packageManager: 'pnpm@latest',
      scripts: { prepare: 'pnpm run build' },
    }, ['package.json', 'pnpm-lock.yaml'])).toThrow(/exact semantic version/i)
  })
})
