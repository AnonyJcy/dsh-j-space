import { mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { basename, dirname, join, resolve, sep } from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'
import { describe, expect, it } from 'vitest'
import { parseDocument } from 'yaml'

interface Expr { __jsExpr: string }
interface Entry {
  id: string
  name: string
  group?: boolean
  disabled?: boolean | Expr
  isolate?: Record<string, boolean>
  config?: any
}

const root = new URL('../', import.meta.url)
function parse(relative: string) {
  const doc = parseDocument(readFileSync(new URL(relative, root), 'utf8'), {
    customTags: [{ tag: 'tag:yaml.org,2002:js', resolve: (value: string) => ({ __jsExpr: value }) }],
  })
  expect(doc.errors).toEqual([])
  expect(doc.warnings).toEqual([])
  return doc.toJS()
}
const manifest = JSON.parse(readFileSync(new URL('package.json', root), 'utf8'))
const bundle = parse(manifest.dsh.bundle.patch)
const declaration: Entry = bundle[0].insert[0]
const plugins: Entry[] = declaration.config.plugins
const legacy: Entry[] = parse('preset/agent.cordis.yml')
function flatten(entries: Entry[]): Entry[] {
  return entries.flatMap(row => [row, ...(row.group ? flatten(row.config) : [])])
}
function row(id: string) {
  const result = flatten(plugins).find(entry => entry.id === id)
  expect(result, id).toBeDefined()
  return result!
}

// Only these exact package-owned expressions are evaluated. Native bundle !!js
// receives the PROFILE baseUrl; legacy deployed files retain their own baseUrl.
const bundleSkillExpression = "process.getBuiltinModule('node:path').join(process.getBuiltinModule('node:path').dirname(process.getBuiltinModule('node:module').createRequire(new URL('package.json', baseUrl)).resolve('@anonyjcy/dsh-j-space/package.json')), 'preset/skills')"
const legacySkillExpression = "process.getBuiltinModule('node:url').fileURLToPath(new URL('skills/', baseUrl))"
function skillDirectory(entries: Entry[], baseUrl: URL) {
  const expression = entries.find(entry => entry.id === 'skill-filesystem')!.config.customSkillDirs[0].__jsExpr
  expect([bundleSkillExpression, legacySkillExpression]).toContain(expression)
  return resolve(Function('process', 'baseUrl', `return ${expression}`)(process, baseUrl))
}

describe('DSH 0.2.1 J-Space preset composition', () => {
  it('declares version 1.2.4 and exactly one native preset with packaged skills', () => {
    expect(manifest.version).toBe('1.2.4')
    expect(bundle).toHaveLength(1)
    expect(bundle[0].insert).toHaveLength(1)
    expect(declaration.id).toBe('preset-j-space')
    expect(declaration.name).toBe('@deepseek-ai/dsh-agent-preset')
    expect(declaration.config.id).toBe('j-space')
    expect(skillDirectory(plugins, root)).toBe(resolve(fileURLToPath(new URL('preset/skills/', root))))
    expect(skillDirectory(legacy, new URL('preset/', root))).toBe(skillDirectory(plugins, root))
  })

  it('resolves installed skills from a distinct native profile, including URL-special path characters', () => {
    const profile = mkdtempSync(join(tmpdir(), 'j-space profile # '))
    try {
      const installed = join(profile, 'node_modules', '@anonyjcy', 'dsh-j-space')
      mkdirSync(join(installed, 'preset', 'skills'), { recursive: true })
      writeFileSync(join(installed, 'package.json'), JSON.stringify({
        name: manifest.name, exports: { './package.json': './package.json' },
      }))
      expect(skillDirectory(plugins, pathToFileURL(profile + sep))).toBe(join(installed, 'preset', 'skills'))
      expect(skillDirectory(plugins, pathToFileURL(profile + sep))).not.toBe(join(profile, 'preset', 'skills'))
    } finally {
      expect(dirname(resolve(profile))).toBe(resolve(tmpdir()))
      expect(basename(profile).startsWith('j-space profile # ')).toBe(true)
      rmSync(profile, { recursive: true, force: true })
    }
  })

  it('keeps bundle and legacy composition equal apart from declaring skill baseUrl', () => {
    const normalized = structuredClone(legacy)
    normalized.find(row => row.id === 'skill-filesystem')!.config.customSkillDirs = row('skill-filesystem').config.customSkillDirs
    expect(normalized).toEqual(plugins)
    const ids = flatten(plugins).map(row => row.id)
    expect(new Set(ids).size).toBe(ids.length)
  })

  it('has no preset-local direct subagents, Team runtime, or stale provider rows', () => {
    for (const entry of flatten(plugins)) {
      expect(entry.id).not.toMatch(/subagent|ralph|agent-team/)
      expect(entry.name).not.toMatch(/subagent|ralph|agent-team/)
      expect(entry.config ?? {}).not.toHaveProperty('backgroundMode')
      expect(entry.config ?? {}).not.toHaveProperty('modelSelectionSettings')
    }
  })

  it('retains only official batch workflows in an isolated engine realm', () => {
    const workflow = row('delegation')
    expect(workflow.group).toBe(true)
    expect(workflow.isolate).toEqual({ workflowEngine: true })
    expect(workflow.config.map((entry: Entry) => entry.id)).toEqual(['workflow-ptc', 'tool-workflow'])
    expect(row('workflow-ptc').config).toEqual({ provider: 'spawn' })
    expect(row('tool-workflow').name).toBe('@deepseek-ai/dsh-tool-workflow')
  })

  it('adds time context and scheduling while preserving standard tool defaults', () => {
    expect(row('time-context').name).toBe('@deepseek-ai/dsh-time-context')
    expect(row('tool-schedule').name).toBe('@deepseek-ai/dsh-tool-schedule')
    expect(row('tool-web').config).toEqual({ fetch: true, searchTimeoutMs: 60000 })
    expect(row('tool-fs-search').config).toEqual({ sampleOverCapGlobResults: false })
    expect(row('tool-todo').config).toEqual({ allowParallelInProgress: true })
    expect(row('command-goal').name).toBe('@deepseek-ai/dsh-command-goal')
    expect(row('present').name).toBe('@deepseek-ai/dsh-tool-present')
    expect(row('tool-plugin-manager').disabled).toBe(true)
    expect(row('planning').isolate).toEqual({ planMode: true })
    expect(row('compaction').isolate).toEqual({ compaction: true, toolResultPruner: true })
  })

  it.each(['linux', 'win32'])('selects the correct shell on %s', platform => {
    const disabled = (id: string) => {
      const expr = (row(id).disabled as Expr).__jsExpr
      expect(expr).toMatch(/^process\.platform (===|!==) 'win32'$/)
      return Function('process', `return ${expr}`)({ platform })
    }
    expect(disabled('tool-bash')).toBe(platform === 'win32')
    expect(disabled('tool-pwsh')).toBe(platform !== 'win32')
  })
})
