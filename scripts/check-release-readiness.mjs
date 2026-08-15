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
const dockerfile = await readFile('assets/runner.Dockerfile', 'utf8')
if (!/^FROM \S+@sha256:[0-9a-f]{64}$/m.test(dockerfile)) {
  throw new Error('runner.Dockerfile must pin its base image by digest')
}
if (!dockerfile.includes('dev.dsh-testkit.context-sha256')) {
  throw new Error('runner.Dockerfile must label the immutable build-context identity')
}
console.log('Package metadata and community release files are complete.')
