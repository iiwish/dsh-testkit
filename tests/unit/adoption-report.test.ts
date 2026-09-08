import { describe, expect, it } from 'vitest'
// @ts-expect-error Test-only JavaScript contract used by the installed-consumer driver.
import { assertAdoptionReport } from '../e2e/adoption-checks.mjs'

const report = () => ({
  verdict: 'failed',
  subject: { packageName: 'dsh-plugin-template', gitCommit: '31af7ebeb8d07cff73253f52f9a9f530cde9de9a' },
  dsh: { version: '0.1.2-rc.1' },
  environment: { runner: 'docker', imageId: `sha256:${'a'.repeat(64)}` },
  stages: [
    { id: 'assemble', status: 'failed', assertions: [{ id: 'config.row.dsh-testkit-deliberately-missing', status: 'failed', actual: false }] },
    { id: 'register', status: 'skipped', assertions: [] },
    { id: 'cleanup', status: 'passed', assertions: [] },
  ],
})

describe('external adoption report contract', () => {
  it('accepts only the deliberate row failure at configuration assembly', () => {
    expect(() => assertAdoptionReport(report(), true)).not.toThrow()
  })
  it('rejects an unrelated failed lifecycle or missing cleanup', () => {
    const wrong = report()
    wrong.stages[0]!.assertions[0]!.id = 'config.row.unrelated'
    expect(() => assertAdoptionReport(wrong, true)).toThrow()
    const dirty = report()
    dirty.stages[2]!.status = 'failed'
    expect(() => assertAdoptionReport(dirty, true)).toThrow()
  })
  it('requires actual positive install, boot, uninstall and reboot stages', () => {
    const invalid = { ...report(), verdict: 'passed' }
    expect(() => assertAdoptionReport(invalid, false)).toThrow()
  })
})
