import { z } from 'zod'

import { REPORT_SCHEMA_VERSION } from '../version.js'

export const LIFECYCLE_STAGE_IDS = [
  'resolve',
  'install-dsh',
  'package',
  'install-plugin',
  'assemble',
  'boot',
  'register',
  'exercise',
  'update',
  'uninstall',
  'reboot',
  'recover',
  'cleanup',
] as const

export const StageIdSchema = z.enum(LIFECYCLE_STAGE_IDS)

export const StageStatusSchema = z.enum(['passed', 'failed', 'skipped', 'unsupported'])
export const VerdictSchema = z.enum([
  'passed',
  'failed',
  'flaky',
  'unsupported',
  'invalid',
  'infrastructure_error',
])
export const FailureKindSchema = z.enum([
  'assertion',
  'subject',
  'dsh',
  'infrastructure',
  'timeout',
  'cleanup',
])

export const AssertionSchema = z.object({
  id: z.string().min(1),
  status: z.enum(['passed', 'failed', 'unsupported']),
  message: z.string(),
  expected: z.unknown().optional(),
  actual: z.unknown().optional(),
  evidence: z.array(z.string()).optional(),
}).strict()

export const StageResultSchema = z.object({
  id: StageIdSchema,
  status: StageStatusSchema,
  startedAt: z.iso.datetime(),
  endedAt: z.iso.datetime(),
  durationMs: z.number().int().nonnegative(),
  summary: z.string(),
  failureKind: FailureKindSchema.optional(),
  command: z.array(z.string()).optional(),
  exitCode: z.number().int().nullable().optional(),
  signal: z.string().nullable().optional(),
  assertions: z.array(AssertionSchema),
  artifacts: z.array(z.string()),
}).strict()

export const ObserverCoverageItemSchema = z.object({
  available: z.boolean(),
  mode: z.string(),
  limitations: z.array(z.string()),
}).strict()

export const SubjectIdentitySchema = z.object({
  input: z.string(),
  kind: z.enum(['local-directory', 'tarball', 'npm', 'git']),
  packageName: z.string(),
  packageVersion: z.string(),
  sourceDigest: z.string(),
  gitCommit: z.string().nullable(),
  mutable: z.boolean(),
}).strict()

export const RepeatabilityAttemptSchema = z.object({
  runId: z.string().min(1),
  verdict: VerdictSchema,
  durationMs: z.number().int().nonnegative(),
  semanticDigest: z.string().regex(/^sha256:[0-9a-f]{64}$/),
  report: z.string().min(1),
}).strict()

export const RepeatabilitySchema = z.object({
  requestedRuns: z.number().int().min(2).max(20),
  completedRuns: z.number().int().min(2).max(20),
  consistent: z.boolean(),
  attempts: z.array(RepeatabilityAttemptSchema).min(2).max(20),
}).strict()

export const RunReportSchema = z.object({
  schemaVersion: z.literal(REPORT_SCHEMA_VERSION),
  runId: z.string().min(1),
  startedAt: z.iso.datetime(),
  endedAt: z.iso.datetime(),
  verdict: VerdictSchema,
  subject: SubjectIdentitySchema,
  dsh: z.object({
    version: z.string(),
    integrity: z.string().nullable(),
  }).strict(),
  scenario: z.object({
    name: z.string().min(1),
    suite: z.enum(['quick', 'full']),
    schemaVersion: z.literal(1),
    profile: z.string().min(1),
    digest: z.string().regex(/^sha256:[0-9a-f]{64}$/),
    case: StageIdSchema.optional(),
  }).strict(),
  testkitVersion: z.string(),
  environment: z.record(z.string(), z.unknown()),
  observerCoverage: z.object({
    filesystem: ObserverCoverageItemSchema,
    process: ObserverCoverageItemSchema,
    ports: ObserverCoverageItemSchema,
    network: ObserverCoverageItemSchema,
    canary: ObserverCoverageItemSchema,
  }).strict(),
  stages: z.array(StageResultSchema),
  artifacts: z.array(z.string()),
  repeatability: RepeatabilitySchema.optional(),
  reproductionCommand: z.string(),
}).strict()

export type StageId = z.infer<typeof StageIdSchema>
export type StageStatus = z.infer<typeof StageStatusSchema>
export type Verdict = z.infer<typeof VerdictSchema>
export type FailureKind = z.infer<typeof FailureKindSchema>
export type Assertion = z.infer<typeof AssertionSchema>
export type StageResult = z.infer<typeof StageResultSchema>
export type ObserverCoverageItem = z.infer<typeof ObserverCoverageItemSchema>
export type SubjectIdentity = z.infer<typeof SubjectIdentitySchema>
export type RepeatabilityAttempt = z.infer<typeof RepeatabilityAttemptSchema>
export type Repeatability = z.infer<typeof RepeatabilitySchema>
export type RunReport = z.infer<typeof RunReportSchema>
