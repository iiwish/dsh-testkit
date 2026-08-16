import { randomUUID } from 'node:crypto'
import {
  access,
  lstat,
  mkdir,
  readFile,
  realpath,
  rename,
  rm,
  writeFile,
} from 'node:fs/promises'
import { dirname, isAbsolute, relative, resolve } from 'node:path'

import { parse as parseYaml, stringify as stringifyYaml } from 'yaml'

import {
  assertSupportedDshVersion,
  SUPPORTED_DSH_NPM_VERSIONS,
} from '../adapters/dsh/support.js'
import { renderDshTestkitSkillFile } from '../agent-skill.js'
import { TESTKIT_VERSION } from '../version.js'

type ScaffoldStatus = 'created' | 'unchanged' | 'replaced'

export interface ScaffoldFileResult {
  readonly path: string
  readonly status: ScaffoldStatus
}

export interface InitializeDshTestkitInput {
  readonly directory: string
  readonly repositoryRoot?: string
  readonly dshVersion?: string
  readonly force?: boolean
}

export interface InitializeDshTestkitResult {
  readonly root: string
  readonly repositoryRoot: string
  readonly files: readonly ScaffoldFileResult[]
  readonly nextCommand: string
}

interface ScaffoldTarget {
  readonly path: string
  readonly content: string
}

interface PackageManifest {
  readonly name?: unknown
  readonly dsh?: {
    readonly bundle?: {
      readonly patch?: unknown
    }
  }
}

const REPOSITORY_TARGET_PATHS = [
  '.github/workflows/dsh-lifecycle.yml',
  '.agents/skills/dsh-testkit/SKILL.md',
] as const

async function exists(path: string): Promise<boolean> {
  try {
    await access(path)
    return true
  } catch {
    return false
  }
}

function containedPath(root: string, path: string, label: string, rootLabel = 'root'): string {
  const candidate = resolve(root, path)
  const fromRoot = relative(root, candidate)
  if (fromRoot === '' || /^\.\.(?:[\\/]|$)/.test(fromRoot) || isAbsolute(fromRoot)) {
    throw new Error(`${label} must resolve to a file inside the ${rootLabel}: ${path}`)
  }
  return candidate
}

function portablePath(path: string): string {
  return path.replaceAll('\\', '/')
}

function shellQuote(value: string): string {
  return /^[A-Za-z0-9_./:@+-]+$/.test(value) ? value : `'${value.replaceAll("'", "'\\''")}'`
}

function workflowScalar(value: string): string {
  return /^[A-Za-z0-9_./@+-]+$/.test(value) ? value : JSON.stringify(value)
}

async function findNearestRepositoryRoot(pluginRoot: string): Promise<string> {
  let candidate = pluginRoot
  while (true) {
    const marker = resolve(candidate, '.git')
    try {
      const metadata = await lstat(marker)
      if (metadata.isSymbolicLink()) {
        throw new Error(`repository marker must not be a symbolic link: ${marker}`)
      }
      if (metadata.isDirectory() || metadata.isFile()) return candidate
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code !== 'ENOENT') throw error
    }
    const parent = dirname(candidate)
    if (parent === candidate) return pluginRoot
    candidate = parent
  }
}

async function resolveRepositoryRoot(pluginRoot: string, requestedRoot?: string): Promise<string> {
  const unresolvedRoot = requestedRoot === undefined
    ? await findNearestRepositoryRoot(pluginRoot)
    : resolve(requestedRoot)
  const metadata = await lstat(unresolvedRoot)
  if (metadata.isSymbolicLink() || !metadata.isDirectory()) {
    throw new Error(`repository root must be a real directory: ${unresolvedRoot}`)
  }
  const repositoryRoot = await realpath(unresolvedRoot)
  const pluginRelative = relative(repositoryRoot, pluginRoot)
  if (/^\.\.(?:[\\/]|$)/.test(pluginRelative) || isAbsolute(pluginRelative)) {
    throw new Error(`repository root must contain the plugin root: ${repositoryRoot}`)
  }
  return repositoryRoot
}

