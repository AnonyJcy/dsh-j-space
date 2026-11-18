// Optional read-only integration check against published DSH host artifacts.
// Usage: node tests/dsh-host-compat.mjs /path/to/host/node_modules [expected-host-version]
// No profile writes, Agent execution, provider requests, or server restarts.
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { createRequire } from 'node:module'
import { resolve, join } from 'node:path'
import { pathToFileURL } from 'node:url'

assert(process.argv[2], 'Pass the DSH host node_modules directory')
const modules = resolve(process.argv[2])
const hostRequire = createRequire(join(modules, '../package.json'))
const host = name => join(modules, '@deepseek-ai', name)
const text = path => readFileSync(path, 'utf8')
const manifest = name => JSON.parse(text(join(host(name), 'package.json')))
const { applyEntryPatches, entryListSchema } = await import(pathToFileURL(hostRequire.resolve('@deepseek-ai/cordis-plugin-include')))
const yaml = hostRequire('js-yaml')
const parse = path => yaml.load(text(path), { schema: entryListSchema })
const root = new URL('../', import.meta.url)
const own = relative => new URL(relative, root)
const jspacePatch = parse(own('cordis.patch.yml'))
const legacy = parse(own('preset/agent.cordis.yml'))
const standardPatch = parse(join(host('dsh-web-app'), 'presets/standard.patch.yml'))
const basePatch = parse(join(host('dsh-base'), 'cordis.patch.yml'))
const webPatch = parse(join(host('dsh-web-app'), 'cordis.patch.yml'))
const warnings = []
const warn = (...args) => warnings.push(args)
const preset = jspacePatch[0].insert[0]
const plugins = preset.config.plugins
// Host releases before 0.2.2 dropped list-agents from the standard preset; keep it
// optional so the same parity contract covers both the RC line and the 0.2.2 alpha.
const removed = ['tool-subagent-control', 'tool-subagent-list-agents', 'tool-subagent', 'tool-subagent-fork']
const bundleSkillExpression = "process.getBuiltinModule('node:path').join(process.getBuiltinModule('node:path').dirname(process.getBuiltinModule('node:module').createRequire(new URL('package.json', baseUrl)).resolve('@anonyjcy/dsh-j-space/package.json')), 'preset/skills')"
const flatten = entries => entries.flatMap(entry => [entry, ...(entry.group ? flatten(entry.config ?? []) : [])])
const all = flatten(plugins)
assert(all.every(entry => !/subagent|ralph|agent-team/.test(entry.name)), 'No preset-owned Team/direct delegation tools')
// Persona and packaged skill directory are J-Space's own; the preset-manager gate
// is a host-version-specific profile expression. Those rows are owned locally, so
// they are compared by presence and identity rather than against host defaults.
const owned = ['persona', 'skill-filesystem', 'tool-plugin-manager']

// All official standard rows are retained apart from the intentional Team split.
const officialPlugins = standardPatch[0].insert[0].config.plugins
const officialDelegation = officialPlugins.find(entry => entry.id === 'delegation')
for (const id of removed) {
  if (!officialDelegation.config.some(entry => entry.id === id)) {
    assert(!flatten(plugins).some(entry => entry.id === id), 'Row removed upstream must not be reintroduced: ' + id)
  }
}
const expected = structuredClone(officialPlugins)
expected.find(entry => entry.id === 'delegation').config = officialDelegation.config.filter(entry => !removed.includes(entry.id))
for (const id of owned) expected.find(entry => entry.id === id).config = plugins.find(entry => entry.id === id).config
const normalize = entries => flatten(entries).map(entry => {
  const result = structuredClone(entry)
  if (result.group) delete result.config
  if (result.id === 'plan-mode') result.config.section = result.config.section.trim()
  if (owned.includes(result.id)) {
    delete result.config
    delete result.disabled
  }
  return result
}).sort((a, b) => a.id.localeCompare(b.id))
assert.deepEqual(normalize(plugins), normalize(expected), 'Parity with actual DSH standard minus direct delegation')
assert.deepEqual(
  Object.fromEntries(owned.map(id => [id, flatten(plugins).find(entry => entry.id === id)?.config])),
  {
    persona: { prefix: 'You are a coding agent powered by the {{model}} model, operating with the J-Space Cognition Suite SV1 architecture.' },
    'skill-filesystem': { customSkillDirs: [{ __jsExpr: bundleSkillExpression }] },
    'tool-plugin-manager': undefined,
  },
  'Locally owned rows keep their exact J-Space configuration',
)
const normalizedLegacy = structuredClone(legacy)
normalizedLegacy.find(entry => entry.id === 'skill-filesystem').config = plugins.find(entry => entry.id === 'skill-filesystem').config
assert.deepEqual(normalizedLegacy, plugins)

// DSH 0.2.2-rc.4 includes the Team runtime in the host composition.
const composed = applyEntryPatches([], [...basePatch, ...webPatch, ...jspacePatch], warn)
assert.deepEqual(composed.find(entry => entry.id === 'preset-j-space').config.plugins, plugins)
for (const id of ['agent-team', 'tool-agent-team', 'ui-agent-team']) {
  const rows = flatten(composed).filter(entry => entry.id === id && !entry.disabled)
  assert.equal(rows.length, 1, id + ' composed exactly once by the host')
}
const workflow = all.find(entry => entry.id === 'delegation')
assert.deepEqual(workflow.isolate, { workflowEngine: true })
assert.deepEqual(workflow.config.map(entry => entry.id), ['workflow-ptc', 'tool-workflow'])
assert.equal(preset.name, '@deepseek-ai/dsh-agent-preset')
// Discover the actual installed baseline, or enforce an explicit release version.
// Every coupled official package must still match; composition parity above is
// deliberately exact so a newer host cannot silently weaken the contract.
const baseline = process.argv[3] ?? manifest('dsh').version
for (const name of ['dsh', 'dsh-web-app', 'dsh-tool-agent-team']) {
  assert.equal(manifest(name).version, baseline, 'Verification baseline for ' + name)
}
const semver = hostRequire('semver')
const ownManifest = JSON.parse(text(own('package.json')))
assert(semver.satisfies(manifest('cordis').version, ownManifest.peerDependencies['@deepseek-ai/cordis']), 'Cordis peer admits the actual host prerelease without includePrerelease override')
assert.equal(warnings.length, 0, 'Official composition must apply without missing patch targets')
console.log(JSON.stringify({ ok: true, baseline: manifest('dsh').version, check: 'official YAML dialect and profile patch semantics; standard composition parity; built-in Team', warnings }, null, 2))
