import { randomUUID } from 'node:crypto'
import { access, lstat, mkdir, readFile, realpath } from 'node:fs/promises'
import { isAbsolute, join, relative, resolve } from 'node:path'

import { z } from 'zod'

import { SUPPORTED_DSH_NPM_VERSIONS } from './adapters/dsh/support.js'
import { runCli } from './cli.js'
import type { CliDependencies } from './cli.js'
import { LIFECYCLE_STAGE_IDS, RunReportSchema } from './domain/report.js'
import type { StageId, Verdict } from './domain/report.js'

const TOOL_OUTPUT_LIMIT = 16 * 1024

export const name = 'dsh-testkit'
export const inject = ['tools']

export interface DshTestArguments {
  confirm: boolean
  source?: string
  dshVersion?: string
  suite?: 'quick' | 'full'
  lifecycleCase?: StageId
  expectedRows?: string[]
  expectedServices?: string[]
  expectedTools?: string[]
  updateFrom?: string
}

export interface DshTestResult {
  exitCode: number
  verdict: Verdict
  runDirectory: string
  reportPath: string | null
  summary: string
  diagnostics: string
}

export type DshPreToolDecision =
  | { kind: 'allow' }
  | { kind: 'deny', reason: string }
  | { kind: 'ask', reason?: string }

export interface DshToolExecution {
  readonly name: string
  readonly arguments: unknown
  readonly agent?: unknown
}

export interface DshToolRunContext {
  readonly signal: AbortSignal
}

export interface DshToolDefinition {
  readonly name: string
  readonly description: string
  readonly parameters: Record<string, unknown>
  readonly output: {
    readonly schema: Record<string, unknown>
    render(args: unknown, value: unknown): Array<{ type: 'text', text: string }>
  }
  execute(args: unknown, exec: DshToolRunContext): Promise<unknown>
}

export interface DshPluginContext {
  on(
    event: 'tools/pre-execute',
    listener: (
      exec: DshToolExecution,
      next: () => Promise<DshPreToolDecision>,
    ) => Promise<DshPreToolDecision>,
  ): unknown
  readonly tools: {
    register(definition: DshToolDefinition): unknown
  }
}

type RunCliFunction = (argv: string[], overrides?: Partial<CliDependencies>) => Promise<number>

export interface DshTestDependencies {
  cwd: string
  runCli: RunCliFunction
  makeRunId: () => string
}

function defaultDependencies(): DshTestDependencies {
  return {
    cwd: process.cwd(),
    runCli,
    makeRunId: () => {
      const timestamp = new Date().toISOString().replace(/[-:.TZ]/g, '').slice(0, 14)
      return `tool-${timestamp}-${randomUUID().slice(0, 8)}`
    },
  }
}

async function exists(path: string): Promise<boolean> {
  try {
    await access(path)
    return true
  } catch {
    return false
  }
}

function isRemoteSource(source: string): boolean {
  return source.startsWith('@') || /^(?:git\+|git@|github:|https?:\/\/)/.test(source)
}

function hasEmbeddedUrlCredentials(source: string): boolean {
  const normalized = source.startsWith('git+') ? source.slice(4) : source
  if (!/^https?:\/\//.test(normalized)) return false
  try {
    const url = new URL(normalized)
    return url.username !== '' || url.password !== ''
  } catch {
    return false
  }
}

function isContained(root: string, candidate: string): boolean {
  const path = relative(root, candidate)
  return path === '' || (!/^\.\.(?:[\\/]|$)/.test(path) && !isAbsolute(path))
}

async function normalizeToolSource(source: string, workspace: string): Promise<string> {
  const value = source.trim()
  if (value === '') throw new Error('dsh_test: source must not be empty')
  if (value.startsWith('file:')) {
    throw new Error('dsh_test: file: sources are not allowed; use a workspace-relative path')
  }
  if (hasEmbeddedUrlCredentials(value)) {
    throw new Error('dsh_test: source URLs must not contain embedded credentials')
  }
  if (isRemoteSource(value)) return value

  const candidate = resolve(workspace, value)
  const looksLocal = isAbsolute(value)
    || value.startsWith('.')
    || value.includes('/')
    || value.includes('\\')
    || await exists(candidate)
  if (!looksLocal) return value
  if (!await exists(candidate)) throw new Error(`dsh_test: local source does not exist: ${value}`)

  const resolved = await realpath(candidate)
  if (!isContained(workspace, resolved)) {
    throw new Error(`dsh_test: local source resolves outside the active workspace: ${value}`)
  }
  const metadata = await lstat(resolved)
  if (!metadata.isDirectory() && !metadata.isFile()) {
    throw new Error(`dsh_test: local source must be a directory or regular file: ${value}`)
  }
  return resolved
}

async function ensureOwnedRunDirectory(workspace: string, runDirectory: string): Promise<void> {
  for (const directory of [join(workspace, '.dsh-testkit'), join(workspace, '.dsh-testkit', 'runs')]) {
    try {
      const metadata = await lstat(directory)
      if (!metadata.isDirectory() || metadata.isSymbolicLink()) {
        throw new Error(`dsh_test: output parent must be a real directory: ${directory}`)
      }
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code !== 'ENOENT') throw error
      await mkdir(directory, { mode: 0o700 })
    }
  }
  await mkdir(runDirectory, { mode: 0o700 })
  if (!isContained(workspace, await realpath(runDirectory))) {
    throw new Error('dsh_test: output directory resolves outside the active workspace')
  }
}

