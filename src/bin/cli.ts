#!/usr/bin/env node
/**
 * CLI for J-Space Preset management in DeepSeek Harness.
 */

import { installJSpacePreset, isJSpacePresetInstalled, targetUserPresetDir, uninstallJSpacePreset, verifyJSpacePreset } from '../installer.ts'

const command = process.argv[2] ?? 'status'

async function main(): Promise<void> {
  switch (command) {
    case 'install': {
      console.log('Installing J-Space Cognition Suite V3.7 preset...')
      const dest = await installJSpacePreset()
      console.log(`Successfully installed to: ${dest}`)
      const check = await verifyJSpacePreset(dest)
      if (check.ok) {
        console.log('Preset verification passed! J-Space is ready to use in DeepSeek Harness.')
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
        console.log('J-Space preset files are healthy and complete.')
      } else {
        console.error(`Verification failed: ${check.message}`)
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
      console.log('  dsh-j-space install    Install J-Space preset to DSH user directory')
      console.log('  dsh-j-space uninstall  Remove J-Space preset from DSH user directory')
      console.log('  dsh-j-space verify     Verify integrity of installed J-Space preset')
      console.log('  dsh-j-space status     Check current installation status')
      break
    }
  }
}

main().catch((err) => {
  console.error('Error:', err)
  process.exitCode = 1
})
