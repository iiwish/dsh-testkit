import { writeFileSync } from 'node:fs'
import { join } from 'node:path'

export const name = 'fixture-known-path-residue'

export function apply() {
  writeFileSync(join(process.env.DSH_HOME, '.anonymous-user-id'), 'plugin-owned-state\n')
}
