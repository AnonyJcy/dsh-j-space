// Real native DSH installation smoke; no live profile, listener, provider or model.
// Usage: node tests/dsh-install-smoke.mjs /private/host/node_modules /absolute/plugin.tgz [expected-host-version]
// A dsh binary (e.g. /private/host/node_modules/.bin/dsh) is also accepted.
// All mutable state is retained in the printed NEW /tmp directory for inspection.
import assert from 'node:assert/strict'
import { existsSync, mkdtempSync, mkdirSync, readFileSync, realpathSync, writeFileSync } from 'node:fs'
import { createHash } from 'node:crypto'
import { createRequire } from 'node:module'
import { dirname, isAbsolute, join, resolve } from 'node:path'
import { tmpdir } from 'node:os'
import { spawnSync } from 'node:child_process'
import { pathToFileURL } from 'node:url'

assert(process.argv[2] && process.argv[3], 'Pass isolated host node_modules (or dsh binary), packed tarball, and optional expected host version')
const supplied = resolve(process.argv[2])
const modules = supplied.endsWith('node_modules') ? supplied : resolve(dirname(realpathSync(supplied)), '../../..')
const hostRequire = createRequire(join(modules, '../package.json'))
const hostPackage = hostRequire.resolve('@deepseek-ai/dsh/package.json')
const hostManifest = JSON.parse(readFileSync(hostPackage, 'utf8'))
const hostBin = join(dirname(hostPackage), 'lib/bin.js')
const tarball = realpathSync(resolve(process.argv[3]))
assert(isAbsolute(tarball) && /\.tgz$/.test(tarball), 'Use an existing npm packed tarball, not a repository directory')
assert.equal(hostManifest.version, process.argv[4] ?? hostManifest.version)
const root = mkdtempSync(join(tmpdir(), 'jspace-native-install-'))
const env = {}
for (const name of ['PATH', 'SystemRoot', 'COMSPEC', 'PATHEXT', 'LANG', 'LC_ALL', 'HTTP_PROXY', 'HTTPS_PROXY', 'NO_PROXY', 'http_proxy', 'https_proxy', 'no_proxy']) {
  if (process.env[name]) env[name] = process.env[name]
}
for (const [name, leaf] of Object.entries({ HOME: 'home', USERPROFILE: 'home', DSH_HOME: 'dsh', DSH_AGENTS_HOME: 'agents', XDG_CONFIG_HOME: 'config', XDG_CACHE_HOME: 'cache', XDG_DATA_HOME: 'data', XDG_STATE_HOME: 'state', TMPDIR: 'tmp', TMP: 'tmp', TEMP: 'tmp', npm_config_cache: 'npm-cache', PNPM_HOME: 'pnpm', COREPACK_HOME: 'corepack' })) {
  env[name] = join(root, leaf)
  mkdirSync(env[name], { recursive: true })
}
env.DSH_TELEMETRY_DISABLED = '1'
env.DO_NOT_TRACK = '1'
env.npm_config_userconfig = join(root, 'empty.npmrc')
writeFileSync(env.npm_config_userconfig, '')
const workspace = join(root, 'workspace')
mkdirSync(workspace)
// Set isolation before loading any host package (some paths are captured at import).
for (const name of Object.keys(process.env)) delete process.env[name]
Object.assign(process.env, env)
process.chdir(workspace)
console.log(JSON.stringify({ phase: 'isolated', root, host: hostManifest.version }))
function cli(args, label) {
  const result = spawnSync(process.execPath, [hostBin, ...args], { cwd: workspace, env, encoding: 'utf8', timeout: 600_000, maxBuffer: 8 * 1024 * 1024 })
  writeFileSync(join(root, `${label}.stdout`), result.stdout ?? '')
  writeFileSync(join(root, `${label}.stderr`), result.stderr ?? '')
  assert.ifError(result.error)
  assert.equal(result.status, 0, `${label} failed; inspect isolated ${label}.stderr/stdout in ${root}`)
  return result.stdout
}
// Older DSH forwards this help to pnpm; newer DSH prints its own profile help.
assert.match(cli(['plugin', '--profile', 'web', '--help'], 'plugin-help'), /--profile|Usage: pnpm/)
cli(['plugin', '--profile', 'web', 'add', tarball], 'plugin-add')
const profileDir = join(env.DSH_HOME, 'profiles/web')
const manifest = () => JSON.parse(readFileSync(join(profileDir, 'package.json'), 'utf8'))
const packageName = '@anonyjcy/dsh-j-space'
assert(manifest().dependencies[packageName], 'Native add persisted the tarball dependency')
assert.equal(manifest().dsh.profile.bundles.filter(name => name === packageName).length, 1, 'Native add registered exactly one plugin bundle')
const importHost = name => import(pathToFileURL(hostRequire.resolve(name)))
const yaml = hostRequire('js-yaml')
const { entryListSchema } = await importHost('@deepseek-ai/cordis-plugin-include')
const parse = source => yaml.load(source, { schema: entryListSchema })
const flatten = entries => entries.flatMap(entry => [entry, ...(entry.group ? flatten(entry.config ?? []) : [])])
const direct = ['tool-subagent-control', 'tool-subagent-list-agents', 'tool-subagent', 'tool-subagent-fork']
function checkDump(team) {
  const rows = parse(cli(['--profile', 'web', '--dump-config'], team ? 'dump-team-on' : 'dump-team-off'))
  const all = flatten(rows)
  assert.equal(all.filter(row => row.id === 'preset-j-space').length, 1)
  const preset = all.find(row => row.id === 'preset-j-space')
  assert.equal(preset.config.id, 'j-space')
  const local = flatten(preset.config.plugins)
  assert.equal(new Set(local.map(row => row.id)).size, local.length, 'No duplicate preset rows')
  assert(local.every(row => !/subagent|ralph|agent-team/.test(row.name)), 'Delegation/Team is exclusively host owned')
  for (const id of ['agent-team', 'tool-agent-team', 'ui-agent-team']) {
    assert.equal(all.filter(row => row.id === id && !row.disabled).length, team ? 1 : 0, `${id} opt-in state`)
  }
  if (team) for (const id of direct) assert.equal(all.find(row => row.id === id)?.disabled, true, `${id} disabled by Team`)
  // Core tools are present only once within this agent's standing composition;
  // other shipped presets are intentionally separate capabilities, not duplicates.
  for (const id of ['tool-bash', 'tool-fs', 'tool-fs-search', 'tool-jobs', 'tool-skill', 'tool-workflow']) {
    assert.equal(local.filter(row => row.id === id).length, 1, id)
    assert.equal(all.filter(row => row.id === id && !row.disabled).length, 0, `${id} must not also be host mounted`)
  }
  return preset
}
checkDump(false)

