import { readFile } from 'node:fs/promises'
import { resolve } from 'node:path'

import { describe, expect, it } from 'vitest'
import { parse } from 'yaml'

describe('published distribution verification', () => {
  it('is manual, read-only, checks v0 identity and runs registry CLI plus released Action', async () => {
    const source = await readFile(resolve(import.meta.dirname, '../../.github/workflows/release-consumer.yml'), 'utf8')
    const workflow = parse(source)
    expect(Object.keys(workflow.on)).toEqual(['workflow_dispatch'])
    expect(workflow.permissions).toEqual({ contents: 'read' })
    const steps = workflow.jobs.verify.steps
    expect(steps[0].with).toMatchObject({ ref: 'v0', 'persist-credentials': false })
    const identity = steps.find((step: { name?: string }) => step.name === 'Verify release identity')
    expect(identity.run).toContain('^[0-9a-f]{40}$')
    expect(identity.run).toContain('git rev-parse HEAD')
    expect(identity.run).toContain('git rev-list -n 1 "v$version"')
    expect(source).toContain('https://registry.npmjs.org/')
    expect(source).toContain('--ignore-scripts --omit=optional')
    expect(source).toContain('npm audit --omit=dev --audit-level=high')
    expect(source).toContain('npm audit signatures')
    expect(source).toContain('consumer/node_modules/dsh-testkit/dist/src/cli.js')
    expect(source).toContain('--dsh 0.1.5-rc.1')
    expect(steps.find((step: { uses?: string }) => step.uses === './.github/actions/dsh-test').with['dsh-version']).toBe('0.1.5-rc.1')
    expect(steps.find((step: { uses?: string }) => step.uses === './.github/actions/dsh-test').with['publish-junit-check']).toBe('false')
    const upload = steps.find((step: { uses?: string }) => step.uses?.startsWith('actions/upload-artifact@'))
    expect(upload.if).toContain("steps.safety.outcome == 'success'")
    expect(upload.with['include-hidden-files']).toBe(false)
    expect(source).not.toContain('npm publish')
  })
})
