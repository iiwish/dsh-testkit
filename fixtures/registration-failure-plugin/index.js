export const name = 'dsh-testkit-fixture-registration-failure'

export function apply(ctx) {
  ctx.provide('fixtureRegistrationFailure', { mounted: true })
}
