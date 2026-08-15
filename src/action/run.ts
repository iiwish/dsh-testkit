import { spawn } from 'node:child_process'
import { existsSync, realpathSync } from 'node:fs'
import { appendFile } from 'node:fs/promises'
import { isAbsolute, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

export function parseAdditionalActionArgs(argsJson: string, legacyArgs: string): string[] {
  if (argsJson.trim() !== '' && argsJson.trim() !== '[]' && legacyArgs.trim() !== '') {
    throw new Error('Use args-json or legacy args, not both')
  }
  if (argsJson.trim() !== '' && argsJson.trim() !== '[]') {
    const parsed: unknown = JSON.parse(argsJson)
    if (!Array.isArray(parsed) || !parsed.every(value => typeof value === 'string')) {
      throw new Error('args-json must be a JSON array of strings')
    }
    return parsed
  }
  return legacyArgs.trim() === '' ? [] : legacyArgs.trim().split(/\s+/)
}

export interface ActionCommandInput {
  plugin: string
  dshVersion: string
  config: string
  output: string
  argsJson: string
  legacyArgs: string
  workspace: string
}

export function buildActionArguments(input: ActionCommandInput): string[] {
  const workspacePlugin = resolve(input.workspace, input.plugin)
  const plugin = !isAbsolute(input.plugin) && existsSync(workspacePlugin)
    ? workspacePlugin
    : input.plugin
  const args = [plugin, '--dsh', input.dshVersion, '--output', resolve(input.workspace, input.output)]
  if (input.config !== '') args.push('--config', resolve(input.workspace, input.config))
  args.push(...parseAdditionalActionArgs(input.argsJson, input.legacyArgs))
  return args
}

async function main(): Promise<void> {
  const githubOutput = process.env.GITHUB_OUTPUT
  const workspace = process.env.GITHUB_WORKSPACE
  if (githubOutput === undefined || workspace === undefined) {
    throw new Error('GITHUB_OUTPUT and GITHUB_WORKSPACE are required')
  }
  const args = buildActionArguments({
    plugin: process.env.INPUT_PLUGIN ?? '',
    dshVersion: process.env.INPUT_DSH_VERSION ?? '',
    config: process.env.INPUT_CONFIG ?? '',
    output: process.env.RESOLVED_OUTPUT ?? '',
    argsJson: process.env.INPUT_ARGS_JSON ?? '[]',
    legacyArgs: process.env.INPUT_ARGS ?? '',
    workspace,
  })
  const cliPath = resolve(import.meta.dirname, '../cli.js')
  const exitCode = await new Promise<number>((resolveExit, reject) => {
    const child = spawn(process.execPath, [cliPath, ...args], { stdio: 'inherit' })
    child.once('error', reject)
    child.once('exit', code => resolveExit(code ?? 3))
  })
  await appendFile(githubOutput, `exit-code=${exitCode}\n`)
}

const isMain = process.argv[1] !== undefined
  && realpathSync(process.argv[1]) === realpathSync(fileURLToPath(import.meta.url))
if (isMain) await main()
