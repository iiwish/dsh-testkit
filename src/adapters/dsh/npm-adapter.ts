import { createHash, randomUUID } from 'node:crypto'
import {
  access,
  cp,
  mkdir,
  readFile,
  readdir,
  rm,
  writeFile,
} from 'node:fs/promises'
import { tmpdir } from 'node:os'
import {
  basename,
  isAbsolute,
  join,
  relative,
  resolve,
} from 'node:path'
import { pathToFileURL } from 'node:url'

import { parse as parseYaml } from 'yaml'
import { z } from 'zod'

import { StageFailure } from '../../domain/lifecycle.js'
import { AssertionSchema } from '../../domain/report.js'
import type { Assertion, FailureKind, SubjectIdentity } from '../../domain/report.js'
import { renderScenarioSnapshot } from '../../domain/scenario.js'
import {
  captureSystemSnapshot,
  diffSnapshots,
  normalizeProcessCommands,
  snapshotFiles,
  writeSnapshot,
} from '../../observers/snapshot.js'
import type { FileChange } from '../../observers/snapshot.js'
import { runCommand } from '../../process/command.js'
import type { CommandResult } from '../../process/command.js'
import type {
  AdapterBootObservation,
  AdapterCompletion,
  LifecycleAdapter,
  ObserverCoverage,
  ProbeArtifact,
} from '../../worker/adapter.js'
import type { WorkerRequest } from '../../worker/protocol.js'

interface PackedSubject {
  source: string
  tarball: string
  packageName: string
  packageVersion: string
  digest: string
  kind: SubjectIdentity['kind']
  gitCommit: string | null
  mutable: boolean
}

export interface ResolvedSource {
  input: string
  kind: SubjectIdentity['kind']
  mutable: boolean
  gitCommit: string | null
}

interface FilesystemCheckpoints {
  dshHome: Awaited<ReturnType<typeof snapshotFiles>>
  workspace: Awaited<ReturnType<typeof snapshotFiles>>
}

const PackOutputSchema = z.array(z.object({
  filename: z.string().min(1),
  name: z.string().min(1),
  version: z.string().min(1),
}).passthrough()).min(1)

const ProbeDocumentSchema = z.object({
  schemaVersion: z.literal(1),
  assertions: z.array(AssertionSchema),
  exercises: z.array(AssertionSchema),
}).passthrough()

