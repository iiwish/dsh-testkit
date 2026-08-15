import { readFile, readdir } from 'node:fs/promises'
import { join } from 'node:path'

import { parse } from 'yaml'

async function yamlFiles(root) {
  const files = []
  const visit = async (directory) => {
    for (const entry of await readdir(directory, { withFileTypes: true })) {
      const path = join(directory, entry.name)
      if (entry.isDirectory()) await visit(path)
      else if (/\.ya?ml$/.test(entry.name)) files.push(path)
    }
  }
  await visit(root)
  return files.sort()
}

function externalUses(value, found = []) {
  if (Array.isArray(value)) {
    for (const child of value) externalUses(child, found)
  } else if (value !== null && typeof value === 'object') {
    for (const [key, child] of Object.entries(value)) {
      if (key === 'uses' && typeof child === 'string' && !child.startsWith('./')) found.push(child)
      else externalUses(child, found)
    }
  }
  return found
}

function valuesForKey(value, wanted, found = []) {
  if (Array.isArray(value)) {
    for (const child of value) valuesForKey(child, wanted, found)
  } else if (value !== null && typeof value === 'object') {
    for (const [key, child] of Object.entries(value)) {
      if (key === wanted) found.push(child)
      valuesForKey(child, wanted, found)
    }
  }
  return found
}

const violations = []
for (const path of await yamlFiles('.github')) {
  const document = parse(await readFile(path, 'utf8'))
  for (const uses of externalUses(document)) {
    if (!/^[^/@]+\/[^/@]+@[0-9a-f]{40}$/i.test(uses)) violations.push(`${path}: ${uses}`)
  }
  for (const cachePath of valuesForKey(document, 'cache-dependency-path')) {
    if (typeof cachePath === 'string' && /(^|\/)\.\.(\/|$)/.test(cachePath)) {
      violations.push(`${path}: cache-dependency-path cannot contain parent traversal: ${cachePath}`)
    }
  }
}

if (violations.length > 0) {
  throw new Error(`GitHub Actions must use full immutable commit SHAs:\n${violations.join('\n')}`)
}
console.log('GitHub Action references are pinned to full commit SHAs.')
