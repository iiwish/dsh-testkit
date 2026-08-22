import { createHash } from 'node:crypto'

import { z } from 'zod'

import { SCENARIO_SCHEMA_VERSION } from '../version.js'

const EXACT_NPM_VERSION = /^\d+\.\d+\.\d+(?:-[0-9A-Za-z-]+(?:\.[0-9A-Za-z-]+)*)?(?:\+[0-9A-Za-z-]+(?:\.[0-9A-Za-z-]+)*)?$/

export const ObserverRequirementSchema = z.enum(['required', 'preferred', 'off'])
const UniqueStringsSchema = z.array(z.string().min(1)).refine(
  values => new Set(values).size === values.length,
  { message: 'values must be unique' },
)

export const ExerciseSchema = z.object({
  tool: z.string().min(1),
  arguments: z.record(z.string(), z.unknown()),
}).strict()

export const ScenarioSchema = z.object({
  schemaVersion: z.literal(SCENARIO_SCHEMA_VERSION),
  name: z.string().min(1),
  suite: z.enum(['quick', 'full']).default('quick'),
  subject: z.object({
    source: z.string().min(1),
    updateFrom: z.string().min(1).optional(),
  }).strict(),
  dsh: z.object({
    version: z.string().refine(value => EXACT_NPM_VERSION.test(value), {
      message: 'DSH target must be an exact npm version such as 0.1.1-rc.2',
    }),
  }).strict(),
  profile: z.string().regex(/^[A-Za-z0-9_-]+$/).default('dsh-testkit'),
  expect: z.object({
    boot: z.enum(['success', 'failure']).default('success'),
    rows: UniqueStringsSchema.default([]),
    services: UniqueStringsSchema.default([]),
    tools: UniqueStringsSchema.default([]),
  }).strict().default({ boot: 'success', rows: [], services: [], tools: [] }),
  exercise: z.array(ExerciseSchema).default([]),
  recovery: z.object({
    onBootFailure: z.enum(['remove-plugin', 'none']).default('remove-plugin'),
  }).strict().default({ onBootFailure: 'remove-plugin' }),
  observers: z.object({
    filesystem: ObserverRequirementSchema.default('required'),
    process: ObserverRequirementSchema.default('preferred'),
    ports: ObserverRequirementSchema.default('preferred'),
    network: ObserverRequirementSchema.default('off'),
    canary: ObserverRequirementSchema.default('preferred'),
  }).strict().default({
    filesystem: 'required',
    process: 'preferred',
    ports: 'preferred',
    network: 'off',
    canary: 'preferred',
  }),
  timeouts: z.object({
    installMs: z.number().int().min(1_000).max(1_800_000).default(300_000),
    bootMs: z.number().int().min(1_000).max(300_000).default(30_000),
    cleanupMs: z.number().int().min(1_000).max(120_000).default(30_000),
  }).strict().default({ installMs: 300_000, bootMs: 30_000, cleanupMs: 30_000 }),
}).strict()

export type ObserverRequirement = z.infer<typeof ObserverRequirementSchema>
export type Exercise = z.infer<typeof ExerciseSchema>
export type Scenario = z.infer<typeof ScenarioSchema>

export function renderScenarioSnapshot(scenario: Scenario): string {
  return `${JSON.stringify(ScenarioSchema.parse(scenario), null, 2)}\n`
}

export function scenarioDigest(scenario: Scenario): string {
  return `sha256:${createHash('sha256').update(renderScenarioSnapshot(scenario)).digest('hex')}`
}

export interface BuildScenarioInput {
  source: string
  dshVersion: string
  name?: string | undefined
  suite?: 'quick' | 'full' | undefined
  updateFrom?: string | undefined
  rows?: string[] | undefined
  services?: string[] | undefined
  tools?: string[] | undefined
}
