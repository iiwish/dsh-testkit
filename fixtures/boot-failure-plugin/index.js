export const name = 'dsh-testkit-fixture-boot-failure'

export function apply() {
  throw new Error('intentional dsh-testkit boot failure')
}
