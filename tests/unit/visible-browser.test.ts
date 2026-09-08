import { describe, expect, it, vi } from 'vitest'

// Test-only module is mounted into the restricted Docker image, not published.
// @ts-expect-error The independent browser harness is JavaScript.
import { exerciseVisibleHost } from '../e2e/visible-browser.mjs'

function mockPage() {
  const nodes = new Map<string, ReturnType<typeof node>>()
  function node() {
    return { waitFor: vi.fn(), click: vi.fn(), fill: vi.fn(), inputValue: vi.fn(), innerText: vi.fn().mockResolvedValue('DSH Testkit visible input'), evaluate: vi.fn().mockResolvedValue(true) }
  }
  const get = (key: string) => {
    if (!nodes.has(key)) nodes.set(key, node())
    return nodes.get(key)!
  }
  return { nodes, get, page: {
    getByRole: (role: string, options?: { name: string }) => get(`${role}:${options?.name ?? ''}`),
    locator: (selector: string) => get(selector),
  } }
}

describe('independent visible-host interaction', () => {
  it('acknowledges native onboarding and edits the real textbox without submitting', async () => {
    const { page, get } = mockPage()
    const result = await exerciseVisibleHost(page)
    expect(get('button:Continue').click).toHaveBeenCalledWith({ timeout: 20000 })
    expect(get('button:Configure later').click).toHaveBeenCalledWith({ timeout: 20000 })
    expect(get('textbox:').click).toHaveBeenCalledWith({ timeout: 20000 })
    expect(get('textbox:').fill).toHaveBeenCalledWith('DSH Testkit visible input', { timeout: 20000 })
    expect(result).toMatchObject({ noticeAcknowledged: true, providerSkipped: true, draftText: 'DSH Testkit visible input', submitted: false })
  })

  it('fails when an overlay blocks a real click rather than dismissing it through DOM mutation', async () => {
    const { page, get } = mockPage()
    get('button:Continue').click.mockRejectedValue(new Error('intercepts pointer events'))
    await expect(exerciseVisibleHost(page)).rejects.toThrow('intercepts pointer events')
    expect(get('textbox:').fill).not.toHaveBeenCalled()
  })

  it('fails if the app remains inert or text entry does not reach the actual editor', async () => {
    const first = mockPage()
    first.get('#root').evaluate.mockResolvedValue(false)
    await expect(exerciseVisibleHost(first.page)).rejects.toThrow('inert')
    const second = mockPage()
    second.get('textbox:').innerText.mockResolvedValue('')
    await expect(exerciseVisibleHost(second.page)).rejects.toThrow('draft')
  })
})
