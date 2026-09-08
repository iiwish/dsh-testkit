import { constants } from 'node:fs'
import { appendFile, lstat, mkdir, mkdtemp, open, readdir, realpath, rm, writeFile } from 'node:fs/promises'
import { createHash } from 'node:crypto'
import { tmpdir } from 'node:os'
import { join, resolve } from 'node:path'

const fail = (category) => { throw new Error(`EVIDENCE_${category}`) }
const fileLimit = 16 * 1024 * 1024
const forbiddenDirectories = new Set(['home', 'user-home', 'harness', 'workspace', 'node_modules', 'storages', 'cache', 'packages'])
const allowedFile = /^(?:report\.(?:json|md)|junit\.xml|scenario\.json|subject\.json|probe(?:-[a-z-]+)?\.json|browser-boot\.json|browser-boot-turn-status\.png|http-boot\.json|filesystem-(?:before-install|before-boot|after-uninstall)\.json|owned-root-final\.json|effective-config(?:-update)?\.yml|(?:process|ports)-[a-z-]+\.txt|[a-zA-Z0-9_.-]+\.(?:stdout|stderr)\.log)$/
const redacted = (value) => value === '[REDACTED]' || value === ''
const credentialKey = /^(?:token|api[_-]?key|password|secret|(?:access|refresh|auth)[_-]?token|client[_-]?secret|authorization|set-cookie|cookies?)$/i

