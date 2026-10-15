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
const teamPatch = parse(join(host('dsh-experimental-agent-team-profile'), 'cordis.patch.yml'))
const basePatch = parse(join(host('dsh-base'), 'cordis.patch.yml'))
const webPatch = parse(join(host('dsh-web-app'), 'cordis.patch.yml'))
const warnings = []
const warn = (...args) => warnings.push(args)
const preset = jspacePatch[0].insert[0]
const plugins = preset.config.plugins
const removed = ['tool-subagent-control', 'tool-subagent-list-agents', 'tool-subagent', 'tool-subagent-fork']
const flatten = entries => entries.flatMap(entry => [entry, ...(entry.group ? flatten(entry.config ?? []) : [])])
const all = flatten(plugins)
assert(all.every(entry => !/subagent|ralph|agent-team/.test(entry.name)), 'No preset-owned Team/direct delegation tools')

// All official standard rows are retained apart from the intentional Team split.
const expected = structuredClone(standardPatch[0].insert[0].config.plugins)
expected.find(entry => entry.id === 'delegation').config = expected.find(entry => entry.id === 'delegation').config.filter(entry => !removed.includes(entry.id))
expected.find(entry => entry.id === 'persona').config = plugins.find(entry => entry.id === 'persona').config
expected.find(entry => entry.id === 'skill-filesystem').config = plugins.find(entry => entry.id === 'skill-filesystem').config
const normalize = entries => flatten(entries).map(entry => {
  const result = structuredClone(entry)
  if (result.group) delete result.config
  if (result.id === 'plan-mode') result.config.section = result.config.section.trim()
  return result
}).sort((a, b) => a.id.localeCompare(b.id))
assert.deepEqual(normalize(plugins), normalize(expected), 'Parity with actual DSH standard minus direct delegation')
const normalizedLegacy = structuredClone(legacy)
normalizedLegacy.find(entry => entry.id === 'skill-filesystem').config = plugins.find(entry => entry.id === 'skill-filesystem').config
assert.deepEqual(normalizedLegacy, plugins)

// Use the real official patch engine. The Team layer cannot visit config.plugins;
// therefore the absence of direct rows must hold BEFORE applying the Team patch.
const withoutTeam = applyEntryPatches([], [...basePatch, ...webPatch, ...jspacePatch], warn)
const withTeam = applyEntryPatches(withoutTeam, teamPatch, warn)
for (const id of removed) assert.equal(flatten(withTeam).find(entry => entry.id === id).disabled, true)
assert.deepEqual(withTeam.find(entry => entry.id === 'preset-j-space').config.plugins, plugins)
for (const id of ['agent-team', 'tool-agent-team', 'ui-agent-team']) {
  assert.equal(flatten(withTeam).filter(entry => entry.id === id).length, 1, id + ' composed exactly once')
  assert(!withoutTeam.some(entry => entry.id === id), 'Team remains opt-in')
}
const workflow = all.find(entry => entry.id === 'delegation')
assert.deepEqual(workflow.isolate, { workflowEngine: true })
assert.deepEqual(workflow.config.map(entry => entry.id), ['workflow-ptc', 'tool-workflow'])
assert.equal(preset.name, '@deepseek-ai/dsh-agent-preset')
// Discover the actual installed baseline, or enforce an explicit release version.
// Every coupled official package must still match; composition parity above is
// deliberately exact so a newer host cannot silently weaken the contract.
const baseline = process.argv[3] ?? manifest('dsh').version
for (const name of ['dsh', 'dsh-web-app', 'dsh-experimental-agent-team-profile']) {
  assert.equal(manifest(name).version, baseline, 'Verification baseline for ' + name)
}
const semver = hostRequire('semver')
const ownManifest = JSON.parse(text(own('package.json')))
assert(semver.satisfies(manifest('cordis').version, ownManifest.peerDependencies['@deepseek-ai/cordis']), 'Cordis peer admits the actual host prerelease without includePrerelease override')
assert.equal(warnings.length, 0, 'Official composition must apply without missing patch targets')
console.log(JSON.stringify({ ok: true, baseline: manifest('dsh').version, check: 'official YAML dialect and profile patch semantics; standard composition parity; Team on/off', warnings }, null, 2))
