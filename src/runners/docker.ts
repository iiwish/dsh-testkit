import { createHash } from 'node:crypto'
import { access, lstat, mkdir, mkdtemp, readFile, readdir, rm } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { dirname, join, resolve } from 'node:path'

import { RunReportSchema } from '../domain/report.js'
import type { RunReport } from '../domain/report.js'
import { snapshotFiles } from '../observers/snapshot.js'
import { replaceOwnedFile, runCommand } from '../process/command.js'
import { TESTKIT_VERSION } from '../version.js'
import type { WorkerRequest } from '../worker/protocol.js'
import { RunnerError } from './types.js'
import { runnerTimeoutMs } from './types.js'
import type { Runner } from './types.js'

export interface DockerInputMount {
  hostPath: string
  containerPath: string
}

export interface DockerRunPlan {
  image: string
  runId: string
  outputDir: string
  requestFilename: string
  input?: DockerInputMount
  inputs?: DockerInputMount[]
  environment?: Record<string, string>
  user?: string
}

export function dockerRunName(runId: string): string {
  const normalized = runId.toLowerCase().replace(/[^a-z0-9_.-]+/g, '-').replace(/^-+|-+$/g, '') || 'run'
  return `dsh-testkit-${normalized}`.slice(0, 63)
}

export function dockerInputContainerPath(
  label: 'primary' | 'update-from',
  _hostPath: string,
  directory: boolean,
): string {
  return directory ? `/input/${label}` : `/input/${label}.tgz`
}

export function runnerImageName(contextDigest: string): string {
  const shortDigest = contextDigest.replace(/^sha256:/, '').slice(0, 12)
  return `dsh-testkit-runner:${TESTKIT_VERSION}-${shortDigest}`
}

export async function dockerContextDigest(root: string): Promise<string> {
  const hash = createHash('sha256')
  for (const path of [
    '.dockerignore',
    'package.json',
    'pnpm-workspace.yaml',
    'assets/runner-pnpm-lock.yaml',
    'assets/runner.Dockerfile',
  ]) {
    hash.update(path)
    hash.update('\0')
    hash.update(await readFile(join(root, path)))
    hash.update('\0')
  }
  const distribution = await snapshotFiles(join(root, 'dist', 'src'))
  hash.update(JSON.stringify(distribution.entries))
  return `sha256:${hash.digest('hex')}`
}

export function buildDockerRunArgs(plan: DockerRunPlan): string[] {
  return [
    'run',
    '--rm',
    '--name', dockerRunName(plan.runId),
    '--label', `dev.dsh-testkit.run=${plan.runId}`,
    '--read-only',
    '--init',
    '--cap-drop', 'ALL',
    '--security-opt', 'no-new-privileges',
    '--pids-limit', '512',
    '--memory', '4g',
    '--cpus', '2',
    ...(plan.user === undefined ? [] : ['--user', plan.user]),
    '--tmpfs', '/work:exec,mode=1777',
    '--tmpfs', '/tmp:exec,mode=1777',
    '-v', `${plan.outputDir}:/output`,
    ...(plan.input === undefined ? [] : ['-v', `${plan.input.hostPath}:${plan.input.containerPath}:ro`]),
    ...(plan.inputs ?? []).flatMap(input => ['-v', `${input.hostPath}:${input.containerPath}:ro`]),
    ...Object.entries(plan.environment ?? {}).flatMap(([name, value]) => ['-e', `${name}=${value}`]),
    plan.image,
    '--request', `/output/${plan.requestFilename}`,
  ]
}

