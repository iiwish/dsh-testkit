import { createHash } from 'node:crypto'

import { RunReportSchema } from './report.js'
import type { RunReport, StageResult, Verdict } from './report.js'

function sha256(value: string): string {
  return `sha256:${createHash('sha256').update(value).digest('hex')}`
}

function stableEnvironment(environment: Record<string, unknown>): Record<string, unknown> {
  return Object.fromEntries(Object.entries(environment)
    .filter(([key]) => !['outputDir', 'startedAt', 'endedAt'].includes(key))
    .sort(([left], [right]) => left.localeCompare(right)))
}

function canonicalize(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(canonicalize)
  if (value !== null && typeof value === 'object') {
    return Object.fromEntries(Object.entries(value as Record<string, unknown>)
      .filter(([, child]) => child !== undefined)
      .sort(([left], [right]) => left.localeCompare(right))
      .map(([key, child]) => [key, canonicalize(child)]))
  }
  return value
}

export function semanticReportDigest(report: RunReport): string {
  return sha256(JSON.stringify(canonicalize({
    verdict: report.verdict,
    subject: report.subject,
    dsh: report.dsh,
    scenario: report.scenario,
    testkitVersion: report.testkitVersion,
    environment: stableEnvironment(report.environment),
    observerCoverage: report.observerCoverage,
    stages: report.stages.map(stage => ({
      id: stage.id,
      status: stage.status,
      summary: stage.summary,
      failureKind: stage.failureKind,
      exitCode: stage.exitCode,
      signal: stage.signal,
      assertions: stage.assertions,
    })),
  })))
}

function prefixStageArtifacts(stage: StageResult, prefix: string): StageResult {
  return {
    ...stage,
    artifacts: stage.artifacts.map(path => `${prefix}/${path}`),
    assertions: stage.assertions.map(assertion => ({
      ...assertion,
      ...(assertion.evidence === undefined
        ? {}
        : { evidence: assertion.evidence.map(path => `${prefix}/${path}`) }),
    })),
  }
}

function aggregateVerdict(reports: readonly RunReport[], consistent: boolean): Verdict {
  if (consistent) return reports[0]?.verdict ?? 'infrastructure_error'
  if (reports.some(report => report.verdict === 'infrastructure_error')) return 'infrastructure_error'
  if (reports.some(report => report.verdict === 'invalid')) return 'invalid'
  return 'flaky'
}

export interface AggregateReportsOptions {
  runId: string
  reports: RunReport[]
  requestedRuns: number
  reproductionCommand: string
}

export function aggregateRunReports(options: AggregateReportsOptions): RunReport {
  if (options.reports.length < 2 || options.reports.length !== options.requestedRuns) {
    throw new Error('repeatability aggregation requires every requested attempt report')
  }
  const first = options.reports[0]
  if (first === undefined) throw new Error('repeatability aggregation requires at least one report')
  const digests = options.reports.map(semanticReportDigest)
  const consistent = new Set(digests).size === 1
  const attempts = options.reports.map((report, index) => ({
    runId: report.runId,
    verdict: report.verdict,
    durationMs: Math.max(0, Date.parse(report.endedAt) - Date.parse(report.startedAt)),
    semanticDigest: digests[index]!,
    report: `attempts/${String(index + 1).padStart(2, '0')}/report.json`,
  }))
  const attemptArtifacts = options.reports.flatMap((report, index) => {
    const prefix = `attempts/${String(index + 1).padStart(2, '0')}`
    return [...new Set([...report.artifacts, 'report.json', 'junit.xml', 'report.md'])]
      .map(path => `${prefix}/${path}`)
  })
  return RunReportSchema.parse({
    ...first,
    runId: options.runId,
    startedAt: options.reports.map(report => report.startedAt).sort()[0],
    endedAt: options.reports.map(report => report.endedAt).sort().at(-1),
    verdict: aggregateVerdict(options.reports, consistent),
    environment: { ...stableEnvironment(first.environment), attempts: options.requestedRuns },
    stages: first.stages.map(stage => prefixStageArtifacts(stage, 'attempts/01')),
    artifacts: [...new Set([...attemptArtifacts, 'report.json', 'junit.xml', 'report.md'])].sort(),
    repeatability: {
      requestedRuns: options.requestedRuns,
      completedRuns: options.reports.length,
      consistent,
      attempts,
    },
    reproductionCommand: options.reproductionCommand,
  })
}
