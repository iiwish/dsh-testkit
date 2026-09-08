import { appendFile } from 'node:fs/promises'

const { DISCOVERY_RESULT: discovery, CANARY_RESULT: canary } = process.env
const versions = (value) => {
  const parsed = JSON.parse(value || '[]')
  if (!Array.isArray(parsed) || parsed.some(item => typeof item !== 'string' || !/^\d+\.\d+\.\d+(?:-[a-zA-Z0-9.-]+)?$/.test(item))) {
    throw new Error('Invalid monitoring version list')
  }
  return parsed
}
try {
  const candidates = versions(process.env.CANARY_VERSIONS)
  const pending = versions(process.env.PENDING_NPM_VERSIONS)
  const healthy = discovery === 'success' && (candidates.length ? canary === 'success' : canary === 'skipped')
  const lines = [
    '# DSH Release Watch',
    '',
    `- Ref: ${process.env.GITHUB_REF}`,
    `- Commit: ${process.env.GITHUB_SHA}`,
    `- Discovery: ${discovery}`,
    `- Canary lanes: ${canary}`,
    `- Runnable candidates: ${candidates.join(', ') || 'none'}`,
    `- Official releases awaiting exact npm packages: ${pending.join(', ') || 'none'}`,
    `- Monitoring result: ${healthy ? 'passed' : 'requires attention'}`,
    '',
    'Canary results do not promote support or authorize publication.',
    '',
  ]
  await appendFile(process.env.GITHUB_STEP_SUMMARY, lines.join('\n'))
  if (!healthy) process.exitCode = 1
} catch {
  console.error('Release Watch summary could not validate monitoring results')
  process.exitCode = 1
}
