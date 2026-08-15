import { mkdtemp, mkdir, rm, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'

import { describe, expect, it } from 'vitest'

import {
  captureSystemSnapshot,
  diffSnapshots,
  normalizeProcessCommands,
  snapshotFiles,
} from '../../src/observers/snapshot.js'

describe('filesystem snapshots', () => {
  it('attributes added, modified and removed entries by content', async () => {
    const root = await mkdtemp(join(tmpdir(), 'dsh-snapshot-'))
    await mkdir(join(root, 'removed'))
    await writeFile(join(root, 'modified.txt'), 'before\n')
    const before = await snapshotFiles(root)

    await writeFile(join(root, 'modified.txt'), 'after\n')
    await writeFile(join(root, 'added.txt'), 'added\n')
    await rm(join(root, 'removed'), { recursive: true })
    const after = await snapshotFiles(root)

    expect(diffSnapshots(before, after).map(change => `${change.kind}:${change.path}`)).toEqual([
      'added:added.txt',
      'modified:modified.txt',
      'removed:removed/',
    ])
  })
})

describe('system snapshots', () => {
  it('captures processes before starting the listening-port observer', async () => {
    const calls: string[] = []
    const result = await captureSystemSnapshot(
      async () => { calls.push('process'); return 'processes' },
      async () => { calls.push('ports'); return 'ports' },
    )

    expect(calls).toEqual(['process', 'ports'])
    expect(result).toEqual({ processes: 'processes', ports: 'ports' })
  })

  it('removes Testkit observer commands from process evidence', () => {
    const snapshot = [
      '1 0 Ss node /app/worker.js',
      '2 1 S ps -eo pid=,ppid=,stat=,command=',
      '3 1 S ss -lntup',
      '4 1 S lsof -nP -iTCP -sTCP:LISTEN',
      '',
    ].join('\n')

    expect(normalizeProcessCommands(snapshot)).toEqual(['node /app/worker.js'])
  })
})
