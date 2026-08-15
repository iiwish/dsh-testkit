export const name = 'dsh-testkit-fixture-healthy'
export const inject = ['tools']

export function apply(ctx) {
  ctx.provide('fixtureHealthy', { version: '1.0.0' })
  ctx.tools.register({
    name: 'fixture_echo',
    description: 'Echo a deterministic fixture value.',
    parameters: {
      type: 'object',
      properties: { value: { type: 'string', description: 'Value to echo.' } },
    },
    output: {
      schema: {
        type: 'object',
        additionalProperties: false,
        required: ['value'],
        properties: { value: { type: 'string' } },
      },
      render: (_args, value) => [{ type: 'text', text: value.value }],
    },
    async execute(args) {
      return { value: args.value ?? 'ok' }
    },
  })
}
