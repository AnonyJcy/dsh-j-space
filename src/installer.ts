/**
 * J-Space preset installer and lifecycle utilities.
 * @module dsh-plugin-j-space/installer
 */

import { cp, mkdir, rm, stat } from 'node:fs/promises'
import { homedir } from 'node:os'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

/** Directory name for the default DeepSeek Harness home under the OS home. */
export const DSH_HOME_DIR_NAME = '.dsh'
/** Environment variable that overrides the default DeepSeek Harness home. */
export const DSH_HOME_ENV = 'DSH_HOME'
/** Subdirectory under DSH home where user-authored presets live. */
export const USER_PRESET_DIR = '.agent-presets'
/** The preset id for J-Space Cognition Suite. */
export const PRESET_ID = 'j-space'

/**
 * Expand supported tilde prefixes against the operating-system home.
 * @param path - path starting with ~
 * @returns expanded absolute path
 */
export function expandHomePath(path: string): string {
  if (path === '~') return homedir()
  if (path.startsWith('~/') || path.startsWith('~\\')) return join(homedir(), path.slice(2))
  return path
}

/**
 * Resolve the single-root DeepSeek Harness home directory.
 * @param configured - explicit harness-home override
 * @param env - environment variable map
 * @returns resolved absolute DSH home directory path
 */
export function resolveDshHome(configured?: string, env: Record<string, string | undefined> = process.env): string {
  const fromEnv = env[DSH_HOME_ENV]
  const selected = configured ?? (fromEnv !== undefined && fromEnv.trim().length > 0 ? fromEnv : join(homedir(), DSH_HOME_DIR_NAME))
  return resolve(expandHomePath(selected))
}

/**
 * Join path segments onto the resolved DeepSeek Harness home.
 * @param segments - path segments to append
 * @returns normalized absolute joined path
 */
export function dshHomePath(...segments: string[]): string {
  return join(resolveDshHome(), ...segments)
}

/**
 * Resolve the directory holding the bundled J-Space preset template.
 * @returns absolute path to the bundled preset template directory.
 */
export function getJSpaceTemplatePath(): string {
  return fileURLToPath(new URL('../preset/', import.meta.url))
}

/**
 * Resolve the destination preset directory under DSH home.
 * @param dshHome - optional explicit DSH home directory path.
 * @returns absolute path to the target j-space preset directory.
 */
export function targetUserPresetDir(dshHome?: string): string {
  if (dshHome !== undefined && dshHome !== '') {
    return join(resolveDshHome(dshHome), USER_PRESET_DIR, PRESET_ID)
  }
  return join(dshHomePath(USER_PRESET_DIR), PRESET_ID)
}

/**
 * Whether the J-Space preset is installed in the target directory.
 * @param targetDir - optional target directory to check (defaults to user preset path).
 * @returns true if the preset composition file exists.
 */
export async function isJSpacePresetInstalled(targetDir?: string): Promise<boolean> {
  const dir = targetDir ?? targetUserPresetDir()
  try {
    const s = await stat(join(dir, 'agent.cordis.yml'))
    return s.isFile()
  } catch {
    return false
  }
}

/**
 * Options for installing the J-Space preset.
 */
export interface InstallOptions {
  /** Explicit DSH home root directory. */
  dshHome?: string
  /** Whether to overwrite existing files. */
  force?: boolean
}

/**
 * Install the J-Space preset and bundled cognition suite into DSH home.
 * @param options - installation options.
 * @returns absolute destination path of the installed preset.
 */
export async function installJSpacePreset(options: InstallOptions = {}): Promise<string> {
  const templateDir = getJSpaceTemplatePath()
  const targetDir = targetUserPresetDir(options.dshHome)

  await mkdir(dirname(targetDir), { recursive: true })
  await cp(templateDir, targetDir, {
    recursive: true,
    force: options.force ?? true,
  })

  return targetDir
}

/**
 * Uninstall the J-Space preset from DSH home.
 * @param dshHome - optional explicit DSH home directory path.
 * @returns true if the directory was deleted, false if it did not exist.
 */
export async function uninstallJSpacePreset(dshHome?: string): Promise<boolean> {
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

/**
 * Verification result of a J-Space preset installation.
 */
export interface VerificationResult {
  /** Whether all required files are present and valid. */
  ok: boolean
  /** Path of the verified preset. */
  presetPath: string
  /** Error or diagnostic message if verification failed. */
  message?: string
}

/**
 * Verify that a J-Space preset installation contains required composition and skill files.
 * @param presetPath - optional path to preset directory (defaults to user preset directory).
 * @returns verification result.
 */
export async function verifyJSpacePreset(presetPath?: string): Promise<VerificationResult> {
  const dir = presetPath ?? targetUserPresetDir()
  const files = [
    'preset.yml',
    'agent.cordis.yml',
    'skills/j-space/SKILL.md',
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
