import assert from 'node:assert/strict'

export async function exerciseVisibleHost(page) {
  const timeout = 20_000
  const notice = page.getByRole('dialog', { name: 'Internal Testing Notice' })
  await notice.waitFor({ state: 'visible', timeout })
  await page.getByRole('button', { name: 'Continue', exact: true }).click({ timeout })
  await notice.waitFor({ state: 'hidden', timeout })
  const provider = page.getByRole('dialog', { name: 'Add an API key to get started' })
  await provider.waitFor({ state: 'visible', timeout })
  await page.getByRole('button', { name: 'Configure later', exact: true }).click({ timeout })
  await provider.waitFor({ state: 'hidden', timeout })
  assert.equal(await page.locator('#root').evaluate(root => !root.inert), true, 'Application remains inert')
  const editor = page.getByRole('textbox')
  const draftText = 'DSH Testkit visible input'
  await editor.fill(draftText, { timeout })
  assert.equal(await editor.innerText(), draftText, 'Native editor did not retain the draft')
  return { noticeAcknowledged: true, providerSkipped: true, draftText, submitted: false }
}
