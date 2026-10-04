/**
 * Standalone plugin for DeepSeek Harness that integrates J-Space Cognition Suite SV1 as an Agent Preset.
 * @module @anonyjcy/dsh-j-space
 */

import type { Context } from '@deepseek-ai/cordis'
import { installJSpacePreset, isJSpacePresetInstalled } from './installer.ts'

export {
  getJSpaceTemplatePath,
  installJSpacePreset,
  isJSpacePresetInstalled,
  PRESET_ID,
  targetUserPresetDir,
  uninstallJSpacePreset,
  USER_PRESET_DIR,
  verifyJSpacePreset,
  type InstallOptions,
  type VerificationResult,
} from './installer.ts'

/** Cordis plugin name. */
export const name = 'plugin-j-space'

/** Configuration options for the plugin. */
export interface Config {
  /** Auto-deploy preset to user preset directory if missing (default: true). */
  autoDeploy?: boolean
}

/**
 * Apply the J-Space plugin to a Cordis Context.
 * Deploys the legacy preset files if missing; DSH 0.2.0 registration is
 * handled separately by the package's bundle patch.
 * @param ctx - Cordis context.
 * @param config - plugin configuration.
 */
export async function apply(ctx: Context, config: Config = {}): Promise<void> {
  const autoDeploy = config.autoDeploy ?? true
  if (!autoDeploy) return

  // Cordis awaits async plugin application, including mounts in an active host.
  // It does not emit the old `ready` event in Cordis 4.
  try {
    const installed = await isJSpacePresetInstalled()
    if (!installed) {
      await installJSpacePreset()
      ctx.logger.info('J-Space Cognition Suite SV1 preset deployed to DSH user presets directory.')
    }
  } catch (error) {
    ctx.logger.warn(`Failed to auto-deploy J-Space preset: ${String(error)}`)
  }
}

export default {
  name,
  apply,
}
