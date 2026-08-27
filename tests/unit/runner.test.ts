import { describe, expect, it } from 'vitest'

import {
  buildDockerRunArgs,
  buildDockerWatchdogRemoveArgs,
  dockerInputContainerPath,
  dockerRunName,
  runnerImageName,
} from '../../src/runners/docker.js'
import { runnerTimeoutMs } from '../../src/runners/types.js'
import type { WorkerRequest } from '../../src/worker/protocol.js'

describe('Docker runner command planning', () => {
  it('mounts output read-write, local input read-only and uses tmpfs work roots', () => {
    const args = buildDockerRunArgs({
      image: 'dsh-testkit-runner:0.1.2',
      runId: 'run:unsafe/name',
      outputDir: '/tmp/output',
      requestFilename: 'worker-request.json',
      input: { hostPath: '/tmp/plugin', containerPath: '/input/plugin' },
      user: '1000:1000',
    })

    expect(args).toContain('--rm')
    expect(args).toContain('--read-only')
    expect(args).toContain('--init')
    expect(args).toContain('no-new-privileges')
    expect(args).toContain('4g')
    expect(args).toContain('2')
    expect(args).toContain('/tmp/output:/output')
    expect(args).toContain('/tmp/plugin:/input/plugin:ro')
    expect(args).toContain('1000:1000')
    expect(args).toContain('/work:exec,mode=1777')
    expect(args.at(-1)).toBe('/output/worker-request.json')
  })

  it('normalizes the run id into a legal bounded container name', () => {
    const name = dockerRunName('run:unsafe/name with spaces')
    expect(name).toMatch(/^dsh-testkit-[a-z0-9_.-]+$/)
    expect(name.length).toBeLessThanOrEqual(63)
  })

  it('preserves a local tarball extension in the container mount', () => {
    expect(dockerInputContainerPath('primary', '/tmp/dsh-plugin.tgz', false)).toBe('/input/primary.tgz')
    expect(dockerInputContainerPath('primary', '/tmp/plugin', true)).toBe('/input/primary')
  })

  it('keys the runner image name by the immutable build-context digest', () => {
    const digest = `sha256:${'a'.repeat(64)}`
    expect(runnerImageName(digest)).toBe('dsh-testkit-runner:0.3.4-aaaaaaaaaaaa')
  })

  it('uses the explicit attempt-wide watchdog budget', () => {
    const request = {
      scenario: { timeouts: { overallMs: 123_456 } },
    } as WorkerRequest
    expect(runnerTimeoutMs(request)).toBe(123_456)
  })

  it('force-removes only the named owned container after watchdog expiry', () => {
    expect(buildDockerWatchdogRemoveArgs('run:unsafe/name')).toEqual([
      'rm', '--force', 'dsh-testkit-run-unsafe-name',
    ])
  })
})
