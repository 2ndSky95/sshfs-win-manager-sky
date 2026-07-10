import { currentPlatform } from '@/platform/index.js'
import { defaultLocale, normalizeLocale } from '@/i18n/locales.js'

const defaultSettings = {
  sshfsBinary: currentPlatform.sshfsBinary,
  startupWithOS: true,
  startInTray: true,
  displayTrayMessageOnClose: true,
  closeWindowQuits: false,
  blurAddresses: false,
  processTrackTimeout: 15,
  showDebugPanel: false,
  compactMode: false,
  demoMode: false,
  passkeyEnabled: true,
  passkeyRetention: '12h',
  theme: 'dark-graphite',
  language: defaultLocale
}

function normalizeSettings (settings = {}) {
  return {
    ...defaultSettings,
    ...settings,
    sshfsBinary: settings.sshfsBinary || defaultSettings.sshfsBinary,
    startupWithOS: typeof settings.startupWithOS === 'boolean' ? settings.startupWithOS : defaultSettings.startupWithOS,
    startInTray: typeof settings.startInTray === 'boolean' ? settings.startInTray : defaultSettings.startInTray,
    blurAddresses: typeof settings.blurAddresses === 'boolean' ? settings.blurAddresses : defaultSettings.blurAddresses,
    displayTrayMessageOnClose: typeof settings.displayTrayMessageOnClose === 'boolean' ? settings.displayTrayMessageOnClose : defaultSettings.displayTrayMessageOnClose,
    closeWindowQuits: typeof settings.closeWindowQuits === 'boolean' ? settings.closeWindowQuits : defaultSettings.closeWindowQuits,
    processTrackTimeout: Number(settings.processTrackTimeout) || defaultSettings.processTrackTimeout,
    showDebugPanel: typeof settings.showDebugPanel === 'boolean' ? settings.showDebugPanel : defaultSettings.showDebugPanel,
    compactMode: typeof settings.compactMode === 'boolean' ? settings.compactMode : defaultSettings.compactMode,
    demoMode: typeof settings.demoMode === 'boolean' ? settings.demoMode : defaultSettings.demoMode,
    passkeyEnabled: typeof settings.passkeyEnabled === 'boolean' ? settings.passkeyEnabled : defaultSettings.passkeyEnabled,
    passkeyRetention: settings.passkeyRetention || defaultSettings.passkeyRetention,
    theme: settings.theme || defaultSettings.theme,
    language: normalizeLocale(settings.language)
  }
}

export {
  defaultSettings,
  normalizeSettings
}
