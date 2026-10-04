import { Context } from '@deepseek-ai/cordis'
import { mkdtemp, readFile, rm, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import plugin from '../src/index.ts'
import { isJSpacePresetInstalled, targetUserPresetDir, verifyJSpacePreset } from '../src/installer.ts'

describe('dsh-j-space legacy plugin lifecycle', () => {
  let ctx: Context
  let tempHome: string

  beforeEach(async () => {
    tempHome = await mkdtemp(join(tmpdir(), 'dsh-jspace-lifecycle-'))
    vi.stubEnv('DSH_HOME', tempHome)
    ctx = new Context()
  })

  afterEach(async () => {
    try {
      await ctx.fiber.dispose()
    } finally {
      vi.unstubAllEnvs()
      await rm(tempHome, { recursive: true, force: true })
    }
  })

  it('deploys during plugin application without a ready event', async () => {
    const targetDir = targetUserPresetDir(tempHome)
    expect(await isJSpacePresetInstalled(targetDir)).toBe(false)

    await ctx.plugin(plugin)

    expect(await isJSpacePresetInstalled(targetDir)).toBe(true)
    expect((await verifyJSpacePreset(targetDir)).ok).toBe(true)
  })

  it('deploys when mounted into an already active context', async () => {
    await ctx.plugin(async function existingPlugin() {})

    await ctx.plugin(plugin)

    expect((await verifyJSpacePreset(targetUserPresetDir(tempHome))).ok).toBe(true)
  })

  it('does not deploy when autoDeploy is disabled', async () => {
    await ctx.plugin(plugin, { autoDeploy: false })

    expect(await isJSpacePresetInstalled(targetUserPresetDir(tempHome))).toBe(false)
  })

  it('preserves an existing preset instead of overwriting user edits', async () => {
    const fiber = await ctx.plugin(plugin)
    const compositionPath = join(targetUserPresetDir(tempHome), 'agent.cordis.yml')
    await writeFile(compositionPath, '# user-edited composition\n')
    // A remount must still check the existing preset before deploying.
    await fiber.dispose()

    await ctx.plugin(plugin)

    expect(await readFile(compositionPath, 'utf8')).toBe('# user-edited composition\n')
  })

  it('reports deployment errors without rejecting plugin application', async () => {
    const blockedHome = join(tempHome, 'not-a-directory')
    await writeFile(blockedHome, 'block directory creation')
    vi.stubEnv('DSH_HOME', blockedHome)
    const messages: Array<{ type: string; args: unknown[] }> = []
    ctx.logger.exporter({
      levels: { default: 3 },
      export: message => { messages.push(message) },
    })

    await ctx.plugin(plugin)

    expect(await isJSpacePresetInstalled(targetUserPresetDir(blockedHome))).toBe(false)
    expect(messages).toEqual(expect.arrayContaining([
      expect.objectContaining({
        type: 'warn',
        args: [expect.stringContaining('Failed to auto-deploy J-Space preset:')],
      }),
    ]))
    expect(messages.some(message => message.type === 'error')).toBe(false)
  })
})
