import { createHash } from 'node:crypto'
import { realpathSync } from 'node:fs'
import { appendFile } from 'node:fs/promises'
import { posix } from 'node:path'
import { fileURLToPath } from 'node:url'

export interface ActionIdentityInput {
  plugin: string
  dshVersion: string
  output: string
  artifactName: string
  checkName: string
  runId: string
  runAttempt: string
  job: string
  action: string
}

export interface ActionIdentity {
  output: string
  artifactName: string
  checkName: string
}

function slug(value: string, fallback: string): string {
  const result = value
    .replace(/^@/, '')
    .replace(/[^A-Za-z0-9._-]+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^[-.]+|[-.]+$/g, '')
    .slice(0, 48)
  return result || fallback
}

function pluginLabel(plugin: string): string {
  return slug(plugin.split(/[\\/]/).filter(Boolean).at(-1) ?? plugin, 'plugin')
}

function validateLine(value: string, label: string): void {
  if (/[\r\n]/.test(value)) throw new Error(`${label} must be a single line`)
}

function validateOutput(output: string): string {
  validateLine(output, 'Action output')
  if (output.includes('\\') || posix.isAbsolute(output)) {
    throw new Error('Action output must be a relative directory inside the workspace')
  }
  const normalized = posix.normalize(output)
  if (normalized === '.' || normalized === '..' || normalized.startsWith('../')) {
    throw new Error('Action output must be a relative directory inside the workspace')
  }
  return normalized
}

function validateArtifactName(name: string): string {
  validateLine(name, 'Artifact name')
  if (name.length === 0 || name.length > 255 || /["':<>|*?/\\]/.test(name)) {
    throw new Error('Artifact name is empty, too long, or contains a GitHub-invalid character')
  }
  return name
}

export function computeActionIdentity(input: ActionIdentityInput): ActionIdentity {
  const digest = createHash('sha256').update(JSON.stringify({
    plugin: input.plugin,
    dshVersion: input.dshVersion,
    runId: input.runId,
    runAttempt: input.runAttempt,
    job: input.job,
    action: input.action,
  })).digest('hex').slice(0, 12)
  const subject = pluginLabel(input.plugin)
  const job = slug(input.job, 'job')
  const output = validateOutput(input.output || `.dsh-testkit/action-${digest}`)
  const artifactName = validateArtifactName(
    input.artifactName || `dsh-testkit-${job}-${subject}-${digest}`,
  )
  const checkName = input.checkName || `DSH lifecycle: ${subject} @ ${input.dshVersion} (${digest})`
  validateLine(checkName, 'Check name')

  return { output, artifactName, checkName }
}

async function main(): Promise<void> {
  const githubOutput = process.env.GITHUB_OUTPUT
  if (githubOutput === undefined) throw new Error('GITHUB_OUTPUT is required')
  const identity = computeActionIdentity({
    plugin: process.env.INPUT_PLUGIN ?? '',
    dshVersion: process.env.INPUT_DSH_VERSION ?? '',
    output: process.env.INPUT_OUTPUT ?? '',
    artifactName: process.env.INPUT_ARTIFACT_NAME ?? '',
    checkName: process.env.INPUT_CHECK_NAME ?? '',
    runId: process.env.GITHUB_RUN_ID ?? '',
    runAttempt: process.env.GITHUB_RUN_ATTEMPT ?? '',
    job: process.env.GITHUB_JOB ?? '',
    action: process.env.GITHUB_ACTION ?? '',
  })
  await appendFile(githubOutput, [
    `output=${identity.output}`,
    `report=${process.env.GITHUB_WORKSPACE}/${identity.output}/report.json`,
    `artifact-name=${identity.artifactName}`,
    `check-name=${identity.checkName}`,
    '',
  ].join('\n'))
}

const isMain = process.argv[1] !== undefined
  && realpathSync(process.argv[1]) === realpathSync(fileURLToPath(import.meta.url))
if (isMain) await main()
