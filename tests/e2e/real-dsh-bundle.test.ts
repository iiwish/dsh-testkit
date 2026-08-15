import { execFile } from 'node:child_process'
import { cp, mkdir, mkdtemp, readFile, readdir, rm, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join, resolve } from 'node:path'
import { pathToFileURL } from 'node:url'
import { promisify } from 'node:util'

import { describe, expect, it } from 'vitest'

import { SUPPORTED_DSH_NPM_VERSIONS } from '../../src/adapters/dsh/support.js'
import { RunReportSchema } from '../../src/domain/report.js'
import { runCommand } from '../../src/process/command.js'

const executeFile = promisify(execFile)
const root = resolve(import.meta.dirname, '../..')
const enabled = process.env.DSH_TESTKIT_E2E === '1'

describe.skipIf(!enabled).sequential('native DSH bundle', () => {
  it('installs, registers and invokes dsh_test through a real DSH profile', async () => {
    const temporary = await mkdtemp(join(tmpdir(), 'dsh-testkit-bundle-e2e-'))
    const harness = join(temporary, 'harness')
    const workspace = join(temporary, 'workspace')
    const home = join(temporary, 'home')
    const userHome = join(temporary, 'user-home')
    const packDirectory = join(temporary, 'pack')
    const logs = join(temporary, 'logs')
    const profile = 'testkit-bundle-e2e'
    const dshVersion = SUPPORTED_DSH_NPM_VERSIONS[0]

    try {
      await Promise.all([
        mkdir(harness, { recursive: true }),
        mkdir(workspace, { recursive: true }),
        mkdir(home, { recursive: true }),
        mkdir(userHome, { recursive: true }),
        mkdir(packDirectory, { recursive: true }),
        mkdir(logs, { recursive: true }),
      ])
      await writeFile(join(harness, 'package.json'), `${JSON.stringify({
        name: 'dsh-testkit-bundle-e2e-host',
        private: true,
        version: '0.0.0',
        packageManager: 'pnpm@11.1.3',
      }, null, 2)}\n`)
      await writeFile(join(harness, 'pnpm-workspace.yaml'), [
        'packages:',
        '  - .',
        'dangerouslyAllowAllBuilds: true',
        '',
      ].join('\n'))
      await cp(join(root, 'fixtures', 'healthy-plugin'), join(workspace, 'healthy-plugin'), { recursive: true })

      await executeFile('pnpm', ['add', '--save-exact', `@deepseek-ai/dsh@${dshVersion}`], {
        cwd: harness,
        timeout: 300_000,
        maxBuffer: 16 * 1024 * 1024,
        env: { ...process.env, NPM_CONFIG_AUDIT: 'false', NPM_CONFIG_FUND: 'false' },
      })
      const packed = await executeFile('npm', ['pack', '--json', '--pack-destination', packDirectory], {
        cwd: root,
        timeout: 180_000,
        maxBuffer: 16 * 1024 * 1024,
      })
      const packMetadata = JSON.parse(packed.stdout) as Array<{ filename?: string }>
      const filename = packMetadata[0]?.filename
      if (filename === undefined) throw new Error('npm pack returned no filename')
      const tarball = join(packDirectory, filename)
      const dsh = join(harness, 'node_modules', '.bin', 'dsh')
      const dshEnvironment = {
        ...process.env,
        DSH_HOME: home,
        HOME: userHome,
        DSH_TELEMETRY_DISABLED: '1',
        PATH: `${join(harness, 'node_modules', '.bin')}:${process.env.PATH ?? ''}`,
        NPM_CONFIG_AUDIT: 'false',
        NPM_CONFIG_FUND: 'false',
        PNPM_CONFIG_DANGEROUSLY_ALLOW_ALL_BUILDS: 'true',
      }

      await executeFile(dsh, ['plugin', '--profile', profile, 'add', tarball, '--save-exact'], {
        cwd: workspace,
        env: dshEnvironment,
        timeout: 300_000,
        maxBuffer: 16 * 1024 * 1024,
      })
      const dumped = await executeFile(dsh, ['--profile', profile, '--dump-config'], {
        cwd: workspace,
        env: dshEnvironment,
        timeout: 60_000,
        maxBuffer: 16 * 1024 * 1024,
      })
      expect(dumped.stdout).toContain('# == dsh-testkit')
      expect(dumped.stdout).toContain('id: tool-dsh-testkit')

      const profileManifest = JSON.parse(await readFile(join(home, 'profiles', profile, 'package.json'), 'utf8'))
      expect(profileManifest.dsh.profile.bundles).toContain('dsh-testkit')

      const probeOutput = join(temporary, 'probe.json')
      const probePatch = join(temporary, 'probe.patch.yml')
      const probeModule = pathToFileURL(join(root, 'dist', 'src', 'probe', 'runtime.js')).href
      await writeFile(probePatch, [
        '- insert:',
        '    - id: dsh-testkit-bundle-e2e-probe',
        `      name: ${JSON.stringify(probeModule)}`,
        '',
      ].join('\n'))
      const probeConfig = {
        schemaVersion: 1,
        output: probeOutput,
        mode: 'present',
        services: [],
        tools: ['dsh_test'],
        exercise: [{
          tool: 'dsh_test',
          arguments: {
            confirm: true,
            source: './healthy-plugin',
            dshVersion,
            expectedRows: ['fixture-healthy'],
            expectedServices: ['fixtureHealthy'],
            expectedTools: ['fixture_echo'],
          },
        }],
        settleMs: 500,
      }
      const boot = await runCommand({
        executable: dsh,
        args: ['--profile', profile, '--patch', probePatch],
        cwd: workspace,
        env: { ...dshEnvironment, DSH_TESTKIT_PROBE_CONFIG: JSON.stringify(probeConfig) },
        timeoutMs: 900_000,
        logDir: logs,
        logName: 'bundle-host',
        completionFile: probeOutput,
      })
      expect(boot.timedOut).toBe(false)
      expect(boot.stoppedAfterCompletion).toBe(true)
      const probe = JSON.parse(await readFile(probeOutput, 'utf8')) as {
        tools: string[]
        exercises: Array<{ id: string, status: string, message: string }>
      }
      expect(probe.tools).toContain('dsh_test')
      expect(probe.exercises).toContainEqual(expect.objectContaining({
        id: 'exercise.dsh_test.1',
        status: 'passed',
      }))

      const runsDirectory = join(workspace, '.dsh-testkit', 'runs')
      const runs = await readdir(runsDirectory)
      expect(runs).toHaveLength(1)
      const report = RunReportSchema.parse(JSON.parse(
        await readFile(join(runsDirectory, runs[0]!, 'report.json'), 'utf8'),
      ))
      expect(report).toMatchObject({
        verdict: 'passed',
        subject: { packageName: '@dsh-testkit/fixture-healthy' },
        environment: { isolation: 'docker-container', unsafeLocal: false },
      })

      await executeFile(dsh, ['plugin', '--profile', profile, 'remove', 'dsh-testkit'], {
        cwd: workspace,
        env: dshEnvironment,
        timeout: 300_000,
        maxBuffer: 16 * 1024 * 1024,
      })
      const removedManifest = JSON.parse(await readFile(join(home, 'profiles', profile, 'package.json'), 'utf8'))
      expect(removedManifest.dsh.profile.bundles).not.toContain('dsh-testkit')
    } finally {
      await rm(temporary, { recursive: true, force: true })
    }
  }, 1_200_000)
})
