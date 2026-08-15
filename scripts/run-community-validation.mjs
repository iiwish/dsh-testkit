#!/usr/bin/env node
import { spawn } from 'node:child_process'
import { mkdir, readFile, readdir, writeFile } from 'node:fs/promises'
import { resolve } from 'node:path'
import { parseArgs } from 'node:util'

import {
  aggregateCommunityReports,
  isExactSemver,
  parseExactNpmSpec,
  sanitizeCommunityEnvironment,
} from '../dist/src/community/validation.js'
import { TESTKIT_VERSION } from '../dist/src/version.js'
import { RunReportSchema } from '../dist/src/domain/report.js'

async function main() {

const { values } = parseArgs({
  options: {
    help: { type: 'boolean', short: 'h' },
    'acknowledge-untrusted-code': { type: 'boolean' },
    dsh: { type: 'string' },
    plugin: { type: 'string', multiple: true },
    output: { type: 'string' },
  },
  strict: true,
})

if (values.help === true) {
  process.stdout.write([
    'Usage: dsh-test-community --acknowledge-untrusted-code --dsh <exact-version>',
    '                          --plugin <exact-npm-spec>... --output <directory>',
    '',
    'Runs public plugin code sequentially in disposable Docker lifecycles.',
    'Only community-summary.json is suitable for aggregate publication.',
    '',
  ].join('\n'))
  return
}

if (values['acknowledge-untrusted-code'] !== true) {
  throw new Error('--acknowledge-untrusted-code is required because public plugins execute package and runtime code')
}
if (values.dsh === undefined || !isExactSemver(values.dsh)) {
  throw new Error('--dsh must be an exact semantic version')
}
if (values.output === undefined) throw new Error('--output is required')
const plugins = values.plugin ?? []
if (plugins.length === 0) throw new Error('at least one --plugin exact npm spec is required')
plugins.forEach(parseExactNpmSpec)

const root = resolve(values.output)
await mkdir(root, { recursive: true })
if ((await readdir(root)).length > 0) throw new Error(`output directory must be empty: ${root}`)

const privateRoot = resolve(root, '.private')
const home = resolve(privateRoot, 'home')
const workspace = resolve(privateRoot, 'workspace')
await Promise.all([
  mkdir(home, { recursive: true, mode: 0o700 }),
  mkdir(workspace, { recursive: true, mode: 0o700 }),
])

const environment = sanitizeCommunityEnvironment(process.env, home)
const packageRoot = resolve(import.meta.dirname, '..')
const cli = resolve(packageRoot, 'dist/src/cli.js')
const results = []
const identities = []

async function execute(args) {
  return await new Promise((complete, reject) => {
    const child = spawn(process.execPath, args, {
      cwd: workspace,
      env: environment,
      shell: false,
      stdio: ['ignore', 'pipe', 'pipe'],
    })
    let stdout = ''
    let stderr = ''
    child.stdout.setEncoding('utf8')
    child.stderr.setEncoding('utf8')
    child.stdout.on('data', chunk => { stdout += chunk })
    child.stderr.on('data', chunk => { stderr += chunk })
    child.once('error', reject)
    child.once('close', code => complete({ code: code ?? 3, stdout, stderr }))
  })
}

for (const [index, subject] of plugins.entries()) {
  const sample = `sample-${String(index + 1).padStart(2, '0')}`
  const output = resolve(privateRoot, sample)
  const execution = await execute([
    cli,
    subject,
    '--dsh', values.dsh,
    '--runner', 'docker',
    '--suite', 'quick',
    '--output', output,
    '--no-color',
  ])
  await writeFile(resolve(privateRoot, `${sample}.controller.log`), [
    `exitCode=${execution.code}`,
    '',
    '[stdout]',
    execution.stdout,
    '',
    '[stderr]',
    execution.stderr,
  ].join('\n'), { mode: 0o600 })

  let verdict = 'infrastructure_error'
  let firstFailureStage = null
  try {
    const report = RunReportSchema.parse(JSON.parse(await readFile(resolve(output, 'report.json'), 'utf8')))
    verdict = report.verdict
    firstFailureStage = report.stages.find(stage => stage.status === 'failed' || stage.status === 'unsupported')?.id ?? null
  } catch {
    // Controller evidence retains failures that happen before a canonical report exists.
  }
  results.push({ subject, verdict, firstFailureStage })
  identities.push({ sample, subject, output })
  process.stdout.write(`${sample}: ${verdict}${firstFailureStage === null ? '' : ` at ${firstFailureStage}`}\n`)
}

await writeFile(resolve(privateRoot, 'subjects.private.json'), `${JSON.stringify(identities, null, 2)}\n`, { mode: 0o600 })
const summary = aggregateCommunityReports(results, {
  dshVersion: values.dsh,
  testkitVersion: TESTKIT_VERSION,
  completedAt: new Date().toISOString(),
})
await writeFile(resolve(root, 'community-summary.json'), `${JSON.stringify(summary, null, 2)}\n`, { mode: 0o644 })
process.stdout.write(`aggregate: ${resolve(root, 'community-summary.json')}\n`)
}

await main().catch(error => {
  process.stderr.write(`dsh-test-community: ${error instanceof Error ? error.message : String(error)}\n`)
  process.exitCode = 2
})
