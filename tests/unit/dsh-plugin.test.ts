import { mkdir, mkdtemp, realpath, symlink } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'

import { describe, expect, it, vi } from 'vitest'

import { DSH_TESTKIT_SKILL } from '../../src/agent-skill.js'
import { apply, createDshTestTool, executeDshTest } from '../../src/dsh-plugin.js'

describe('native DSH tool adapter', () => {
  it('registers one typed dsh_test tool without unsafe CLI controls', () => {
    const register = vi.fn()
    const on = vi.fn()
    apply({ on, tools: { register } } as never)

    expect(register).toHaveBeenCalledOnce()
    expect(on).toHaveBeenCalledWith('tools/pre-execute', expect.any(Function))
    const tool = register.mock.calls[0]?.[0] as ReturnType<typeof createDshTestTool>
    const parameters = tool.parameters as { required: string[], properties: Record<string, unknown> }
    expect(tool.name).toBe('dsh_test')
    expect(parameters.required).toContain('confirm')
    expect(Object.keys(parameters.properties)).toEqual(expect.arrayContaining([
      'confirm', 'source', 'dshVersion', 'suite', 'lifecycleCase',
      'expectedRows', 'expectedServices', 'expectedTools', 'updateFrom',
    ]))
    expect(Object.keys(parameters.properties)).not.toEqual(expect.arrayContaining([
      'runner', 'unsafeLocal', 'allowMutableSource', 'output', 'config', 'argv',
    ]))
  })

  it('registers the canonical Skill through an optional injected child', () => {
    const registerSkill = vi.fn(() => vi.fn())
    const inject = vi.fn((_services, callback) => callback({
      skills: { register: registerSkill },
    }))

    apply({
      inject,
      on: () => undefined,
      tools: { register: () => undefined },
    } as never)

    expect(inject).toHaveBeenCalledWith(['skills'], expect.any(Function))
    expect(registerSkill).toHaveBeenCalledOnce()
    expect(registerSkill).toHaveBeenCalledWith(DSH_TESTKIT_SKILL)
  })

  it('asks for interactive approval without overriding a downstream denial', async () => {
    let gate: ((exec: { name: string, agent?: object, arguments?: unknown }, next: () => Promise<{ kind: 'allow' | 'deny' }>) => Promise<unknown>) | undefined
    apply({
      on: (_event: string, listener: typeof gate) => { gate = listener },
      tools: { register: () => undefined },
    } as never)

    await expect(gate?.({ name: 'dsh_test', agent: {}, arguments: { confirm: true } }, async () => ({ kind: 'allow' })))
      .resolves.toMatchObject({ kind: 'ask' })
    await expect(gate?.({ name: 'dsh_test', agent: {}, arguments: { confirm: true } }, async () => ({ kind: 'deny' })))
      .resolves.toMatchObject({ kind: 'deny' })
    await expect(gate?.({ name: 'dsh_test', arguments: { confirm: true } }, async () => ({ kind: 'allow' })))
      .resolves.toMatchObject({ kind: 'allow' })
    await expect(gate?.({ name: 'dsh_test', agent: {}, arguments: { confirm: false } }, async () => ({ kind: 'allow' })))
      .resolves.toMatchObject({ kind: 'allow' })
  })

  it('requires explicit confirmation before constructing a run', async () => {
    const runCli = vi.fn()
    const root = await mkdtemp(join(tmpdir(), 'dsh-tool-consent-'))

    await expect(executeDshTest({ confirm: false }, { cwd: root, runCli }))
      .rejects.toThrow('confirm=true')
    expect(runCli).not.toHaveBeenCalled()
  })

  it('validates model arguments before executing the adapter', async () => {
    const tool = createDshTestTool()

    await expect(tool.execute({ confirm: 'yes' }, {
      signal: new AbortController().signal,
    } as never)).rejects.toThrow('invalid arguments')
  })

  it('forces Docker, disables implicit config and returns a bounded structured result', async () => {
    const root = await mkdtemp(join(tmpdir(), 'dsh-tool-run-'))
    const workspace = await realpath(root)
    await mkdir(join(root, 'plugin'))
    const signal = new AbortController().signal
    const runCli = vi.fn(async (_argv, overrides) => {
      overrides.stdout?.('PASSED\n')
      overrides.stderr?.('diagnostic\n')
      expect(overrides).toMatchObject({ cwd: workspace, useDefaultConfig: false, signal })
      return 0
    })

    const result = await executeDshTest({
      confirm: true,
      source: './plugin',
      dshVersion: '0.1.0-rc.6',
      suite: 'quick',
      lifecycleCase: 'boot',
      expectedRows: ['plugin-row'],
      expectedServices: ['pluginService'],
      expectedTools: ['plugin_tool'],
    }, { cwd: root, runCli, makeRunId: () => 'tool-test' }, signal)

    const argv = runCli.mock.calls[0]?.[0] as string[]
    expect(argv).toEqual([
      join(workspace, 'plugin'),
      '--dsh', '0.1.0-rc.6',
      '--runner', 'docker',
      '--suite', 'quick',
      '--case', 'boot',
      '--expect-row', 'plugin-row',
      '--expect-service', 'pluginService',
      '--expect-tool', 'plugin_tool',
      '--output', join(workspace, '.dsh-testkit', 'runs', 'tool-test'),
    ])
    expect(argv).not.toContain('--unsafe-local')
    expect(argv).not.toContain('--allow-mutable-source')
    expect(result).toMatchObject({
      exitCode: 0,
      verdict: 'passed',
      runDirectory: join(workspace, '.dsh-testkit', 'runs', 'tool-test'),
      reportPath: null,
      summary: 'PASSED',
      diagnostics: 'diagnostic',
    })
  })

  it('rejects local paths and symlinks that escape the active workspace', async () => {
    const root = await mkdtemp(join(tmpdir(), 'dsh-tool-workspace-'))
    const outside = await mkdtemp(join(tmpdir(), 'dsh-tool-outside-'))
    await symlink(outside, join(root, 'escaped'))
    const runCli = vi.fn()

    await expect(executeDshTest({ confirm: true, source: outside }, { cwd: root, runCli }))
      .rejects.toThrow('outside the active workspace')
    await expect(executeDshTest({ confirm: true, source: './escaped' }, { cwd: root, runCli }))
      .rejects.toThrow('outside the active workspace')
    expect(runCli).not.toHaveBeenCalled()
  })

  it('rejects embedded URL credentials before creating an evidence directory', async () => {
    const root = await mkdtemp(join(tmpdir(), 'dsh-tool-credentials-'))
    const runCli = vi.fn()

    await expect(executeDshTest({
      confirm: true,
      source: 'https://token@example.com/plugin.tgz',
    }, { cwd: root, runCli })).rejects.toThrow('must not contain embedded credentials')
    expect(runCli).not.toHaveBeenCalled()
  })

  it('rejects an output parent symlink instead of writing evidence outside the workspace', async () => {
    const root = await mkdtemp(join(tmpdir(), 'dsh-tool-output-'))
    const outside = await mkdtemp(join(tmpdir(), 'dsh-tool-output-outside-'))
    await symlink(outside, join(root, '.dsh-testkit'))
    const runCli = vi.fn()

    await expect(executeDshTest({ confirm: true }, { cwd: root, runCli }))
      .rejects.toThrow('output parent must be a real directory')
    expect(runCli).not.toHaveBeenCalled()
  })
})
