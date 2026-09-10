import { describe, expect, it } from 'vitest'

import { assertSupportedDshVersion, DEFAULT_DSH_NPM_VERSION, SUPPORTED_DSH_NPM_VERSIONS } from '../../src/adapters/dsh/support.js'

describe('reviewed DSH support', () => {
  it('accepts the exact rc.1 host without changing the default or dropping older hosts', () => {
    expect(DEFAULT_DSH_NPM_VERSION).toBe('0.1.1-rc.2')
    expect(SUPPORTED_DSH_NPM_VERSIONS).toEqual([
      '0.1.1-rc.2', '0.1.5-rc.1', '0.1.2-rc.1', '0.1.0-rc.8', '0.1.0-rc.7', '0.1.0-rc.6',
    ])
    expect(() => assertSupportedDshVersion('0.1.5-rc.1')).not.toThrow()
    expect(() => assertSupportedDshVersion('0.1.2-rc.1')).not.toThrow()
  })

  it.each(['0.1.2-alpha.5', '0.1.3-alpha.2', '0.1.5-alpha.1', '0.1.5-alpha.2', '0.1.5-rc.2', 'latest', '^0.1.2'])('rejects unreviewed or mutable host %s', (version) => {
    expect(() => assertSupportedDshVersion(version)).toThrow(expect.objectContaining({ exitCode: 4 }))
  })
})
