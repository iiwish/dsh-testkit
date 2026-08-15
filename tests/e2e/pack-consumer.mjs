import { execFile } from 'node:child_process'
import { mkdir, mkdtemp, readFile, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join, resolve } from 'node:path'
import { promisify } from 'node:util'

const executeFile = promisify(execFile)
const root = resolve(import.meta.dirname, '../..')
const temporary = await mkdtemp(join(tmpdir(), 'dsh-testkit-pack-'))
const packDir = join(temporary, 'pack')
const consumerDir = join(temporary, 'consumer')
await Promise.all([
  mkdir(packDir, { recursive: true }),
  mkdir(consumerDir, { recursive: true }),
])

const packed = await executeFile('npm', ['pack', '--json', '--pack-destination', packDir], {
  cwd: root,
  timeout: 120_000,
  maxBuffer: 8 * 1024 * 1024,
})
const metadata = JSON.parse(packed.stdout)
const filename = metadata[0]?.filename
if (typeof filename !== 'string') throw new Error(`npm pack returned no filename: ${packed.stdout}`)
const tarball = join(packDir, filename)
await writeFile(join(consumerDir, 'package.json'), `${JSON.stringify({
  name: 'dsh-testkit-clean-consumer',
  private: true,
  type: 'module',
}, null, 2)}\n`)
await executeFile('pnpm', ['add', '--ignore-scripts', tarball], {
  cwd: consumerDir,
  timeout: 120_000,
  maxBuffer: 8 * 1024 * 1024,
})
const help = await executeFile(join(consumerDir, 'node_modules', '.bin', 'dsh-test'), ['--help'], {
  cwd: consumerDir,
  timeout: 30_000,
})
if (!help.stdout.includes('Real-host lifecycle testing for DSH plugins.')) {
  throw new Error('packed CLI help is missing the product description')
}
const imported = await executeFile(process.execPath, ['--input-type=module', '--eval', [
  "import { ScenarioSchema, TESTKIT_VERSION } from 'dsh-testkit'",
  "if (!ScenarioSchema || TESTKIT_VERSION !== '0.1.0') process.exit(1)",
].join(';')], { cwd: consumerDir, timeout: 30_000 })
if (imported.stderr !== '') process.stderr.write(imported.stderr)
const manifest = JSON.parse(await readFile(join(consumerDir, 'node_modules', 'dsh-testkit', 'package.json'), 'utf8'))
if (manifest.bin?.['dsh-test'] !== 'dist/src/cli.js') throw new Error('packed bin mapping is invalid')
const installedPackage = join(consumerDir, 'node_modules', 'dsh-testkit')
for (const dockerInput of ['.dockerignore', 'assets/runner.Dockerfile', 'assets/runner-pnpm-lock.yaml', 'pnpm-workspace.yaml']) {
  await readFile(join(installedPackage, dockerInput))
}
for (const schema of ['schemas/report-v1.json', 'schemas/scenario-v1.json']) {
  JSON.parse(await readFile(join(installedPackage, schema), 'utf8'))
}
await executeFile('docker', [
  'build',
  '--file', join(installedPackage, 'assets', 'runner.Dockerfile'),
  '--build-arg', 'TESTKIT_VERSION=0.1.0-pack-smoke',
  '--tag', 'dsh-testkit-pack-smoke:0.1.0',
  installedPackage,
], { cwd: consumerDir, timeout: 1_800_000, maxBuffer: 16 * 1024 * 1024 })
process.stdout.write(`packed consumer smoke passed: ${filename}\n`)