async function rejectSymbolicLinkComponents(root: string, path: string): Promise<void> {
  const segments = relative(root, path).split(/[\\/]/).filter(Boolean)
  let candidate = root
  for (const [index, segment] of segments.entries()) {
    candidate = resolve(candidate, segment)
    let metadata
    try {
      metadata = await lstat(candidate)
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code === 'ENOENT') return
      throw error
    }
    if (metadata.isSymbolicLink()) {
      throw new Error(`scaffold path contains a symbolic link: ${candidate}`)
    }
    if (index < segments.length - 1 && !metadata.isDirectory()) {
      throw new Error(`scaffold parent is not a directory: ${candidate}`)
    }
  }
}

function collectInsertedRowIds(value: unknown): string[] {
  const ids = new Set<string>()
  const visit = (node: unknown): void => {
    if (Array.isArray(node)) {
      for (const item of node) visit(item)
      return
    }
    if (typeof node !== 'object' || node === null) return
    const record = node as Record<string, unknown>
    if (Array.isArray(record.insert)) {
      for (const entry of record.insert) {
        if (typeof entry !== 'object' || entry === null) continue
        const id = (entry as Record<string, unknown>).id
        if (typeof id === 'string' && id.trim() !== '') ids.add(id.trim())
      }
    }
    for (const child of Object.values(record)) visit(child)
  }
  visit(value)
  return [...ids].sort()
}

