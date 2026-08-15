import type { StageId, Verdict } from '../domain/report.js'

const EXACT_SEMVER = /^(?:0|[1-9]\d*)\.(?:0|[1-9]\d*)\.(?:0|[1-9]\d*)(?:-(?:0|[1-9]\d*|\d*[A-Za-z-][0-9A-Za-z-]*)(?:\.(?:0|[1-9]\d*|\d*[A-Za-z-][0-9A-Za-z-]*))*)?(?:\+[0-9A-Za-z-]+(?:\.[0-9A-Za-z-]+)*)?$/
const PACKAGE_NAME = /^(?:@[a-z0-9][a-z0-9._-]*\/)?[a-z0-9][a-z0-9._-]*$/

export interface ExactNpmSpec {
  name: string
  version: string
}

export interface CommunityResult {
  subject: string
  verdict: Verdict
  firstFailureStage: StageId | null
}

export interface CommunitySummaryContext {
  dshVersion: string
  testkitVersion: string
  completedAt: string
}

export interface CommunitySummary {
  schemaVersion: 1
  cohortSize: number
  dshVersion: string
  testkitVersion: string
  completedAt: string
  verdicts: Record<string, number>
  firstFailureStages: Record<string, number>
}

export function isExactSemver(value: string): boolean {
  return EXACT_SEMVER.test(value)
}

export function parseExactNpmSpec(input: string): ExactNpmSpec {
  const separator = input.lastIndexOf('@')
  const name = input.slice(0, separator)
  const version = input.slice(separator + 1)
  if (separator <= 0 || !PACKAGE_NAME.test(name) || !isExactSemver(version)) {
    throw new Error(`community subjects must use an exact npm version: ${input}`)
  }
  return { name, version }
}

export function sanitizeCommunityEnvironment(
  input: NodeJS.ProcessEnv,
  isolatedHome: string,
): NodeJS.ProcessEnv {
  const environment: NodeJS.ProcessEnv = {}
  for (const key of ['PATH', 'LANG', 'LC_ALL', 'TMPDIR', 'TMP', 'TEMP', 'SYSTEMROOT', 'WINDIR', 'COMSPEC', 'PATHEXT']) {
    if (input[key] !== undefined) environment[key] = input[key]
  }
  return {
    ...environment,
    HOME: isolatedHome,
    DSH_HOME: `${isolatedHome}/.dsh`,
    DSH_TELEMETRY_DISABLED: '1',
    CI: '1',
    NO_COLOR: '1',
    NPM_CONFIG_REGISTRY: 'https://registry.npmjs.org/',
    NPM_CONFIG_AUDIT: 'false',
    NPM_CONFIG_FUND: 'false',
    NPM_CONFIG_UPDATE_NOTIFIER: 'false',
  }
}

function count(values: readonly string[]): Record<string, number> {
  const result: Record<string, number> = {}
  for (const value of values) result[value] = (result[value] ?? 0) + 1
  return Object.fromEntries(Object.entries(result).sort(([left], [right]) => left.localeCompare(right)))
}

export function aggregateCommunityReports(
  reports: readonly CommunityResult[],
  context: CommunitySummaryContext,
): CommunitySummary {
  return {
    schemaVersion: 1,
    cohortSize: reports.length,
    dshVersion: context.dshVersion,
    testkitVersion: context.testkitVersion,
    completedAt: context.completedAt,
    verdicts: count(reports.map(report => report.verdict)),
    firstFailureStages: count(reports.flatMap(report => report.firstFailureStage ?? [])),
  }
}
