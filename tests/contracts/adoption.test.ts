import { readFile } from 'node:fs/promises'
import { describe, expect, it } from 'vitest'
import { parse } from 'yaml'

describe('isolated external adoption acceptance', () => {
  it('pins the external repository and keeps its checkout credential-free and Action read-only', async () => {
    const workflow = parse(await readFile('.github/workflows/ci.yml', 'utf8'))
    const job = workflow.jobs.adoption
    expect(job.permissions).toEqual({ contents: 'read' })
    const checkout = job.steps.find((step: { with?: { repository?: string } }) => step.with?.repository)
    expect(checkout.with).toMatchObject({ repository: 'bugmaker2/dsh-plugin-template', ref: '31af7ebeb8d07cff73253f52f9a9f530cde9de9a', 'persist-credentials': false })
    expect(job.steps).toContainEqual(expect.objectContaining({ uses: './.github/actions/dsh-test', with: expect.objectContaining({ plugin: '.adoption-subject', 'dsh-version': '0.1.2-rc.1', 'publish-junit-check': 'false' }) }))
  })
})
