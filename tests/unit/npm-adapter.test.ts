import { access, mkdir, mkdtemp, readFile, rm, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'

import { describe, expect, it, vi } from 'vitest'
import { parse } from 'yaml'

import {
  buildLocalPackageInstallPlan,
  classifyBootFailure,
  DshNpmAdapter,
} from '../../src/adapters/dsh/npm-adapter.js'
import type { AdapterBootObservation } from '../../src/worker/adapter.js'
import type { AdapterCompletion } from '../../src/worker/adapter.js'
import { ScenarioSchema } from '../../src/domain/scenario.js'
import type { CommandResult } from '../../src/process/command.js'
import { captureSystemSnapshot, snapshotFiles } from '../../src/observers/snapshot.js'

vi.mock('../../src/observers/snapshot.js', async (importOriginal) => {
  const snapshot = await importOriginal<typeof import('../../src/observers/snapshot.js')>()
  return { ...snapshot, captureSystemSnapshot: vi.fn(snapshot.captureSystemSnapshot) }
})

vi.mock('node:fs/promises', async (importOriginal) => {
  const fs = await importOriginal<typeof import('node:fs/promises')>()
  return { ...fs, access: vi.fn(fs.access) }
})

describe('subject-free runtime baseline', () => {
  it.each([true, false])('declares Connection readiness only for browser probes (%s)', async (browser) => {
    const root = await mkdtemp(join(tmpdir(), 'dsh-probe-readiness-'))
    const adapter = new DshNpmAdapter() as unknown as { ensureProbePatch(): Promise<void> }
    Object.assign(adapter, { runRoot: root, request: { scenario: {
      ...(browser ? { browser: { smoke: {} } } : {}),
    } } })
    try {
      vi.mocked(access).mockResolvedValueOnce(undefined)
      await adapter.ensureProbePatch()
      const patch = parse(await readFile(join(root, 'probe.patch.yml'), 'utf8'))
      expect(patch[0].insert[0].inject).toEqual(browser ? ['connection'] : undefined)
    } finally {
      await rm(root, { recursive: true, force: true })
    }
  })

  it('still attributes content changes to a credential file already present in the host baseline', async () => {
    const root = await mkdtemp(join(tmpdir(), 'dsh-baseline-residue-'))
    const home = join(root, 'home')
    const workspace = join(root, 'workspace')
    const evidence = join(root, 'evidence')
    for (const directory of [home, workspace, evidence]) await mkdir(directory)
    await writeFile(join(home, '.credentials.yaml'), 'version: 1\n')
    const baseline = { dshHome: await snapshotFiles(home), workspace: await snapshotFiles(workspace) }
    await writeFile(join(home, '.credentials.yaml'), 'version: 1\n# plugin-owned residue\n')
    const adapter = new DshNpmAdapter() as unknown as {
      uninstall(): Promise<unknown>
      dshPlugin(...args: unknown[]): Promise<CommandResult>
      readProfileManifest(): Promise<object>
    }
    Object.assign(adapter, {
      dshHome: home, workspaceDir: workspace, evidenceDir: evidence, profileDir: join(home, 'profiles/web'),
      installedPackageName: 'fixture', beforeBootSnapshots: baseline, beforeInstallSnapshots: baseline,
      request: { outputDir: root, scenario: ScenarioSchema.parse({
        schemaVersion: 1, name: 'residue', subject: { source: '.' }, dsh: { version: '0.1.2-rc.1' }, profile: 'web',
        browser: { smoke: { kind: 'turn-status-text', expectedText: 'ready' } },
      }) },
    })
    vi.spyOn(adapter, 'dshPlugin').mockResolvedValue({ artifacts: [] } as unknown as CommandResult)
    vi.spyOn(adapter, 'readProfileManifest').mockResolvedValue({})
    try {
      await expect(adapter.uninstall()).rejects.toMatchObject({ details: {
        assertions: expect.arrayContaining([expect.objectContaining({
          id: 'uninstall.filesystem.residue', status: 'failed', actual: ['modified:dsh-home/.credentials.yaml'],
        })]),
      } })
    } finally {
      vi.restoreAllMocks()
      await rm(root, { recursive: true, force: true })
    }
  })

  it.each(['success', 'failure'] as const)('requires a %s baseline boot before subject installation', async (outcome) => {
    const root = await mkdtemp(join(tmpdir(), 'dsh-baseline-test-'))
    const adapter = new DshNpmAdapter() as unknown as {
      prepareProfileBaseline(): Promise<string[]>
      command(...args: unknown[]): Promise<CommandResult>
      dshPlugin(...args: unknown[]): Promise<CommandResult>
      observeBoot(label: string, mode: string): Promise<AdapterCompletion<AdapterBootObservation>>
    }
    Object.assign(adapter, {
      runRoot: root,
      packagesDir: root,
      request: { scenario: ScenarioSchema.parse({
        schemaVersion: 1, name: 'baseline', subject: { source: '.' }, dsh: { version: '0.1.2-rc.1' },
      }) },
    })
    const result = { stdout: '[{"filename":"baseline.tgz","name":"baseline","version":"0.0.0"}]', artifacts: [] } as unknown as CommandResult
    vi.spyOn(adapter, 'command').mockResolvedValue(result)
    const calls: string[] = []
    vi.spyOn(adapter, 'dshPlugin').mockImplementation(async (label) => { calls.push(String(label)); return result })
    vi.spyOn(adapter, 'observeBoot').mockImplementation(async (label, mode) => {
      calls.push(`${label}:${mode}`)
      return { summary: 'baseline', value: { outcome, probe: outcome === 'success' ? { assertions: [], exercises: [] } : null }, artifacts: ['evidence/probe-baseline-boot.json'] }
    })
    try {
      if (outcome === 'success') {
        await expect(adapter.prepareProfileBaseline()).resolves.toContain('evidence/probe-baseline-boot.json')
        expect(calls).toEqual(['baseline-install', 'baseline-remove', 'baseline-boot:baseline'])
      } else {
        await expect(adapter.prepareProfileBaseline()).rejects.toMatchObject({ details: { failureKind: 'infrastructure' } })
      }
    } finally {
      vi.restoreAllMocks()
      await rm(root, { recursive: true, force: true })
    }
  })
})

describe('DshNpmAdapter verdict boundaries', () => {
  it('redacts launcher credentials before persisting or returning process snapshots', async () => {
    const root = await mkdtemp(join(tmpdir(), 'dsh-process-redaction-'))
    const adapter = new DshNpmAdapter() as unknown as {
      captureSystem(label: string): Promise<{ processes: string | null; ports: string | null }>
    }
    Object.assign(adapter, { evidenceDir: root, canary: 'canary-secret', request: { outputDir: root } })
    vi.mocked(captureSystemSnapshot).mockResolvedValueOnce({
      processes: '123 1 S node open http://127.0.0.1:3080/?token=launch-secret canary-secret',
      ports: null,
    })
    try {
      const result = await adapter.captureSystem('boot')
      expect(result.processes).toBe('123 1 S node open http://127.0.0.1:3080/?token=[REDACTED] [REDACTED]')
      expect(await readFile(join(root, 'process-boot.txt'), 'utf8')).toBe(result.processes)
      expect(result.ports).toBeNull()
    } finally {
      await rm(root, { recursive: true, force: true })
    }
  })

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