export class DockerRunner implements Runner {
  async run(request: WorkerRequest, signal?: AbortSignal): Promise<RunReport> {
    try {
      await mkdir(request.outputDir, { recursive: true })
      const logsDir = join(request.outputDir, 'logs')
      const controllerLogsDir = await mkdtemp(join(tmpdir(), 'dsh-testkit-controller-'))
      const root = await findPackageRoot(import.meta.dirname)
      const contextDigest = await dockerContextDigest(root)
      const image = runnerImageName(contextDigest)
      try {
        await this.ensureImage(image, contextDigest, root, controllerLogsDir, signal)
        const imageId = await this.imageId(image, root, controllerLogsDir, signal)

        const inputs: DockerInputMount[] = []
        const scenario = structuredClone(request.scenario)
        if (await exists(scenario.subject.source)) {
          const hostPath = resolve(scenario.subject.source)
          const containerPath = dockerInputContainerPath('primary', hostPath, (await lstat(hostPath)).isDirectory())
          inputs.push({ hostPath, containerPath })
          scenario.subject.source = containerPath
        }
        if (scenario.subject.updateFrom !== undefined && await exists(scenario.subject.updateFrom)) {
          const hostPath = resolve(scenario.subject.updateFrom)
          const containerPath = dockerInputContainerPath('update-from', hostPath, (await lstat(hostPath)).isDirectory())
          inputs.push({ hostPath, containerPath })
          scenario.subject.updateFrom = containerPath
        }
        const requestFilename = 'worker-request.json'
        const containerRequest: WorkerRequest = {
          ...request,
          scenario,
          outputDir: '/output',
          runner: 'docker',
          unsafeLocal: false,
        }
        await replaceOwnedFile(
          join(request.outputDir, requestFilename),
          `${JSON.stringify(containerRequest, null, 2)}\n`,
        )
        const result = await runCommand({
          executable: 'docker',
          args: buildDockerRunArgs({
            image,
            runId: request.runId,
            outputDir: request.outputDir,
            requestFilename,
            inputs,
            environment: { DSH_TESTKIT_IMAGE: image, DSH_TESTKIT_IMAGE_ID: imageId },
            ...(process.getuid === undefined || process.getgid === undefined
              ? {}
              : { user: `${process.getuid()}:${process.getgid()}` }),
          }),
          cwd: root,
          timeoutMs: runnerTimeoutMs(request),
          ...(signal === undefined ? {} : { signal }),
          logDir: controllerLogsDir,
          logName: 'docker-runner',
        }).finally(async () => {
          await rm(join(request.outputDir, requestFilename), { force: true })
        })
        if (result.stdoutTruncated || result.stderrTruncated) {
          throw new RunnerError('Docker worker output exceeded the 8 MiB per-stream evidence limit', 3)
        }
        const reportPath = join(request.outputDir, 'report.json')
        if (!await exists(reportPath)) {
          throw new RunnerError(`Docker worker produced no report (exit ${result.exitCode ?? 'null'}): ${result.stderr.trim()}`, 3)
        }
        const reportMetadata = await lstat(reportPath)
        if (!reportMetadata.isFile() || reportMetadata.isSymbolicLink()) {
          throw new RunnerError('Docker worker produced an unsafe report artifact', 3)
        }
        const report = RunReportSchema.parse(JSON.parse(await readFile(reportPath, 'utf8')))
        await auditWorkerOutput(request.outputDir, report)
        await copyControllerLogs(controllerLogsDir, logsDir)
        const runnerArtifacts = (await readdir(logsDir)).map(name => `logs/${name}`)
        return RunReportSchema.parse({
          ...report,
          artifacts: [...new Set([...report.artifacts, ...runnerArtifacts])].sort(),
        })
      } catch (error) {
        await resetOwnedOutput(request.outputDir)
        await copyControllerLogs(controllerLogsDir, logsDir)
        throw error
      } finally {
        await rm(controllerLogsDir, { recursive: true, force: true })
      }
    } catch (error) {
      if (error instanceof RunnerError) throw error
      const code = (error as NodeJS.ErrnoException).code
      if (code === 'ENOENT') throw new RunnerError('Docker is required by the default runner but was not found', 4)
      throw new RunnerError(error instanceof Error ? error.message : String(error), 3)
    }
  }

  private async ensureImage(
    image: string,
    contextDigest: string,
    root: string,
    logsDir: string,
    signal?: AbortSignal,
  ): Promise<void> {
    const inspected = await runCommand({
      executable: 'docker',
      args: ['image', 'inspect', '--format', '{{ index .Config.Labels "dev.dsh-testkit.context-sha256" }}', image],
      cwd: root,
      timeoutMs: 30_000,
      logDir: logsDir,
      logName: 'docker-image-inspect',
      ...(signal === undefined ? {} : { signal }),
    })
    if (inspected.exitCode === 0 && inspected.stdout.trim() === contextDigest) return
    const built = await runCommand({
      executable: 'docker',
      args: [
        'build',
        '--file', 'assets/runner.Dockerfile',
        '--build-arg', `TESTKIT_VERSION=${TESTKIT_VERSION}`,
        '--build-arg', `TESTKIT_CONTEXT_SHA256=${contextDigest}`,
        '--tag', image,
        '.',
      ],
      cwd: root,
      timeoutMs: 1_800_000,
      logDir: logsDir,
      logName: 'docker-image-build',
      ...(signal === undefined ? {} : { signal }),
    })
    if (built.exitCode !== 0 || built.timedOut) {
      throw new RunnerError(`Unable to build ${image}: ${built.stderr.trim() || built.stdout.trim()}`, 3)
    }
  }

