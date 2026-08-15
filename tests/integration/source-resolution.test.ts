import { execFile } from 'node:child_process'
import { access, mkdir, mkdtemp, rm, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { promisify } from 'node:util'

import { afterEach, describe, expect, it, vi } from 'vitest'

import { DshNpmAdapter } from '../../src/adapters/dsh/npm-adapter.js'
import { buildScenario } from '../../src/config/scenario.js'
import type { WorkerRequest } from '../../src/worker/protocol.js'

const executeFile = promisify(execFile)

describe.sequential('local source resolution evidence', () => {
  afterEach(() => { vi.unstubAllEnvs() })

  it('declares Git commit probe logs when the plugin root is a repository', async () => {
    const temporary = await mkdtemp(join(tmpdir(), 'dsh-testkit-git-root-'))
    const plugin = join(temporary, 'plugin')
    const output = join(temporary, 'output')
    const work = join(temporary, 'work')
    await Promise.all([
      mkdir(plugin),
      mkdir(output),
    ])
    await writeFile(join(plugin, 'README.md'), 'fixture\n')
    await executeFile('git', ['init'], { cwd: plugin })
    await executeFile('git', ['add', 'README.md'], { cwd: plugin })
    await executeFile('git', [
      '-c', 'user.name=DSH Testkit',
      '-c', 'user.email=dsh-testkit@example.invalid',
      'commit', '-m', 'fixture',
    ], { cwd: plugin })

    vi.stubEnv('DSH_TESTKIT_WORK_ROOT', work)
    const request: WorkerRequest = {
      schemaVersion: 1,
      runId: 'git-root-evidence',
      scenario: buildScenario({
        source: plugin,
        dshVersion: '0.1.0-rc.6',
      }),
      outputDir: output,
      reproductionCommand: 'dsh-test . --dsh 0.1.0-rc.6',
      allowMutableSource: false,
      runner: 'local',
      unsafeLocal: true,
    }
    const adapter = new DshNpmAdapter()
    try {
      await adapter.initialize(request)
      await adapter.resolve()

      expect(adapter.subjectIdentity().gitCommit).toMatch(/^[0-9a-f]{40}$/)
      expect(adapter.artifacts()).toEqual(expect.arrayContaining([
        'logs/resolve-git-plugin.stderr.log',
        'logs/resolve-git-plugin.stdout.log',
      ]))
      await Promise.all([
        access(join(output, 'logs/resolve-git-plugin.stderr.log')),
        access(join(output, 'logs/resolve-git-plugin.stdout.log')),
      ])
    } finally {
      await adapter.cleanup().catch(() => undefined)
      await rm(temporary, { recursive: true, force: true })
    }
  })
})