const EXACT_VERSION = /@\d+\.\d+\.\d+(?:-[0-9A-Za-z.-]+)?(?:\+[0-9A-Za-z.-]+)?$/
const GIT_SOURCE = /^(?:git\+|git@|github:|https?:\/\/.*\.git(?:#|$))/
const GIT_COMMIT = /#([0-9a-f]{40})$/i

function hasEmbeddedUrlCredentials(input: string): boolean {
  const normalized = input.startsWith('git+') ? input.slice(4) : input
  if (!/^https?:\/\//i.test(normalized)) return false
  try {
    const url = new URL(normalized)
    return url.username !== '' || url.password !== ''
  } catch {
    return false
  }
}

export function classifyRemoteSource(input: string): ResolvedSource {
  if (hasEmbeddedUrlCredentials(input)) {
    throw new StageFailure('Source URLs must not contain embedded credentials; use a scoped credential helper', {
      failureKind: 'subject',
    })
  }
  if (GIT_SOURCE.test(input)) {
    const commit = input.match(GIT_COMMIT)?.[1] ?? null
    return { input, kind: 'git', mutable: commit === null, gitCommit: commit }
  }
  if (/^https?:\/\//.test(input)) {
    return { input, kind: 'tarball', mutable: true, gitCommit: null }
  }
  return { input, kind: 'npm', mutable: !EXACT_VERSION.test(input), gitCommit: null }
}

function safeProcessEnvironment(): NodeJS.ProcessEnv {
  const allowed = [
    'PATH', 'SHELL', 'LANG', 'LC_ALL', 'TERM', 'CI',
    'HTTP_PROXY', 'HTTPS_PROXY', 'NO_PROXY',
    'http_proxy', 'https_proxy', 'no_proxy',
    'NPM_CONFIG_REGISTRY', 'NPM_CONFIG_USERCONFIG',
    'NODE_EXTRA_CA_CERTS', 'SSH_AUTH_SOCK', 'GIT_ASKPASS',
  ]
  return Object.fromEntries(allowed.flatMap(name => (
    process.env[name] === undefined ? [] : [[name, process.env[name]]]
  )))
}

function environmentRedactions(): string[] {
  const values = new Set<string>()
  for (const name of [
    'HTTP_PROXY', 'HTTPS_PROXY', 'http_proxy', 'https_proxy', 'NPM_CONFIG_REGISTRY',
  ]) {
    const value = process.env[name]
    if (value === undefined) continue
    try {
      const url = new URL(value)
      if (url.username !== '' || url.password !== '') {
        values.add(value)
        if (url.password !== '') values.add(decodeURIComponent(url.password))
      }
    } catch {
      // Non-URL proxy and registry values do not expose structured credentials.
    }
  }
  return [...values].filter(Boolean)
}

function sha256(value: Buffer | string): string {
  return `sha256:${createHash('sha256').update(value).digest('hex')}`
}

function containedPath(root: string, input: string): string {
  const candidate = resolve(root, input)
  const pathFromRoot = relative(root, candidate)
  if (pathFromRoot === '..' || pathFromRoot.startsWith(`..${process.platform === 'win32' ? '\\' : '/'}`) || isAbsolute(pathFromRoot)) {
    throw new StageFailure(`Packed artifact escaped the owned package directory: ${input}`, {
      failureKind: 'subject',
    })
  }
  return candidate
}

async function exists(path: string): Promise<boolean> {
  try {
    await access(path)
    return true
  } catch {
    return false
  }
}

function commandArtifacts(result: CommandResult): string[] {
  return result.artifacts.map(path => `logs/${path}`)
}

function collectIds(value: unknown, ids = new Set<string>()): Set<string> {
  if (Array.isArray(value)) {
    for (const child of value) collectIds(child, ids)
  } else if (value !== null && typeof value === 'object') {
    const record = value as Record<string, unknown>
    if (typeof record.id === 'string') ids.add(record.id)
    for (const child of Object.values(record)) collectIds(child, ids)
  }
  return ids
}

function failedAssertions(assertions: readonly Assertion[]): Assertion[] {
  return assertions.filter(assertion => assertion.status !== 'passed')
}

function normalizedLines(value: string | null): string[] {
  return value === null
    ? []
    : value.split('\n').map(line => line.trim()).filter(Boolean).sort()
}

function listeningPorts(value: string | null): string[] {
  return normalizedLines(value).filter(line => !line.startsWith('Netid '))
}

interface PackageIdentity {
  packageName: string | null
  packageVersion: string | null
}

export function buildUpdateIdentityAssertions(
  previous: PackageIdentity,
  installed: PackageIdentity,
  target: PackageIdentity,
): Assertion[] {
  return [
    {
      id: 'update.package-name',
      status: installed.packageName === target.packageName ? 'passed' : 'failed',
      message: installed.packageName === target.packageName
        ? 'Installed package name equals the packed update target'
        : 'Installed package name does not equal the packed update target',
      expected: target.packageName,
      actual: installed.packageName,
    },
    {
      id: 'update.version',
      status: installed.packageVersion === target.packageVersion ? 'passed' : 'failed',
      message: installed.packageVersion === target.packageVersion
        ? 'Installed version equals the packed update target'
        : 'Installed version does not equal the packed update target',
      expected: target.packageVersion,
      actual: installed.packageVersion,
    },
    {
      id: 'update.previous-version',
      status: previous.packageVersion !== installed.packageVersion ? 'passed' : 'failed',
      message: previous.packageVersion !== installed.packageVersion
        ? 'Installed plugin version changed'
        : 'Installed plugin version did not change',
      expected: `not ${previous.packageVersion ?? 'unknown'}`,
      actual: installed.packageVersion,
    },
    {
      id: 'update.previous-package-name',
      status: previous.packageName === target.packageName ? 'passed' : 'failed',
      message: previous.packageName === target.packageName
        ? 'Update source and target use the same package name'
        : 'Update source and target use different package names',
      expected: target.packageName,
      actual: previous.packageName,
    },
  ]
}

function formatFilesystemChange(change: FileChange, root: string): string {
  return `${change.kind}:${root}/${change.path}`
}

function addedValues(before: readonly string[], after: readonly string[]): string[] {
  const baseline = new Set(before)
  return [...new Set(after.filter(value => !baseline.has(value)))].sort()
}

function probeRuntimePath(): string {
  return process.env.DSH_TESTKIT_PROBE_MODULE
    ?? resolve(import.meta.dirname, '../../probe/runtime.js')
}

export class DshNpmAdapter implements LifecycleAdapter {
  private request!: WorkerRequest
  private runRoot = ''
  private harnessDir = ''
  private dshHome = ''
  private workspaceDir = ''
  private packagesDir = ''
  private corepackHome = ''
  private logsDir = ''
  private evidenceDir = ''
  private profileDir = ''
  private dshExecutable = ''
  private probePatch = ''
  private canary = ''
  private primaryResolved!: ResolvedSource
  private initialResolved!: ResolvedSource
  private primaryPacked!: PackedSubject
  private initialPacked!: PackedSubject
  private installedPackageName: string | null = null
  private installedPackageVersion: string | null = null
  private beforeInstallSnapshots: FilesystemCheckpoints | null = null
  private beforeBootSnapshots: FilesystemCheckpoints | null = null
  private processObserver = false
  private portObserver = false
  private initialProcessCommands: string[] = []
  private initialListeningPorts: string[] = []
  private readonly artifactSet = new Set<string>()
  private dshIntegrity: string | null = null
  private pnpmVersion = 'unavailable'
  private readonly canaryHits = new Set<string>()

  async initialize(request: WorkerRequest): Promise<void> {
    this.request = request
    this.runRoot = resolve(
      process.env.DSH_TESTKIT_WORK_ROOT ?? join(tmpdir(), `dsh-testkit-${request.runId}-${randomUUID().slice(0, 8)}`),
    )
    this.harnessDir = join(this.runRoot, 'harness')
    this.dshHome = join(this.runRoot, 'home')
    this.workspaceDir = join(this.runRoot, 'workspace')
    this.packagesDir = join(this.runRoot, 'packages')
    this.corepackHome = process.env.DSH_TESTKIT_COREPACK_HOME ?? join(this.runRoot, 'corepack')
    this.logsDir = join(request.outputDir, 'logs')
    this.evidenceDir = join(request.outputDir, 'evidence')
    this.profileDir = join(this.dshHome, 'profiles', request.scenario.profile)
    this.canary = `dsh-testkit-canary-${request.runId}-${randomUUID()}`
    await Promise.all([
      mkdir(this.harnessDir, { recursive: true }),
      mkdir(this.dshHome, { recursive: true }),
      mkdir(this.workspaceDir, { recursive: true }),
      mkdir(this.packagesDir, { recursive: true }),
      mkdir(join(this.runRoot, 'tmp'), { recursive: true }),
      mkdir(join(this.runRoot, 'corepack'), { recursive: true }),
      mkdir(join(this.runRoot, 'user-home'), { recursive: true }),
      mkdir(this.logsDir, { recursive: true }),
      mkdir(this.evidenceDir, { recursive: true }),
    ])
    await writeFile(join(this.runRoot, 'package.json'), `${JSON.stringify({
      name: 'dsh-testkit-owned-run-root',
      private: true,
      packageManager: 'pnpm@11.1.3',
    }, null, 2)}\n`)
    const scenarioPath = join(this.evidenceDir, 'scenario.json')
    await writeFile(scenarioPath, renderScenarioSnapshot(this.request.scenario))
    this.addArtifact(scenarioPath)
    try {
      const toolchain = await runCommand({
        executable: 'pnpm',
        args: ['--version'],
        cwd: this.runRoot,
        timeoutMs: 10_000,
        logDir: this.logsDir,
        logName: 'toolchain-pnpm',
        env: {
          ...safeProcessEnvironment(),
          HOME: join(this.runRoot, 'user-home'),
          TMPDIR: join(this.runRoot, 'tmp'),
          COREPACK_HOME: this.corepackHome,
        },
        inheritEnv: false,
        redactions: [this.canary, ...environmentRedactions()],
      })
      if (toolchain.exitCode === 0) this.pnpmVersion = toolchain.stdout.trim()
      if (toolchain.redactionMatches.includes(0)) this.canaryHits.add('toolchain-pnpm')
      for (const artifact of commandArtifacts(toolchain)) this.artifactSet.add(artifact)
    } catch {
      this.pnpmVersion = 'unavailable'
    }
    const initialSystem = await this.captureSystem('initialize')
    this.processObserver = initialSystem.processes !== null
    this.portObserver = initialSystem.ports !== null
    this.initialProcessCommands = normalizeProcessCommands(initialSystem.processes)
    this.initialListeningPorts = listeningPorts(initialSystem.ports)
  }

  async resolve(): Promise<AdapterCompletion<void>> {
    this.primaryResolved = await this.resolveSource(this.request.scenario.subject.source)
    this.initialResolved = this.request.scenario.subject.updateFrom === undefined
      ? this.primaryResolved
      : await this.resolveSource(this.request.scenario.subject.updateFrom)
    const mutable = this.primaryResolved.mutable || this.initialResolved.mutable
    if (mutable && !this.request.allowMutableSource) {
      throw new StageFailure('Mutable npm or Git source requires --allow-mutable-source', {
        failureKind: 'subject',
      })
    }
    const assertions: Assertion[] = mutable
      ? [{
          id: 'source.reproducible',
          status: 'unsupported',
          message: 'Mutable source was explicitly allowed; this run cannot establish reproducibility',
          expected: 'immutable source',
          actual: 'mutable source',
        }]
      : [{
          id: 'source.reproducible',
          status: 'passed',
          message: 'Source resolves to an immutable run input',
          expected: 'immutable source',
          actual: 'immutable source',
        }]
    return { value: undefined, summary: `Resolved ${this.primaryResolved.kind} source`, assertions }
  }

  async installDsh(): Promise<AdapterCompletion<void>> {
    await writeFile(join(this.harnessDir, 'package.json'), `${JSON.stringify({
      name: 'dsh-testkit-run-harness',
      private: true,
      version: '0.0.0',
    }, null, 2)}\n`)
    await writeFile(join(this.harnessDir, 'pnpm-workspace.yaml'), [
      'packages:',
      '  - .',
      'dangerouslyAllowAllBuilds: true',
      '',
    ].join('\n'))
    const result = await this.command('install-dsh', 'pnpm', [
      'add',
      '--save-exact',
      `@deepseek-ai/dsh@${this.request.scenario.dsh.version}`,
    ], this.harnessDir, this.request.scenario.timeouts.installMs, {}, 'infrastructure')
    this.dshExecutable = join(this.harnessDir, 'node_modules', '.bin', 'dsh')
    if (!await exists(this.dshExecutable)) {
      throw new StageFailure('Installed DSH package did not expose the dsh binary', {
        failureKind: 'infrastructure',
        artifacts: commandArtifacts(result),
      })
    }
    const dshPackagePath = join(this.harnessDir, 'node_modules', '@deepseek-ai', 'dsh')
    const manifestPath = join(dshPackagePath, 'package.json')
    const manifestBytes = await readFile(manifestPath)
    const manifest = JSON.parse(manifestBytes.toString('utf8')) as { version?: string }
    if (manifest.version !== this.request.scenario.dsh.version) {
      throw new StageFailure(`Expected DSH ${this.request.scenario.dsh.version} but installed ${manifest.version ?? 'unknown'}`, {
        failureKind: 'infrastructure',
        artifacts: commandArtifacts(result),
      })
    }
    const installedFiles = await snapshotFiles(dshPackagePath)
    this.dshIntegrity = sha256(JSON.stringify(installedFiles.entries))
    return {
      value: undefined,
      summary: `Installed exact DSH ${manifest.version}`,
      command: result.command,
      exitCode: result.exitCode,
      signal: result.signal,
      artifacts: commandArtifacts(result),
      assertions: [{
        id: 'dsh.version.exact',
        status: 'passed',
        message: `Installed DSH ${manifest.version}`,
        expected: this.request.scenario.dsh.version,
        actual: manifest.version,
      }],
    }
  }

  async packageSubject(): Promise<AdapterCompletion<void>> {
    this.primaryPacked = await this.packSource(this.primaryResolved, 'primary')
    this.initialPacked = this.initialResolved.input === this.primaryResolved.input
      ? this.primaryPacked
      : await this.packSource(this.initialResolved, 'update-from')
    const evidencePath = join(this.evidenceDir, 'subject.json')
    await writeFile(evidencePath, `${JSON.stringify({
      primary: this.primaryPacked,
      initial: this.initialPacked,
    }, null, 2)}\n`)
    this.addArtifact(evidencePath)
    return {
      value: undefined,
      summary: `Packed ${this.primaryPacked.packageName}@${this.primaryPacked.packageVersion}`,
      artifacts: ['evidence/subject.json'],
      assertions: [{
        id: 'subject.pack.digest',
        status: 'passed',
        message: 'Published tarball candidate has a content digest',
        actual: this.primaryPacked.digest,
      }],
    }
  }

  async installPlugin(): Promise<AdapterCompletion<void>> {
    const baselineArtifacts = await this.prepareProfileBaseline()
    this.beforeInstallSnapshots = await this.captureFilesystemCheckpoint('filesystem-before-install.json')
    const result = await this.dshPlugin('install-plugin', [
      'add',
      this.initialPacked.tarball,
      '--save-exact',
    ])
    this.installedPackageName = this.initialPacked.packageName
    this.installedPackageVersion = await this.readInstalledVersion(this.installedPackageName)
    const manifest = await this.readProfileManifest()
    const dependency = manifest.dependencies?.[this.installedPackageName]
    const bundles = manifest.dsh?.profile?.bundles ?? []
    const assertions: Assertion[] = [
      {
        id: 'install.manifest.dependency',
        status: dependency === undefined ? 'failed' : 'passed',
        message: dependency === undefined ? 'Plugin dependency is absent from the profile manifest' : 'Plugin dependency is pinned in the profile manifest',
        expected: this.installedPackageName,
        actual: dependency ?? null,
      },
      {
        id: 'install.manifest.bundle',
        status: bundles.includes(this.installedPackageName) ? 'passed' : 'failed',
        message: bundles.includes(this.installedPackageName) ? 'Plugin bundle is active in the profile' : 'Package declares no active dsh.bundle layer',
        expected: this.installedPackageName,
        actual: bundles,
      },
    ]
    if (failedAssertions(assertions).length > 0) {
      throw new StageFailure('Plugin installation did not produce an active DSH bundle', {
        failureKind: 'subject',
        assertions,
        artifacts: commandArtifacts(result),
        command: result.command,
        exitCode: result.exitCode,
        signal: result.signal,
      })
    }
    this.beforeBootSnapshots = await this.captureFilesystemCheckpoint('filesystem-before-boot.json')
    return {
      value: undefined,
      summary: `Installed ${this.installedPackageName}@${this.installedPackageVersion ?? 'unknown'} into profile ${this.request.scenario.profile}`,
      command: result.command,
      exitCode: result.exitCode,
      signal: result.signal,
      artifacts: [
        ...baselineArtifacts,
        ...commandArtifacts(result),
        'evidence/filesystem-before-install.json',
        'evidence/filesystem-before-boot.json',
      ],
      assertions,
    }
  }

  async assemble(): Promise<AdapterCompletion<void>> {
    return await this.inspectEffectiveConfiguration('assemble', 'effective-config.yml', 'config.row')
  }

  async boot(): Promise<AdapterCompletion<AdapterBootObservation>> {
    return await this.observeBoot('boot', 'present')
  }

  async register(observation: AdapterBootObservation): Promise<AdapterCompletion<void>> {
    if (observation.probe === null) {
      throw new StageFailure('Runtime probe was not produced', { failureKind: 'assertion' })
    }
    const failures = failedAssertions(observation.probe.assertions)
    if (failures.length > 0) {
      throw new StageFailure(`${failures.length} runtime registration assertion(s) failed`, {
        failureKind: 'assertion',
        assertions: observation.probe.assertions,
      })
    }
    return {
      value: undefined,
      summary: `${observation.probe.assertions.length} runtime registration assertion(s) passed`,
      assertions: observation.probe.assertions,
    }
  }

  async exercise(observation: AdapterBootObservation): Promise<AdapterCompletion<void>> {
    if (observation.probe === null) {
      throw new StageFailure('Runtime probe was not produced', { failureKind: 'assertion' })
    }
    const failures = failedAssertions(observation.probe.exercises)
    if (failures.length > 0) {
      throw new StageFailure(`${failures.length} deterministic tool exercise(s) failed`, {
        failureKind: 'assertion',
        assertions: observation.probe.exercises,
      })
    }
    return {
      value: undefined,
      summary: `${observation.probe.exercises.length} deterministic tool exercise(s) passed`,
      assertions: observation.probe.exercises,
    }
  }

  async update(): Promise<AdapterCompletion<void>> {
    const previous = {
      packageName: this.installedPackageName,
      packageVersion: this.installedPackageVersion,
    }
    const result = await this.dshPlugin('update', ['add', this.primaryPacked.tarball, '--save-exact'])
    this.installedPackageName = this.primaryPacked.packageName
    this.installedPackageVersion = await this.readInstalledVersion(this.installedPackageName)
    const configured = await this.inspectEffectiveConfiguration(
      'update-assemble',
      'effective-config-update.yml',
      'update.config.row',
    )
    const boot = await this.observeBoot('update-boot', 'present')
    if (boot.value.outcome !== 'success' || boot.value.probe === null) {
      throw new StageFailure('Updated plugin did not boot successfully', {
        failureKind: 'subject',
        artifacts: [...commandArtifacts(result), ...(configured.artifacts ?? []), ...(boot.artifacts ?? [])],
      })
    }
    const assertions: Assertion[] = [
      ...buildUpdateIdentityAssertions(previous, {
        packageName: this.installedPackageName,
        packageVersion: this.installedPackageVersion,
      }, {
        packageName: this.primaryPacked.packageName,
        packageVersion: this.primaryPacked.packageVersion,
      }),
      ...(configured.assertions ?? []),
      ...boot.value.probe.assertions,
      ...boot.value.probe.exercises,
    ]
    if (failedAssertions(assertions).length > 0) {
      throw new StageFailure('Updated plugin failed lifecycle assertions', {
        failureKind: 'assertion',
        assertions,
        artifacts: [...commandArtifacts(result), ...(configured.artifacts ?? []), ...(boot.artifacts ?? [])],
      })
    }
    return {
      value: undefined,
      summary: `Updated ${this.installedPackageName} from ${previous.packageVersion ?? 'unknown'} to ${this.installedPackageVersion ?? 'unknown'} and reassembled the profile`,
      assertions,
      artifacts: [...commandArtifacts(result), ...(configured.artifacts ?? []), ...(boot.artifacts ?? [])],
      command: result.command,
      exitCode: result.exitCode,
      signal: result.signal,
    }
  }

  async uninstall(): Promise<AdapterCompletion<void>> {
    if (this.installedPackageName === null) throw new StageFailure('Installed package identity is unavailable')
    const packageName = this.installedPackageName
    const result = await this.dshPlugin('uninstall', ['remove', packageName])
    const manifest = await this.readProfileManifest()
    const bundles = manifest.dsh?.profile?.bundles ?? []
    const installedPackagePath = join(this.profileDir, 'node_modules', ...packageName.split('/'))
    const packageFilesRemain = await exists(installedPackagePath)
    const assertions: Assertion[] = [
      {
        id: 'uninstall.manifest.dependency',
        status: manifest.dependencies?.[packageName] === undefined ? 'passed' : 'failed',
        message: manifest.dependencies?.[packageName] === undefined ? 'Plugin dependency was removed' : 'Plugin dependency remains in the profile',
        expected: false,
        actual: manifest.dependencies?.[packageName] !== undefined,
      },
      {
        id: 'uninstall.manifest.bundle',
        status: bundles.includes(packageName) ? 'failed' : 'passed',
        message: bundles.includes(packageName) ? 'Plugin bundle remains active' : 'Plugin bundle was removed from the profile',
        expected: false,
        actual: bundles.includes(packageName),
      },
      {
        id: 'uninstall.package.files',
        status: packageFilesRemain ? 'failed' : 'passed',
        message: packageFilesRemain ? 'Plugin package files remain in the profile' : 'Plugin package files were removed',
        expected: false,
        actual: packageFilesRemain,
      },
    ]
    if (this.beforeBootSnapshots !== null) {
      const [dshHome, workspace] = await Promise.all([
        snapshotFiles(this.dshHome),
        snapshotFiles(this.workspaceDir),
      ])
      const after = { dshHome, workspace }
      const snapshotPath = join(this.evidenceDir, 'filesystem-after-uninstall.json')
      await writeSnapshot(snapshotPath, after)
      this.addArtifact(snapshotPath)
      const bootResidue = [
        ...diffSnapshots(this.beforeBootSnapshots.dshHome, after.dshHome)
          .filter(change => !this.isKnownPackageManagerChange(change.path))
          .map(change => formatFilesystemChange(change, 'dsh-home')),
        ...diffSnapshots(this.beforeBootSnapshots.workspace, after.workspace)
          .map(change => formatFilesystemChange(change, 'workspace')),
      ]
      const installResidue = this.beforeInstallSnapshots === null ? [] : [
        ...diffSnapshots(this.beforeInstallSnapshots.dshHome, after.dshHome)
          .filter(change => !this.isKnownPackageManagerChange(change.path))
          .map(change => formatFilesystemChange(change, 'dsh-home')),
        ...diffSnapshots(this.beforeInstallSnapshots.workspace, after.workspace)
          .map(change => formatFilesystemChange(change, 'workspace')),
      ]
      const residue = [...new Set([...bootResidue, ...installResidue])].sort()
      assertions.push({
        id: 'uninstall.filesystem.residue',
        status: residue.length === 0 ? 'passed' : 'failed',
        message: residue.length === 0 ? 'No unexplained files remain after uninstall' : `${residue.length} unexplained file(s) remain after uninstall`,
        expected: [],
        actual: residue,
        evidence: ['evidence/filesystem-after-uninstall.json'],
      })
    }
    if (failedAssertions(assertions).length > 0) {
      throw new StageFailure('Plugin uninstall left active state or unexplained files', {
        failureKind: 'assertion',
        assertions,
        artifacts: [...commandArtifacts(result), 'evidence/filesystem-after-uninstall.json'],
        command: result.command,
        exitCode: result.exitCode,
        signal: result.signal,
      })
    }
    this.installedPackageVersion = null
    return {
      value: undefined,
      summary: `Removed ${packageName} from the profile`,
      assertions,
      command: result.command,
      exitCode: result.exitCode,
      signal: result.signal,
      artifacts: [...commandArtifacts(result), 'evidence/filesystem-after-uninstall.json'],
    }
  }

  async reboot(): Promise<AdapterCompletion<void>> {
    const completion = await this.observeBoot('reboot', 'absent')
    return this.requireCleanBoot(completion, 'Profile rebooted without the plugin')
  }

  async recover(): Promise<AdapterCompletion<void>> {
    const artifacts: string[] = []
    if (this.installedPackageName !== null) {
      const manifest = await this.readProfileManifest().catch(() => null)
      if (manifest?.dependencies?.[this.installedPackageName] !== undefined) {
        const removal = await this.dshPlugin('recover-remove', ['remove', this.installedPackageName])
        artifacts.push(...commandArtifacts(removal))
      }
    }
    const completion = await this.observeBoot('recover-boot', 'absent')
    const clean = this.requireCleanBoot(completion, 'Profile recovered after plugin removal')
    return { ...clean, artifacts: [...artifacts, ...(clean.artifacts ?? [])] }
  }

  async cleanup(): Promise<AdapterCompletion<void>> {
    const cleanupSystem = await this.captureSystem('cleanup')
    const snapshotPath = join(this.evidenceDir, 'owned-root-final.json')
    const topLevelEntries = (await readdir(this.runRoot, { withFileTypes: true })).map(entry => ({
      name: entry.name,
      kind: entry.isDirectory() ? 'directory' : entry.isSymbolicLink() ? 'symlink' : 'file',
    })).sort((left, right) => left.name.localeCompare(right.name))
    const canaryHits = [...this.canaryHits].sort()
    let removalError: string | null = null
    try {
      await rm(this.runRoot, { recursive: true, force: true })
    } catch (error) {
      removalError = error instanceof Error ? error.message : String(error)
    }
    const removed = !await exists(this.runRoot)
    await writeSnapshot(snapshotPath, {
      schemaVersion: 1,
      topLevelEntries,
      removed,
      removalError,
    })
    this.addArtifact(snapshotPath)
    const assertions: Assertion[] = [
      {
        id: 'cleanup.owned-root.removed',
        status: removed ? 'passed' : 'failed',
        message: removed ? 'Owned run root was removed' : 'Owned run root remains after cleanup',
        expected: true,
        actual: removed,
        evidence: ['evidence/owned-root-final.json'],
      },
      {
        id: 'canary.log-leak',
        status: canaryHits.length === 0 ? 'passed' : 'failed',
        message: canaryHits.length === 0 ? 'Canary value did not appear in command logs' : 'Canary value appeared in command logs',
        expected: [],
        actual: canaryHits,
      },
    ]
    if (this.request.runner === 'docker' && this.processObserver && cleanupSystem.processes !== null) {
      const residue = addedValues(this.initialProcessCommands, normalizeProcessCommands(cleanupSystem.processes))
      assertions.push({
        id: 'cleanup.process.residue',
        status: residue.length === 0 ? 'passed' : 'failed',
        message: residue.length === 0 ? 'No process remains beyond the Docker baseline' : `${residue.length} process command(s) remain beyond the Docker baseline`,
        expected: [],
        actual: residue,
        evidence: ['evidence/process-initialize.txt', 'evidence/process-cleanup.txt'],
      })
    }
    if (this.request.runner === 'docker' && this.portObserver && cleanupSystem.ports !== null) {
      const residue = addedValues(this.initialListeningPorts, listeningPorts(cleanupSystem.ports))
      assertions.push({
        id: 'cleanup.port.residue',
        status: residue.length === 0 ? 'passed' : 'failed',
        message: residue.length === 0 ? 'No listener remains beyond the Docker baseline' : `${residue.length} listener(s) remain beyond the Docker baseline`,
        expected: [],
        actual: residue,
        evidence: ['evidence/ports-initialize.txt', 'evidence/ports-cleanup.txt'],
      })
    }
    const cleanupFailures = failedAssertions(assertions)
    if (cleanupFailures.length > 0) {
      const summary = !removed
        ? 'Owned run root could not be removed'
        : canaryHits.length > 0
          ? 'Canary value leaked into command output'
          : 'A process or listener remains beyond the Docker baseline'
      throw new StageFailure(summary, {
        failureKind: removed ? 'assertion' : 'cleanup',
        assertions,
        artifacts: [
          'evidence/owned-root-final.json',
          ...(!this.processObserver || cleanupSystem.processes === null
            ? []
            : ['evidence/process-initialize.txt', 'evidence/process-cleanup.txt']),
          ...(!this.portObserver || cleanupSystem.ports === null
            ? []
            : ['evidence/ports-initialize.txt', 'evidence/ports-cleanup.txt']),
        ],
      })
    }
    return {
      value: undefined,
      summary: 'Removed the owned run root and retained evidence',
      assertions,
      artifacts: ['evidence/owned-root-final.json'],
    }
  }

  subjectIdentity(): SubjectIdentity {
    const packed = this.primaryPacked
    if (packed === undefined) {
      return {
        input: this.request.scenario.subject.source,
        kind: this.primaryResolved?.kind ?? 'local-directory',
        packageName: 'unresolved',
        packageVersion: 'unresolved',
        sourceDigest: 'unresolved',
        gitCommit: this.primaryResolved?.gitCommit ?? null,
        mutable: this.primaryResolved?.mutable ?? false,
      }
    }
    return {
      input: packed.source,
      kind: packed.kind,
      packageName: packed.packageName,
      packageVersion: packed.packageVersion,
      sourceDigest: packed.digest,
      gitCommit: packed.gitCommit,
      mutable: packed.mutable,
    }
  }

  dshIdentity(): { version: string; integrity: string | null } {
    return { version: this.request.scenario.dsh.version, integrity: this.dshIntegrity }
  }

  environment(): Record<string, unknown> {
    const runner = this.request.runner
    return {
      runner,
      isolation: runner === 'docker' ? 'docker-container' : 'unsafe-local',
      unsafeLocal: this.request.unsafeLocal,
      platform: process.platform,
      arch: process.arch,
      node: process.version,
      pnpm: this.pnpmVersion,
      image: process.env.DSH_TESTKIT_IMAGE ?? null,
      imageId: process.env.DSH_TESTKIT_IMAGE_ID ?? null,
    }
  }

  observerCoverage(): ObserverCoverage {
    const localLimitation = this.request.runner === 'local'
      ? ['Local checkpoints share the host process and network namespaces']
      : []
    return {
      filesystem: { available: true, mode: 'owned-root snapshots', limitations: ['Changes outside the disposable run root are not observed'] },
      process: { available: this.processObserver, mode: this.processObserver ? 'ps checkpoint' : 'unavailable', limitations: ['Short-lived processes between checkpoints may be missed', ...localLimitation] },
      ports: { available: this.portObserver, mode: this.portObserver ? 'listening-port checkpoint' : 'unavailable', limitations: ['Short-lived listeners between checkpoints may be missed', ...localLimitation] },
      network: { available: false, mode: 'unavailable', limitations: ['v0.1 does not include a network namespace trace or proxy observer'] },
      canary: { available: true, mode: 'raw-stream sentinel detection with sanitized persistence', limitations: ['Absence from process output does not prove absence of egress'] },
    }
  }

  artifacts(): string[] {
    return [...this.artifactSet].sort()
  }

  private async resolveSource(input: string): Promise<ResolvedSource> {
    const absolute = isAbsolute(input) ? input : resolve(input)
    if (await exists(absolute)) {
      const metadata = await import('node:fs/promises').then(module => module.stat(absolute))
      const kind: SubjectIdentity['kind'] = metadata.isDirectory() ? 'local-directory' : 'tarball'
      let gitCommit: string | null = null
      if (metadata.isDirectory() && await exists(join(absolute, '.git'))) {
        const result = await runCommand({
          executable: 'git',
          args: ['-C', absolute, 'rev-parse', 'HEAD'],
          cwd: absolute,
          timeoutMs: 10_000,
          logDir: this.logsDir,
          logName: `resolve-git-${basename(absolute)}`,
          env: safeProcessEnvironment(),
          inheritEnv: false,
          redactions: [this.canary, ...environmentRedactions()],
        })
        if (result.exitCode === 0) gitCommit = result.stdout.trim() || null
      }
      return { input: absolute, kind, mutable: false, gitCommit }
    }
    if (isAbsolute(input)) {
      throw new StageFailure(`Local source does not exist: ${input}`, { failureKind: 'subject' })
    }
    return classifyRemoteSource(input)
  }

  private async packSource(source: ResolvedSource, label: string): Promise<PackedSubject> {
    let cwd = this.packagesDir
    let spec = source.input
    if (source.kind === 'local-directory') {
      cwd = join(this.runRoot, `source-${label}`)
      await cp(source.input, cwd, {
        recursive: true,
        dereference: false,
        filter: path => !['node_modules', '.git', '.dsh-testkit'].includes(basename(path)),
      })
      spec = '.'
    }
    const result = await this.command(
      `package-${label}`,
      'npm',
      ['pack', '--json', '--pack-destination', this.packagesDir, spec],
      cwd,
      this.request.scenario.timeouts.installMs,
    )
    let parsed: z.infer<typeof PackOutputSchema>
    try {
      parsed = PackOutputSchema.parse(JSON.parse(result.stdout))
    } catch (error) {
      throw new StageFailure(`npm pack returned invalid metadata: ${error instanceof Error ? error.message : String(error)}`, {
        failureKind: 'subject',
        artifacts: commandArtifacts(result),
      })
    }
    const metadata = parsed[0]
    if (metadata === undefined) throw new StageFailure('npm pack produced no tarball metadata')
    const tarball = containedPath(this.packagesDir, metadata.filename)
    const digest = sha256(await readFile(tarball))
    return {
      source: source.input,
      tarball,
      packageName: metadata.name,
      packageVersion: metadata.version,
      digest,
      kind: source.kind,
      gitCommit: source.gitCommit,
      mutable: source.mutable,
    }
  }

  private async prepareProfileBaseline(): Promise<string[]> {
    const baselineDir = join(this.runRoot, 'baseline-plugin')
    await mkdir(baselineDir, { recursive: true })
    await Promise.all([
      writeFile(join(baselineDir, 'package.json'), `${JSON.stringify({
        name: '@dsh-testkit/internal-baseline',
        version: '0.0.0',
        type: 'module',
        main: 'index.js',
        files: ['index.js', 'cordis.patch.yml'],
        dsh: { bundle: { patch: './cordis.patch.yml' } },
      }, null, 2)}\n`),
      writeFile(join(baselineDir, 'index.js'), [
        "export const name = 'dsh-testkit-internal-baseline'",
        'export function apply() {}',
        '',
      ].join('\n')),
      writeFile(join(baselineDir, 'cordis.patch.yml'), [
        '- insert:',
        '    - id: dsh-testkit-internal-baseline',
        "      name: '@dsh-testkit/internal-baseline'",
        '',
      ].join('\n')),
    ])
    const packed = await this.command(
      'baseline-package',
      'npm',
      ['pack', '--json', '--pack-destination', this.packagesDir, '.'],
      baselineDir,
      this.request.scenario.timeouts.installMs,
    )
    const metadata = PackOutputSchema.parse(JSON.parse(packed.stdout))[0]
    if (metadata === undefined) throw new StageFailure('Baseline package produced no tarball metadata')
    const tarball = containedPath(this.packagesDir, metadata.filename)
    const installed = await this.dshPlugin('baseline-install', ['add', tarball, '--save-exact'])
    const removed = await this.dshPlugin('baseline-remove', ['remove', metadata.name])
    return [
      ...commandArtifacts(packed),
      ...commandArtifacts(installed),
      ...commandArtifacts(removed),
    ]
  }

  private async command(
    logName: string,
    executable: string,
    args: string[],
    cwd: string,
    timeoutMs: number,
    env: NodeJS.ProcessEnv = {},
    failureKind: FailureKind = 'subject',
  ): Promise<CommandResult> {
    const result = await runCommand({
      executable,
      args,
      cwd,
      timeoutMs,
      logDir: this.logsDir,
      logName,
      env: {
        ...safeProcessEnvironment(),
        HOME: join(this.runRoot, 'user-home'),
        TMPDIR: join(this.runRoot, 'tmp'),
        COREPACK_HOME: this.corepackHome,
        ...env,
      },
      inheritEnv: false,
      redactions: [this.canary, ...environmentRedactions()],
    })
    for (const artifact of commandArtifacts(result)) this.artifactSet.add(artifact)
    if (result.redactionMatches.includes(0)) this.canaryHits.add(logName)
    if (result.stdoutTruncated || result.stderrTruncated) {
      throw new StageFailure(`${basename(executable)} output exceeded the 8 MiB per-stream evidence limit`, {
        failureKind,
        artifacts: commandArtifacts(result),
        command: result.command,
        exitCode: result.exitCode,
        signal: result.signal,
      })
    }
    if (result.exitCode !== 0 || result.timedOut) {
      throw new StageFailure(
        result.timedOut
          ? `${basename(executable)} timed out after ${timeoutMs}ms`
          : `${basename(executable)} exited with code ${result.exitCode ?? 'null'}`,
        {
          failureKind: result.timedOut ? 'timeout' : result.interruptedBy === null ? failureKind : 'infrastructure',
          artifacts: commandArtifacts(result),
          command: result.command,
          exitCode: result.exitCode,
          signal: result.signal,
        },
      )
    }
    return result
  }

  private async dshPlugin(logName: string, args: string[]): Promise<CommandResult> {
    return await this.command(
      logName,
      this.dshExecutable,
      ['plugin', '--profile', this.request.scenario.profile, ...args],
      this.workspaceDir,
      this.request.scenario.timeouts.installMs,
      this.dshEnvironment(),
    )
  }

  private dshEnvironment(extra: NodeJS.ProcessEnv = {}): NodeJS.ProcessEnv {
    return {
      ...safeProcessEnvironment(),
      DSH_HOME: this.dshHome,
      HOME: join(this.runRoot, 'user-home'),
      COREPACK_HOME: this.corepackHome,
      DSH_TELEMETRY_DISABLED: '1',
      DSH_TESTKIT_CANARY: this.canary,
      PATH: `${join(this.harnessDir, 'node_modules', '.bin')}:${process.env.PATH ?? ''}`,
      NPM_CONFIG_AUDIT: 'false',
      NPM_CONFIG_FUND: 'false',
      PNPM_CONFIG_DANGEROUSLY_ALLOW_ALL_BUILDS: 'true',
      ...extra,
    }
  }

  private async ensureProbePatch(): Promise<void> {
    if (this.probePatch !== '') return
    const modulePath = probeRuntimePath()
    if (!await exists(modulePath)) {
      throw new StageFailure(`Runtime probe module is missing at ${modulePath}`, { failureKind: 'infrastructure' })
    }
    this.probePatch = join(this.runRoot, 'probe.patch.yml')
    await writeFile(this.probePatch, [
      '- insert:',
      '    - id: dsh-testkit-runtime-probe',
      `      name: ${JSON.stringify(pathToFileURL(modulePath).href)}`,
      '',
    ].join('\n'))
  }

  private async observeBoot(
    label: string,
    mode: 'present' | 'absent',
  ): Promise<AdapterCompletion<AdapterBootObservation>> {
    await this.ensureProbePatch()
    const probePath = join(this.evidenceDir, `probe-${label}.json`)
    await rm(probePath, { force: true })
    const config = {
      schemaVersion: 1,
      output: probePath,
      mode,
      services: this.request.scenario.expect.services,
      tools: this.request.scenario.expect.tools,
      exercise: mode === 'present' ? this.request.scenario.exercise : [],
      settleMs: 500,
    }
    const result = await runCommand({
      executable: this.dshExecutable,
      args: ['--profile', this.request.scenario.profile, '--patch', this.probePatch],
      cwd: this.workspaceDir,
      timeoutMs: this.request.scenario.timeouts.bootMs,
      logDir: this.logsDir,
      logName: label,
      env: this.dshEnvironment({ DSH_TESTKIT_PROBE_CONFIG: JSON.stringify(config) }),
      inheritEnv: false,
      redactions: [this.canary, ...environmentRedactions()],
      completionFile: probePath,
      beforeCompletionStop: async () => { await this.captureSystem(label) },
    })
    for (const artifact of commandArtifacts(result)) this.artifactSet.add(artifact)
    if (result.redactionMatches.includes(0)) this.canaryHits.add(label)
    if (result.stdoutTruncated || result.stderrTruncated) {
      throw new StageFailure('DSH boot output exceeded the 8 MiB per-stream evidence limit', {
        failureKind: 'subject',
        artifacts: commandArtifacts(result),
        command: result.command,
        exitCode: result.exitCode,
        signal: result.signal,
      })
    }
    if (result.timedOut) {
      throw new StageFailure(`DSH boot timed out before the runtime probe completed`, {
        failureKind: 'timeout',
        artifacts: commandArtifacts(result),
        command: result.command,
        exitCode: result.exitCode,
        signal: result.signal,
      })
    }
    if (result.interruptedBy !== null) {
      throw new StageFailure(`DSH boot was interrupted by ${result.interruptedBy}`, {
        failureKind: 'infrastructure',
        artifacts: commandArtifacts(result),
        command: result.command,
        exitCode: result.exitCode,
        signal: result.signal,
      })
    }
    if (!await exists(probePath) || (result.exitCode !== 0 && result.signal !== 'SIGTERM')) {
      const crashed = result.signal !== null && !result.stoppedAfterCompletion
      return {
        value: { outcome: crashed ? 'crash' : 'failure', probe: null },
        summary: crashed
          ? `DSH crashed with ${result.signal} before the ${label} runtime probe completed`
          : `DSH exited before the ${label} runtime probe completed`,
        command: result.command,
        exitCode: result.exitCode,
        signal: result.signal,
        artifacts: commandArtifacts(result),
      }
    }
    const document = ProbeDocumentSchema.parse(JSON.parse(await readFile(probePath, 'utf8')))
    this.addArtifact(probePath)
    const probe: ProbeArtifact = {
      assertions: document.assertions,
      exercises: document.exercises,
    }
    return {
      value: { outcome: 'success', probe },
      summary: `DSH reached the ${label} runtime probe`,
      command: result.command,
      exitCode: result.exitCode,
      signal: result.signal,
      artifacts: [...commandArtifacts(result), `evidence/${basename(probePath)}`],
    }
  }

  private requireCleanBoot(
    completion: AdapterCompletion<AdapterBootObservation>,
    summary: string,
  ): AdapterCompletion<void> {
    const probe = completion.value.probe
    if (completion.value.outcome !== 'success' || probe === null) {
      throw new StageFailure('Profile did not boot after plugin removal', {
        failureKind: 'subject',
        ...(completion.artifacts === undefined ? {} : { artifacts: completion.artifacts }),
      })
    }
    const failures = failedAssertions(probe.assertions)
    if (failures.length > 0) {
      throw new StageFailure('Plugin capabilities remain registered after removal', {
        failureKind: 'assertion',
        assertions: probe.assertions,
        ...(completion.artifacts === undefined ? {} : { artifacts: completion.artifacts }),
      })
    }
    return {
      value: undefined,
      summary,
      assertions: probe.assertions,
      ...(completion.artifacts === undefined ? {} : { artifacts: completion.artifacts }),
      ...(completion.command === undefined ? {} : { command: completion.command }),
      ...(completion.exitCode === undefined ? {} : { exitCode: completion.exitCode }),
      ...(completion.signal === undefined ? {} : { signal: completion.signal }),
    }
  }

  private async inspectEffectiveConfiguration(
    logName: string,
    artifactName: string,
    assertionPrefix: string,
  ): Promise<AdapterCompletion<void>> {
    const result = await this.command(
      logName,
      this.dshExecutable,
      ['--profile', this.request.scenario.profile, '--dump-config'],
      this.workspaceDir,
      this.request.scenario.timeouts.bootMs,
      this.dshEnvironment(),
    )
    const configPath = join(this.evidenceDir, artifactName)
    await writeFile(configPath, result.stdout)
    this.addArtifact(configPath)
    const composed = parseYaml(result.stdout, {
      customTags: [{ tag: 'tag:yaml.org,2002:js', resolve: (value: string) => value }],
    })
    const ids = collectIds(composed)
    const evidence = [`evidence/${artifactName}`]
    const assertions: Assertion[] = this.request.scenario.expect.rows.map(row => ({
      id: `${assertionPrefix}.${row}`,
      status: ids.has(row) ? 'passed' : 'failed',
      message: ids.has(row) ? `Configuration row ${row} is present` : `Configuration row ${row} is absent`,
      expected: true,
      actual: ids.has(row),
      evidence,
    }))
    if (failedAssertions(assertions).length > 0) {
      throw new StageFailure('Effective DSH configuration is missing expected rows', {
        failureKind: 'assertion',
        assertions,
        artifacts: [...commandArtifacts(result), ...evidence],
        command: result.command,
        exitCode: result.exitCode,
        signal: result.signal,
      })
    }
    return {
      value: undefined,
      summary: `Composed profile with ${ids.size} addressable rows`,
      command: result.command,
      exitCode: result.exitCode,
      signal: result.signal,
      artifacts: [...commandArtifacts(result), ...evidence],
      assertions,
    }
  }

  private async readProfileManifest(): Promise<{
    dependencies?: Record<string, string>
    dsh?: { profile?: { bundles?: string[] } }
  }> {
    return JSON.parse(await readFile(join(this.profileDir, 'package.json'), 'utf8')) as {
      dependencies?: Record<string, string>
      dsh?: { profile?: { bundles?: string[] } }
    }
  }

  private async readInstalledVersion(packageName: string): Promise<string | null> {
    try {
      const path = join(this.profileDir, 'node_modules', ...packageName.split('/'), 'package.json')
      const manifest = JSON.parse(await readFile(path, 'utf8')) as { version?: string }
      return manifest.version ?? null
    } catch {
      return null
    }
  }

  private addArtifact(path: string): void {
    this.artifactSet.add(relative(this.request.outputDir, path))
  }

  private async captureSystem(label: string): Promise<{ processes: string | null; ports: string | null }> {
    const { processes, ports } = await captureSystemSnapshot()
    if (processes !== null) {
      const path = join(this.evidenceDir, `process-${label}.txt`)
      await writeFile(path, processes)
      this.addArtifact(path)
    }
    if (ports !== null) {
      const path = join(this.evidenceDir, `ports-${label}.txt`)
      await writeFile(path, ports)
      this.addArtifact(path)
    }
    return { processes, ports }
  }

  private async captureFilesystemCheckpoint(filename: string): Promise<FilesystemCheckpoints> {
    const [dshHome, workspace] = await Promise.all([
      snapshotFiles(this.dshHome),
      snapshotFiles(this.workspaceDir),
    ])
    const checkpoint = { dshHome, workspace }
    const path = join(this.evidenceDir, filename)
    await writeSnapshot(path, checkpoint)
    this.addArtifact(path)
    return checkpoint
  }

  private isKnownPackageManagerChange(path: string): boolean {
    const normalized = path.replaceAll('\\', '/')
    const profile = `profiles/${this.request.scenario.profile}`
    const managedPrefixes = [
      'profiles/node_modules/',
      `${profile}/node_modules/`,
    ]
    const exactPaths = new Set([
      'profiles/',
      `${profile}/`,
      `${profile}/cordis.patch.yml`,
      `${profile}/cordis.yml`,
      `${profile}/node_modules/`,
      `${profile}/node_modules/.modules.yaml`,
      `${profile}/node_modules/.pnpm-workspace-state-v1.json`,
      `${profile}/package.json`,
      `${profile}/pnpm-lock.yaml`,
      `${profile}/pnpm-workspace.yaml`,
    ])
    return exactPaths.has(normalized)
      || managedPrefixes.some(prefix => normalized === prefix || normalized.startsWith(prefix))
  }

}