  private async imageId(
    image: string,
    root: string,
    logsDir: string,
    signal?: AbortSignal,
  ): Promise<string> {
    const result = await runCommand({
      executable: 'docker',
      args: ['image', 'inspect', '--format', '{{.Id}}', image],
      cwd: root,
      timeoutMs: 30_000,
      logDir: logsDir,
      logName: 'docker-image-identity',
      ...(signal === undefined ? {} : { signal }),
    })
    if (result.exitCode !== 0) throw new RunnerError(`Unable to inspect ${image} identity`, 3)
    return result.stdout.trim()
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

async function copyControllerLogs(source: string, target: string): Promise<void> {
  try {
    const metadata = await lstat(target)
    if (!metadata.isDirectory() || metadata.isSymbolicLink()) {
      throw new RunnerError('Docker worker replaced the owned logs directory', 3)
    }
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code !== 'ENOENT') throw error
    await mkdir(target, { recursive: false })
  }
  for (const name of await readdir(source)) {
    await replaceOwnedFile(join(target, name), await readFile(join(source, name)))
  }
}

async function resetOwnedOutput(outputDir: string): Promise<void> {
  const metadata = await lstat(outputDir)
  if (!metadata.isDirectory() || metadata.isSymbolicLink()) {
    throw new RunnerError('Docker output root must be a real directory', 3)
  }
  for (const name of await readdir(outputDir)) {
    await rm(join(outputDir, name), { recursive: true, force: true })
  }
}

async function auditWorkerOutput(outputDir: string, report: RunReport): Promise<void> {
  const declared = new Set([
    'report.json',
    ...report.artifacts,
    ...report.stages.flatMap(stage => [
      ...stage.artifacts,
      ...stage.assertions.flatMap(assertion => assertion.evidence ?? []),
    ]),
  ])
  const allowedFiles = new Set<string>()
  const allowedDirectories = new Set<string>()
  for (const artifact of declared) {
    const normalized = artifact.replaceAll('\\', '/')
    if (normalized === '' || normalized.startsWith('/') || normalized.split('/').includes('..')) {
      throw new RunnerError(`Docker worker declared an unsafe artifact path: ${artifact}`, 3)
    }
    allowedFiles.add(normalized)
    const segments = normalized.split('/')
    for (let length = 1; length < segments.length; length += 1) {
      allowedDirectories.add(segments.slice(0, length).join('/'))
    }
  }

  const violations: string[] = []
  const visit = async (directory: string, relativeDirectory = ''): Promise<void> => {
    for (const entry of await readdir(directory, { withFileTypes: true })) {
      const relativePath = relativeDirectory === '' ? entry.name : `${relativeDirectory}/${entry.name}`
      const absolutePath = join(directory, entry.name)
      if (entry.isSymbolicLink() || (!entry.isDirectory() && !entry.isFile())) {
        violations.push(relativePath)
        await rm(absolutePath, { recursive: true, force: true })
      } else if (entry.isDirectory()) {
        await visit(absolutePath, relativePath)
        if (!allowedDirectories.has(relativePath)) {
          violations.push(relativePath)
          await rm(absolutePath, { recursive: true, force: true })
        }
      } else if (!allowedFiles.has(relativePath)) {
        violations.push(relativePath)
        await rm(absolutePath, { force: true })
      }
    }
  }
  await visit(outputDir)
  if (violations.length > 0) {
    throw new RunnerError(`Docker worker produced undeclared or unsafe output: ${JSON.stringify(violations.slice(0, 20))}`, 3)
  }
}

async function findPackageRoot(start: string): Promise<string> {
  let current = resolve(start)
  for (let depth = 0; depth < 8; depth += 1) {
    const manifest = join(current, 'package.json')
    if (await exists(manifest)) {
      const parsed = JSON.parse(await readFile(manifest, 'utf8')) as { name?: string }
      if (parsed.name === 'dsh-testkit') return current
    }
    const parent = dirname(current)
    if (parent === current) break
    current = parent
  }
  throw new Error(`Cannot locate dsh-testkit package root from ${start}`)
}
