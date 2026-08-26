export const name = 'dsh-testkit-fixture-http-route'

export function apply(ctx) {
  ctx.inject(['webServer'], (hostCtx) => {
    hostCtx.webServer.register({
      kind: 'exact',
      path: '/dsh-testkit/health',
      handler: (_request, response) => {
        response.writeHead(200, { 'content-type': 'application/json' })
        response.end(JSON.stringify({ status: 'ok', version: '1.0.0' }))
      },
    })
  })
}