function scenarioName(packageName: unknown): string {
  const source = typeof packageName === 'string' ? packageName : 'dsh-plugin'
  const normalized = source
    .replace(/^@/, '')
    .replace(/[^A-Za-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .toLowerCase()
  return `${normalized || 'dsh-plugin'}-quick`
}

function renderScenario(packageName: unknown, dshVersion: string, rows: string[]): string {
  return stringifyYaml({
    schemaVersion: 1,
    name: scenarioName(packageName),
    subject: { source: '.' },
    dsh: { version: dshVersion },
    expect: {
      boot: 'success',
      rows,
      services: [],
      tools: [],
    },
  }, { lineWidth: 0 })
}

function renderWorkflow(dshVersion: string, pluginPath: string, configPath: string): string {
  return `# Generated by DSH Testkit ${TESTKIT_VERSION}. Review before committing.
name: DSH lifecycle

on:
  pull_request:
  workflow_dispatch:

permissions:
  contents: read

jobs:
  lifecycle:
    name: DSH lifecycle
    runs-on: ubuntu-latest
    timeout-minutes: 20
    steps:
      - uses: actions/checkout@3d3c42e5aac5ba805825da76410c181273ba90b1 # v7.0.1
      - uses: actions/setup-node@820762786026740c76f36085b0efc47a31fe5020 # v7.0.0
        with:
          node-version: '22'
      - uses: iiwish/dsh-testkit/.github/actions/dsh-test@v0
        with:
          plugin: ${workflowScalar(pluginPath)}
          dsh-version: '${dshVersion}'
          config: ${workflowScalar(configPath)}
          check-name: DSH lifecycle
`
}

async function readBundle(root: string): Promise<{
  packageName: unknown
  rows: string[]
}> {
  const manifestPath = resolve(root, 'package.json')
  await rejectSymbolicLinkComponents(root, manifestPath)
  let manifest: PackageManifest
  try {
    manifest = JSON.parse(await readFile(manifestPath, 'utf8')) as PackageManifest
  } catch (error) {
    throw new Error(`unable to read package.json: ${error instanceof Error ? error.message : String(error)}`)
  }
  const patchReference = manifest.dsh?.bundle?.patch
  if (typeof patchReference !== 'string' || patchReference.trim() === '') {
    throw new Error('package.json must declare dsh.bundle.patch')
  }
  const patchPath = containedPath(root, patchReference, 'dsh.bundle.patch', 'plugin root')
  await rejectSymbolicLinkComponents(root, patchPath)
  let patchMetadata
  try {
    patchMetadata = await lstat(patchPath)
  } catch {
    throw new Error(`dsh.bundle.patch file does not exist: ${patchReference}`)
  }
  if (!patchMetadata.isFile()) throw new Error(`dsh.bundle.patch must be a regular file: ${patchReference}`)
  const patchRoot = await realpath(patchPath)
  const patchRelative = relative(root, patchRoot)
  if (/^\.\.(?:[\\/]|$)/.test(patchRelative) || isAbsolute(patchRelative)) {
    throw new Error(`dsh.bundle.patch resolves outside the plugin root: ${patchReference}`)
  }
  let patch: unknown
  try {
    patch = parseYaml(await readFile(patchPath, 'utf8'))
  } catch (error) {
    throw new Error(`unable to parse dsh.bundle.patch: ${error instanceof Error ? error.message : String(error)}`)
  }
  const rows = collectInsertedRowIds(patch)
  if (rows.length === 0) {
    throw new Error('dsh.bundle.patch contains no deterministic inserted row id')
  }
  return { packageName: manifest.name, rows }
}

async function preflightTarget(root: string, target: ScaffoldTarget, force: boolean): Promise<ScaffoldFileResult> {
  const path = containedPath(root, target.path, 'scaffold target')
  await rejectSymbolicLinkComponents(root, path)
  if (!await exists(path)) return { path: target.path, status: 'created' }
  const metadata = await lstat(path)
  if (!metadata.isFile()) throw new Error(`scaffold target is not a regular file: ${target.path}`)
  const current = await readFile(path, 'utf8')
  if (current === target.content) return { path: target.path, status: 'unchanged' }
  if (!force) throw new Error(`scaffold conflict at ${target.path}; rerun with --force to replace it`)
  return { path: target.path, status: 'replaced' }
}

async function writeTarget(root: string, target: ScaffoldTarget, status: ScaffoldStatus): Promise<void> {
  if (status === 'unchanged') return
  const path = containedPath(root, target.path, 'scaffold target')
  await rejectSymbolicLinkComponents(root, path)
  await mkdir(dirname(path), { recursive: true })
  await rejectSymbolicLinkComponents(root, path)
  if (status === 'created') {
    await writeFile(path, target.content, { flag: 'wx' })
    return
  }
  const temporary = `${path}.${process.pid}.${randomUUID()}.tmp`
  await writeFile(temporary, target.content, { flag: 'wx' })
  try {
    await rename(temporary, path)
  } finally {
    await rm(temporary, { force: true })
  }
}

export async function initializeDshTestkitProject(
  input: InitializeDshTestkitInput,
): Promise<InitializeDshTestkitResult> {
  const requestedRoot = resolve(input.directory)
  const metadata = await lstat(requestedRoot)
  if (metadata.isSymbolicLink() || !metadata.isDirectory()) {
    throw new Error(`plugin root must be a real directory: ${requestedRoot}`)
  }
  const root = await realpath(requestedRoot)
  const repositoryRoot = await resolveRepositoryRoot(root, input.repositoryRoot)
  const pluginRelative = portablePath(relative(repositoryRoot, root))
  const pluginPath = pluginRelative === '' ? '.' : `./${pluginRelative}`
  const scenarioPath = pluginRelative === '' ? 'dsh-testkit.yaml' : `${pluginRelative}/dsh-testkit.yaml`
  const dshVersion = input.dshVersion ?? SUPPORTED_DSH_NPM_VERSIONS.at(-1)
  if (dshVersion === undefined) throw new Error('DSH Testkit has no supported DSH version')
  assertSupportedDshVersion(dshVersion)
  const bundle = await readBundle(root)
  const targets: ScaffoldTarget[] = [
    {
      path: scenarioPath,
      content: renderScenario(bundle.packageName, dshVersion, bundle.rows),
    },
    {
      path: REPOSITORY_TARGET_PATHS[0],
      content: renderWorkflow(dshVersion, pluginPath, scenarioPath),
    },
    {
      path: REPOSITORY_TARGET_PATHS[1],
      content: renderDshTestkitSkillFile(),
    },
  ]

  const files: ScaffoldFileResult[] = []
  for (const target of targets) {
    files.push(await preflightTarget(repositoryRoot, target, input.force === true))
  }
  for (const [index, target] of targets.entries()) {
    await writeTarget(repositoryRoot, target, files[index]!.status)
  }
  const nextCommand = pluginRelative === ''
    ? 'pnpm dsh-test'
    : `pnpm dsh-test --config ${shellQuote(scenarioPath)}`
  return { root, repositoryRoot, files, nextCommand }
}
