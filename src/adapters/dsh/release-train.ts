import { isExactSemver } from '../../community/validation.js'

export interface DshRegistryMetadata {
  'dist-tags'?: Record<string, unknown>
  versions?: Record<string, unknown>
}

export interface DshGitHubRelease {
  tag_name?: unknown
  draft?: unknown
  immutable?: unknown
}

export interface DshReleaseTrain {
  taggedVersions: string[]
  upstreamVersions: string[]
  supportedVersions: string[]
  canaryVersions: string[]
  pendingNpmVersions: string[]
}

function sortedUnique(values: Iterable<string>): string[] {
  return [...new Set(values)].sort(compareExactSemver)
}

function compareExactSemver(left: string, right: string): number {
  const parse = (value: string): [number, number, number, string[]] => {
    const buildSeparator = value.indexOf('+')
    const withoutBuild = buildSeparator === -1 ? value : value.slice(0, buildSeparator)
    const prereleaseSeparator = withoutBuild.indexOf('-')
    const core = prereleaseSeparator === -1 ? withoutBuild : withoutBuild.slice(0, prereleaseSeparator)
    const prerelease = prereleaseSeparator === -1 ? '' : withoutBuild.slice(prereleaseSeparator + 1)
    const [major = 0, minor = 0, patch = 0] = core.split('.').map(Number)
    return [major, minor, patch, prerelease === '' ? [] : prerelease.split('.')]
  }
  const [leftMajor, leftMinor, leftPatch, leftPrerelease] = parse(left)
  const [rightMajor, rightMinor, rightPatch, rightPrerelease] = parse(right)
  const corePairs: Array<readonly [number, number]> = [
    [leftMajor, rightMajor],
    [leftMinor, rightMinor],
    [leftPatch, rightPatch],
  ]
  for (const [leftPart, rightPart] of corePairs) {
    if (leftPart !== rightPart) return leftPart - rightPart
  }
  if (leftPrerelease.length === 0 || rightPrerelease.length === 0) {
    return leftPrerelease.length === rightPrerelease.length ? 0 : leftPrerelease.length === 0 ? 1 : -1
  }
  for (let index = 0; index < Math.max(leftPrerelease.length, rightPrerelease.length); index += 1) {
    const leftPart = leftPrerelease[index]
    const rightPart = rightPrerelease[index]
    if (leftPart === undefined || rightPart === undefined) return leftPart === undefined ? -1 : 1
    if (leftPart === rightPart) continue
    const leftNumeric = /^\d+$/.test(leftPart)
    const rightNumeric = /^\d+$/.test(rightPart)
    if (leftNumeric && rightNumeric) return Number(leftPart) - Number(rightPart)
    if (leftNumeric !== rightNumeric) return leftNumeric ? -1 : 1
    return leftPart.localeCompare(rightPart)
  }
  return 0
}

function officialReleaseVersions(releases: readonly DshGitHubRelease[]): string[] {
  return sortedUnique(releases.flatMap(release => {
    if (release.draft === true || release.immutable !== true || typeof release.tag_name !== 'string') return []
    const match = /^dsh-v(.+)$/.exec(release.tag_name)
    if (match?.[1] === undefined || !isExactSemver(match[1])) return []
    return [match[1]]
  }))
}

export function discoverDshReleaseTrain(
  metadata: DshRegistryMetadata,
  supportedVersions: readonly string[],
  releases: readonly DshGitHubRelease[] = [],
): DshReleaseTrain {
  const tags = metadata['dist-tags'] ?? {}
  for (const tag of ['latest', 'next']) {
    const value = tags[tag]
    if (value !== undefined && (typeof value !== 'string' || !isExactSemver(value))) {
      throw new Error(`DSH npm dist-tag ${tag} is not an exact semantic version`)
    }
  }
  const taggedVersions = sortedUnique(['latest', 'next'].flatMap(tag => {
    const value = tags[tag]
    return typeof value === 'string' && isExactSemver(value) ? [value] : []
  }))
  const upstreamVersions = officialReleaseVersions(releases)
  const supported = sortedUnique(supportedVersions)
  const publishedVersions = new Set([
    ...taggedVersions,
    ...Object.keys(metadata.versions ?? {}).filter(isExactSemver),
  ])
  const newestSupported = supported.at(-1)
  const candidates = sortedUnique([...taggedVersions, ...upstreamVersions])
    .filter(version => !supported.includes(version)
      && (newestSupported === undefined || compareExactSemver(version, newestSupported) > 0))
  return {
    taggedVersions,
    upstreamVersions,
    supportedVersions: supported,
    canaryVersions: candidates.filter(version => publishedVersions.has(version)),
    pendingNpmVersions: candidates.filter(version => !publishedVersions.has(version)),
  }
}