function scan(text) {
  if (/-----BEGIN (?:[A-Z ]+ )?PRIVATE KEY-----/.test(text)
    || /\b(?:gh[pousr]_[A-Za-z0-9]{20,}|github_pat_[A-Za-z0-9_]{20,}|npm_[A-Za-z0-9]{20,})\b/.test(text)) fail('CREDENTIAL')
  for (const match of text.matchAll(/(?:authorization|set-cookie|cookie)\s*:\s*([^\r\n]+)/gi)) {
    if (!redacted(match[1].trim().replace(/^Bearer\s+/i, ''))) fail('CREDENTIAL')
  }
  for (const match of text.matchAll(/https?:\/\/[^\s"'<>]+/gi)) {
    let url
    try { url = new URL(match[0]) } catch { continue }
    if (url.username || url.password) fail('CREDENTIAL')
    for (const [key, value] of url.searchParams) {
      if ((credentialKey.test(key) || key.toLowerCase() === 'auth') && !redacted(value)) fail('CREDENTIAL')
    }
  }
  for (const match of text.matchAll(/["']?(?:token|api[_-]?key|password|secret|(?:access|refresh|auth)[_-]?token|client[_-]?secret)["']?\s*[:=]\s*["']?([^\s"',}\r\n]+)/gi)) {
    if (!redacted(match[1])) fail('CREDENTIAL')
  }
}

function inspect(buffer, name) {
  if (name.endsWith('.png')) {
    if (!buffer.subarray(0, 8).equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]))) fail('FORMAT')
    // Chromium screenshots need no embedded text or arbitrary trailing payloads.
    let offset = 8
    let dataSeen = false
    while (offset + 12 <= buffer.length) {
      const length = buffer.readUInt32BE(offset)
      const type = buffer.toString('ascii', offset + 4, offset + 8)
      if (offset + length + 12 > buffer.length) fail('FORMAT')
      if (offset === 8) {
        if (type !== 'IHDR' || length !== 13) fail('FORMAT')
        const width = buffer.readUInt32BE(offset + 8)
        const height = buffer.readUInt32BE(offset + 12)
        if (width === 0 || height === 0 || width > 16384 || height > 16384) fail('LIMIT')
      } else if (type === 'IDAT') dataSeen = true
      else if (type === 'IEND') {
        if (length !== 0 || !dataSeen || offset + 12 !== buffer.length) fail('FORMAT')
        return
      } else fail('FORMAT')
      offset += length + 12
    }
    fail('FORMAT')
  }
  let text
  try { text = new TextDecoder('utf-8', { fatal: true }).decode(buffer) } catch { fail('FORMAT') }
  if (text.includes('\0')) fail('FORMAT')
  scan(text)
  // Decode JSON escapes as well as scanning raw diagnostics, which may be non-JSON.
  if (name.endsWith('.json')) {
    let parsed
    try { parsed = JSON.parse(text) } catch { return }
    const visit = (value) => {
      if (typeof value === 'string') scan(value)
      else if (value && typeof value === 'object') {
        for (const [key, child] of Object.entries(value)) {
          const emptyContainer = child && typeof child === 'object' && Object.keys(child).length === 0
          if (credentialKey.test(key) && child != null && !emptyContainer && !redacted(String(child))) fail('CREDENTIAL')
          visit(child)
        }
      }
    }
    visit(parsed)
  }
}

let stage
try {
  const args = process.argv.slice(2)
  if (!args[0] || args.slice(1).some((arg) => arg !== '--allow-missing')) fail('PATH')
  const input = resolve(args[0])
  let available = true
  try {
    const metadata = await lstat(input)
    if (metadata.isSymbolicLink()) fail('LINK')
    if (!metadata.isDirectory()) fail('PATH')
  } catch (error) {
    if (error.code === 'ENOENT' && args.includes('--allow-missing')) available = false
    else throw error
  }
  const parent = await realpath(process.env.RUNNER_TEMP || tmpdir())
  stage = await mkdtemp(join(parent, 'dsh-safe-evidence-'))
  const files = []
  let total = 0
  let entries = 0
  async function walk(directory, relative = '', depth = 0) {
    if (depth > 24) fail('LIMIT')
    for (const name of (await readdir(directory)).sort()) {
      if (++entries > 8000) fail('LIMIT')
      const source = join(directory, name)
      const metadata = await lstat(source)
      if (metadata.isSymbolicLink() || (!metadata.isDirectory() && metadata.nlink !== 1)) fail('LINK')
      if (!/^[a-zA-Z0-9][a-zA-Z0-9_.-]*$/.test(name)) fail('PATH')
      const path = relative ? `${relative}/${name}` : name
      if (metadata.isDirectory()) {
        if (forbiddenDirectories.has(name.toLowerCase())) fail('PATH')
        await mkdir(join(stage, path), { mode: 0o700 })
        await walk(source, path, depth + 1)
        continue
      }
      if (!metadata.isFile() || !allowedFile.test(name)) fail('PATH')
      if (metadata.size > fileLimit || files.length >= 4000 || total + metadata.size > 256 * 1024 * 1024) fail('LIMIT')
      const handle = await open(source, constants.O_RDONLY | constants.O_NOFOLLOW)
      let buffer
      try {
        const current = await handle.stat()
        if (!current.isFile() || current.nlink !== 1 || current.ino !== metadata.ino || current.dev !== metadata.dev) fail('LINK')
        if (current.size > fileLimit) fail('LIMIT')
        buffer = Buffer.alloc(current.size + 1)
        let length = 0
        while (length < buffer.length) {
          const { bytesRead } = await handle.read(buffer, length, buffer.length - length, null)
          if (!bytesRead) break
          length += bytesRead
        }
        if (length !== current.size) fail('LIMIT')
        buffer = buffer.subarray(0, length)
      } finally { await handle.close() }
      total += buffer.length
      if (total > 256 * 1024 * 1024) fail('LIMIT')
      inspect(buffer, name)
      await writeFile(join(stage, path), buffer, { flag: 'wx', mode: 0o600 })
      files.push({ path, bytes: buffer.length, sha256: createHash('sha256').update(buffer).digest('hex') })
    }
  }
  if (available) await walk(input)
  await writeFile(join(stage, 'evidence-manifest.json'), JSON.stringify({ schemaVersion: 1, sourceAvailable: available, files }, null, 2), { flag: 'wx', mode: 0o600 })
  if (process.env.GITHUB_OUTPUT) await appendFile(process.env.GITHUB_OUTPUT, `path=${stage}\n`)
  console.log(JSON.stringify({ path: stage }))
} catch (error) {
  if (stage) await rm(stage, { recursive: true, force: true })
  console.error(/^EVIDENCE_[A-Z]+$/.test(error.message) ? error.message : 'EVIDENCE_IO')
  process.exitCode = 1
}
