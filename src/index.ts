/**
 * Standalone plugin for DeepSeek Harness that integrates J-Space Cognition Suite V3.7 as an Agent Preset.
 * @module @deepseek-ai/dsh-plugin-j-space
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
 * Ensures the J-Space preset is available in the DSH environment.
 * @param ctx - Cordis context.
 * @param config - plugin configuration.
 */
export function apply(ctx: Context, config: Config = {}): void {
  const autoDeploy = config.autoDeploy ?? true
  if (!autoDeploy) return

  ctx.on('ready', async () => {
    try {
      const installed = await isJSpacePresetInstalled()
      if (!installed) {
        await installJSpacePreset()
        ctx.logger.info('J-Space Cognition Suite V3.7 preset deployed to DSH user presets directory.')
      }
    } catch (error) {
      ctx.logger.warn(`Failed to auto-deploy J-Space preset: ${String(error)}`)
    }
  })
}

export default {
  name,
  apply,
}
