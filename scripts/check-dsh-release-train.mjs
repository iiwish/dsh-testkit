#!/usr/bin/env node
import { readFile, writeFile } from 'node:fs/promises'
import { parseArgs } from 'node:util'

import { discoverDshReleaseTrain } from '../dist/src/adapters/dsh/release-train.js'
import { SUPPORTED_DSH_NPM_VERSIONS } from '../dist/src/adapters/dsh/support.js'

const { values } = parseArgs({
  options: { metadata: { type: 'string' } },
  strict: true,
})

const metadata = values.metadata === undefined
  ? await fetch('https://registry.npmjs.org/@deepseek-ai%2fdsh', {
      signal: AbortSignal.timeout(30_000),
    }).then(async response => {
      if (!response.ok) throw new Error(`npm registry returned HTTP ${response.status}`)
      return await response.json()
    })
  : JSON.parse(await readFile(values.metadata, 'utf8'))

const result = discoverDshReleaseTrain(metadata, SUPPORTED_DSH_NPM_VERSIONS)
process.stdout.write(`${JSON.stringify(result, null, 2)}\n`)
if (process.env.GITHUB_OUTPUT !== undefined) {
  await writeFile(process.env.GITHUB_OUTPUT, [
    `tagged_versions=${JSON.stringify(result.taggedVersions)}`,
    `canary_versions=${JSON.stringify(result.canaryVersions)}`,
    `has_canaries=${String(result.canaryVersions.length > 0)}`,
    '',
  ].join('\n'), { flag: 'a' })
}
