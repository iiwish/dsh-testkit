#!/usr/bin/env node
import { realpathSync } from 'node:fs'
import { mkdir, readFile, rm, writeFile } from 'node:fs/promises'
import { fileURLToPath } from 'node:url'

import { DshNpmAdapter } from '../adapters/dsh/npm-adapter.js'
import { exitCodeForVerdict } from '../domain/lifecycle.js'
import { RunReportSchema } from '../domain/report.js'
import { renderJson } from '../reporters/json.js'
import { LifecycleWorker } from './lifecycle-worker.js'
import { WorkerRequestSchema } from './protocol.js'

export async function runWorker(argv: string[]): Promise<number> {
  const requestIndex = argv.indexOf('--request')
  const requestPath = requestIndex === -1 ? undefined : argv[requestIndex + 1]
  if (requestPath === undefined) throw new Error('worker requires --request <path>')
  const request = WorkerRequestSchema.parse(JSON.parse(await readFile(requestPath, 'utf8')))
  await mkdir(request.outputDir, { recursive: true })
  const report = RunReportSchema.parse(await new LifecycleWorker(new DshNpmAdapter()).run(request))
  const reportPath = `${request.outputDir}/report.json`
  await rm(reportPath, { force: true })
  await writeFile(reportPath, renderJson(report), { flag: 'wx', mode: 0o600 })
  return exitCodeForVerdict(report.verdict)
}

const isMain = process.argv[1] !== undefined
  && realpathSync(process.argv[1]) === realpathSync(fileURLToPath(import.meta.url))
if (isMain) {
  try {
    process.exitCode = await runWorker(process.argv.slice(2))
  } catch (error) {
    process.stderr.write(`dsh-test worker: ${error instanceof Error ? error.stack ?? error.message : String(error)}\n`)
    process.exitCode = 3
  }
}
