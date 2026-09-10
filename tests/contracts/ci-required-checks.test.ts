import { readFile } from 'node:fs/promises'

import { describe, expect, it } from 'vitest'
import { parse } from 'yaml'
import { DEFAULT_DSH_NPM_VERSION, SUPPORTED_DSH_NPM_VERSIONS } from '../../src/adapters/dsh/support.js'

const runLifecycle = "github.event_name == 'push' || needs.changes.outputs.lifecycle == 'true'"
const skipLifecycle = "github.event_name == 'pull_request' && needs.changes.outputs.lifecycle != 'true'"

describe('required CI checks', () => {
  it('uses one pinned pnpm setup release across workflows and the composite Action', async () => {
    const setups: { uses: string; with: { version: string } }[] = []
    for (const path of ['.github/workflows/ci.yml', '.github/workflows/dsh-release-watch.yml', '.github/workflows/release.yml', '.github/actions/dsh-test/action.yml']) {
      const workflow = parse(await readFile(path, 'utf8'))
      const jobs = workflow.jobs ? Object.values(workflow.jobs) : [workflow.runs]
      for (const job of jobs as { steps?: typeof setups }[]) {
        setups.push(...(job.steps ?? []).filter(step => step.uses?.startsWith('pnpm/action-setup@')))
      }
    }
    expect(setups).toHaveLength(8)
    expect(new Set(setups.map(step => step.uses)).size).toBe(1)
    expect(setups.every(step => /^pnpm\/action-setup@[a-f0-9]{40}$/.test(step.uses))).toBe(true)
    expect(setups.every(step => step.with.version === '11.1.3')).toBe(true)
  })

  it('runs every formally supported host through all three real-host suites', async () => {
    const workflow = parse(await readFile('.github/workflows/ci.yml', 'utf8'))
    expect(workflow.jobs['real-host'].env.DSH_TESTKIT_DSH_VERSION).toBe(DEFAULT_DSH_NPM_VERSION)
    expect(workflow.jobs['real-host-compat'].strategy.matrix['dsh-version']).toEqual(SUPPORTED_DSH_NPM_VERSIONS.slice(1))
    for (const name of ['real-host', 'real-host-compat']) {
      for (const command of ['pnpm test:e2e', 'pnpm test:bundle-e2e', 'pnpm test:pack']) {
        expect(workflow.jobs[name].steps).toContainEqual(expect.objectContaining({
          run: command, env: { DSH_TESTKIT_E2E_OUTPUT: '${{ runner.temp }}/dsh-testkit-evidence' },
        }))
      }
      expect(workflow.jobs[name].steps.some((step: Record<string, unknown>) => step.id === 'safety')).toBe(true)
    }
  })

  it('runs both canary lanes independently and uploads evidence even after failure', async () => {
    const workflow = parse(await readFile('.github/workflows/dsh-release-watch.yml', 'utf8'))
    const job = workflow.jobs.canary
    expect(job.strategy.matrix.lane).toEqual(['lifecycle', 'bundle'])
    const upload = job.steps.find((step: Record<string, unknown>) => String(step.uses).startsWith('actions/upload-artifact@'))
    expect(upload).toMatchObject({
      if: "always() && steps.safety.outcome == 'success'",
      with: {
        name: 'dsh-canary-${{ matrix.dsh }}-${{ matrix.lane }}',
        path: '${{ steps.safety.outputs.path }}',
        'include-hidden-files': false,
        'retention-days': 14,
      },
    })
    expect(job.steps).toContainEqual(expect.objectContaining({
      if: "matrix.lane == 'lifecycle'", run: 'pnpm test:e2e',
      env: { DSH_TESTKIT_E2E_OUTPUT: '${{ runner.temp }}/dsh-testkit-evidence' },
    }))
    expect(job.steps).toContainEqual(expect.objectContaining({
      if: "matrix.lane == 'bundle'", run: 'pnpm test:bundle-e2e',
      env: { DSH_TESTKIT_E2E_OUTPUT: '${{ runner.temp }}/dsh-testkit-evidence' },
    }))
  })

  it.each(['real-host', 'action-smoke'])('%s keeps its check identity for documentation-only pull requests', async (jobName) => {
    const workflow = parse(await readFile('.github/workflows/ci.yml', 'utf8'))
    const job = workflow.jobs[jobName]

    expect(job.if).toBeUndefined()
    expect(job.steps).toContainEqual(expect.objectContaining({
      if: skipLifecycle,
      run: expect.stringContaining('No lifecycle-impacting changes'),
    }))

    const executionSteps = job.steps.filter((step: Record<string, unknown>) => step.if !== skipLifecycle && !['safety', 'evidence'].includes(String(step.id)))
    expect(executionSteps.length).toBeGreaterThan(0)
    expect(executionSteps.every((step: Record<string, unknown>) => step.if === runLifecycle)).toBe(true)
  })

  it('runs Composite Action smoke with a read-only token', async () => {
    const workflow = parse(await readFile('.github/workflows/ci.yml', 'utf8'))

    for (const jobName of ['action-smoke', 'action-smoke-compat']) {
      expect(workflow.jobs[jobName].permissions).toEqual({ contents: 'read' })
    }
  })

  it('runs both Action smoke subjects across every compatibility host', async () => {
    const workflow = parse(await readFile('.github/workflows/ci.yml', 'utf8'))
    const entries = workflow.jobs['action-smoke-compat'].strategy.matrix.include

    expect(entries).toHaveLength(SUPPORTED_DSH_NPM_VERSIONS.slice(1).length * 2)
    for (const dshVersion of ['0.1.5-rc.1', '0.1.2-rc.1', '0.1.0-rc.8', '0.1.0-rc.7', '0.1.0-rc.6']) {
      expect(entries).toEqual(expect.arrayContaining([
        { plugin: 'fixtures/healthy-plugin', 'dsh-version': dshVersion },
        { plugin: 'fixtures/boot-failure-plugin', 'dsh-version': dshVersion },
      ]))
    }
  })

  it('defaults JUnit publication to annotations without Checks API permission', async () => {
    const action = parse(await readFile('.github/actions/dsh-test/action.yml', 'utf8'))

    expect(action.inputs['publish-junit-check']).toMatchObject({
      required: false,
      default: 'false',
    })
    const junit = action.runs.steps.find((step: Record<string, unknown>) => step.name === 'Publish JUnit')
    expect(junit.with.annotate_only).toBe("${{ inputs.publish-junit-check != 'true' }}")
    expect(junit.if).toBe("always() && steps.safety.outcome == 'success'")
    expect(junit.with.report_paths).toBe('${{ steps.safety.outputs.path }}/junit.xml')
  })

  it('gates every artifact outlet with the shared scanner and staged path', async () => {
    for (const path of ['.github/workflows/ci.yml', '.github/workflows/dsh-release-watch.yml', '.github/workflows/release.yml', '.github/actions/dsh-test/action.yml']) {
      const workflow = parse(await readFile(path, 'utf8'))
      const jobs = workflow.jobs ? Object.values(workflow.jobs) : [workflow.runs]
      for (const job of jobs as { steps?: Record<string, any>[] }[]) {
        for (const outlet of job.steps?.filter(step => String(step.uses).startsWith('actions/upload-artifact@')) ?? []) {
          expect(outlet.if).toBe("always() && steps.safety.outcome == 'success'")
          expect(outlet.with.path).toBe('${{ steps.safety.outputs.path }}')
          expect(outlet.with['include-hidden-files']).toBe(false)
          const safety = job.steps?.find(step => step.id === 'safety')
          expect(safety?.run).toContain('scripts/prepare-evidence.mjs')
          expect(safety?.if).toContain('always()')
          expect(job.steps!.indexOf(safety!)).toBeLessThan(job.steps!.indexOf(outlet))
        }
      }
    }
  })

  it('closes monitoring with an always-run summary of discovery and canary results', async () => {
    const workflow = parse(await readFile('.github/workflows/dsh-release-watch.yml', 'utf8'))
    expect(workflow.jobs.summary).toMatchObject({
      if: 'always()', needs: ['discover', 'canary'],
    })
    expect(workflow.jobs.summary.steps).toContainEqual(expect.objectContaining({ run: 'node scripts/summarize-dsh-release-watch.mjs' }))
  })
})
