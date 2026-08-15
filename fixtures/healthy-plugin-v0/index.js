export const name = 'dsh-testkit-fixture-healthy-v0'
export const inject = ['tools']

export function apply(ctx) {
  ctx.provide('fixtureHealthy', { version: '0.9.0' })
  ctx.tools.register({
    name: 'fixture_echo',
    description: 'Echo a deterministic fixture value.',
    parameters: { type: 'object', properties: { value: { type: 'string' } } },
    output: {
      schema: { type: 'object', required: ['value'], properties: { value: { type: 'string' } } },
      render: (_args, value) => [{ type: 'text', text: value.value }],
    },
    async execute(args) { return { value: args.value ?? 'v0' } },
  })
}
