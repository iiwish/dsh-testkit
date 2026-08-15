import { readFile } from 'node:fs/promises'
import { resolve } from 'node:path'

import { describe, expect, it } from 'vitest'
import { parse as parseYaml } from 'yaml'

import {
  DSH_TESTKIT_SKILL,
  renderDshTestkitSkillFile,
} from '../../src/agent-skill.js'

const root = resolve(import.meta.dirname, '../..')

describe('DSH Testkit Agent Skill', () => {
  it('routes plugin creation, review, release and lifecycle failures without hardcoding a DSH release', () => {
    expect(DSH_TESTKIT_SKILL.name).toBe('dsh-testkit')
    expect(DSH_TESTKIT_SKILL.description.length).toBeLessThanOrEqual(500)
    expect(DSH_TESTKIT_SKILL.description).toMatch(/creating.*reviewing.*releasing/i)
    expect(DSH_TESTKIT_SKILL.description).toMatch(/install.*boot.*register.*uninstall.*reboot.*flaky/i)
    expect(DSH_TESTKIT_SKILL.content).toContain('dsh-test init')
    expect(DSH_TESTKIT_SKILL.content).toContain('--suite full')
    expect(DSH_TESTKIT_SKILL.content).toContain('report.json')
    expect(DSH_TESTKIT_SKILL.content).toContain('--unsafe-local')
    expect(DSH_TESTKIT_SKILL.content).toMatch(/not a security certification/i)
    expect(DSH_TESTKIT_SKILL.content).not.toMatch(/0\.1\.0-rc\.\d+/)
    expect(DSH_TESTKIT_SKILL.invocation).toEqual({ modelInvocable: true, userInvocable: true })
  })

  it('renders valid compact frontmatter and keeps the repository Skill byte-identical', async () => {
    const rendered = renderDshTestkitSkillFile()
    const frontmatter = /^---\n([\s\S]+?)\n---\n/.exec(rendered)?.[1]

    expect(frontmatter).toBeDefined()
    expect(parseYaml(frontmatter ?? '')).toMatchObject({
      name: 'dsh-testkit',
      description: DSH_TESTKIT_SKILL.description,
    })
    expect(Buffer.byteLength(rendered)).toBeLessThanOrEqual(4 * 1024)
    await expect(readFile(
      resolve(root, '.agents/skills/dsh-testkit/SKILL.md'),
      'utf8',
    )).resolves.toBe(rendered)
  })
})
