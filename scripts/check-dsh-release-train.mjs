#!/usr/bin/env node
import { readFile, writeFile } from 'node:fs/promises'
import { parseArgs } from 'node:util'

import { discoverDshReleaseTrain } from '../dist/src/adapters/dsh/release-train.js'
import { SUPPORTED_DSH_NPM_VERSIONS } from '../dist/src/adapters/dsh/support.js'

const { values } = parseArgs({
  options: {
    metadata: { type: 'string' },
    releases: { type: 'string' },
  },
  strict: true,
})

async function fetchJson(url, headers = {}) {
  return await fetch(url, {
      signal: AbortSignal.timeout(30_000),
      headers,
    }).then(async response => {
      if (!response.ok) throw new Error(`${url} returned HTTP ${response.status}`)
      return await response.json()
    })
}

const metadata = values.metadata === undefined
  ? await fetchJson('https://registry.npmjs.org/@deepseek-ai%2fdsh')
  : JSON.parse(await readFile(values.metadata, 'utf8'))
const githubHeaders = {
  Accept: 'application/vnd.github+json',
  'X-GitHub-Api-Version': '2022-11-28',
  'User-Agent': 'dsh-testkit-release-watch',
  ...(process.env.GITHUB_TOKEN === undefined
    ? {}
    : { Authorization: `Bearer ${process.env.GITHUB_TOKEN}` }),
}
const releases = values.releases === undefined
  ? await fetchJson(
      'https://api.github.com/repos/deepseek-ai/deepseek-harness/releases?per_page=30',
      githubHeaders,
    )
  : JSON.parse(await readFile(values.releases, 'utf8'))

const result = discoverDshReleaseTrain(metadata, SUPPORTED_DSH_NPM_VERSIONS, releases)
process.stdout.write(`${JSON.stringify(result, null, 2)}\n`)
if (process.env.GITHUB_OUTPUT !== undefined) {
  await writeFile(process.env.GITHUB_OUTPUT, [
    `tagged_versions=${JSON.stringify(result.taggedVersions)}`,
    `upstream_versions=${JSON.stringify(result.upstreamVersions)}`,
    `canary_versions=${JSON.stringify(result.canaryVersions)}`,
    `has_canaries=${String(result.canaryVersions.length > 0)}`,
    `pending_npm_versions=${JSON.stringify(result.pendingNpmVersions)}`,
    `has_pending_npm=${String(result.pendingNpmVersions.length > 0)}`,
    '',
  ].join('\n'), { flag: 'a' })
}
