import { z } from 'zod'

import { ScenarioSchema } from '../domain/scenario.js'

export const WorkerRequestSchema = z.object({
  schemaVersion: z.literal(1),
  runId: z.string().min(1),
  scenario: ScenarioSchema,
  outputDir: z.string().min(1),
  reproductionCommand: z.string().min(1),
  allowMutableSource: z.boolean().default(false),
  runner: z.enum(['docker', 'local']),
  unsafeLocal: z.boolean(),
}).strict()

export type WorkerRequest = z.infer<typeof WorkerRequestSchema>
