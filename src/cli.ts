#!/usr/bin/env node
import { randomUUID } from 'node:crypto'
import { realpathSync } from 'node:fs'
import { access, lstat, mkdir, readFile, readdir, realpath, rm, stat, writeFile } from 'node:fs/promises'
import { dirname, isAbsolute, join, relative, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

import { Command, CommanderError, InvalidArgumentError } from 'commander'
import { parse as parseYaml } from 'yaml'

import { buildScenario, parseScenario, validateRunnerSelection } from './config/scenario.js'
import { exitCodeForVerdict } from './domain/lifecycle.js'
import { aggregateRunReports } from './domain/repeatability.js'
import { RunReportSchema } from './domain/report.js'
import type { RunReport } from './domain/report.js'
import type { Scenario } from './domain/scenario.js'
import { renderJson } from './reporters/json.js'
import { renderJunit } from './reporters/junit.js'
import { renderMarkdown } from './reporters/markdown.js'
import { renderTerminal } from './reporters/terminal.js'
import { createRunner } from './runners/index.js'
import type { Runner, RunnerKind } from './runners/types.js'
import { RunnerError } from './runners/types.js'
import { TESTKIT_VERSION } from './version.js'
import { WorkerRequestSchema } from './worker/protocol.js'

interface CliOptions {
  dsh?: string
  config?: string
  suite?: 'quick' | 'full'
  repeat?: number
  runner: RunnerKind
  unsafeLocal: boolean
  output?: string
  expectRow: string[]
  expectService: string[]
  expectTool: string[]
  updateFrom?: string
  allowMutableSource: boolean
  json: boolean
  color: boolean
}

export interface CliDependencies {
  stdout: (value: string) => void
  stderr: (value: string) => void
  runnerFactory: (kind: RunnerKind) => Runner
  cwd: string
  env: NodeJS.ProcessEnv
}

const collect = (value: string, previous: string[]): string[] => [...previous, value]

function parseRepeat(value: string): number {
  if (!/^\d+$/.test(value)) throw new InvalidArgumentError('must be an integer from 2 to 20')
  const count = Number(value)
  if (count < 2 || count > 20) throw new InvalidArgumentError('must be an integer from 2 to 20')
  return count
}

function defaultDependencies(): CliDependencies {
  return {
    stdout: value => process.stdout.write(value),
    stderr: value => process.stderr.write(value),
    runnerFactory: createRunner,
    cwd: process.cwd(),
    env: process.env,
  }
}

function makeRunId(): string {
  const timestamp = new Date().toISOString().replace(/[-:.TZ]/g, '').slice(0, 14)
  return `${timestamp}-${randomUUID().slice(0, 8)}`
}

function shellQuote(value: string): string {
  return /^[A-Za-z0-9_./:@+-]+$/.test(value) ? value : `'${value.replaceAll("'", "'\\''")}'`
}

async function exists(path: string): Promise<boolean> {
  try {
    await access(path)
    return true
  } catch {
    return false
  }
}

async function isDirectory(path: string): Promise<boolean> {
  try {
    return (await stat(path)).isDirectory()
  } catch {
    return false
  }
}

async function validateDeclaredArtifacts(report: RunReport, outputDir: string): Promise<void> {
  const outputRoot = await realpath(outputDir)
  const declared = new Set([
    ...report.artifacts,
    ...report.stages.flatMap(stage => [
      ...stage.artifacts,
      ...stage.assertions.flatMap(assertion => assertion.evidence ?? []),
    ]),
  ])
  for (const artifact of declared) {
    const candidate = resolve(outputDir, artifact)
    const relativeCandidate = relative(outputDir, candidate)
    if (artifact === '' || relativeCandidate === '' || /^\.\.(?:[\\/]|$)/.test(relativeCandidate) || isAbsolute(relativeCandidate)) {
      throw new RunnerError(`declared artifact escapes the output directory: ${artifact}`, 3)
    }
    let artifactPath: string
    try {
      artifactPath = await realpath(candidate)
    } catch {
      throw new RunnerError(`declared artifact is missing: ${artifact}`, 3)
    }
    const relativeArtifact = relative(outputRoot, artifactPath)
    if (relativeArtifact === '' || /^\.\.(?:[\\/]|$)/.test(relativeArtifact) || isAbsolute(relativeArtifact)) {
      throw new RunnerError(`declared artifact resolves outside the output directory: ${artifact}`, 3)
    }
  }
}

async function replaceOwnedFile(path: string, content: string): Promise<void> {
  await rm(path, { force: true })
  await writeFile(path, content, { flag: 'wx', mode: 0o600 })
}

async function persistReport(reportInput: RunReport, outputDir: string): Promise<RunReport> {
  const report = RunReportSchema.parse({
    ...reportInput,
    artifacts: [...new Set([...reportInput.artifacts, 'report.json', 'junit.xml', 'report.md'])].sort(),
  })
  await Promise.all([
    replaceOwnedFile(join(outputDir, 'report.json'), renderJson(report)),
    replaceOwnedFile(join(outputDir, 'junit.xml'), renderJunit(report)),
    replaceOwnedFile(join(outputDir, 'report.md'), renderMarkdown(report)),
  ])
  await validateDeclaredArtifacts(report, outputDir)
  return report
}

async function normalizeSource(source: string, cwd: string): Promise<string> {
  if (isAbsolute(source)) return source
  const candidate = resolve(cwd, source)
  if (source.startsWith('@') || /^(?:git\+|git@|github:|https?:\/\/)/.test(source)) return source
  if (source.startsWith('.') || source.includes('/') || source.includes('\\') || await exists(candidate)) {
    return candidate
  }
  return source
}

async function loadScenarioConfig(path: string): Promise<Scenario> {
  const raw = await readFile(path, 'utf8')
  return parseScenario(path.endsWith('.json') ? JSON.parse(raw) : parseYaml(raw))
}

function buildProgram(deps: CliDependencies): Command {
  return new Command()
    .name('dsh-test')
    .version(TESTKIT_VERSION)
    .description('Real-host lifecycle testing for DSH plugins.')
    .exitOverride()
    .configureOutput({ writeOut: deps.stdout, writeErr: deps.stderr })
    .argument('[plugin-source]')
    .option('--dsh <version>')
    .option('--config <path>')
    .option('--suite <suite>', 'quick or full')
    .option('--repeat <count>', 'repeat lifecycle attempts (2 to 20)', parseRepeat)
    .option('--runner <runner>', 'docker or local', 'docker')
    .option('--unsafe-local', 'allow plugin execution outside Docker', false)
    .option('--output <dir>')
    .option('--expect-row <id>', 'expected config row', collect, [])
    .option('--expect-service <name>', 'expected Cordis service', collect, [])
    .option('--expect-tool <name>', 'expected tool schema', collect, [])
    .option('--update-from <source>')
    .option('--allow-mutable-source', 'allow mutable package and Git sources', false)
    .option('--json', 'print the canonical report as JSON', false)
    .option('--no-color')
}

export async function runCli(argv: string[], overrides: Partial<CliDependencies> = {}): Promise<number> {
  const deps = { ...defaultDependencies(), ...overrides }
  try {
    const program = buildProgram(deps)
    program.parse(argv, { from: 'user' })
    const options = program.opts<CliOptions>()
    if (options.runner !== 'docker' && options.runner !== 'local') {
      throw new Error('--runner must be docker or local')
    }
    validateRunnerSelection({ runner: options.runner, unsafeLocal: options.unsafeLocal })

    const explicitConfig = options.config === undefined ? undefined : resolve(deps.cwd, options.config)
    const defaultConfig = join(deps.cwd, 'dsh-testkit.yaml')
    const configPath = explicitConfig ?? (await exists(defaultConfig) ? defaultConfig : undefined)
    const configured = configPath === undefined ? undefined : await loadScenarioConfig(configPath)
    const sourceArgument = program.args[0]
    const source = sourceArgument ?? configured?.subject.source
    const dshVersion = options.dsh ?? configured?.dsh.version
    if (source === undefined) throw new Error('plugin source is required')
    if (dshVersion === undefined) throw new Error('--dsh exact version is required')

    const configBase = configPath === undefined ? deps.cwd : dirname(configPath)
    const normalizedSource = await normalizeSource(source, sourceArgument === undefined ? configBase : deps.cwd)
    const configuredUpdate = options.updateFrom ?? configured?.subject.updateFrom
    const normalizedUpdate = configuredUpdate === undefined
      ? undefined
      : await normalizeSource(configuredUpdate, options.updateFrom === undefined ? configBase : deps.cwd)
    const scenario = buildScenario({
      source: normalizedSource,
      dshVersion,
      suite: options.suite ?? configured?.suite,
      ...(configured?.name === undefined ? {} : { name: configured.name }),
      ...(normalizedUpdate === undefined
        ? {}
        : { updateFrom: normalizedUpdate }),
      ...((options.expectRow.length > 0 ? options.expectRow : configured?.expect.rows) === undefined
        ? {}
        : { rows: options.expectRow.length > 0 ? options.expectRow : configured?.expect.rows }),
      ...((options.expectService.length > 0 ? options.expectService : configured?.expect.services) === undefined
        ? {}
        : { services: options.expectService.length > 0 ? options.expectService : configured?.expect.services }),
      ...((options.expectTool.length > 0 ? options.expectTool : configured?.expect.tools) === undefined
        ? {}
        : { tools: options.expectTool.length > 0 ? options.expectTool : configured?.expect.tools }),
    })
    const mergedScenario = configured === undefined ? scenario : parseScenario({
      ...configured,
      ...scenario,
      expect: { ...configured.expect, ...scenario.expect, boot: configured.expect.boot },
      exercise: configured.exercise,
      observers: configured.observers,
      recovery: configured.recovery,
      timeouts: configured.timeouts,
    })

    const runId = makeRunId()
    const outputDir = resolve(deps.cwd, options.output ?? join('.dsh-testkit', 'runs', runId))
    await mkdir(outputDir, { recursive: true })
    const outputMetadata = await lstat(outputDir)
    if (!outputMetadata.isDirectory() || outputMetadata.isSymbolicLink()) {
      throw new Error(`output path must be a real directory, not a symlink: ${outputDir}`)
    }
    if (await isDirectory(normalizedSource)) {
      const outputRelative = relative(await realpath(normalizedSource), await realpath(outputDir))
      const firstSegment = outputRelative.split(/[\\/]/)[0]
      const nested = outputRelative !== '' && !/^\.\.(?:[\\/]|$)/.test(outputRelative) && !isAbsolute(outputRelative)
      if (nested && firstSegment !== '.dsh-testkit') {
        throw new Error('an output directory inside the plugin source must be under .dsh-testkit')
      }
    }
    if ((await readdir(outputDir)).length > 0) {
      throw new Error(`output directory must be empty: ${outputDir}`)
    }
    const repeatCount = options.repeat ?? (mergedScenario.suite === 'full' ? 5 : 1)
    if (mergedScenario.suite === 'full' && repeatCount < 5) {
      throw new Error('--suite full requires at least five attempts')
    }
    const reproductionArgs = [
      ...(sourceArgument === undefined ? [] : [source]),
      '--dsh', dshVersion,
      '--runner', options.runner,
      '--suite', mergedScenario.suite,
    ]
    if (options.runner === 'local') reproductionArgs.push('--unsafe-local')
    if (options.config !== undefined) reproductionArgs.push('--config', options.config)
    for (const row of options.expectRow) reproductionArgs.push('--expect-row', row)
    for (const service of options.expectService) reproductionArgs.push('--expect-service', service)
    for (const tool of options.expectTool) reproductionArgs.push('--expect-tool', tool)
    if (options.updateFrom !== undefined) reproductionArgs.push('--update-from', options.updateFrom)
    if (options.allowMutableSource) reproductionArgs.push('--allow-mutable-source')
    if (options.repeat !== undefined) reproductionArgs.push('--repeat', String(options.repeat))
    const reproductionCommand = ['dsh-test', ...reproductionArgs].map(shellQuote).join(' ')
    const runner = deps.runnerFactory(options.runner)
    const reports: RunReport[] = []
    for (let attempt = 1; attempt <= repeatCount; attempt += 1) {
      const repeated = repeatCount > 1
      const attemptId = repeated ? `${runId}-${String(attempt).padStart(2, '0')}` : runId
      const attemptDir = repeated
        ? join(outputDir, 'attempts', String(attempt).padStart(2, '0'))
        : outputDir
      await mkdir(attemptDir, { recursive: true })
      const request = WorkerRequestSchema.parse({
        schemaVersion: 1,
        runId: attemptId,
        scenario: mergedScenario,
        outputDir: attemptDir,
        reproductionCommand,
        allowMutableSource: options.allowMutableSource,
        runner: options.runner,
        unsafeLocal: options.unsafeLocal,
      })
      reports.push(await persistReport(await runner.run(request), attemptDir))
    }
    const report = reports.length === 1
      ? reports[0]!
      : await persistReport(aggregateRunReports({
          runId,
          reports,
          requestedRuns: repeatCount,
          reproductionCommand,
        }), outputDir)
    const color = options.color && deps.env.NO_COLOR === undefined && process.stdout.isTTY === true
    deps.stdout(options.json ? renderJson(report) : renderTerminal(report, { color }))
    return exitCodeForVerdict(report.verdict)
  } catch (error) {
    if (error instanceof CommanderError && (error.code === 'commander.helpDisplayed' || error.code === 'commander.version')) {
      return 0
    }
    deps.stderr(`dsh-test: ${error instanceof Error ? error.message : String(error)}\n`)
    if (error instanceof RunnerError) return error.exitCode
    return 2
  }
}

const isMain = process.argv[1] !== undefined
  && realpathSync(process.argv[1]) === realpathSync(fileURLToPath(import.meta.url))
if (isMain) {
  process.exitCode = await runCli(process.argv.slice(2))
}
