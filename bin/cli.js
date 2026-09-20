#!/usr/bin/env node
/**
 * CLI for J-Space Preset management in DeepSeek Harness.
 * Pure ESM Node.js runtime script.
 */

import { cp, mkdir, rm, stat } from 'node:fs/promises'
import { homedir } from 'node:os'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const DSH_HOME_DIR_NAME = '.dsh'
const DSH_HOME_ENV = 'DSH_HOME'
const USER_PRESET_DIR = '.agent-presets'
const PRESET_ID = 'j-space'

function expandHomePath(p) {
  if (!p) return homedir()
  if (p === '~') return homedir()
  if (p.startsWith('~/') || p.startsWith('~\\')) return join(homedir(), p.slice(2))
  return p
}

function resolveDshHome(configured, env = process.env) {
  const fromEnv = env[DSH_HOME_ENV]
  const selected = configured ?? (fromEnv !== undefined && fromEnv.trim().length > 0 ? fromEnv : join(homedir(), DSH_HOME_DIR_NAME))
  return resolve(expandHomePath(selected))
}

function targetUserPresetDir(dshHome) {
  if (dshHome !== undefined && dshHome !== '') {
    return join(resolveDshHome(dshHome), USER_PRESET_DIR, PRESET_ID)
  }
  return join(resolveDshHome(), USER_PRESET_DIR, PRESET_ID)
}

function getJSpaceTemplatePath() {
  return fileURLToPath(new URL('../preset/', import.meta.url))
}

async function isJSpacePresetInstalled(targetDir) {
  const dir = targetDir ?? targetUserPresetDir()
  try {
    const s = await stat(join(dir, 'agent.cordis.yml'))
    return s.isFile()
  } catch {
    return false
  }
}

async function installJSpacePreset(options = {}) {
  const templateDir = getJSpaceTemplatePath()
  const targetDir = targetUserPresetDir(options.dshHome)
  await mkdir(dirname(targetDir), { recursive: true })
  await cp(templateDir, targetDir, { recursive: true, force: options.force ?? true })
  return targetDir
}

async function uninstallJSpacePreset(dshHome) {
  const targetDir = targetUserPresetDir(dshHome)
  try {
    const s = await stat(targetDir)
    if (s.isDirectory() || s.isFile()) {
      await rm(targetDir, { recursive: true, force: true })
      return true
    }
    return false
  } catch {
    return false
  }
}

async function verifyJSpacePreset(presetPath) {
  const dir = presetPath ?? targetUserPresetDir()
  const files = [
    'preset.yml',
    'agent.cordis.yml',
    'skills/j-space/SKILL.md',
    'skills/j-space/scripts/control.py',
    'skills/j-space/scripts/host_bridge.py',
    'skills/j-space/scripts/jspace.py',
    'skills/j-space/scripts/verify_suite.py',
  ]
  for (const relative of files) {
    const full = join(dir, relative)
    try {
      const s = await stat(full)
      if (!s.isFile()) {
        return { ok: false, presetPath: dir, message: `Expected regular file at: ${relative}` }
      }
    } catch {
      return { ok: false, presetPath: dir, message: `Missing required file: ${relative}` }
    }
  }
  return { ok: true, presetPath: dir }
}

const command = process.argv[2] ?? 'status'

async function main() {
  switch (command) {
    case 'install': {
      console.log('Installing J-Space Cognition Suite SV1 preset...')
      const dest = await installJSpacePreset()
      console.log(`Successfully installed to: ${dest}`)
      const check = await verifyJSpacePreset(dest)
      if (check.ok) {
        console.log('✓ Preset verification passed! J-Space is ready to use in DeepSeek Harness.')
      } else {
        console.warn(`Warning: verification reported: ${check.message}`)
      }
      break
    }
    case 'uninstall': {
      console.log('Uninstalling J-Space preset...')
      const removed = await uninstallJSpacePreset()
      if (removed) {
        console.log('Successfully uninstalled J-Space preset.')
      } else {
        console.log('J-Space preset was not installed.')
      }
      break
    }
    case 'verify': {
      const dest = targetUserPresetDir()
      console.log(`Verifying preset at: ${dest}`)
      const check = await verifyJSpacePreset(dest)
      if (check.ok) {
        console.log('✓ J-Space preset files are healthy and complete.')
      } else {
        console.error(`✗ Verification failed: ${check.message}`)
        process.exitCode = 1
      }
      break
    }
    case 'status':
    default: {
      const installed = await isJSpacePresetInstalled()
      const dest = targetUserPresetDir()
      console.log(`J-Space Preset target directory: ${dest}`)
      console.log(`Installed: ${installed ? 'Yes' : 'No'}`)
      if (installed) {
        const check = await verifyJSpacePreset(dest)
        console.log(`Verification: ${check.ok ? 'Healthy' : `Issues detected (${check.message})`}`)
      }
      console.log('\nUsage:')
      console.log('  node bin/cli.js install    Install J-Space preset to DSH user directory (~/.dsh/.agent-presets/j-space)')
      console.log('  node bin/cli.js uninstall  Remove J-Space preset from DSH user directory')
      console.log('  node bin/cli.js verify     Verify integrity of installed J-Space preset')
      console.log('  node bin/cli.js status     Check current installation status')
      break
    }
  }
}

main().catch((err) => {
  console.error('Error:', err)
  process.exitCode = 1
})
