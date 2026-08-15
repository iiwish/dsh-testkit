import { spawn } from 'node:child_process'
import { access, mkdir, rm, writeFile } from 'node:fs/promises'
import { basename, join } from 'node:path'

export interface CommandOptions {
  executable: string
  args?: string[]
  cwd: string
  env?: NodeJS.ProcessEnv
  timeoutMs: number
  logDir: string
  logName: string
  redactions?: string[]
  stdin?: string
  completionFile?: string
  beforeCompletionStop?: (pid: number | undefined) => Promise<void>
  inheritEnv?: boolean
  signal?: AbortSignal
}

export interface CommandResult {
  command: string[]
  exitCode: number | null
  signal: NodeJS.Signals | null
  timedOut: boolean
  stoppedAfterCompletion: boolean
  redactionApplied: boolean
  redactionMatches: number[]
  interruptedBy: NodeJS.Signals | null
  durationMs: number
  stdout: string
  stderr: string
  stdoutTruncated: boolean
  stderrTruncated: boolean
  artifacts: string[]
}

const OUTPUT_LIMIT_BYTES = 8 * 1024 * 1024
const TRUNCATION_NOTICE = `\n[DSH Testkit truncated command output after ${OUTPUT_LIMIT_BYTES} bytes]\n`

function redact(value: string, redactions: readonly string[]): string {
  let result = value
  for (const secret of [...redactions].filter(Boolean).sort((left, right) => right.length - left.length)) {
    result = result.replaceAll(secret, '[REDACTED]')
  }
  return result
}

function terminateProcess(pid: number | undefined, signal: NodeJS.Signals): void {
  if (pid === undefined) return
  try {
    if (process.platform === 'win32') process.kill(pid, signal)
    else process.kill(-pid, signal)
  } catch (error) {
    const code = (error as NodeJS.ErrnoException).code
    if (code !== 'ESRCH') throw error
  }
}

export async function replaceOwnedFile(path: string, content: string | Buffer): Promise<void> {
  await rm(path, { force: true })
  await writeFile(path, content, { flag: 'wx', mode: 0o600 })
}

