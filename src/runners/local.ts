import { mkdir, readFile, readdir, rm, writeFile } from 'node:fs/promises'
import { join, resolve } from 'node:path'

import { RunReportSchema } from '../domain/report.js'
import type { RunReport } from '../domain/report.js'
import { runCommand } from '../process/command.js'
import type { WorkerRequest } from '../worker/protocol.js'
import { RunnerError } from './types.js'
import { runnerTimeoutMs } from './types.js'
import type { Runner } from './types.js'

export class LocalRunner implements Runner {
  async run(request: WorkerRequest, signal?: AbortSignal): Promise<RunReport> {
    await mkdir(request.outputDir, { recursive: true })
    const requestPath = join(request.outputDir, 'worker-request.json')
    const workRoot = join(request.outputDir, '.owned-run-root')
    const localRequest: WorkerRequest = { ...request, runner: 'local', unsafeLocal: true }
    await writeFile(requestPath, `${JSON.stringify(localRequest, null, 2)}\n`)
    const workerPath = resolve(import.meta.dirname, '../worker/main.js')
    const result = await runCommand({
      executable: process.execPath,
      args: [workerPath, '--request', requestPath],
      cwd: process.cwd(),
      env: {
        DSH_TESTKIT_RUNNER: 'local',
        DSH_TESTKIT_WORK_ROOT: workRoot,
      },
      timeoutMs: runnerTimeoutMs(request),
      ...(signal === undefined ? {} : { signal }),
      logDir: join(request.outputDir, 'logs'),
      logName: 'local-worker',
    }).finally(async () => {
      await Promise.all([
        rm(requestPath, { force: true }),
        rm(workRoot, { recursive: true, force: true }),
      ])
    })
    if (result.stdoutTruncated || result.stderrTruncated) {
      throw new RunnerError('Local worker output exceeded the 8 MiB per-stream evidence limit', 3)
    }
    const reportPath = join(request.outputDir, 'report.json')
    try {
      const report = RunReportSchema.parse(JSON.parse(await readFile(reportPath, 'utf8')))
      const runnerArtifacts = (await readdir(join(request.outputDir, 'logs'))).map(name => `logs/${name}`)
      return RunReportSchema.parse({
        ...report,
        artifacts: [...new Set([...report.artifacts, ...runnerArtifacts])].sort(),
      })
    } catch {
      throw new RunnerError(`Local worker produced no valid report (exit ${result.exitCode ?? 'null'}): ${result.stderr.trim()}`, 3)
    }
  }
}
