import { readFile, writeFile } from 'node:fs/promises'
import { resolve } from 'node:path'

const root = resolve(import.meta.dirname, '..')
const source = await readFile(resolve(root, 'pnpm-lock.yaml'))
await writeFile(resolve(root, 'assets/runner-pnpm-lock.yaml'), source)
