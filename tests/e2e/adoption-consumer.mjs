import assert from 'node:assert/strict'
import { createHash } from 'node:crypto'
import { mkdir, mkdtemp, readFile, rm, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join, resolve } from 'node:path'
import { parse } from 'yaml'

import { runCommand } from '../../dist/src/process/command.js'
import { buildDockerRunArgs, dockerRunName } from '../../dist/src/runners/docker.js'
import { RunReportSchema } from '../../dist/src/domain/report.js'

const root = resolve(import.meta.dirname, '../..')
const subject = resolve(process.argv.filter(arg => arg !== '--')[2] ?? '.adoption-subject')
const expectedCommit = '31af7ebeb8d07cff73253f52f9a9f530cde9de9a'
const host = '0.1.2-rc.1'
const temporary = await mkdtemp(join(tmpdir(), 'dsh-adoption-'))
const output = resolve(process.env.DSH_TESTKIT_E2E_OUTPUT ?? join(temporary, 'evidence'))
await mkdir(output, { recursive: true })
const env = { PATH: process.env.PATH, HOME: join(temporary, 'home'), NPM_CONFIG_USERCONFIG: '/dev/null', NPM_CONFIG_REGISTRY: 'https://registry.npmjs.org/', NPM_CONFIG_AUDIT: 'false', NPM_CONFIG_FUND: 'false', CI: 'true' }
await mkdir(env.HOME, { recursive: true })

async function command(name, executable, args, cwd = root, expectedCode = 0, timeoutMs = 900_000) {
  const result = await runCommand({ executable, args, cwd, env, inheritEnv: false, timeoutMs, logDir: join(output, 'logs'), logName: name })
  assert.equal(result.timedOut, false, `${name} timed out`)
  assert.equal(result.stdoutTruncated || result.stderrTruncated, false, `${name} output truncated`)
  assert.equal(result.exitCode, expectedCode, `${name}: unexpected exit; see ${output}/logs/${name}.*.log`)
  return result
}

