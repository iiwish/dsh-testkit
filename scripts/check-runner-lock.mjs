import { readFile } from 'node:fs/promises'
import { resolve } from 'node:path'

const root = resolve(import.meta.dirname, '..')
const [projectLock, runnerLock] = await Promise.all([
  readFile(resolve(root, 'pnpm-lock.yaml')),
  readFile(resolve(root, 'assets/runner-pnpm-lock.yaml')),
])

if (!projectLock.equals(runnerLock)) {
  throw new Error('assets/runner-pnpm-lock.yaml is stale; copy pnpm-lock.yaml after dependency changes')
}
