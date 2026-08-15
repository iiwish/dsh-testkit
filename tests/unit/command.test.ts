import { mkdtemp } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'

import { describe, expect, it } from 'vitest'

import { runCommand } from '../../src/process/command.js'

describe('command runner', () => {
  it('captures output, persists logs and redacts canary values', async () => {
    const root = await mkdtemp(join(tmpdir(), 'dsh-command-'))
    const result = await runCommand({
      executable: process.execPath,
      args: ['-e', 'console.log("hello top-secret"); console.error("token=top-secret")'],
      cwd: root,
      timeoutMs: 5_000,
      logDir: root,
      logName: 'redaction',
      redactions: ['top-secret'],
    })

    expect(result).toMatchObject({ exitCode: 0, timedOut: false })
    expect(result.stdout).toContain('hello [REDACTED]')
    expect(result.stderr).toContain('token=[REDACTED]')
    expect(result.redactionMatches).toEqual([0])
    expect(result.command.join(' ')).not.toContain('top-secret')
    expect(result.artifacts).toEqual([
      'redaction.stdout.log',
      'redaction.stderr.log',
    ])
  })

  it('rejects cleanly when the executable is unavailable', async () => {
    const root = await mkdtemp(join(tmpdir(), 'dsh-command-missing-'))
    await expect(runCommand({
      executable: 'dsh-testkit-command-does-not-exist',
      cwd: root,
      timeoutMs: 100,
      logDir: root,
      logName: 'missing',
    })).rejects.toMatchObject({ code: 'ENOENT' })
  })

  it('terminates a timed-out process and classifies the result', async () => {
    const root = await mkdtemp(join(tmpdir(), 'dsh-command-timeout-'))
    const result = await runCommand({
      executable: process.execPath,
      args: ['-e', 'setInterval(() => {}, 1000)'],
      cwd: root,
      timeoutMs: 100,
      logDir: root,
      logName: 'timeout',
    })

    expect(result.timedOut).toBe(true)
    expect(result.exitCode).not.toBe(0)
  })

  it('bounds captured output and records truncation explicitly', async () => {
    const root = await mkdtemp(join(tmpdir(), 'dsh-command-bounded-'))
    const result = await runCommand({
      executable: process.execPath,
      args: ['-e', 'process.stdout.write("x".repeat(8 * 1024 * 1024 + 1024))'],
      cwd: root,
      timeoutMs: 5_000,
      logDir: root,
      logName: 'bounded',
    })

    expect(result.stdoutTruncated).toBe(true)
    expect(result.stdout).toContain('[DSH Testkit truncated command output')
    expect(Buffer.byteLength(result.stdout)).toBeLessThan(8 * 1024 * 1024 + 256)
  })
})
