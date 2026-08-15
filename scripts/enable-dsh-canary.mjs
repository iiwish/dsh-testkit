#!/usr/bin/env node
import { readFile, writeFile } from 'node:fs/promises'
import { parseArgs } from 'node:util'

import ts from 'typescript'

const EXACT_SEMVER = /^(?:0|[1-9]\d*)\.(?:0|[1-9]\d*)\.(?:0|[1-9]\d*)(?:-(?:0|[1-9]\d*|\d*[A-Za-z-][0-9A-Za-z-]*)(?:\.(?:0|[1-9]\d*|\d*[A-Za-z-][0-9A-Za-z-]*))*)?(?:\+[0-9A-Za-z-]+(?:\.[0-9A-Za-z-]+)*)?$/

const { values, positionals } = parseArgs({
  options: { file: { type: 'string', default: 'src/adapters/dsh/support.ts' } },
  allowPositionals: true,
  strict: true,
})
const version = positionals[0]
if (positionals.length !== 1 || version === undefined || !EXACT_SEMVER.test(version)) {
  throw new Error('provide one exact semantic version to enable as a disposable canary')
}

const sourceText = await readFile(values.file, 'utf8')
const source = ts.createSourceFile(values.file, sourceText, ts.ScriptTarget.Latest, true, ts.ScriptKind.TS)
let versions
function visit(node) {
  if (ts.isVariableDeclaration(node)
    && ts.isIdentifier(node.name)
    && node.name.text === 'SUPPORTED_DSH_NPM_VERSIONS') {
    const initializer = ts.isAsExpression(node.initializer) ? node.initializer.expression : node.initializer
    if (ts.isArrayLiteralExpression(initializer)) versions = initializer
  }
  ts.forEachChild(node, visit)
}
visit(source)
if (versions === undefined) throw new Error(`${values.file} does not declare SUPPORTED_DSH_NPM_VERSIONS as an array`)
if (versions.elements.some(element => ts.isStringLiteral(element) && element.text === version)) process.exit(0)

const multiline = sourceText.slice(versions.getStart(source), versions.end).includes('\n')
const insertion = versions.elements.length === 0
  ? `'${version}'`
  : multiline ? `,\n  '${version}'` : `, '${version}'`
const updated = `${sourceText.slice(0, versions.end - 1)}${insertion}${sourceText.slice(versions.end - 1)}`
await writeFile(values.file, updated)
