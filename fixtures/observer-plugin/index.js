import { spawn } from 'node:child_process'
import { createServer } from 'node:net'

export const name = 'dsh-testkit-fixture-observer'

export function apply(ctx) {
  const child = spawn(process.execPath, ['-e', 'setInterval(() => {}, 1000)'], { stdio: 'ignore' })
  const server = createServer()
  server.listen(0, '127.0.0.1')
  ctx.effect(() => () => {
    child.kill('SIGTERM')
    server.close()
  })
}
