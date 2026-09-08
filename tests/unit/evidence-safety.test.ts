import { execFile } from 'node:child_process'
import { link, mkdir, mkdtemp, readFile, readdir, realpath, rm, stat, symlink, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join, resolve } from 'node:path'
import { promisify } from 'node:util'

import { afterEach, beforeEach, describe, expect, it } from 'vitest'

const execute = promisify(execFile)
const script = resolve(import.meta.dirname, '../../scripts/prepare-evidence.mjs')
let root: string
let input: string
let staging: string

beforeEach(async () => {
  root = await mkdtemp(join(tmpdir(), 'dsh-evidence-policy-'))
  input = join(root, 'input')
  staging = join(root, 'staging')
  await mkdir(input)
  await mkdir(staging)
})
afterEach(async () => { await rm(root, { recursive: true, force: true }) })

async function prepare(...args: string[]) {
  try {
    const result = await execute(process.execPath, [script, input, ...args], {
      env: { ...process.env, RUNNER_TEMP: staging, GITHUB_OUTPUT: join(root, 'github-output') },
      timeout: 10_000,
    })
    return { code: 0, ...result }
  } catch (error) {
    const result = error as { code: number; stdout: string; stderr: string }
    return { code: result.code, stdout: result.stdout, stderr: result.stderr }
  }
}

describe('evidence publication boundary', () => {
  it.each(['passed', 'failed', 'timeout'])('stages safe %s diagnostics without mutating originals', async (verdict) => {
    const report = JSON.stringify({ verdict, url: 'http://127.0.0.1:3080/?token=[REDACTED]' })
    await writeFile(join(input, 'report.json'), report)
    const result = await prepare()
    expect(result.code, result.stderr).toBe(0)
    const output = JSON.parse(result.stdout).path as string
    expect(output.startsWith(`${await realpath(staging)}/`)).toBe(true)
    expect(await readFile(join(output, 'report.json'), 'utf8')).toBe(report)
    expect(await readFile(join(input, 'report.json'), 'utf8')).toBe(report)
    expect((await stat(join(output, 'report.json'))).mode & 0o777).toBe(0o600)
    expect(JSON.parse(await readFile(join(output, 'evidence-manifest.json'), 'utf8'))).toMatchObject({
      schemaVersion: 1, sourceAvailable: true,
      files: [{ path: 'report.json', bytes: Buffer.byteLength(report), sha256: expect.stringMatching(/^[a-f0-9]{64}$/) }],
    })
    expect(await readFile(join(root, 'github-output'), 'utf8')).toContain(`path=${output}\n`)
  })

  it.each([
    ['launch-query', 'http://127.0.0.1:3080/?token=private-launch'],
    ['encoded-query', 'http://127.0.0.1:3080/?%74oken=private-launch'],
    ['json-escape', '{"url":"http://127.0.0.1:3080/?to\\u006ben=private-launch"}'],
    ['authorization', 'Authorization: Bearer private-launch'],
    ['json-authorization', '{"Authorization":"Bearer private-launch"}'],
    ['json-cookies', '{"cookies":[{"name":"session","value":"private-launch"}]}'],
    ['refresh-token', '{"refresh_token":"private-launch"}'],
    ['environment-token', 'TOKEN=private-launch'],
    ['cookie', 'Set-Cookie: session=private-launch; HttpOnly'],
    ['private-key', '-----BEGIN PRIVATE KEY-----\nprivate-launch'],
    ['api-key', '{"api_key":"private-launch"}'],
  ])('rejects %s without exposing the value or leaving a staging directory', async (_kind, content) => {
    await writeFile(join(input, 'report.json'), content)
    const result = await prepare()
    expect(result.code).toBe(1)
    expect(result.stderr).toContain('EVIDENCE_CREDENTIAL')
    expect(`${result.stdout}${result.stderr}`).not.toContain('private-launch')
    expect(await readdir(staging)).toEqual([])
    await expect(readFile(join(root, 'github-output'), 'utf8')).rejects.toMatchObject({ code: 'ENOENT' })
  })

  it.each(['.credentials.yaml', 'browser-auth-boot.json', 'worker-request.json', 'plugin-source.js', 'archive.zip'])('rejects non-allowlisted file %s', async (filename) => {
    await writeFile(join(input, filename), 'private-content')
    const result = await prepare()
    expect(result.code).toBe(1)
    expect(result.stderr).toContain('EVIDENCE_PATH')
    expect(result.stderr).not.toContain('private-content')
  })

  it.each(['symlink', 'hardlink', 'directory-link'])('rejects %s rather than following it outside the input', async (kind) => {
    const outside = join(root, 'outside')
    await mkdir(outside)
    await writeFile(join(outside, 'report.json'), '{}')
    if (kind === 'directory-link') await symlink(outside, join(input, 'runs'))
    else if (kind === 'symlink') await symlink(join(outside, 'report.json'), join(input, 'report.json'))
    else await link(join(outside, 'report.json'), join(input, 'report.json'))
    const result = await prepare()
    expect(result.code).toBe(1)
    expect(result.stderr).toContain('EVIDENCE_LINK')
    expect(await readdir(staging)).toEqual([])
  })

  it('rejects host-directory content even with an allowlisted basename', async () => {
    await mkdir(join(input, 'home'))
    await writeFile(join(input, 'home', 'report.json'), '{}')
    expect((await prepare()).stderr).toContain('EVIDENCE_PATH')
  })

  it('rejects a binary disguised as a text report', async () => {
    await writeFile(join(input, 'report.json'), Buffer.from([0, 255, 1]))
    expect((await prepare()).stderr).toContain('EVIDENCE_FORMAT')
  })

  it('rejects a PNG signature without a complete bounded image structure', async () => {
    await writeFile(join(input, 'browser-boot-turn-status.png'), Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]))
    expect((await prepare()).stderr).toContain('EVIDENCE_FORMAT')
  })

  it('rejects excessive nesting without publishing partial output', async () => {
    await mkdir(join(input, ...Array.from({ length: 26 }, () => 'runs')), { recursive: true })
    expect((await prepare()).stderr).toContain('EVIDENCE_LIMIT')
    expect(await readdir(staging)).toEqual([])
  })

  it('rejects an oversized file before reading its contents', async () => {
    await writeFile(join(input, 'report.json'), Buffer.alloc(16 * 1024 * 1024 + 1, 32))
    expect((await prepare()).stderr).toContain('EVIDENCE_LIMIT')
  })

  it('retains an explicit unavailable manifest when an early failure produced no output', async () => {
    await rm(input, { recursive: true })
    const result = await prepare('--allow-missing')
    expect(result.code, result.stderr).toBe(0)
    const output = JSON.parse(result.stdout).path as string
    expect(JSON.parse(await readFile(join(output, 'evidence-manifest.json'), 'utf8'))).toMatchObject({
      sourceAvailable: false, files: [],
    })
  })
})