function appendBounded(current: string, value: string): string {
  if (Buffer.byteLength(current) >= TOOL_OUTPUT_LIMIT) return current
  const remaining = TOOL_OUTPUT_LIMIT - Buffer.byteLength(current)
  const bytes = Buffer.from(value)
  const retained = bytes.subarray(0, remaining).toString('utf8')
  return `${current}${retained}${bytes.length > remaining ? '\n[output truncated]\n' : ''}`
}

function verdictForExitCode(exitCode: number): Verdict {
  return ({
    0: 'passed',
    1: 'failed',
    2: 'invalid',
    3: 'infrastructure_error',
    4: 'unsupported',
    5: 'flaky',
  } as Record<number, Verdict>)[exitCode] ?? 'infrastructure_error'
}

export async function executeDshTest(
  args: DshTestArguments,
  overrides: Partial<DshTestDependencies> = {},
  signal?: AbortSignal,
): Promise<DshTestResult> {
  if (args.confirm !== true) {
    throw new Error('dsh_test requires confirm=true before executing plugin code in Docker')
  }
  signal?.throwIfAborted()
  const deps = { ...defaultDependencies(), ...overrides }
  const workspace = await realpath(deps.cwd)
  const source = await normalizeToolSource(args.source ?? '.', workspace)
  const updateFrom = args.updateFrom === undefined
    ? undefined
    : await normalizeToolSource(args.updateFrom, workspace)
  const runDirectory = join(workspace, '.dsh-testkit', 'runs', deps.makeRunId())
  await ensureOwnedRunDirectory(workspace, runDirectory)
  const reportPath = join(runDirectory, 'report.json')
  let stdout = ''
  let stderr = ''
  const argv = [
    source,
    '--dsh', args.dshVersion ?? SUPPORTED_DSH_NPM_VERSIONS[0],
    '--runner', 'docker',
    '--suite', args.suite ?? 'quick',
    ...(args.lifecycleCase === undefined ? [] : ['--case', args.lifecycleCase]),
    ...(args.expectedRows ?? []).flatMap(row => ['--expect-row', row]),
    ...(args.expectedServices ?? []).flatMap(service => ['--expect-service', service]),
    ...(args.expectedTools ?? []).flatMap(tool => ['--expect-tool', tool]),
    ...(updateFrom === undefined ? [] : ['--update-from', updateFrom]),
    '--output', runDirectory,
  ]
  const exitCode = await deps.runCli(argv, {
    cwd: workspace,
    useDefaultConfig: false,
    signal,
    stdout: value => { stdout = appendBounded(stdout, value) },
    stderr: value => { stderr = appendBounded(stderr, value) },
  })
  signal?.throwIfAborted()

  let verdict = verdictForExitCode(exitCode)
  let persistedReportPath: string | null = null
  try {
    const report = RunReportSchema.parse(JSON.parse(await readFile(reportPath, 'utf8')))
    verdict = report.verdict
    persistedReportPath = reportPath
  } catch {
    // Invalid input and infrastructure failures can settle before a report exists.
  }
  return {
    exitCode,
    verdict,
    runDirectory,
    reportPath: persistedReportPath,
    summary: stdout.trim() || `dsh-test exited with code ${exitCode}`,
    diagnostics: stderr.trim(),
  }
}

