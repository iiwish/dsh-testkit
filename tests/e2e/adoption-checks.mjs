import assert from 'node:assert/strict'

export const adoptionCommit = '31af7ebeb8d07cff73253f52f9a9f530cde9de9a'
export const adoptionHost = '0.1.2-rc.1'

export function buildVisibleBrowserArgs(baseArgs) {
  const userIndex = baseArgs.indexOf('--user')
  assert.ok(userIndex > 0 && /^\d+:\d+$/.test(baseArgs[userIndex + 1]), 'Docker output owner must be explicit')
  assert.equal(baseArgs.at(-2), '--request')
  return [...baseArgs.slice(0, -3), '--entrypoint', 'node', baseArgs.at(-3),
    '/opt/dsh-testkit/tests/e2e/visible-browser-worker.mjs']
}

export function assertAdoptionReport(report, negative) {
  assert.equal(report.verdict, negative ? 'failed' : 'passed')
  assert.equal(report.subject.packageName, 'dsh-plugin-template')
  assert.equal(report.subject.gitCommit, adoptionCommit)
  assert.equal(report.dsh.version, adoptionHost)
  assert.equal(report.environment.runner, 'docker')
  assert.match(report.environment.imageId, /^sha256:[0-9a-f]{64}$/)
  assert.equal(report.stages.find(stage => stage.id === 'cleanup')?.status, 'passed')
  if (negative) {
    const assembly = report.stages.find(stage => stage.id === 'assemble')
    assert.equal(assembly?.status, 'failed')
    assert.ok(assembly.assertions.some(assertion => assertion.id === 'config.row.dsh-testkit-deliberately-missing' && assertion.status === 'failed' && assertion.actual === false))
  } else {
    for (const id of ['install-plugin', 'assemble', 'boot', 'register', 'uninstall', 'reboot']) {
      assert.equal(report.stages.find(stage => stage.id === id)?.status, 'passed', `${id} did not pass`)
    }
  }
}
