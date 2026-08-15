import { execFile } from 'node:child_process'
import { access, mkdir, mkdtemp, readFile, rm, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join, resolve } from 'node:path'
import { promisify } from 'node:util'

const executeFile = promisify(execFile)
const root = resolve(import.meta.dirname, '../..')
const rootManifest = JSON.parse(await readFile(join(root, 'package.json'), 'utf8'))
const version = rootManifest.version
const temporary = await mkdtemp(join(tmpdir(), 'dsh-testkit-pack-'))
const packDir = join(temporary, 'pack')
const consumerDir = join(temporary, 'consumer')
const image = `dsh-testkit-pack-smoke:${version}`

try {
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
  const installed = await executeFile('pnpm', ['add', '--ignore-scripts', tarball], {
    cwd: consumerDir,
    timeout: 120_000,
    maxBuffer: 8 * 1024 * 1024,
    env: { ...process.env, PNPM_CONFIG_AUTO_INSTALL_PEERS: 'false' },
  })
  const installLog = `${installed.stdout}\n${installed.stderr}`
  if (/peer dependenc|missing peer|unmet peer/i.test(installLog)) {
    throw new Error(`packed install emitted a peer warning:\n${installLog}`)
  }
  for (const peer of ['cordis', 'dsh-invariants', 'dsh-tools']) {
    await access(join(consumerDir, 'node_modules', '@deepseek-ai', peer))
      .then(() => { throw new Error(`optional host peer was installed into the clean consumer: ${peer}`) })
      .catch((error) => {
        if (error instanceof Error && !('code' in error && error.code === 'ENOENT')) throw error
      })
  }
  const help = await executeFile(join(consumerDir, 'node_modules', '.bin', 'dsh-test'), ['--help'], {
    cwd: consumerDir,
    timeout: 30_000,
  })
  if (!help.stdout.includes('Real-host lifecycle testing for DSH plugins.')) {
    throw new Error('packed CLI help is missing the product description')
  }
  const communityHelp = await executeFile(
    join(consumerDir, 'node_modules', '.bin', 'dsh-test-community'),
    ['--help'],
    { cwd: consumerDir, timeout: 30_000 },
  )
  if (!communityHelp.stdout.includes('Only community-summary.json is suitable for aggregate publication.')) {
    throw new Error('packed community CLI help is missing its disclosure boundary')
  }
  const imported = await executeFile(process.execPath, ['--input-type=module', '--eval', [
    "import { ScenarioSchema, TESTKIT_VERSION, createDshTestTool } from 'dsh-testkit'",
    `if (!ScenarioSchema || TESTKIT_VERSION !== '${version}' || createDshTestTool().name !== 'dsh_test') process.exit(1)`,
  ].join(';')], { cwd: consumerDir, timeout: 30_000 })
  if (imported.stderr !== '') process.stderr.write(imported.stderr)

  const installedPackage = join(consumerDir, 'node_modules', 'dsh-testkit')
  const [englishReadme, chineseReadme] = await Promise.all([
    readFile(join(installedPackage, 'README.md'), 'utf8'),
    readFile(join(installedPackage, 'README.zh-CN.md'), 'utf8'),
  ])
  if (!englishReadme.includes('[简体中文](README.zh-CN.md)') || !chineseReadme.includes('[English](README.md)')) {
    throw new Error('packed README language entrypoints are not reciprocal')
  }
  const adapterTypes = await readFile(join(installedPackage, 'dist', 'src', 'dsh-plugin.d.ts'), 'utf8')
  if (adapterTypes.includes("from '@deepseek-ai/")) {
    throw new Error('published root types must not require optional DSH host peers')
  }
  const manifest = JSON.parse(await readFile(join(installedPackage, 'package.json'), 'utf8'))
  if (manifest.version !== version) throw new Error('packed manifest version is stale')
  if (manifest.bin?.['dsh-test'] !== 'dist/src/cli.js'
    || manifest.bin?.['dsh-test-community'] !== 'scripts/run-community-validation.mjs') {
    throw new Error('packed bin mapping is invalid')
  }
  if (manifest.dsh?.bundle?.patch !== './cordis.patch.yml') throw new Error('packed DSH bundle manifest is invalid')
  if (manifest.exports?.['./cordis.patch.yml'] !== './cordis.patch.yml') throw new Error('packed bundle patch export is missing')
  const patch = await readFile(join(installedPackage, 'cordis.patch.yml'), 'utf8')
  if (!patch.includes('id: tool-dsh-testkit') || !patch.includes('name: dsh-testkit')) {
    throw new Error('packed bundle patch does not register dsh-testkit')
  }
  for (const dockerInput of ['.dockerignore', 'assets/runner.Dockerfile', 'assets/runner-pnpm-lock.yaml', 'pnpm-workspace.yaml']) {
    await readFile(join(installedPackage, dockerInput))
  }
  for (const schema of ['schemas/report-v1.json', 'schemas/scenario-v1.json']) {
    JSON.parse(await readFile(join(installedPackage, schema), 'utf8'))
  }
  const sourceMap = JSON.parse(await readFile(join(installedPackage, 'dist', 'src', 'cli.js.map'), 'utf8'))
  if (!Array.isArray(sourceMap.sourcesContent) || sourceMap.sourcesContent.length === 0) {
    throw new Error('published source maps must embed their TypeScript sources')
  }

  await executeFile('docker', [
    'build',
    '--file', join(installedPackage, 'assets', 'runner.Dockerfile'),
    '--build-arg', `TESTKIT_VERSION=${version}-pack-smoke`,
    '--tag', image,
    installedPackage,
  ], { cwd: consumerDir, timeout: 1_800_000, maxBuffer: 16 * 1024 * 1024 })
  process.stdout.write(`packed consumer smoke passed: ${filename}\n`)
} finally {
  await executeFile('docker', ['image', 'rm', '--force', image], {
    timeout: 60_000,
    maxBuffer: 8 * 1024 * 1024,
  }).catch(() => undefined)
  await rm(temporary, { recursive: true, force: true })
}
