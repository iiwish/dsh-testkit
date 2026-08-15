import { describe, expect, it } from 'vitest'

import {
  buildDockerRunArgs,
  dockerInputContainerPath,
  dockerRunName,
  runnerImageName,
} from '../../src/runners/docker.js'

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
    expect(runnerImageName(digest)).toBe('dsh-testkit-runner:0.3.1-aaaaaaaaaaaa')
  })
})