try {
  const identity = await command('subject-commit', 'git', ['rev-parse', 'HEAD'], subject)
  assert.equal(identity.stdout.trim(), expectedCommit)
  assert.equal((await command('subject-clean', 'git', ['status', '--porcelain'], subject)).stdout.trim(), '')
  const pack = await command('pack-testkit', 'npm', ['pack', '--json', '--pack-destination', temporary])
  const metadata = JSON.parse(pack.stdout)[0]
  const consumer = join(temporary, 'consumer')
  await mkdir(consumer)
  await writeFile(join(consumer, 'package.json'), JSON.stringify({ private: true, name: 'testkit-adoption-consumer', version: '0.0.0' }))
  await command('install-consumer', 'npm', ['install', '--ignore-scripts', '--omit=optional', join(temporary, metadata.filename)], consumer)
  const cli = join(consumer, 'node_modules/dsh-testkit/dist/src/cli.js')
  await command('init-first', process.execPath, [cli, 'init'], subject)
  const generatedPaths = ['dsh-testkit.yaml', '.github/workflows/dsh-lifecycle.yml', '.agents/skills/dsh-testkit/SKILL.md']
  const digest = async path => createHash('sha256').update(await readFile(join(subject, path))).digest('hex')
  const generated = []
  for (const path of generatedPaths) generated.push({ path, sha256: await digest(path) })
  await command('init-second', process.execPath, [cli, 'init'], subject)
  for (const file of generated) assert.equal(await digest(file.path), file.sha256, 'init is not byte-idempotent')
  const scenario = parse(await readFile(join(subject, 'dsh-testkit.yaml'), 'utf8'))
  assert.deepEqual(scenario.expect.rows, ['dsh-plugin-template'])
  const workflow = parse(await readFile(join(subject, '.github/workflows/dsh-lifecycle.yml'), 'utf8'))
  assert.deepEqual(workflow.permissions, { contents: 'read' })
  const reports = []
  for (const [name, negative] of [['baseline', false], ['negative-config', true], ['corrected-config', false]]) {
    const destination = join(output, name)
    await command(name, process.execPath, [cli, '--config', 'dsh-testkit.yaml', '--dsh', host, '--output', destination,
      ...(negative ? ['--expect-row', 'dsh-testkit-deliberately-missing'] : [])], subject, negative ? 1 : 0)
    const report = RunReportSchema.parse(JSON.parse(await readFile(join(destination, 'report.json'), 'utf8')))
    assert.equal(report.verdict, negative ? 'failed' : 'passed')
    assert.equal(report.subject.packageName, 'dsh-plugin-template')
    assert.equal(report.dsh.version, host)
    assert.equal(report.environment.runner, 'docker')
    if (negative) assert.equal(report.stages.find(stage => stage.id === 'register')?.status, 'failed')
    reports.push(report)
  }
  await writeFile(join(output, 'probe-adoption.json'), JSON.stringify({ sourceRepository: 'bugmaker2/dsh-plugin-template', sourceCommit: expectedCommit, testkitTarballIntegrity: metadata.integrity, generated, runs: reports.map(report => ({ runId: report.runId, verdict: report.verdict, sourceDigest: report.subject.sourceDigest, dsh: report.dsh, image: report.environment.image })), maintainerAdoption: false, fault: 'deliberately incorrect configuration, not an upstream plugin defect' }, null, 2))

  for (const [name, viewport] of [['desktop', { width: 1280, height: 800 }], ['mobile', { width: 390, height: 844 }]]) {
    const destination = join(output, `visible-${name}`)
    await mkdir(destination)
    const runId = `t016-visible-${name}-${Date.now()}`
    await writeFile(join(destination, 'request.json'), JSON.stringify({ schemaVersion: 1, runId, scenario: {
      schemaVersion: 1, name: 'independent-visible-host', subject: { source: '/input/primary' }, dsh: { version: host }, profile: 'web',
      expect: { rows: ['fixture-web-status'] }, browser: { smoke: { kind: 'turn-status-text', expectedText: 'Fixture status ready' } }, timeouts: { bootMs: 120000 },
    }, outputDir: '/output', reproductionCommand: 'pnpm test:adoption -- .adoption-subject', case: 'register', runner: 'docker', unsafeLocal: false }))
    const args = buildDockerRunArgs({ image: reports[0].environment.image, runId, outputDir: destination, requestFilename: 'request.json', inputs: [
      { hostPath: join(root, 'fixtures/web-status-plugin'), containerPath: '/input/primary' },
      { hostPath: join(root, 'tests/e2e'), containerPath: '/opt/dsh-testkit/tests/e2e' },
    ], environment: { TESTKIT_VISIBLE_VIEWPORT: JSON.stringify(viewport), DSH_TESTKIT_IMAGE: reports[0].environment.image, DSH_TESTKIT_IMAGE_ID: reports[0].environment.imageId } })
    const imageIndex = args.indexOf(reports[0].environment.image)
    args.splice(imageIndex, 0, '--entrypoint', 'node')
    args.splice(imageIndex + 3, 2, '/opt/dsh-testkit/tests/e2e/visible-browser-worker.mjs')
    try {
      await command(`visible-${name}`, 'docker', args, root, 0, 900_000)
      const report = RunReportSchema.parse(JSON.parse(await readFile(join(destination, 'report.json'), 'utf8')))
      assert.equal(report.verdict, 'passed')
      assert.ok(report.stages.find(stage => stage.id === 'register')?.assertions.some(assertion => assertion.id === 'browser.visible-host.interaction' && assertion.status === 'passed'))
    } finally {
      await rm(join(destination, 'request.json'), { force: true })
      await runCommand({ executable: 'docker', args: ['rm', '--force', dockerRunName(runId)], cwd: root, env, inheritEnv: false, timeoutMs: 10000, logDir: join(output, 'logs'), logName: `cleanup-visible-${name}` })
    }
  }
  console.log('Installed consumer, intentional configuration failure, correction and independent visible browser acceptance passed.')
} finally {
  // Keep bounded diagnostics when no explicit output was requested.
  if (process.env.DSH_TESTKIT_E2E_OUTPUT) await rm(temporary, { recursive: true, force: true })
}
