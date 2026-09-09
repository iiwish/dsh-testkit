import { createRequire } from 'node:module'

import { describe, expect, it } from 'vitest'

const require = createRequire(import.meta.url)
const xmlbuilderRequire = createRequire(require.resolve('xmlbuilder2'))
const yaml = xmlbuilderRequire('js-yaml') as {
  load(source: string, options: { maxTotalMergeKeys: number }): unknown
}

describe('JUnit dependency security', () => {
  it('counts empty YAML merge sources against the work budget', () => {
    const input = 'arr: &arr [{}, {}, {}]\ntarget: { <<: *arr }\n'
    expect(() => yaml.load(input, { maxTotalMergeKeys: 2 })).toThrow(/merge/i)
  })
})
