import { access, readFile } from 'node:fs/promises'

import { parse as parseYaml } from 'yaml'

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

const readmes = await Promise.all([
  readFile('README.md', 'utf8'),
  readFile('README.zh-CN.md', 'utf8'),
])
for (const [index, readme] of readmes.entries()) {
  const path = index === 0 ? 'README.md' : 'README.zh-CN.md'
  if (readme.includes('YOUR_ORG')) throw new Error(`${path} contains an unresolved repository placeholder`)
  if (!readme.includes(`dsh plugin --profile web add dsh-testkit@${manifest.version}`)) {
    throw new Error(`${path} must document the current native DSH bundle installation path`)
  }
}
if (manifest.dsh?.bundle?.patch !== './cordis.patch.yml') {
  throw new Error('package.json must declare the DSH bundle patch')
}

const positioningFiles = [
  'README.md',
  'README.zh-CN.md',
  '.ai-platform/docs/product-design.md',
  '.ai-platform/docs/technology-decision-record.md',
  '.ai-platform/docs/release-report.md',
  '.ai-platform/specs/lifecycle-runner/spec.md',
  '.ai-platform/specs/lifecycle-runner/plan.md',
  '.ai-platform/specs/lifecycle-runner/tasks.md',
]
const unsupportedClaims = [
  'official DSH Profile Bundle',
  'Official DSH Profile Bundle',
  'Official directory',
  'Official plugin directory',
  '官方 bundle 形态',
  '官方 `dsh.bundle.patch`',
  '官方 DSH Profile Bundle',
]
for (const path of positioningFiles) {
  const contents = await readFile(path, 'utf8')
  const claim = unsupportedClaims.find(candidate => contents.includes(candidate))
  if (claim !== undefined) throw new Error(`${path} makes an unsupported official-status claim: ${claim}`)
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
for (const required of [
  'DSH_TESTKIT_COREPACK_HOME=/work/run/corepack',
  'DSH_TESTKIT_COREPACK_SEED=/opt/corepack',
]) {
  if (!dockerfile.includes(required)) {
    throw new Error(`runner.Dockerfile is missing writable Corepack control: ${required}`)
  }
}
if (!manifest.scripts?.build?.includes('scripts/prepare-runner-lock.mjs')) {
  throw new Error('build must generate the runner lockfile from the canonical root lock')
}
const action = parseYaml(await readFile('.github/actions/dsh-test/action.yml', 'utf8'))
if (action.inputs?.['publish-junit-check']?.default !== 'false') {
  throw new Error('Composite Action must default publish-junit-check to false')
}
const junitStep = action.runs?.steps?.find(step => step.name === 'Publish JUnit')
if (junitStep?.with?.annotate_only !== "${{ inputs.publish-junit-check != 'true' }}") {
  throw new Error('Composite Action must use annotate-only JUnit reporting by default')
}
const ciWorkflow = parseYaml(await readFile('.github/workflows/ci.yml', 'utf8'))
for (const jobName of ['action-smoke', 'action-smoke-compat']) {
  if (JSON.stringify(ciWorkflow.jobs?.[jobName]?.permissions) !== JSON.stringify({ contents: 'read' })) {
    throw new Error(`${jobName} must prove the read-only Composite Action contract`)
  }
}
const releaseWorkflow = await readFile('.github/workflows/release.yml', 'utf8')
for (const required of ['id-token: write', 'environment: npm', 'package-manager-cache: false', 'pnpm test:bundle-e2e', 'npm publish --access public']) {
  if (!releaseWorkflow.includes(required)) {
    throw new Error(`release workflow is missing trusted-publishing control: ${required}`)
  }
}
console.log('Package metadata and community release files are complete.')