const bootApi = await importHost('@deepseek-ai/dsh-app-boot')
async function runtime(team) {
  const installAnchor = hostPackage
  const profile = bootApi.loadProfile('jspace-smoke', 'web', installAnchor)
  assert.deepEqual(profile.skippedBundles, [], 'No incompatible or unresolved bundle skipped')
  const resolution = await bootApi.createRuntimeResolution({ installAnchor, profile })
  // Only surface/HMR rows are suppressed; the actual host capability services,
  // preset registry and every enabled J-Space composition row still activate.
  // Their intentionally unavailable browser consumers may remain pending.
  const overlay = ['hmr', 'web-startup', 'webserver', 'web-runtime', 'connection', 'desktop-product-telemetry', 'product-analytics'].map(id => ({ id, disabled: true }))
  const profileContext = { name: 'web', dir: profile.dir, patchPath: profile.patchPath, installAnchor, startedBundles: profile.layers.map(layer => layer.packageName), cwd: workspace, home: env.DSH_HOME, overlays: overlay, telemetryDisabledEnv: '1' }
  const ctx = await bootApi.boot('jspace-smoke', join(profile.dir, 'cordis.yml'), bootApi.readProfilePatches('jspace-smoke', profileContext, profile), async ctx => {
    ctx.provide('profileContext', profileContext)
    await ctx.plugin(bootApi.PluginPackages, { resolution })
  })
  try {
    assert.equal(ctx.get('webServer'), undefined, 'Smoke must never bind a Web listener')
    assert.equal(ctx.get('webStartup'), undefined, 'Smoke cannot invoke a real Web startup')
    assert.equal(Boolean(ctx.get('agentTeams')), team, 'Real Team service follows native opt-in')
    const hostRows = [...ctx.loader.entries()]
    for (const id of ['agent-team', 'tool-agent-team', 'ui-agent-team']) {
      const matching = hostRows.filter(row => row.options.id === id)
      assert.equal(matching.length, team ? 1 : 0, `${id} mounted only by opted-in host layer`)
      if (team) assert.equal(matching[0].fiber?.state, 2, `${id} is active in real Loader`)
    }
    const registered = await ctx.agentPresets.resolve('j-space')
    assert(!registered.broken, `Preset activation failed: ${registered.broken}`)
    const composition = (await ctx.agentPresets.compositionInventory()).find(row => row.id === 'j-space')
    assert(composition && !composition.broken, 'Native preset has an activated standing composition')
    for (const row of composition.rows) if (row.enabled === true) assert.equal(row.fiberState, 2, `${row.entryId} activated`)
    const inspection = ctx.agentPresets.inspectCompositions().find(row => row.id === 'j-space')
    assert.deepEqual(inspection.leakedServices, [], 'Preset leaks no services outside its isolation realm')
    const scope = await ctx.agentPresets.acquireScope('j-space')
    try {
      const options = { cwd: workspace, scope: scope.key }
      const toolNames = ctx.tools.schemas(scope.key).map(tool => tool.name)
      assert.equal(new Set(toolNames).size, toolNames.length, 'Real scoped tool catalog has no duplicate names')
      for (const name of ['bash', 'read', 'glob', 'grep', 'skill', 'workflow']) assert.equal(toolNames.filter(tool => tool === name).length, 1, `Scoped core tool ${name} appears once`)
      for (const name of ['subagent', 'subagent_fork', 'list_agents', 'send_message']) assert(!toolNames.includes(name), `Direct delegation tool ${name} must not leak into J-Space`)
      const skills = await ctx.skills.list(options)
      const jspace = skills.filter(skill => skill.name === 'j-space')
      assert.equal(jspace.length, 1, 'Packaged J-Space is discovered once through real scoped host skills')
      assert(jspace[0].path.includes('@anonyjcy') && jspace[0].path.endsWith('/preset/skills/j-space/SKILL.md'), 'Skill resolves inside the natively installed tarball')
      const definition = await ctx.skills.get('j-space', options)
      assert(definition?.content.includes('control.py'), 'Real host loads the complete controller skill')
      assert(!((await ctx.skills.list({ cwd: workspace })).some(skill => skill.name === 'j-space')), 'J-Space skill stays preset-scoped, not global')
      console.log(JSON.stringify({ phase: 'runtime', team, preset: registered.id, activatedRows: composition.rows.filter(row => row.enabled === true).length, skill: jspace[0].path, skillBytes: Buffer.byteLength(definition.content) }))
    } finally {
      await scope[Symbol.asyncDispose]()
    }
  } finally {
    await ctx.fiber.dispose()
  }
}
await runtime(false)
cli(['plugin', '--profile', 'web', 'add', `@deepseek-ai/dsh-experimental-agent-team-profile@${hostManifest.version}`], 'team-add')
assert.equal(manifest().dsh.profile.bundles.filter(name => name === '@deepseek-ai/dsh-experimental-agent-team-profile').length, 1)
checkDump(true)
await runtime(true)
assert(!existsSync(join(env.DSH_HOME, '.agent-presets')), 'Native bundle integration must not depend on legacy preset auto-deployment')
console.log(JSON.stringify({ ok: true, root, baseline: hostManifest.version, tarball, sha256: createHash('sha256').update(readFileSync(tarball)).digest('hex'), coverage: ['native plugin add of npm tarball', 'persisted dependency and bundle discovery', 'native config dump', 'real Loader preset activation', 'preset-scoped filesystem skill discovery and body loading', 'Team opt-in via native add', 'no preset duplicate core tools or direct delegation', 'headless boot with no network listener'], limits: ['no provider credentials', 'no model execution or model E2E', 'no browser interaction', 'no current GUI/profile mutation'] }, null, 2))