export async function runCommand(options: CommandOptions): Promise<CommandResult> {
  options.signal?.throwIfAborted()
  const args = options.args ?? []
  const redactions = options.redactions ?? []
  const started = Date.now()
  await mkdir(options.logDir, { recursive: true })

  return await new Promise<CommandResult>((resolve, reject) => {
    const child = spawn(options.executable, args, {
      cwd: options.cwd,
      env: { ...(options.inheritEnv === false ? {} : process.env), ...options.env },
      shell: false,
      detached: process.platform !== 'win32',
      stdio: ['pipe', 'pipe', 'pipe'],
    })
    let stdout = ''
    let stderr = ''
    let stdoutBytes = 0
    let stderrBytes = 0
    let stdoutTruncated = false
    let stderrTruncated = false
    let timedOut = false
    let stoppedAfterCompletion = false
    let settled = false
    let checkingCompletion = false
    let interruptedBy: NodeJS.Signals | null = null
    let completionPoll: NodeJS.Timeout | undefined
    let timeout: NodeJS.Timeout | undefined
    const killTimers = new Set<NodeJS.Timeout>()
    const redactionMatches = new Set<number>()
    const maxRedactionLength = Math.max(1, ...redactions.map(value => value.length))
    let stdoutScanTail = ''
    let stderrScanTail = ''

    const scan = (chunk: string, tail: string): string => {
      const candidate = `${tail}${chunk}`
      redactions.forEach((secret, index) => {
        if (secret !== '' && candidate.includes(secret)) redactionMatches.add(index)
      })
      const tailLength = maxRedactionLength - 1
      return tailLength === 0 ? '' : candidate.slice(-tailLength)
    }

    const append = (current: string, bytes: number, chunk: string): [string, number, boolean] => {
      const remaining = OUTPUT_LIMIT_BYTES - bytes
      if (remaining <= 0) return [current, bytes, true]
      const buffer = Buffer.from(chunk)
      const retained = buffer.subarray(0, remaining)
      return [current + retained.toString('utf8'), bytes + retained.length, buffer.length > remaining]
    }

    const scheduleKill = () => {
      const timer = setTimeout(() => {
        killTimers.delete(timer)
        if (!settled) terminateProcess(child.pid, 'SIGKILL')
      }, 1_000)
      timer.unref()
      killTimers.add(timer)
    }

    const clearTimers = () => {
      if (timeout !== undefined) clearTimeout(timeout)
      if (completionPoll !== undefined) clearInterval(completionPoll)
      for (const timer of killTimers) clearTimeout(timer)
      killTimers.clear()
    }

    child.stdout.setEncoding('utf8')
    child.stderr.setEncoding('utf8')
    child.stdout.on('data', chunk => {
      const value = String(chunk)
      stdoutScanTail = scan(value, stdoutScanTail)
      const appended = append(stdout, stdoutBytes, value)
      stdout = appended[0]
      stdoutBytes = appended[1]
      stdoutTruncated ||= appended[2]
    })
    child.stderr.on('data', chunk => {
      const value = String(chunk)
      stderrScanTail = scan(value, stderrScanTail)
      const appended = append(stderr, stderrBytes, value)
      stderr = appended[0]
      stderrBytes = appended[1]
      stderrTruncated ||= appended[2]
    })
    const forwardSignal = (signal: NodeJS.Signals) => {
      interruptedBy ??= signal
      terminateProcess(child.pid, signal)
      scheduleKill()
    }
    const onInterrupt = () => { forwardSignal('SIGINT') }
    const onTerminate = () => { forwardSignal('SIGTERM') }
    const onAbort = () => { forwardSignal('SIGTERM') }
    process.once('SIGINT', onInterrupt)
    process.once('SIGTERM', onTerminate)
    options.signal?.addEventListener('abort', onAbort, { once: true })
    if (options.signal?.aborted === true) onAbort()
    child.once('error', (error) => {
      if (settled) return
      settled = true
      clearTimers()
      process.off('SIGINT', onInterrupt)
      process.off('SIGTERM', onTerminate)
      options.signal?.removeEventListener('abort', onAbort)
      reject(error)
    })

    if (options.stdin !== undefined) child.stdin.end(options.stdin)
    else child.stdin.end()

    const completionFile = options.completionFile
    completionPoll = completionFile === undefined ? undefined : setInterval(() => {
      if (checkingCompletion || settled || stoppedAfterCompletion) return
      checkingCompletion = true
      void access(completionFile).then(async () => {
        if (settled || stoppedAfterCompletion) return
        stoppedAfterCompletion = true
        try {
          if (options.beforeCompletionStop !== undefined) await options.beforeCompletionStop(child.pid)
        } finally {
          if (!settled) {
            terminateProcess(child.pid, 'SIGTERM')
            scheduleKill()
          }
        }
      }).catch(() => undefined).finally(() => { checkingCompletion = false })
    }, 25)
    completionPoll?.unref()

    timeout = setTimeout(() => {
      timedOut = true
      terminateProcess(child.pid, 'SIGTERM')
      scheduleKill()
    }, options.timeoutMs)
    timeout.unref()

    child.once('close', (exitCode, signal) => {
      if (settled) return
      settled = true
      clearTimers()
      process.off('SIGINT', onInterrupt)
      process.off('SIGTERM', onTerminate)
      options.signal?.removeEventListener('abort', onAbort)
      const sanitizedStdout = `${redact(stdout, redactions)}${stdoutTruncated ? TRUNCATION_NOTICE : ''}`
      const sanitizedStderr = `${redact(stderr, redactions)}${stderrTruncated ? TRUNCATION_NOTICE : ''}`
      const matchedIndexes = [...redactionMatches].sort((left, right) => left - right)
      const stdoutPath = join(options.logDir, `${options.logName}.stdout.log`)
      const stderrPath = join(options.logDir, `${options.logName}.stderr.log`)
      void Promise.all([
        replaceOwnedFile(stdoutPath, sanitizedStdout),
        replaceOwnedFile(stderrPath, sanitizedStderr),
      ]).then(() => {
        resolve({
          command: sanitizeCommand([options.executable, ...args], redactions),
          exitCode,
          signal,
          timedOut,
          stoppedAfterCompletion,
          redactionApplied: matchedIndexes.length > 0,
          redactionMatches: matchedIndexes,
          interruptedBy,
          durationMs: Date.now() - started,
          stdout: sanitizedStdout,
          stderr: sanitizedStderr,
          stdoutTruncated,
          stderrTruncated,
          artifacts: [basename(stdoutPath), basename(stderrPath)],
        })
      }, reject)
    })
  })
}

export function sanitizeCommand(command: readonly string[], redactions: readonly string[]): string[] {
  return command.map(part => redact(part, redactions))
}
