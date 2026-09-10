import { readFileSync } from 'node:fs'

import ts from 'typescript'
import { describe, expect, it } from 'vitest'
import { parse } from 'yaml'

const manifest = JSON.parse(readFileSync(new URL('../../package.json', import.meta.url), 'utf8'))
const dependabot = parse(readFileSync(new URL('../../.github/dependabot.yml', import.meta.url), 'utf8'))

describe('test toolchain maintenance', () => {
  it('pins the coverage provider to the exact Vitest version', () => {
    expect(manifest.devDependencies.vitest).toMatch(/^\d+\.\d+\.\d+$/)
    expect(manifest.devDependencies['@vitest/coverage-v8']).toBe(manifest.devDependencies.vitest)
  })

  it.each(['version-updates', 'security-updates'])('groups the framework and provider for %s', (appliesTo) => {
    const npm = dependabot.updates.find((update: { 'package-ecosystem': string }) => update['package-ecosystem'] === 'npm')
    const groups = Object.values(npm.groups ?? {}) as Array<{ 'applies-to'?: string; patterns: string[] }>
    expect(groups.some(group => (group['applies-to'] ?? 'version-updates') === appliesTo
      && group.patterns.includes('vitest') && group.patterns.includes('@vitest/*'))).toBe(true)
  })

  it.each([
    ['tests/e2e/real-dsh.test.ts', 'real DSH lifecycle fixtures'],
    ['tests/e2e/real-dsh-bundle.test.ts', 'native DSH bundle'],
    ['tests/integration/source-resolution.test.ts', 'local source resolution evidence'],
  ])('keeps %s explicitly non-concurrent', (path, suiteName) => {
    const source = ts.createSourceFile(path, readFileSync(path, 'utf8'), ts.ScriptTarget.Latest, true)
    const suites: ts.CallExpression[] = []
    function visit(node: ts.Node): void {
      if (ts.isCallExpression(node) && node.arguments[0]
        && ts.isStringLiteral(node.arguments[0]) && node.arguments[0].text === suiteName) {
        suites.push(node)
      }
      ts.forEachChild(node, visit)
    }
    visit(source)
    expect(suites).toHaveLength(1)
    const options = suites[0]!.arguments[1]
    expect(options && ts.isObjectLiteralExpression(options)
      && options.properties.some(property => ts.isPropertyAssignment(property)
        && ts.isIdentifier(property.name) && property.name.text === 'concurrent'
        && property.initializer.kind === ts.SyntaxKind.FalseKeyword)).toBe(true)
  })
})
