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

import { DEFAULT_DSH_NPM_VERSION } from '../../src/adapters/dsh/support.js'
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
  await writeBundleFixture(root)
  return root
}

async function writeBundleFixture(root: string): Promise<void> {
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
}

describe('one-command project scaffold', () => {
  it('generates a deterministic scenario, least-privilege workflow and project Skill', async () => {
    const root = await createBundleFixture()
    const result = await initializeDshTestkitProject({ directory: root })

    expect(result.root).toBe(await realpath(root))
    expect(result.repositoryRoot).toBe(await realpath(root))
    expect(result.files).toEqual(expectedPaths.map(path => ({ path, status: 'created' })))
    expect(result.nextCommand).toBe('pnpm dsh-test')

    const scenario = parseScenario(parseYaml(await readFile(join(root, 'dsh-testkit.yaml'), 'utf8')))
    expect(scenario).toMatchObject({
      schemaVersion: 1,
      name: 'fixture-example-plugin-quick',
      subject: { source: '.' },
      dsh: { version: DEFAULT_DSH_NPM_VERSION },
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

  it('keeps the scenario with a nested plugin and repository integrations at the nearest Git root', async () => {
    const repositoryRoot = await mkdtemp(join(tmpdir(), 'dsh-testkit-init-repo-'))
    await mkdir(join(repositoryRoot, '.git'))
    const pluginRoot = join(repositoryRoot, 'plugin')
    await mkdir(pluginRoot)
    await writeBundleFixture(pluginRoot)

    const result = await initializeDshTestkitProject({ directory: pluginRoot })

    expect(result.root).toBe(await realpath(pluginRoot))
    expect(result.repositoryRoot).toBe(await realpath(repositoryRoot))
    expect(result.files).toEqual([
      { path: 'plugin/dsh-testkit.yaml', status: 'created' },
      { path: '.github/workflows/dsh-lifecycle.yml', status: 'created' },
      { path: '.agents/skills/dsh-testkit/SKILL.md', status: 'created' },
    ])
    expect(result.nextCommand).toBe('pnpm dsh-test --config plugin/dsh-testkit.yaml')

    const scenario = parseScenario(parseYaml(await readFile(join(pluginRoot, 'dsh-testkit.yaml'), 'utf8')))
    expect(scenario.subject.source).toBe('.')
    const workflow = await readFile(join(repositoryRoot, '.github/workflows/dsh-lifecycle.yml'), 'utf8')
    expect(workflow).toContain('plugin: ./plugin')
    expect(workflow).toContain('config: plugin/dsh-testkit.yaml')
    await expect(readFile(join(repositoryRoot, '.agents/skills/dsh-testkit/SKILL.md'), 'utf8'))
      .resolves.toBe(renderDshTestkitSkillFile())
    expect(await exists(join(pluginRoot, '.github'))).toBe(false)
    expect(await exists(join(pluginRoot, '.agents'))).toBe(false)
  })

  it('supports an explicit repository root when Git metadata is unavailable', async () => {
    const repositoryRoot = await mkdtemp(join(tmpdir(), 'dsh-testkit-init-export-'))
    const pluginRoot = join(repositoryRoot, 'packages/plugin')
    await mkdir(pluginRoot, { recursive: true })
    await writeBundleFixture(pluginRoot)

    const result = await initializeDshTestkitProject({
      directory: pluginRoot,
      repositoryRoot,
    })

    expect(result.repositoryRoot).toBe(await realpath(repositoryRoot))
    expect(result.files[0]).toEqual({ path: 'packages/plugin/dsh-testkit.yaml', status: 'created' })
    await expect(readFile(join(repositoryRoot, '.github/workflows/dsh-lifecycle.yml'), 'utf8'))
      .resolves.toContain('plugin: ./packages/plugin')
  })

  it('rejects a symbolic-link Git marker instead of widening the repository boundary', async () => {
    const repositoryRoot = await mkdtemp(join(tmpdir(), 'dsh-testkit-init-marker-'))
    const markerTarget = await mkdtemp(join(tmpdir(), 'dsh-testkit-init-marker-target-'))
    await symlink(markerTarget, join(repositoryRoot, '.git'))
    const pluginRoot = join(repositoryRoot, 'plugin')
    await mkdir(pluginRoot)
    await writeBundleFixture(pluginRoot)

    await expect(initializeDshTestkitProject({ directory: pluginRoot }))
      .rejects.toThrow(/repository marker.*symbolic link/i)
    expect(await exists(join(pluginRoot, 'dsh-testkit.yaml'))).toBe(false)
    expect(await exists(join(repositoryRoot, '.github/workflows/dsh-lifecycle.yml'))).toBe(false)
  })

  it('rejects an unrelated explicit repository root before writing', async () => {
    const pluginRoot = await createBundleFixture()
    const unrelatedRoot = await mkdtemp(join(tmpdir(), 'dsh-testkit-init-unrelated-'))

    await expect(initializeDshTestkitProject({
      directory: pluginRoot,
      repositoryRoot: unrelatedRoot,
    })).rejects.toThrow(/repository root must contain the plugin root/i)

    expect(await exists(join(pluginRoot, 'dsh-testkit.yaml'))).toBe(false)
    expect(await exists(join(unrelatedRoot, '.github/workflows/dsh-lifecycle.yml'))).toBe(false)
    expect(await exists(join(unrelatedRoot, '.agents/skills/dsh-testkit/SKILL.md'))).toBe(false)
  })

  it('preflights repository and plugin targets before any write', async () => {
    const repositoryRoot = await mkdtemp(join(tmpdir(), 'dsh-testkit-init-atomic-'))
    await mkdir(join(repositoryRoot, '.git'))
    const pluginRoot = join(repositoryRoot, 'plugin')
    await mkdir(pluginRoot)
    await writeBundleFixture(pluginRoot)
    await mkdir(join(repositoryRoot, '.github/workflows'), { recursive: true })
    const conflict = join(repositoryRoot, '.github/workflows/dsh-lifecycle.yml')
    await writeFile(conflict, 'maintainer-owned\n')

    await expect(initializeDshTestkitProject({ directory: pluginRoot }))
      .rejects.toThrow(/conflict.*--force/i)

    await expect(readFile(conflict, 'utf8')).resolves.toBe('maintainer-owned\n')
    expect(await exists(join(pluginRoot, 'dsh-testkit.yaml'))).toBe(false)
    expect(await exists(join(repositoryRoot, '.agents/skills/dsh-testkit/SKILL.md'))).toBe(false)
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
