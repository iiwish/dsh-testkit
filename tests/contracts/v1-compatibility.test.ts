import { readFile } from 'node:fs/promises'
import { resolve } from 'node:path'

import { Ajv2020 } from 'ajv/dist/2020.js'
import addFormatsModule from 'ajv-formats'
import { describe, expect, it } from 'vitest'

import { RunReportSchema } from '../../src/domain/report.js'
import { ScenarioSchema } from '../../src/domain/scenario.js'

async function readJson(path: string): Promise<unknown> {
  return JSON.parse(await readFile(resolve(process.cwd(), path), 'utf8'))
}

describe('published v1 contract compatibility', () => {
  it.each([
    {
      name: 'scenario',
      fixture: 'tests/contracts/fixtures/scenario-v1.0.1.json',
      schema: 'schemas/scenario-v1.json',
      runtime: ScenarioSchema,
    },
    {
      name: 'report',
      fixture: 'tests/contracts/fixtures/report-v1.0.1.json',
      schema: 'schemas/report-v1.json',
      runtime: RunReportSchema,
    },
  ])('accepts the shipped $name fixture with runtime and JSON schemas', async ({ fixture, schema, runtime }) => {
    const [fixtureValue, schemaValue] = await Promise.all([readJson(fixture), readJson(schema)])
    const ajv = new Ajv2020({ allErrors: true, strict: true })
    addFormatsModule.default(ajv)

    expect(runtime.safeParse(fixtureValue).success).toBe(true)
    expect(ajv.validate(schemaValue as object, fixtureValue), ajv.errorsText()).toBe(true)
  })

  it('accepts the optional loopback HTTP route contract in both schemas', async () => {
    const schemaValue = await readJson('schemas/scenario-v1.json')
    const scenario = {
      schemaVersion: 1,
      name: 'http-route-contract',
      subject: { source: '.' },
      dsh: { version: '0.1.0-rc.6' },
      profile: 'web',
      http: {
        routes: [{
          id: 'health',
          method: 'GET',
          path: '/health',
          expect: { status: 200, json: { version: '$subject.packageVersion' } },
        }],
      },
    }
    const ajv = new Ajv2020({ allErrors: true, strict: true })
    addFormatsModule.default(ajv)

    expect(ScenarioSchema.safeParse(scenario).success).toBe(true)
    expect(ajv.validate(schemaValue as object, scenario), ajv.errorsText()).toBe(true)
  })
})
