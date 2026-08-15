import { readFile } from 'node:fs/promises'
import { resolve } from 'node:path'

const root = resolve(import.meta.dirname, '..')
const contracts = [
  ['.ai-platform/specs/lifecycle-runner/contracts/report.schema.json', 'schemas/report-v1.json'],
  ['.ai-platform/specs/lifecycle-runner/contracts/scenario.schema.json', 'schemas/scenario-v1.json'],
]

for (const [source, published] of contracts) {
  const [sourceContent, publishedContent] = await Promise.all([
    readFile(resolve(root, source)),
    readFile(resolve(root, published)),
  ])
  if (!sourceContent.equals(publishedContent)) {
    throw new Error(`${published} is stale; copy the confirmed contract from ${source}`)
  }
}

const manifest = JSON.parse(await readFile(resolve(root, 'package.json'), 'utf8'))
const versionSource = await readFile(resolve(root, 'src/version.ts'), 'utf8')
if (!versionSource.includes(`TESTKIT_VERSION = '${manifest.version}'`)) {
  throw new Error('src/version.ts must match the package version')
}
