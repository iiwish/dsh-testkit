import { isExactSemver } from '../../community/validation.js'

export interface DshRegistryMetadata {
  'dist-tags'?: Record<string, unknown>
}

export interface DshReleaseTrain {
  taggedVersions: string[]
  supportedVersions: string[]
  canaryVersions: string[]
}

export function discoverDshReleaseTrain(
  metadata: DshRegistryMetadata,
  supportedVersions: readonly string[],
): DshReleaseTrain {
  const tags = metadata['dist-tags'] ?? {}
  for (const tag of ['latest', 'next']) {
    const value = tags[tag]
    if (value !== undefined && (typeof value !== 'string' || !isExactSemver(value))) {
      throw new Error(`DSH npm dist-tag ${tag} is not an exact semantic version`)
    }
  }
  const taggedVersions = [...new Set(['latest', 'next'].flatMap(tag => {
    const value = tags[tag]
    return typeof value === 'string' && isExactSemver(value) ? [value] : []
  }))].sort((left, right) => left.localeCompare(right))
  const supported = [...new Set(supportedVersions)].sort((left, right) => left.localeCompare(right))
  return {
    taggedVersions,
    supportedVersions: supported,
    canaryVersions: taggedVersions.filter(version => !supported.includes(version)),
  }
}
