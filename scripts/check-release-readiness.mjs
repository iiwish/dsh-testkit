import { access, readFile } from 'node:fs/promises'

const manifest = JSON.parse(await readFile('package.json', 'utf8'))
const requiredFields = ['repository', 'homepage', 'bugs', 'author', 'publishConfig', 'types']
const missingFields = requiredFields.filter(field => manifest[field] === undefined)
if (missingFields.length > 0) throw new Error(`package.json is missing: ${missingFields.join(', ')}`)

if (manifest.publishConfig?.access !== 'public'
  || manifest.publishConfig?.provenance !== true
  || manifest.publishConfig?.registry !== 'https://registry.npmjs.org/') {
  throw new Error('publishConfig must require public npm provenance publishing')
}

for (const path of [
  'SECURITY.md',
  'CHANGELOG.md',
  '.github/ISSUE_TEMPLATE/bug_report.yml',
  '.github/ISSUE_TEMPLATE/lifecycle_failure.yml',
  '.github/PULL_REQUEST_TEMPLATE.md',
]) {
  await access(path)
}

const readme = await readFile('README.md', 'utf8')
if (readme.includes('YOUR_ORG')) throw new Error('README.md contains an unresolved repository placeholder')
if (!readme.includes('dsh plugin --profile web add dsh-testkit@0.2.0')) {
  throw new Error('README.md must document the native DSH bundle installation path')
}
if (manifest.dsh?.bundle?.patch !== './cordis.patch.yml') {
  throw new Error('package.json must declare the official DSH bundle patch')
}
const bundlePatch = await readFile('cordis.patch.yml', 'utf8')
if (!bundlePatch.includes('id: tool-dsh-testkit') || !bundlePatch.includes('name: dsh-testkit')) {
  throw new Error('cordis.patch.yml must register the dsh-testkit Cordis row')
}
const dockerfile = await readFile('assets/runner.Dockerfile', 'utf8')
if (!/^FROM \S+@sha256:[0-9a-f]{64}$/m.test(dockerfile)) {
  throw new Error('runner.Dockerfile must pin its base image by digest')
}
if (!dockerfile.includes('dev.dsh-testkit.context-sha256')) {
  throw new Error('runner.Dockerfile must label the immutable build-context identity')
}
if (!dockerfile.includes('COPY assets/runner-pnpm-lock.yaml ./pnpm-lock.yaml')) {
  throw new Error('runner.Dockerfile must consume the generated runner lockfile')
}
if (!manifest.scripts?.build?.includes('scripts/prepare-runner-lock.mjs')) {
  throw new Error('build must generate the runner lockfile from the canonical root lock')
}
const releaseWorkflow = await readFile('.github/workflows/release.yml', 'utf8')
for (const required of ['id-token: write', 'environment: npm', 'package-manager-cache: false', 'pnpm test:bundle-e2e', 'npm publish --access public']) {
  if (!releaseWorkflow.includes(required)) {
    throw new Error(`release workflow is missing trusted-publishing control: ${required}`)
  }
}
console.log('Package metadata and community release files are complete.')
