import { createHash } from 'node:crypto'

import { z } from 'zod'

import { SCENARIO_SCHEMA_VERSION } from '../version.js'

const EXACT_NPM_VERSION = /^\d+\.\d+\.\d+(?:-[0-9A-Za-z-]+(?:\.[0-9A-Za-z-]+)*)?(?:\+[0-9A-Za-z-]+(?:\.[0-9A-Za-z-]+)*)?$/

export const ObserverRequirementSchema = z.enum(['required', 'preferred', 'off'])
const UniqueStringsSchema = z.array(z.string().min(1)).refine(
  values => new Set(values).size === values.length,
  { message: 'values must be unique' },
)

const HTTP_PATH = /^\/(?:[A-Za-z0-9._~!$&'()*+,;=:@%\/-]*)$/

function validateHttpPath(value: string): boolean {
  if (!HTTP_PATH.test(value)) return false
  if (value.includes('//')) return false
  return value.split('/').every(segment => segment !== '..')
}

export const ExerciseSchema = z.object({
  tool: z.string().min(1),
  arguments: z.record(z.string(), z.unknown()),
}).strict()

export const HttpRouteExpectationSchema = z.object({
  status: z.number().int().min(100).max(599).default(200),
  json: z.record(z.string().min(1), z.unknown()).default({}),
}).strict().default({ status: 200, json: {} })

export const HttpRouteSchema = z.object({
  id: z.string().regex(/^[A-Za-z0-9][A-Za-z0-9._:-]*$/).max(128),
  method: z.literal('GET').default('GET'),
  path: z.string().refine(validateHttpPath, {
    message: 'HTTP route path must be an absolute loopback path without query, fragment, traversal or control characters',
  }),
  expect: HttpRouteExpectationSchema,
}).strict()

export const HttpRoutesSchema = z.object({
  routes: z.array(HttpRouteSchema).min(1).refine(
    routes => new Set(routes.map(route => route.id)).size === routes.length,
    { message: 'HTTP route identifiers must be unique' },
  ),
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
  http: HttpRoutesSchema.optional(),
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
export type HttpRouteExpectation = z.infer<typeof HttpRouteExpectationSchema>
export type HttpRoute = z.infer<typeof HttpRouteSchema>
export type HttpRoutes = z.infer<typeof HttpRoutesSchema>
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
  profile?: string | undefined
  updateFrom?: string | undefined
  rows?: string[] | undefined
  services?: string[] | undefined
  tools?: string[] | undefined
}
