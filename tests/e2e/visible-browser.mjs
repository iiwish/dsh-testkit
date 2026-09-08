import assert from 'node:assert/strict'

export async function exerciseVisibleHost(page, onStep = () => {}) {
  const timeout = 20_000
  const notice = page.getByRole('dialog', { name: 'Internal Testing Notice' })
  await notice.waitFor({ state: 'visible', timeout })
  await page.getByRole('button', { name: 'Continue', exact: true }).click({ timeout })
  await notice.waitFor({ state: 'hidden', timeout })
  onStep('notice-acknowledged')
  const provider = page.getByRole('dialog', { name: 'Add an API key to get started' })
  await provider.waitFor({ state: 'visible', timeout })
  await page.getByRole('button', { name: 'Configure later', exact: true }).click({ timeout })
  await provider.waitFor({ state: 'hidden', timeout })
  onStep('provider-skipped')
  assert.equal(await page.locator('#root').evaluate(root => !root.inert), true, 'Application remains inert')
  await page.getByRole('button', { name: 'Choose workspace', exact: true }).click({ timeout })
  const picker = page.getByRole('dialog', { name: 'Select Workspace Directory' })
  await picker.waitFor({ state: 'visible', timeout })
  await page.getByRole('button', { name: 'Edit path', exact: true }).click({ timeout })
  const path = page.getByRole('textbox', { name: 'Edit path', exact: true })
  await path.fill('/work/run/workspace', { timeout })
  await path.press('Enter', { timeout })
  await page.getByRole('button', { name: 'Open', exact: true }).click({ timeout })
  await picker.waitFor({ state: 'hidden', timeout })
  onStep('owned-workspace-selected')
  const editor = page.getByRole('textbox')
  const draftText = 'DSH Testkit visible input'
  await editor.click({ timeout })
  await editor.fill(draftText, { timeout })
  assert.equal(await editor.innerText(), draftText, 'Native editor did not retain the draft')
  onStep('draft-entered')
  return { noticeAcknowledged: true, providerSkipped: true, workspaceSelected: '/work/run/workspace', draftText, submitted: false }
}
