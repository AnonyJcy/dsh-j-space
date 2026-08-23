import { mkdtemp, rm } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import {
  getJSpaceTemplatePath,
  installJSpacePreset,
  isJSpacePresetInstalled,
  targetUserPresetDir,
  uninstallJSpacePreset,
  verifyJSpacePreset,
} from '../src/installer.ts'

describe('dsh-plugin-j-space installer', () => {
  let tempHome: string

  beforeEach(async () => {
    tempHome = await mkdtemp(join(tmpdir(), 'dsh-jspace-test-home-'))
  })

  afterEach(async () => {
    await rm(tempHome, { recursive: true, force: true })
  })

  it('locates the bundled preset template with complete files', async () => {
    const templateDir = getJSpaceTemplatePath()
    const check = await verifyJSpacePreset(templateDir)
    expect(check.ok).toBe(true)
    expect(check.message).toBeUndefined()
  })

  it('installs the J-Space preset into a target DSH home directory', async () => {
    const targetDir = targetUserPresetDir(tempHome)
    expect(await isJSpacePresetInstalled(targetDir)).toBe(false)

    const installedPath = await installJSpacePreset({ dshHome: tempHome })
    expect(installedPath).toBe(targetDir)
    expect(await isJSpacePresetInstalled(targetDir)).toBe(true)

    const check = await verifyJSpacePreset(targetDir)
    expect(check.ok).toBe(true)
  })

  it('uninstalls the J-Space preset cleanly', async () => {
    const targetDir = targetUserPresetDir(tempHome)
    await installJSpacePreset({ dshHome: tempHome })
    expect(await isJSpacePresetInstalled(targetDir)).toBe(true)

    const removed = await uninstallJSpacePreset(tempHome)
    expect(removed).toBe(true)
    expect(await isJSpacePresetInstalled(targetDir)).toBe(false)

    // Second uninstall returns false because it is already gone
    const removedAgain = await uninstallJSpacePreset(tempHome)
    expect(removedAgain).toBe(false)
  })
})