const DshTestArgumentsSchema = z.strictObject({
  confirm: z.boolean(),
  source: z.string().optional(),
  dshVersion: z.string().optional(),
  suite: z.enum(['quick', 'full']).optional(),
  lifecycleCase: z.enum(LIFECYCLE_STAGE_IDS).optional(),
  expectedRows: z.array(z.string()).optional(),
  expectedServices: z.array(z.string()).optional(),
  expectedTools: z.array(z.string()).optional(),
  updateFrom: z.string().optional(),
})

function parseToolArguments(args: unknown): DshTestArguments {
  const result = DshTestArgumentsSchema.safeParse(args)
  if (result.success) return result.data as DshTestArguments
  const violations = result.error.issues.map((issue) => {
    const path = issue.path.length === 0 ? 'arguments' : issue.path.join('.')
    return `${path}: ${issue.message}`
  })
  throw new Error(`invalid arguments: ${violations.join('; ')}`)
}

export function createDshTestTool(): DshToolDefinition {
  return {
    name: 'dsh_test',
    description:
      'Run real-host lifecycle tests for a DSH plugin. This executes package build/install code inside ' +
      'a hardened Docker runner, may use network access, and requires access to the Docker daemon. ' +
      'Ask the user for confirmation, then set confirm=true. Local inputs are restricted to the active workspace.',
    parameters: {
      type: 'object',
      additionalProperties: false,
      properties: {
        confirm: {
          type: 'boolean',
          description: 'Must be true after the user explicitly confirms Docker execution of plugin code.',
        },
        source: {
          type: 'string',
          description: 'Workspace-relative plugin directory/tarball, exact npm package, or pinned Git source. Defaults to the active workspace.',
        },
        dshVersion: {
          type: 'string',
          description: `Exact supported DSH version. Defaults to ${SUPPORTED_DSH_NPM_VERSIONS[0]}.`,
        },
        suite: {
          type: 'string',
          enum: ['quick', 'full'],
          description: 'Lifecycle suite. Defaults to quick.',
        },
        lifecycleCase: {
          type: 'string',
          enum: LIFECYCLE_STAGE_IDS,
          description: 'Optional lifecycle stage to rerun with its required prefix.',
        },
        expectedRows: {
          type: 'array',
          items: { type: 'string' },
          description: 'Expected effective-config row IDs.',
        },
        expectedServices: {
          type: 'array',
          items: { type: 'string' },
          description: 'Expected Cordis service names.',
        },
        expectedTools: {
          type: 'array',
          items: { type: 'string' },
          description: 'Expected registered DSH tool names.',
        },
        updateFrom: {
          type: 'string',
          description: 'Optional older workspace-relative, exact npm, or pinned Git source for the update stage.',
        },
      },
      required: ['confirm'],
    },
    output: {
      schema: {
        type: 'object',
        additionalProperties: false,
        properties: {
          exitCode: { type: 'integer' },
          verdict: {
            type: 'string',
            enum: ['passed', 'failed', 'flaky', 'unsupported', 'invalid', 'infrastructure_error'],
          },
          runDirectory: { type: 'string' },
          reportPath: {
            oneOf: [{ type: 'string' }, { type: 'null' }],
          },
          summary: { type: 'string' },
          diagnostics: { type: 'string' },
        },
        required: [
          'exitCode',
          'verdict',
          'runDirectory',
          'reportPath',
          'summary',
          'diagnostics',
        ],
      },
      render: (_args, value) => [{ type: 'text', text: JSON.stringify(value, null, 2) }],
    },
    execute: async (args, exec) => executeDshTest(parseToolArguments(args), {}, exec.signal),
  }
}

export function apply(ctx: DshPluginContext): void {
  ctx.on('tools/pre-execute', async (exec, next): Promise<DshPreToolDecision> => {
    const downstream = await next()
    const confirmed = typeof exec.arguments === 'object'
      && exec.arguments !== null
      && (exec.arguments as Record<string, unknown>).confirm === true
    if (exec.name !== 'dsh_test' || exec.agent === undefined || !confirmed || downstream.kind !== 'allow') {
      return downstream
    }
    return {
      kind: 'ask',
      reason: 'dsh_test executes plugin package scripts in Docker with Docker daemon and network access',
    }
  })
  ctx.tools.register(createDshTestTool())
}
