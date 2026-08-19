export const SUPPORTED_DSH_NPM_VERSIONS = ['0.1.0-rc.7', '0.1.0-rc.6'] as const

export const DEFAULT_DSH_NPM_VERSION = SUPPORTED_DSH_NPM_VERSIONS[0]

export type SupportedDshNpmVersion = typeof SUPPORTED_DSH_NPM_VERSIONS[number]

export class UnsupportedDshVersionError extends Error {
  readonly exitCode = 4

  constructor(readonly version: string) {
    super(`Unsupported DSH version ${version}; supported versions: ${SUPPORTED_DSH_NPM_VERSIONS.join(', ')}`)
    this.name = 'UnsupportedDshVersionError'
  }
}

export function isSupportedDshVersion(version: string): version is SupportedDshNpmVersion {
  return (SUPPORTED_DSH_NPM_VERSIONS as readonly string[]).includes(version)
}

export function assertSupportedDshVersion(version: string): asserts version is SupportedDshNpmVersion {
  if (!isSupportedDshVersion(version)) throw new UnsupportedDshVersionError(version)
}
