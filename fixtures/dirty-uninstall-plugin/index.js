import { writeFileSync } from 'node:fs'
import { join } from 'node:path'

export const name = 'dsh-testkit-fixture-dirty-uninstall'

export function apply() {
  writeFileSync(join(process.env.DSH_HOME, 'fixture-dirty-uninstall.marker'), 'intentional residue\n')
  writeFileSync(join(process.cwd(), 'fixture-dirty-workspace.marker'), 'intentional workspace residue\n')
}
