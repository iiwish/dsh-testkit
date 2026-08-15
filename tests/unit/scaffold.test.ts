import {
  access,
  mkdir,
  mkdtemp,
  readFile,
  realpath,
  symlink,
  writeFile,
} from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'

import { describe, expect, it } from 'vitest'
import { parse as parseYaml } from 'yaml'

import { SUPPORTED_DSH_NPM_VERSIONS } from '../../src/adapters/dsh/support.js'
import { renderDshTestkitSkillFile } from '../../src/agent-skill.js'
import { parseScenario } from '../../src/config/scenario.js'
import { initializeDshTestkitProject } from '../../src/scaffold/init.js'

const expectedPaths = [
  'dsh-testkit.yaml',
  '.github/workflows/dsh-lifecycle.yml',
  '.agents/skills/dsh-testkit/SKILL.md',
]

async function exists(path: string): Promise<boolean> {
  try {
    await access(path)
    return true
  } catch {
    return false
  }
}

async function createBundleFixture(): Promise<string> {
  const root = await mkdtemp(join(tmpdir(), 'dsh-testkit-init-'))
  await writeFile(join(root, 'package.json'), `${JSON.stringify({
    name: '@fixture/example-plugin',
    version: '1.0.0',
    dsh: { bundle: { patch: './cordis.patch.yml' } },
  }, null, 2)}\n`)
  await writeFile(join(root, 'cordis.patch.yml'), [
    '- insert:',
    '    - id: tool-example',
    '      name: ./dist/index.js',
    '    - id: service-example',
    '      name: ./dist/service.js',
    '',
  ].join('\n'))
  return root
}

describe('one-command project scaffold', () => {
  it('generates a deterministic scenario, least-privilege workflow and project Skill', async () => {
    const root = await createBundleFixture()
    const result = await initializeDshTestkitProject({ directory: root })

    expect(result.root).toBe(await realpath(root))
    expect(result.files).toEqual(expectedPaths.map(path => ({ path, status: 'created' })))
    expect(result.nextCommand).toBe('pnpm dsh-test')

    const scenario = parseScenario(parseYaml(await readFile(join(root, 'dsh-testkit.yaml'), 'utf8')))
    expect(scenario).toMatchObject({
      schemaVersion: 1,
      name: 'fixture-example-plugin-quick',
      subject: { source: '.' },
      dsh: { version: SUPPORTED_DSH_NPM_VERSIONS.at(-1) },
      expect: {
        boot: 'success',
        rows: ['service-example', 'tool-example'],
        services: [],
        tools: [],
      },
    })

    const workflow = await readFile(join(root, '.github/workflows/dsh-lifecycle.yml'), 'utf8')
    expect(workflow).toContain('name: DSH lifecycle')
    expect(workflow).toContain('permissions:\n  contents: read')
    expect(workflow).toContain('iiwish/dsh-testkit/.github/actions/dsh-test@v0')
    expect(workflow).toContain('check-name: DSH lifecycle')
    expect(workflow).toContain('config: dsh-testkit.yaml')
    expect(workflow).not.toMatch(/write-all|contents: write/)

    await expect(readFile(
      join(root, '.agents/skills/dsh-testkit/SKILL.md'),
      'utf8',
    )).resolves.toBe(renderDshTestkitSkillFile())
  })

  it('is byte-idempotent and reports existing generated files as unchanged', async () => {
    const root = await createBundleFixture()
    await initializeDshTestkitProject({ directory: root })
    const before = await Promise.all(expectedPaths.map(path => readFile(join(root, path), 'utf8')))

    const result = await initializeDshTestkitProject({ directory: root })
    const after = await Promise.all(expectedPaths.map(path => readFile(join(root, path), 'utf8')))

    expect(result.files).toEqual(expectedPaths.map(path => ({ path, status: 'unchanged' })))
    expect(after).toEqual(before)
  })

  it('preflights every target and leaves zero partial writes when one file conflicts', async () => {
    const root = await createBundleFixture()
    await mkdir(join(root, '.github/workflows'), { recursive: true })
    const conflict = join(root, '.github/workflows/dsh-lifecycle.yml')
    await writeFile(conflict, 'maintainer-owned\n')

    await expect(initializeDshTestkitProject({ directory: root }))
      .rejects.toThrow(/conflict.*--force/i)
    await expect(readFile(conflict, 'utf8')).resolves.toBe('maintainer-owned\n')
    expect(await exists(join(root, 'dsh-testkit.yaml'))).toBe(false)
    expect(await exists(join(root, '.agents/skills/dsh-testkit/SKILL.md'))).toBe(false)
  })

  it('replaces only explicit targets when force is set and reports the replacement', async () => {
    const root = await createBundleFixture()
    await writeFile(join(root, 'dsh-testkit.yaml'), 'maintainer-owned\n')

    const result = await initializeDshTestkitProject({ directory: root, force: true })

    expect(result.files).toContainEqual({ path: 'dsh-testkit.yaml', status: 'replaced' })
    expect(parseYaml(await readFile(join(root, 'dsh-testkit.yaml'), 'utf8')))
      .toMatchObject({ schemaVersion: 1, subject: { source: '.' } })
  })

  it('rejects symlink path components before writing any scaffold target', async () => {
    const root = await createBundleFixture()
    const outside = await mkdtemp(join(tmpdir(), 'dsh-testkit-init-outside-'))
    await symlink(outside, join(root, '.github'))

    await expect(initializeDshTestkitProject({ directory: root }))
      .rejects.toThrow(/symbolic link/i)
    expect(await exists(join(root, 'dsh-testkit.yaml'))).toBe(false)
    expect(await exists(join(root, '.agents/skills/dsh-testkit/SKILL.md'))).toBe(false)
    expect(await exists(join(outside, 'workflows/dsh-lifecycle.yml'))).toBe(false)
  })

  it('rejects non-bundles and patches without deterministic row ids', async () => {
    const plain = await mkdtemp(join(tmpdir(), 'dsh-testkit-init-plain-'))
    await writeFile(join(plain, 'package.json'), '{"name":"plain","version":"1.0.0"}\n')
    await expect(initializeDshTestkitProject({ directory: plain }))
      .rejects.toThrow(/dsh\.bundle\.patch/i)

    const noRows = await createBundleFixture()
    await writeFile(join(noRows, 'cordis.patch.yml'), '- merge:\n    name: ./dist/index.js\n')
    await expect(initializeDshTestkitProject({ directory: noRows }))
      .rejects.toThrow(/row id/i)
  })
})
