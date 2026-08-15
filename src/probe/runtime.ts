import { mkdir, rename, writeFile } from 'node:fs/promises'
import { dirname } from 'node:path'

interface ProbeConfig {
  schemaVersion: 1
  output: string
  mode: 'present' | 'absent'
  services: string[]
  tools: string[]
  exercise: Array<{ tool: string; arguments: Record<string, unknown> }>
  settleMs?: number
}

interface RuntimeContext {
  get(name: string): unknown
}

interface ToolRuntime {
  schemas(): Array<{ name: string }>
  execute(input: {
    callId: string
    name: string
    arguments: unknown
    signal: AbortSignal
  }): Promise<{ isError: boolean; content: unknown; value?: unknown }>
}

function assertion(id: string, pass: boolean, message: string, expected: unknown, actual: unknown) {
  return { id, status: pass ? 'passed' : 'failed', message, expected, actual }
}

async function persist(output: string, payload: unknown): Promise<void> {
  await mkdir(dirname(output), { recursive: true })
  const temporary = `${output}.${process.pid}.tmp`
  await writeFile(temporary, `${JSON.stringify(payload, null, 2)}\n`)
  await rename(temporary, output)
}

export const name = 'dsh-testkit-runtime-probe'

export async function apply(ctx: RuntimeContext): Promise<void> {
  const raw = process.env.DSH_TESTKIT_PROBE_CONFIG
  if (raw === undefined) throw new Error('DSH_TESTKIT_PROBE_CONFIG is required')
  const config = JSON.parse(raw) as ProbeConfig
  const assertions: ReturnType<typeof assertion>[] = []
  const exercises: ReturnType<typeof assertion>[] = []

  const expectedPresent = config.mode === 'present'
  const started = Date.now()
  const settleMs = Math.max(1, config.settleMs ?? 500)
  const earliestObservation = started + settleMs
  const deadline = started + Math.max(settleMs * 3, 100)
  let tools = ctx.get('tools') as ToolRuntime | undefined
  let toolNames = tools?.schemas().map(schema => schema.name) ?? []
  while (Date.now() < deadline) {
    tools = ctx.get('tools') as ToolRuntime | undefined
    toolNames = tools?.schemas().map(schema => schema.name) ?? []
    const servicesReady = config.services.every(service => (
      (ctx.get(service) !== undefined) === expectedPresent
    ))
    const toolsReady = config.tools.every(tool => toolNames.includes(tool) === expectedPresent)
    if (Date.now() >= earliestObservation && servicesReady && toolsReady) break
    await new Promise(resolve => setTimeout(resolve, 50))
  }

  for (const service of config.services) {
    const present = ctx.get(service) !== undefined
    assertions.push(assertion(
      `service.${service}`,
      present === expectedPresent,
      `${service} service is ${present ? 'registered' : 'absent'}`,
      expectedPresent,
      present,
    ))
  }

  for (const tool of config.tools) {
    const present = toolNames.includes(tool)
    assertions.push(assertion(
      `tool.${tool}`,
      present === expectedPresent,
      `${tool} tool is ${present ? 'registered' : 'absent'}`,
      expectedPresent,
      present,
    ))
  }

  if (config.mode === 'present') {
    if (config.exercise.length === 0) {
      exercises.push(assertion(
        'exercise.runtime-probe',
        true,
        'Runtime probe completed in the loaded plugin context',
        'completed',
        'completed',
      ))
    }
    for (const [index, exercise] of config.exercise.entries()) {
      try {
        if (tools === undefined) throw new Error('tools service is absent')
        const result = await tools.execute({
          callId: `dsh-testkit-${index + 1}`,
          name: exercise.tool,
          arguments: exercise.arguments,
          signal: new AbortController().signal,
        })
        exercises.push(assertion(
          `exercise.${exercise.tool}.${index + 1}`,
          !result.isError,
          result.isError ? `Tool ${exercise.tool} returned an error` : `Tool ${exercise.tool} completed`,
          false,
          result.isError,
        ))
      } catch (error) {
        exercises.push(assertion(
          `exercise.${exercise.tool}.${index + 1}`,
          false,
          error instanceof Error ? error.message : String(error),
          'successful tool result',
          'exception',
        ))
      }
    }
  }

  await persist(config.output, {
    schemaVersion: 1,
    capturedAt: new Date().toISOString(),
    mode: config.mode,
    services: Object.fromEntries(config.services.map(service => [service, ctx.get(service) !== undefined])),
    tools: toolNames,
    assertions,
    exercises,
  })
}

export default { name, apply }
