import { execFile } from 'node:child_process'
import { createHash } from 'node:crypto'
import { readFile, readdir, readlink, stat, writeFile } from 'node:fs/promises'
import { basename, join, relative } from 'node:path'
import { promisify } from 'node:util'

const executeFile = promisify(execFile)
const EMPTY_SHA256 = 'sha256:e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855'

export interface FileEntry {
  path: string
  kind: 'directory' | 'file' | 'symlink'
  size: number
  digest: string
}

export interface FileSnapshot {
  root: string
  entries: FileEntry[]
}

export interface FileChange {
  path: string
  kind: 'added' | 'modified' | 'removed'
  before?: FileEntry
  after?: FileEntry
}

async function visit(root: string, current: string, entries: FileEntry[]): Promise<void> {
  for (const entry of await readdir(current, { withFileTypes: true })) {
    const path = join(current, entry.name)
    if (entry.isDirectory()) {
      entries.push({
        path: `${relative(root, path)}/`,
        kind: 'directory',
        size: 0,
        digest: EMPTY_SHA256,
      })
      await visit(root, path, entries)
    } else if (entry.isFile()) {
      const metadata = await stat(path)
      const digest = createHash('sha256').update(await readFile(path)).digest('hex')
      entries.push({ path: relative(root, path), kind: 'file', size: metadata.size, digest: `sha256:${digest}` })
    } else if (entry.isSymbolicLink()) {
      const target = await readlink(path)
      const digest = createHash('sha256').update(target).digest('hex')
      entries.push({
        path: relative(root, path),
        kind: 'symlink',
        size: Buffer.byteLength(target),
        digest: `sha256:${digest}`,
      })
    }
  }
}

export async function snapshotFiles(root: string): Promise<FileSnapshot> {
  const entries: FileEntry[] = []
  try {
    await visit(root, root, entries)
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code !== 'ENOENT') throw error
  }
  entries.sort((left, right) => left.path.localeCompare(right.path))
  return { root, entries }
}

export async function writeSnapshot(path: string, snapshot: unknown): Promise<string> {
  await writeFile(path, `${JSON.stringify(snapshot, null, 2)}\n`)
  return basename(path)
}

async function capture(executable: string, args: string[]): Promise<string | null> {
  try {
    const result = await executeFile(executable, args, { maxBuffer: 8 * 1024 * 1024 })
    return result.stdout
  } catch {
    return null
  }
}

export async function captureProcesses(): Promise<string | null> {
  return await capture('ps', ['-eo', 'pid=,ppid=,stat=,command='])
}

export async function captureListeningPorts(): Promise<string | null> {
  if (process.platform === 'linux') return await capture('ss', ['-lntup'])
  if (process.platform === 'darwin') return await capture('lsof', ['-nP', '-iTCP', '-sTCP:LISTEN'])
  return null
}

export async function captureSystemSnapshot(
  processCapture: () => Promise<string | null> = captureProcesses,
  portCapture: () => Promise<string | null> = captureListeningPorts,
): Promise<{ processes: string | null; ports: string | null }> {
  const processes = await processCapture()
  const ports = await portCapture()
  return { processes, ports }
}

export function normalizeProcessCommands(value: string | null): string[] {
  if (value === null) return []
  const observerCommands = [
    'ps -eo pid=,ppid=,stat=,command=',
    'ss -lntup',
    'lsof -nP -iTCP -sTCP:LISTEN',
  ]
  return value.split('\n').flatMap(line => {
    const normalized = line.trim()
    const match = normalized.match(/^\d+\s+\d+\s+\S+\s+(.+)$/)
    if (match?.[1] === undefined || observerCommands.some(command => match[1] === command)) return []
    return [match[1]]
  }).sort()
}

export function diffSnapshots(before: FileSnapshot, after: FileSnapshot): FileChange[] {
  const beforeByPath = new Map(before.entries.map(entry => [entry.path, entry]))
  const afterByPath = new Map(after.entries.map(entry => [entry.path, entry]))
  const paths = [...new Set([...beforeByPath.keys(), ...afterByPath.keys()])].sort()
  const changes: FileChange[] = []
  for (const path of paths) {
    const beforeEntry = beforeByPath.get(path)
    const afterEntry = afterByPath.get(path)
    if (beforeEntry === undefined && afterEntry !== undefined) {
      changes.push({ path, kind: 'added', after: afterEntry })
    } else if (beforeEntry !== undefined && afterEntry === undefined) {
      changes.push({ path, kind: 'removed', before: beforeEntry })
    } else if (beforeEntry !== undefined && afterEntry !== undefined
      && (beforeEntry.kind !== afterEntry.kind
        || beforeEntry.size !== afterEntry.size
        || beforeEntry.digest !== afterEntry.digest)) {
      changes.push({ path, kind: 'modified', before: beforeEntry, after: afterEntry })
    }
  }
  return changes
}
