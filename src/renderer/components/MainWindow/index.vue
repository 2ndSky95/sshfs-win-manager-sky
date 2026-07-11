<template>
    <div class="main-shell" :class="{ 'compact-mode': appSettings.compactMode }">
      <header class="tab-bar">
        <div class="brand">
          <span class="brand-logo">
            <img class="brand-logo-img" :src="logoSky" alt="">
            <span class="brand-logo-tint tint-cloud" :style="maskStyle(logoMaskFull)"></span>
            <span class="brand-logo-tint tint-folder" :style="maskStyle(logoMaskHole)"></span>
          </span>
          <div class="brand-text">
            <strong>SSHFS-Win</strong>
            <span>Manager <em>Sky</em></span>
          </div>
        </div>

        <button class="tab-item" :class="{ active: activeSection === 'favorites' }" :disabled="connectionFormVisible" type="button" @click="showFavorites">
          <Icon icon="star"/>
          <span class="tab-label">{{ $t('nav.favorites') }}</span>
        </button>

        <button class="tab-item" :class="{ active: activeSection === 'connections' }" :disabled="connectionFormVisible" type="button" @click="showConnections">
          <Icon icon="sshfsFolder"/>
          <span class="tab-label">{{ $t('nav.connections') }}</span>
        </button>

        <button class="tab-item" :class="{ active: activeSection === 'settings' }" :disabled="connectionFormVisible" type="button" @click="showSettings">
          <Icon icon="settings"/>
          <span class="tab-label">{{ $t('nav.settings') }}</span>
        </button>

        <button v-if="appSettings.showDebugPanel" class="tab-item" :class="{ active: activeSection === 'debug' }" :disabled="connectionFormVisible" type="button" @click="showDebug">
          <span class="terminal-glyph">&gt;_</span>
          <span class="tab-label">Debug</span>
        </button>

        <div class="tab-spacer"></div>

        <button class="tab-item" :class="{ active: activeSection === 'about' }" :disabled="connectionFormVisible" type="button" @click="showAbout">
          <Icon icon="help"/>
          <span class="tab-label">{{ $t('nav.about') }}</span>
        </button>

        <div class="window-controls">
          <button class="window-control" type="button" @click="windowMinimize">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32"><path d="M 7 23 L 25 23 L 25 25 L 7 25 Z "/></svg>
          </button>
          <button class="window-control close" type="button" @click="windowClose">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32"><path d="M 7.21875 5.78125 L 5.78125 7.21875 L 14.5625 16 L 5.78125 24.78125 L 7.21875 26.21875 L 16 17.4375 L 24.78125 26.21875 L 26.21875 24.78125 L 17.4375 16 L 26.21875 7.21875 L 24.78125 5.78125 L 16 14.5625 Z "/></svg>
          </button>
        </div>
      </header>

      <main class="tab-content">
      <section v-if="connectionFormVisible" class="form-tab">
        <AddEditConnectionWindow
          :key="connectionFormUuid || 'new-connection'"
          embedded
          :edit-uuid="connectionFormUuid"
          @close="connectionFormVisible = false"
        />
      </section>

      <section v-else-if="activeSection === 'connections' || activeSection === 'favorites'" class="connection-panel">
        <div class="panel-toolbar" :class="{ 'has-edit-toggle': sortMode === 'manual' }">
          <label class="search-box">
            <Icon icon="info"/>
            <input v-model="searchText" type="search" :placeholder="$t('list.searchPlaceholder')">
          </label>

          <button
            v-if="sortMode === 'manual'"
            class="edit-toggle icon-only"
            :class="{ active: isEditModeEnabled }"
            type="button"
            v-tooltip="isEditModeEnabled ? $t('list.editDone') : $t('list.editOrder')"
            @click="listMode = isEditModeEnabled ? 'none' : 'edit'"
          >
            <Icon icon="pen"/>
          </button>

          <AppSelect v-model="sortMode" class="sort-select" :options="sortOptions" @update:modelValue="handleSortModeChange"/>
        </div>

        <div v-if="!hasConnections" class="empty-list">
          <Icon icon="sshfsFolder"/>
          <h1>{{ $t('list.emptyTitle') }}</h1>
          <p>{{ $t('list.emptyText') }}</p>
          <div class="list-footer">
            <button class="btn primary-action" type="button" @click="addNewConnection">
              <Icon icon="plus"/>
              {{ $t('detail.newConnection') }}
            </button>
          </div>
        </div>

        <div v-else class="connection-list" :style="{ '--drive-badge-w': driveBadgeWidth }">
          <template v-for="conn in filteredConnections" :key="conn.uuid">
          <button
            type="button"
            class="connection-card"
            :class="{ connected: conn.status === 'connected', expanded: expandedConnectionUuid === conn.uuid, favorite: conn.favorite, editing: showDragGrip, 'drop-before': dragOverUuid === conn.uuid && dragOverPosition === 'before', 'drop-after': dragOverUuid === conn.uuid && dragOverPosition === 'after' }"
            :draggable="showDragGrip"
            @click="toggleExpandConnection(conn)"
            @dragstart="dragConnection(conn.uuid)"
            @dragover.prevent="dragOverConnection(conn, $event)"
            @dragend="clearDragState"
            @drop="dropConnection(conn.uuid)"
          >
            <span v-if="showDragGrip" class="drag-grip">
              <Icon icon="grip"/>
            </span>

            <span class="connection-icon">
              <img v-if="conn.iconDataUrl" :src="conn.iconDataUrl" :alt="conn.name">
              <Icon v-else icon="sshfsFolder"/>
            </span>

            <span class="connection-main">
              <strong><b class="drive-inline">{{ mountPointLabel(conn) }}</b>{{ conn.name }}</strong>
              <span class="connection-meta">
                <span>
                  <b>{{ mountPointLabel(conn) }}</b>
                  <span class="connection-target">
                    <span :class="{ 'blur-secret': appSettings.blurAddresses }">{{ conn.host }}</span>
                    <i>&middot;</i>
                    {{ conn.folder || '/' }}
                  </span>
                </span>
              </span>
            </span>

            <span class="quick-actions">
              <span class="connection-state" :class="conn.status || 'disconnected'">{{ $t('status.' + (conn.status || 'disconnected')) }}</span>
              <button
                type="button"
                class="round-action favorite"
                :class="{ active: conn.favorite }"
                v-tooltip="conn.favorite ? $t('list.removeFavorite') : $t('list.addFavorite')"
                @click.stop="toggleFavorite(conn)"
              >
                <Icon icon="star"/>
              </button>
              <button
                type="button"
                class="round-action open-folder"
                :disabled="conn.status !== 'connected'"
                v-tooltip="$t('common.openFolder')"
                @click.stop="openLocal(getLocalMountPath(conn))"
              >
                <Icon icon="openFolder"/>
              </button>
              <button
                type="button"
                class="round-action open-terminal"
                :disabled="conn.status !== 'connected'"
                v-tooltip="$t('common.openTerminal')"
                @click.stop="openTerminal(conn)"
              >
                <span>&gt;_</span>
              </button>
              <button
                v-if="conn.status === 'connected'"
                type="button"
                class="round-action primary"
                v-tooltip="$t('common.disconnect')"
                @click.stop="disconnect(conn)"
              >
                <Icon icon="plugConnected"/>
              </button>
              <button
                v-else
                type="button"
                class="round-action"
                :class="{ loading: conn.status === 'connecting' }"
                :disabled="conn.status === 'connecting' || conn.status === 'disconnecting'"
                v-tooltip="conn.status === 'connecting' ? $t('common.connecting') : $t('common.connect')"
                @click.stop="connect(conn)"
              >
                <Icon icon="plugDisconnected"/>
              </button>
            </span>
          </button>

          <div v-if="expandedConnectionUuid === conn.uuid" class="connection-expanded">
            <div class="info-panel">
              <div class="info-row">
                <span>{{ $t('detail.address') }}</span>
                <strong :class="{ 'blur-secret': appSettings.blurAddresses }">{{ conn.host }}</strong>
              </div>
              <div class="info-row">
                <span>{{ $t('detail.port') }}</span>
                <strong>{{ conn.port || 22 }}</strong>
              </div>
              <div class="info-row">
                <span>{{ $t('detail.mountPoint') }}</span>
                <strong>{{ mountPointLabel(conn) }}</strong>
              </div>
              <div class="info-row">
                <span>{{ $t('detail.remotePath') }}</span>
                <strong>{{ conn.folder || '/' }}</strong>
              </div>
              <div class="info-row">
                <span>{{ $t('detail.user') }}</span>
                <strong>{{ conn.user || '-' }}</strong>
              </div>
              <div class="info-row ssh-command-row">
                <span>{{ $t('detail.sshCommand') }}</span>
                <strong>
                  <button type="button" v-tooltip="$t('detail.copySshCommand')" @click="copySshCommand(conn)">
                    <Icon icon="duplicate"/>
                  </button>
                </strong>
              </div>
            </div>

            <div class="expanded-actions">
              <button class="action-button" type="button" @click="editConnection(conn)">
                <Icon icon="pen"/>
                {{ $t('common.edit') }}
              </button>
              <button class="action-button" type="button" @click="cloneConnection(conn)">
                <Icon icon="duplicate"/>
                {{ $t('common.duplicate') }}
              </button>
              <button class="action-button" type="button" @click="selectConnectionIcon(conn)">
                <Icon icon="pen"/>
                {{ $t('detail.changeIcon') }}
              </button>
              <button v-if="conn.iconDataUrl" class="action-button" type="button" @click="removeConnectionIcon(conn)">
                <Icon icon="unavailable"/>
                {{ $t('detail.removeIcon') }}
              </button>
              <button class="action-button danger" type="button" @click="deleteConnection(conn)">
                <Icon icon="trashCan"/>
                {{ $t('common.delete') }}
              </button>
            </div>
          </div>
          </template>

          <div class="list-footer">
            <button class="btn primary-action" type="button" @click="addNewConnection">
              <Icon icon="plus"/>
              {{ $t('detail.newConnection') }}
            </button>
          </div>
        </div>
      </section>

      <section v-else-if="activeSection === 'settings'" class="settings-tab">
        <div class="settings-scroll">
          <div class="workspace-card settings-workspace">
            <header class="workspace-header">
              <div>
                <h1>{{ $t('settings.title') }}</h1>
                <p>{{ $t('settings.subtitle') }}</p>
              </div>
            </header>

            <div class="settings-section">
              <h2>{{ $t('settings.sectionGeneral') }}</h2>
              <div class="settings-grid">
                <label class="field">
                  <span>{{ $t('settings.sshfsBinary') }}</span>
                  <input v-model="settingsForm.sshfsBinary" type="text" :placeholder="sshfsBinaryPlaceholder">
                </label>

                <label class="field compact">
                  <span>{{ $t('settings.processTimeout') }}</span>
                  <input v-model.number="settingsForm.processTrackTimeout" type="number" min="1">
                </label>

                <label class="field">
                  <span>{{ $t('settings.theme') }}</span>
                  <AppSelect v-model="settingsForm.theme" :groups="themeSelectGroups" @update:modelValue="previewTheme"/>
                </label>

                <label class="field compact">
                  <span>{{ $t('settings.language') }}</span>
                  <AppSelect v-model="settingsForm.language" :options="languageOptions" @update:modelValue="previewLanguage"/>
                </label>

              </div>

              <div class="toggle-list">
                <label class="settings-toggle opacity-row">
                  <span class="toggle-text">{{ $t('settings.windowOpacity') }}</span>
                  <input
                    v-model.number="settingsForm.windowOpacity"
                    type="range"
                    min="0.5"
                    max="1"
                    step="0.01"
                    @input="previewOpacity(settingsForm.windowOpacity)"
                  >
                </label>
                <label class="settings-toggle">
                  <input v-model="settingsForm.startupWithOS" type="checkbox">
                  <span class="switch-track"></span>
                  <span class="toggle-text">{{ $t('settings.startupWithOS', { os: platformDisplayName }) }}</span>
                </label>
                <label class="settings-toggle" :class="{ 'is-disabled': !settingsForm.startupWithOS }">
                  <input v-model="settingsForm.startInTray" type="checkbox" :disabled="!settingsForm.startupWithOS">
                  <span class="switch-track"></span>
                  <span class="toggle-text">{{ $t(isMac ? 'settings.startInMenuBar' : 'settings.startInTray') }}</span>
                </label>
                <label class="settings-toggle">
                  <input v-model="settingsForm.closeWindowQuits" type="checkbox">
                  <span class="switch-track"></span>
                  <span class="toggle-text">{{ $t('settings.closeWindowQuits') }}</span>
                </label>
                <label class="settings-toggle" :class="{ 'is-disabled': settingsForm.closeWindowQuits }">
                  <input v-model="settingsForm.displayTrayMessageOnClose" type="checkbox" :disabled="settingsForm.closeWindowQuits">
                  <span class="switch-track"></span>
                  <span class="toggle-text">{{ $t('settings.displayTrayMessageOnClose') }}</span>
                </label>
                <label class="settings-toggle">
                  <input v-model="settingsForm.blurAddresses" type="checkbox">
                  <span class="switch-track"></span>
                  <span class="toggle-text">{{ $t('settings.blurAddresses') }}</span>
                </label>
                <label class="settings-toggle">
                  <input v-model="settingsForm.compactMode" type="checkbox">
                  <span class="switch-track"></span>
                  <span class="toggle-text">{{ $t('settings.compactMode') }}</span>
                </label>
                <label class="settings-toggle">
                  <input v-model="settingsForm.showDebugPanel" type="checkbox">
                  <span class="switch-track"></span>
                  <span class="toggle-text">{{ $t('settings.showDebugPanel') }}</span>
                </label>
              </div>
            </div>

            <div class="settings-section">
              <h2>{{ $t('settings.sectionPasskey') }}</h2>
              <div class="toggle-list passkey-row">
                <label class="settings-toggle">
                  <input v-model="settingsForm.passkeyEnabled" type="checkbox">
                  <span class="switch-track"></span>
                  <span class="toggle-text">{{ $t('settings.passkeyEnabled') }}</span>
                </label>
                <label class="field compact passkey-retention" :class="{ 'is-disabled': !settingsForm.passkeyEnabled }">
                  <span>{{ $t('settings.passkeyRetention') }}</span>
                  <AppSelect v-model="settingsForm.passkeyRetention" :options="retentionOptions" :disabled="!settingsForm.passkeyEnabled"/>
                </label>
              </div>
            </div>

            <div class="settings-section">
              <h2>{{ $t('settings.sectionData') }}</h2>
              <div class="settings-actions">
                <button class="action-button" type="button" @click="exportConnections">
                  <Icon icon="duplicate"/>
                  {{ $t('settings.exportJson') }}
                </button>
                <button class="action-button" type="button" @click="importConnections">
                  <Icon icon="openFolder"/>
                  {{ $t('settings.importJson') }}
                </button>
                <button class="action-button" type="button" @click="importLegacyConfiguration">
                  <Icon icon="duplicate"/>
                  {{ $t('settings.importLegacy') }}
                </button>
              </div>
            </div>
          </div>
        </div>

        <div v-if="settingsFormDirty" class="settings-form-actions">
          <button class="btn cancel-action" type="button" @click="resetSettingsForm">{{ $t('common.cancel') }}</button>
          <button class="btn save-action" type="button" @click="saveSettings">{{ $t('common.save') }}</button>
        </div>
      </section>

      <section v-else-if="activeSection === 'about'" class="tab-workspace">
        <div class="workspace-card about-workspace">
          <header class="workspace-header about-header">
            <img class="about-logo" :src="logoSky" alt="SSHFS-Win Manager Sky">
            <div>
              <h1>SSHFS-Win Manager Sky</h1>
              <p>{{ $t('about.versionLine', { version: appVersion }) }}</p>
            </div>
          </header>

          <div class="about-content">
            <p>{{ $t('about.maintainedBy') }}</p>
            <p>{{ $t('about.website') }} <button class="text-link" type="button" @click="openExternal('https://4-sky.de')">4-sky.de</button></p>
            <p>
              {{ $t('about.basedOn') }}
              <button class="text-link" type="button" @click="openExternal('https://www.emulsion.io')">emulsion.io</button>
              ·
              <button class="text-link" type="button" @click="openExternal('https://github.com/evsar3/sshfs-win-manager')">evsar3</button>
            </p>
            <p>{{ $t('about.license') }}</p>

            <h2>{{ $t('about.libraries') }}</h2>
            <div class="library-grid">
              <button type="button" @click="openExternal('https://github.com/nodejs/node')">Node.js</button>
              <button type="button" @click="openExternal('https://github.com/electron/electron')">Electron</button>
              <button type="button" @click="openExternal('https://github.com/vitejs/vite')">Vite</button>
              <button type="button" @click="openExternal('https://github.com/alex8088/electron-vite')">electron-vite</button>
              <button type="button" @click="openExternal('https://github.com/vuejs/core')">Vue.js</button>
              <button type="button" @click="openExternal('https://github.com/vuejs/vuex')">Vuex</button>
              <button type="button" @click="openExternal('https://github.com/billziss-gh/sshfs-win')">SSHFS-Win</button>
            </div>
          </div>

        </div>
      </section>

      <section v-else-if="activeSection === 'debug'" class="tab-workspace debug-workspace">
        <div class="debug-panel">
          <div class="debug-header">
            <strong>{{ $t('detail.debugOutput') }}</strong>
            <span>
              <button type="button" v-tooltip="$t('detail.clearDebug')" @click="clearDebugOutput">
                <Icon icon="unavailable"/>
              </button>
              <button type="button" v-tooltip="$t('detail.copyDebug')" @click="copyDebugOutput">
                <Icon icon="duplicate"/>
              </button>
            </span>
          </div>
          <textarea v-model="debugOutput" readonly ref="debugOutput"></textarea>
        </div>
      </section>
      </main>

      <footer class="status-bar">
        <div class="status-left">
          <span><Icon icon="sshfsFolder"/> {{ $t('detail.connectionsCount', { count: connections.length }) }}</span>
          <span class="success"><span class="status-dot"></span> {{ $t('detail.connectedCount', { count: connectedConnections.length }) }}</span>
          <span class="warning"><span class="status-dot"></span> {{ $t('detail.busyCount', { count: busyConnections.length }) }}</span>
        </div>
        <div class="status-right">
          <span class="success"><span class="status-dot"></span> {{ $t('app.serviceActive') }}</span>
        </div>
      </footer>
    </div>

    <div v-if="notificationToast" class="app-toast" :class="notificationToast.type">
      {{ notificationToast.text }}
    </div>

    <div v-if="passkeyConfirmVisible" class="modal-backdrop" @click.self="resolvePasskeyConfirm(false)">
      <div class="modal-card">
        <h2>{{ $t('settings.passkeyDisableTitle') }}</h2>
        <p>{{ $t('settings.passkeyDisableConfirm') }}</p>
        <div class="modal-actions">
          <button class="btn" type="button" @click="resolvePasskeyConfirm(false)">{{ $t('common.cancel') }}</button>
          <button class="btn primary-action" type="button" @click="resolvePasskeyConfirm(true)">{{ $t('common.ok') }}</button>
        </div>
      </div>
    </div>
</template>

<script>
import fs from 'fs'
import { ipcRenderer } from 'electron'

import { v4 as uuid } from 'uuid'

import ProcessManager from '@/ProcessManager.js'
import SecretManager from '@/SecretManager.js'
import { setLocale } from '@/i18n/index.js'
import { supportedLocaleOptions } from '@/i18n/locales.js'
import { defaultSettings, normalizeSettings } from '@/store/SettingsDefaults.js'
import { stateReady } from '@/store/index.js'
import AppSelect from '@/components/AppSelect.vue'
import { currentPlatform, getConnectionMountPoint, isMountPointActive, shortenPathForDisplay } from '@/platform/index.js'

import Icon from '@/components/Icon.vue'
import AddEditConnectionWindow from '@/components/AddEditConnectionWindow/index.vue'

import logoSky from '@/assets/logo-sky.png'
import logoMaskFull from '@/assets/logo-mask-full.png'
import logoMaskHole from '@/assets/logo-mask-hole.png'

export default {
  name: 'main-window',

  components: {
    Icon,
    AddEditConnectionWindow,
    AppSelect
  },

  methods: {
    showConnections () {
      this.activeSection = 'connections'
    },

    showDebug () {
      this.activeSection = 'debug'
    },

    windowMinimize () {
      ipcRenderer.send('window:minimize-current')
    },

    setupWindowDrag () {
      let drag = null
      let dragMoved = false

      window.addEventListener('mousedown', e => {
        if (e.button !== 0) {
          return
        }

        if (e.target.closest('input, select, textarea, .modal-card, [draggable="true"]')) {
          return
        }

        let el = e.target
        while (el && el !== document.documentElement) {
          if (el.scrollHeight > el.clientHeight || el.scrollWidth > el.clientWidth) {
            const rect = el.getBoundingClientRect()
            if (e.clientX > rect.left + el.clientWidth || e.clientY > rect.top + el.clientHeight) {
              return
            }
          }
          el = el.parentElement
        }

        drag = { sx: e.screenX, sy: e.screenY, pos: null, active: false }
        dragMoved = false

        ipcRenderer.invoke('window:get-position').then(pos => {
          if (drag) {
            drag.pos = pos
          }
        })
      })

      window.addEventListener('mousemove', e => {
        if (!drag || !drag.pos) {
          return
        }

        const dx = e.screenX - drag.sx
        const dy = e.screenY - drag.sy

        if (!drag.active && Math.abs(dx) + Math.abs(dy) < 5) {
          return
        }

        drag.active = true
        dragMoved = true

        ipcRenderer.send('window:set-position', {
          x: drag.pos[0] + dx,
          y: drag.pos[1] + dy
        })
      })

      window.addEventListener('mouseup', () => {
        drag = null
      })

      window.addEventListener('click', e => {
        if (dragMoved) {
          dragMoved = false
          e.stopPropagation()
          e.preventDefault()
        }
      }, true)
    },

    async windowClose () {
      if (this.appSettings.closeWindowQuits) {
        await ProcessManager.terminateAll()
        ipcRenderer.send('app:quit')
        return
      }

      ipcRenderer.send('window:hide-current')
      this.showRunningInBackgroundNotification()
    },

    showFavorites () {
      this.activeSection = 'favorites'
    },

    showSettings () {
      this.activeSection = 'settings'
      this.settingsForm = normalizeSettings(this.appSettings)
    },

    showAbout () {
      this.activeSection = 'about'
    },

    handleSortModeChange () {
      if (this.sortMode !== 'manual') {
        this.listMode = 'none'
      }
    },

    toggleFavorite (conn) {
      conn.favorite = !conn.favorite
      this.$store.dispatch('UPDATE_CONNECTION', conn)
    },

    async selectConnectionIcon (conn) {
      const iconDataUrl = await ipcRenderer.invoke('dialog:select-connection-icon')

      if (!iconDataUrl) {
        return
      }

      this.$store.dispatch('UPDATE_CONNECTION', {
        ...conn,
        iconDataUrl
      })
    },

    removeConnectionIcon (conn) {
      this.$store.dispatch('UPDATE_CONNECTION', {
        ...conn,
        iconDataUrl: null
      })
    },

    previewTheme (theme) {
      if (!theme) {
        return
      }

      document.body.dataset.theme = theme
      ipcRenderer.send('theme:preview', theme)
      this.$store.dispatch('UPDATE_SETTINGS', {
        ...this.appSettings,
        theme
      })
    },

    resetSettingsForm () {
      this.settingsForm = normalizeSettings(this.appSettings)
      this.previewTheme(this.settingsForm.theme)
      this.previewLanguage(this.settingsForm.language)
      this.previewOpacity(this.settingsForm.windowOpacity)
      this.activeSection = 'connections'
    },

    previewOpacity (value) {
      ipcRenderer.send('main-window:set-opacity', value)
    },

    previewLanguage (language) {
      setLocale(language)
    },

    async saveSettings () {
      const settings = normalizeSettings(this.settingsForm)
      const passkeyWasEnabled = this.appSettings.passkeyEnabled !== false

      if (passkeyWasEnabled && !settings.passkeyEnabled) {
        if (!(await this.confirmPasskeyDisable())) {
          this.settingsForm.passkeyEnabled = true
          return
        }

        if (!(await this.decryptAllSecretsToPlainText())) {
          this.settingsForm.passkeyEnabled = true
          return
        }
      }

      if (!passkeyWasEnabled && settings.passkeyEnabled) {
        if (!(await this.encryptAllPlainTextPasswords())) {
          this.settingsForm.passkeyEnabled = false
          return
        }
      }

      if (!settings.showDebugPanel && this.activeSection === 'debug') {
        this.activeSection = 'settings'
      }

      if (settings.compactMode !== (this.appSettings.compactMode === true)) {
        ipcRenderer.send('main-window:set-size', { width: settings.compactMode ? 440 : 680 })
      }

      this.settingsForm = { ...settings }
      this.$store.dispatch('UPDATE_SETTINGS', settings)

      ipcRenderer.invoke('app:set-login-item-settings', {
        openAtLogin: settings.startupWithOS,
        args: settings.startInTray ? ['--systray'] : []
      }).catch(() => {})
    },

    async exportConnections () {
      const payload = {
        app: 'sshfs-win-manager-evo',
        formatVersion: 1,
        exportedAt: new Date().toISOString(),
        connections: this.connections
      }

      try {
        await ipcRenderer.invoke('connections:export', JSON.parse(JSON.stringify(payload)))
      } catch {
        window.alert(this.$t('settings.exportFailed'))
      }
    },

    async importConnections () {
      const result = await ipcRenderer.invoke('connections:import')

      if (result.canceled) {
        return
      }

      let data

      try {
        data = JSON.parse(result.content)
      } catch {
        window.alert(this.$t('settings.invalidImportJson'))
        return
      }

      const connections = Array.isArray(data) ? data : data.connections

      if (!Array.isArray(connections)) {
        window.alert(this.$t('settings.invalidImportConnections'))
        return
      }

      if (!window.confirm(this.$t('settings.importConfirm', { count: connections.length }))) {
        return
      }

      this.$store.dispatch('IMPORT_CONNECTIONS', connections)

      await this.offerEncryptImportedPasswords()
    },

    async offerEncryptImportedPasswords () {
      if (this.appSettings.passkeyEnabled === false) {
        return
      }

      const hasPlainTextPasswords = this.$store.state.Data.connections.some(conn => conn && conn.password && conn.authType !== 'key-file')

      if (!hasPlainTextPasswords) {
        return
      }

      if (!window.confirm(this.$t('settings.importEncryptPrompt'))) {
        return
      }

      await this.migratePlainTextPasswords()
    },

    async importLegacyConfiguration () {
      const result = await ipcRenderer.invoke('legacy-config:import')

      if (!result.found) {
        window.alert(this.$t('settings.legacyImportNotFound'))
        return
      }

      if (result.error) {
        window.alert(this.$t('settings.legacyImportReadFailed', { error: result.error }))
        return
      }

      const connections = Array.isArray(result.connections) ? result.connections : []

      if (!connections.length) {
        window.alert(this.$t('settings.legacyImportEmpty'))
        return
      }

      const hasPasswords = connections.some(conn => conn && conn.password)
      const message = hasPasswords
        ? this.$t('settings.legacyImportConfirmWithPasswords', { count: connections.length, filePath: result.filePath })
        : this.$t('settings.legacyImportConfirm', { count: connections.length, filePath: result.filePath })

      if (!window.confirm(message)) {
        return
      }

      const importedConnections = this.prepareLegacyConnections(connections)
      const mergedConnections = [
        ...this.connections,
        ...importedConnections
      ]

      this.$store.dispatch('IMPORT_CONNECTIONS', mergedConnections)
      this.sortMode = 'manual'

      if (importedConnections[0]) {
        this.selectedConnectionUuid = importedConnections[0].uuid
        this.activeSection = 'connections'
      }

      this.notify(this.$t('notifications.legacyImportDone', { count: importedConnections.length }))

      await this.offerEncryptImportedPasswords()
    },

    prepareLegacyConnections (connections) {
      const existingUuids = new Set(this.connections.map(conn => conn.uuid))

      return connections.map(conn => {
        const imported = JSON.parse(JSON.stringify(conn))

        if (!imported.uuid || existingUuids.has(imported.uuid)) {
          imported.uuid = uuid()
        }

        existingUuids.add(imported.uuid)

        imported.status = 'disconnected'
        imported.pid = 0
        imported.favorite = typeof imported.favorite === 'boolean' ? imported.favorite : false
        imported.iconDataUrl = typeof imported.iconDataUrl === 'string' ? imported.iconDataUrl : null
        imported.preferredMountPoint = imported.preferredMountPoint || null
        imported.mountPoint = imported.mountPoint || imported.preferredMountPoint || 'auto'
        imported.advanced = {
          customCmdlOptionsEnabled: false,
          customCmdlOptions: [],
          connectOnStartup: false,
          reconnect: false,
          ...(imported.advanced || {})
        }

        if (!imported.authType) {
          imported.authType = imported.keyFile ? 'key-file' : 'password'
        }

        return imported
      })
    },

    openExternal (url) {
      ipcRenderer.invoke('shell:open-external', url)
    },

    dragConnection (uuid) {
      this.draggedConnectionUuid = uuid
    },

    dragOverConnection (conn, event) {
      if (!this.draggedConnectionUuid || conn.uuid === this.draggedConnectionUuid) {
        this.dragOverUuid = null
        return
      }

      const rect = event.currentTarget.getBoundingClientRect()

      this.dragOverUuid = conn.uuid
      this.dragOverPosition = (event.clientY - rect.top) < rect.height / 2 ? 'before' : 'after'
    },

    clearDragState () {
      this.draggedConnectionUuid = null
      this.dragOverUuid = null
    },

    dropConnection (uuid) {
      if (!this.draggedConnectionUuid || this.draggedConnectionUuid === uuid) {
        this.clearDragState()
        return
      }

      const fromIndex = this.connections.findIndex(conn => conn.uuid === this.draggedConnectionUuid)

      if (fromIndex === -1) {
        this.clearDragState()
        return
      }

      const items = [...this.connections]
      const dragged = items.splice(fromIndex, 1)[0]
      const targetIndex = items.findIndex(conn => conn.uuid === uuid)

      if (targetIndex === -1) {
        this.clearDragState()
        return
      }

      items.splice(targetIndex + (this.dragOverPosition === 'after' ? 1 : 0), 0, dragged)

      this.clearDragState()
      this.sortMode = 'manual'
      this.$store.dispatch('REFRESH_CONNECTIONS', items)
    },

    selectConnection (conn) {
      this.selectedConnectionUuid = conn.uuid

      if (this.activeSection === 'settings' || this.activeSection === 'about') {
        this.activeSection = 'connections'
      }
    },

    toggleExpandConnection (conn) {
      this.selectConnection(conn)
      this.expandedConnectionUuid = this.expandedConnectionUuid === conn.uuid ? null : conn.uuid
    },

    toggleDeleteMode () {
      this.listMode = this.listMode === 'delete' ? 'none' : 'delete'
    },

    toggleEditMode () {
      this.listMode = this.listMode === 'edit' ? 'none' : 'edit'
    },

    async prepareConnectionForConnect (conn) {
      if (conn.authType !== 'password') {
        return conn
      }

      if (conn.secrets && conn.secrets.password) {
        try {
          const password = await SecretManager.decryptSecret(conn.secrets.password, this.appSettings)

          return password === null
            ? null
            : { ...conn, password }
        } catch {
          SecretManager.lock()
          this.notify(this.$t('notifications.passkeyInvalid'), 'error-icon')
          return null
        }
      }

      if (!conn.password) {
        const password = await this.requestConnectionPassword(conn)

        if (!password) {
          return null
        }

        if (this.appSettings.passkeyEnabled === false) {
          this.$store.dispatch('UPDATE_CONNECTION', {
            ...conn,
            password
          })

          return { ...conn, password }
        }

        const activePasskey = await SecretManager.getPasskey(this.appSettings, this.getFirstEncryptedPassword() ? 'unlock' : 'create')

        if (!activePasskey) {
          return null
        }

        const encrypted = SecretManager.encryptWithPasskey(password, activePasskey)

        this.$store.dispatch('UPDATE_CONNECTION', {
          ...conn,
          password: '',
          secrets: {
            ...(conn.secrets || {}),
            password: encrypted
          }
        })

        return { ...conn, password }
      }

      // Plain-text password while the passkey is enabled: always ask, regardless of retention.
      if (this.appSettings.passkeyEnabled !== false) {
        if (!window.confirm(this.$t('settings.connectEncryptPrompt'))) {
          return conn
        }

        const activePasskey = await SecretManager.getPasskey(this.appSettings, this.getFirstEncryptedPassword() ? 'unlock' : 'create')

        if (!activePasskey) {
          return null
        }

        const existingSecret = this.getFirstEncryptedPassword()

        if (existingSecret) {
          try {
            SecretManager.decryptWithPasskey(existingSecret, activePasskey)
          } catch {
            SecretManager.lock()
            this.notify(this.$t('notifications.passkeyInvalid'), 'error-icon')
            return null
          }
        }

        this.$store.dispatch('UPDATE_CONNECTION', {
          ...conn,
          password: '',
          secrets: {
            ...(conn.secrets || {}),
            password: SecretManager.encryptWithPasskey(conn.password, activePasskey)
          }
        })

        return { ...conn }
      }

      return conn
    },

    requestConnectionPassword (conn) {
      return new Promise(resolve => {
        ipcRenderer.once('password-prompt:response', (event, data) => {
          switch (data.message) {
            case 'connection-password':
              resolve(data.password)
              break

            case 'connection-password-cancel':
            default:
              resolve(null)
              break
          }
        })

        ipcRenderer.invoke('window:open', {
          name: 'password-prompt-window',
          route: `#/password-prompt/${conn.uuid}`,
          options: {
            height: 210,
            width: 350,
            useContentSize: true,
            frame: false,
            maximizable: false,
            minimizable: false,
            resizable: false,
            modal: true
          }
        })
      })
    },

    async migratePlainTextPasswords () {
      const plainPasswordConnections = this.$store.state.Data.connections.filter(conn => conn.password && conn.authType !== 'key-file')
      const existingEncryptedSecret = this.getFirstEncryptedPassword()

      if (!plainPasswordConnections.length) {
        return
      }

      const activePasskey = await SecretManager.getPasskey(this.appSettings, existingEncryptedSecret ? 'unlock' : 'create')

      if (!activePasskey) {
        return
      }

      if (existingEncryptedSecret) {
        try {
          SecretManager.decryptWithPasskey(existingEncryptedSecret, activePasskey)
        } catch {
          SecretManager.lock()
          this.notify(this.$t('notifications.passkeyInvalid'), 'error-icon')
          return
        }
      }

      for (const conn of plainPasswordConnections) {
        const encrypted = SecretManager.encryptWithPasskey(conn.password, activePasskey)

        this.$store.dispatch('UPDATE_CONNECTION', {
          ...conn,
          password: '',
          secrets: {
            ...(conn.secrets || {}),
            password: encrypted
          }
        })
      }
    },

    getFirstEncryptedPassword () {
      const conn = this.$store.state.Data.connections.find(conn => conn.secrets && conn.secrets.password)

      return conn && conn.secrets.password
    },

    confirmPasskeyDisable () {
      return new Promise(resolve => {
        this.passkeyConfirmResolve = resolve
        this.passkeyConfirmVisible = true
      })
    },

    resolvePasskeyConfirm (accepted) {
      this.passkeyConfirmVisible = false

      if (this.passkeyConfirmResolve) {
        this.passkeyConfirmResolve(accepted)
        this.passkeyConfirmResolve = null
      }
    },

    async decryptAllSecretsToPlainText () {
      const encryptedConnections = this.$store.state.Data.connections.filter(conn => conn.secrets && conn.secrets.password)

      if (!encryptedConnections.length) {
        SecretManager.lock()
        return true
      }

      SecretManager.lock()

      const activePasskey = await SecretManager.getPasskey(this.appSettings, 'unlock')

      if (!activePasskey) {
        return false
      }

      const decrypted = []

      try {
        for (const conn of encryptedConnections) {
          decrypted.push([conn, SecretManager.decryptWithPasskey(conn.secrets.password, activePasskey)])
        }
      } catch {
        SecretManager.lock()
        this.notify(this.$t('notifications.passkeyInvalid'), 'error-icon')
        return false
      }

      for (const [conn, password] of decrypted) {
        const secrets = { ...(conn.secrets || {}) }
        delete secrets.password

        this.$store.dispatch('UPDATE_CONNECTION', {
          ...conn,
          password,
          secrets
        })
      }

      SecretManager.lock()
      return true
    },

    async encryptAllPlainTextPasswords () {
      const plainPasswordConnections = this.$store.state.Data.connections.filter(conn => conn.authType === 'password' && conn.password)
      const existingEncryptedSecret = this.getFirstEncryptedPassword()

      SecretManager.lock()

      const activePasskey = await SecretManager.getPasskey(this.appSettings, existingEncryptedSecret ? 'unlock' : 'create')

      if (!activePasskey) {
        return false
      }

      if (existingEncryptedSecret) {
        try {
          SecretManager.decryptWithPasskey(existingEncryptedSecret, activePasskey)
        } catch {
          SecretManager.lock()
          this.notify(this.$t('notifications.passkeyInvalid'), 'error-icon')
          return false
        }
      }

      for (const conn of plainPasswordConnections) {
        this.$store.dispatch('UPDATE_CONNECTION', {
          ...conn,
          password: '',
          secrets: {
            ...(conn.secrets || {}),
            password: SecretManager.encryptWithPasskey(conn.password, activePasskey)
          }
        })
      }

      return true
    },

    async unlockEncryptedSecretsAtStartup () {
      const existingEncryptedSecret = this.getFirstEncryptedPassword()

      if (!existingEncryptedSecret || SecretManager.isUnlocked()) {
        return
      }

      try {
        await SecretManager.decryptSecret(existingEncryptedSecret, this.appSettings)
      } catch {
        SecretManager.lock()
        this.notify(this.$t('notifications.passkeyInvalid'), 'error-icon')
      }
    },

    connect (conn) {
      return new Promise(async resolve => {
        const connToConnect = await this.prepareConnectionForConnect(conn)

        if (!connToConnect) {
          resolve()
          return
        }

        this.$store.dispatch('UPDATE_CONNECTION_STATUS', {
          uuid: conn.uuid,
          status: 'connecting'
        })

        const connect = c => {
          ProcessManager.create(c).then(pid => {
            console.log(`{${conn.uuid}}`, 'status:', 'ui connected', pid)

            this.$store.dispatch('UPDATE_CONNECTION_STATUS', {
              uuid: conn.uuid,
              pid,
              status: 'connected'
            })

            this.selectConnection(conn)
            resolve()
          }).catch(async error => {
            // "Mount point in use" usually means an sshfs process from a
            // previous session still serves this mount: adopt it instead.
            if (String(error).includes('Mount point in use')) {
              await this.adoptRunningMounts()

              if (conn.status === 'connected') {
                this.selectConnection(conn)
                resolve()
                return
              }
            }

            this.$store.dispatch('UPDATE_CONNECTION_STATUS', {
              uuid: conn.uuid,
              pid: null,
              status: 'disconnected'
            })

            this.notify(this.$t('notifications.cannotConnect', { name: conn.name, error }), 'error-icon')
            resolve()
          })
        }

        if (conn.authType === 'password-ask' || conn.authType === 'interactive' || conn.authType === 'key-file-passphrase' || conn.authType === 'key-file-interactive' || conn.authType === 'key-file-passphrase-interactive') {
          ipcRenderer.once('password-prompt:response', (event, data) => {
            switch (data.message) {
              case 'connection-password':
                connect({
                  ...conn,
                  password: data.password,
                  interactiveResponses: data.interactiveResponses || []
                })
                break

              case 'connection-password-cancel':
                this.$store.dispatch('UPDATE_CONNECTION_STATUS', {
                  uuid: conn.uuid,
                  pid: null,
                  status: 'disconnected'
                })
                resolve()
                break
            }
          })

          ipcRenderer.invoke('window:open', {
            name: 'password-prompt-window',
            route: `#/password-prompt/${conn.uuid}`,
            options: {
              height: conn.authType === 'key-file-passphrase-interactive' ? 360 : (conn.authType === 'key-file-interactive' || conn.authType === 'interactive' ? 270 : 210),
              width: 350,
              useContentSize: true,
              frame: false,
              maximizable: false,
              minimizable: false,
              resizable: false,
              modal: true
            }
          })
        } else {
          connect(connToConnect)
        }
      })
    },

    connectionTargetString (conn) {
      return `${conn.user}@${String(conn.host || '').trim()}:${conn.folder}`
    },

    async adoptRunningMounts () {
      const running = await ProcessManager.listRunningSshfs()

      if (!running.length) {
        return
      }

      const usedPids = new Set()

      for (const conn of this.connections) {
        if (conn.status === 'connected') {
          continue
        }

        const target = this.connectionTargetString(conn)
        const match = running.find(proc => !usedPids.has(proc.pid) && proc.commandLine && proc.commandLine.includes(target))

        if (match) {
          usedPids.add(match.pid)
          conn.pid = match.pid
          conn.status = 'connected'
          ProcessManager.adopt(match.pid, conn)
        }
      }

      this.updateConnectionList()
    },

    async disconnect (conn) {
      conn.status = 'disconnecting'

      let pid = conn.pid

      // Status said connected but we lost the pid (e.g. stale state):
      // find the real sshfs process for this target before giving up.
      if (!pid) {
        const target = this.connectionTargetString(conn)
        const running = await ProcessManager.listRunningSshfs()
        const match = running.find(proc => proc.commandLine && proc.commandLine.includes(target))

        pid = match ? match.pid : null
      }

      if (!pid) {
        conn.pid = null
        conn.status = 'disconnected'
        this.updateConnectionList()
        return
      }

      ProcessManager.terminate(pid, conn).then(() => {
        conn.pid = null
        conn.status = 'disconnected'

        this.updateConnectionList()
      })
    },

    openLocal (path) {
      if (path) {
        ipcRenderer.invoke('shell:open-path', path)
      }
    },

    async openTerminal (conn) {
      if (!conn) {
        return
      }

      const terminalConnection = await this.prepareConnectionForTerminal(conn)

      if (!terminalConnection) {
        return
      }

      try {
        await ipcRenderer.invoke('shell:open-ssh-terminal', {
          tabbyQuery: this.getTabbyQuickConnectQuery(terminalConnection),
          sshArgs: this.getSshArgs(terminalConnection)
        })
      } catch (error) {
        this.notify(this.$t('notifications.terminalOpenFailed', { error: error.message || error }), 'error-icon')
      }
    },

    async prepareConnectionForTerminal (conn) {
      if (conn.authType !== 'password' && conn.authType !== 'password-ask') {
        return conn
      }

      const connectionWithPassword = conn.authType === 'password'
        ? await this.prepareConnectionForConnect(conn)
        : {
            ...conn,
            password: await this.requestConnectionPassword(conn)
          }

      if (!connectionWithPassword || !connectionWithPassword.password) {
        return null
      }

      ipcRenderer.send('clipboard:write-text', connectionWithPassword.password)
      this.notify(this.$t('notifications.terminalPasswordCopied'))

      return connectionWithPassword
    },

    getLocalMountPath (conn) {
      return getConnectionMountPoint(conn)
    },

    maskStyle (maskUrl) {
      const mask = `url(${maskUrl})`

      return {
        maskImage: mask,
        WebkitMaskImage: mask
      }
    },

    addNewConnection () {
      this.connectionFormUuid = null
      this.connectionFormVisible = true
    },

    editConnection (conn) {
      this.connectionFormUuid = conn.uuid
      this.connectionFormVisible = true
    },

    cloneConnection (conn) {
      const connCopy = {...conn}

      const randName = Math.random().toString(30).substr(-4)

      connCopy.uuid = uuid()
      connCopy.name += ` (copy-${randName})`
      connCopy.status = 'disconnected'
      connCopy.pid = null

      this.$store.dispatch('ADD_CONNECTION', connCopy)
      this.selectedConnectionUuid = connCopy.uuid
    },

    deleteConnection (conn) {
      const currentIndex = this.connections.findIndex(item => item.uuid === conn.uuid)

      this.$store.dispatch('DELETE_CONNECTION', conn)

      setTimeout(() => {
        if (this.connections.length === 0) {
          this.listMode = 'none'
          this.selectedConnectionUuid = null
        } else if (this.selectedConnectionUuid === conn.uuid) {
          const nextConnection = this.connections[Math.min(currentIndex, this.connections.length - 1)]
          this.selectedConnectionUuid = nextConnection.uuid
        }
      }, 200)
    },

    settings () {
      ipcRenderer.invoke('window:open', {
        name: 'settings-window',
        route: '#/settings',
        options: {
          height: 620,
          width: 540,
          useContentSize: true,
          frame: false,
          maximizable: false,
          minimizable: false,
          resizable: true,
          modal: true
        }
      })
    },

    showRunningInBackgroundNotification () {
      if (!this.runningInBackgroundNotificationShowed) {
        if (this.$store.state.Settings.settings.displayTrayMessageOnClose) {
          this.runningInBackgroundNotificationShowed = true
          ipcRenderer.send('tray:display-close-message', {
            text: this.$t('notifications.trayStillRunning')
          })
        }
      }
    },

    notify (text, icon = null) {
      if (this.notificationTimer) {
        clearTimeout(this.notificationTimer)
      }

      this.notificationToast = {
        text,
        type: icon === 'error-icon' ? 'error' : 'info'
      }

      this.notificationTimer = setTimeout(() => {
        this.notificationToast = null
        this.notificationTimer = null
      }, 4500)

      if (icon === 'error-icon') {
        this.flashTrayError()
      }
    },

    flashTrayError () {
      if (this.trayErrorTimer) {
        clearTimeout(this.trayErrorTimer)
      }

      this.trayErrorActive = true
      this.trayErrorTimer = setTimeout(() => {
        this.trayErrorActive = false
        this.trayErrorTimer = null
      }, 10000)
    },

    getConnectionByPid (pid) {
      return this.connections.find(a => a.pid === pid)
    },

    clearDebugOutput () {
      this.debugOutput = ''
    },

    copyDebugOutput () {
      ipcRenderer.send('clipboard:write-text', this.debugOutput)

      this.notify(this.$t('notifications.debugCopied'))
    },

    copySshCommand (conn) {
      ipcRenderer.send('clipboard:write-text', this.getSshCommand(conn))

      this.notify(this.$t('notifications.sshCommandCopied'))
    },

    getSshArgs (conn) {
      const args = [
        '-p',
        String(conn.port || 22)
      ]

      if (this.isKeyAuthConnection(conn) && conn.keyFile) {
        args.push('-i', conn.keyFile)
      }

      if (conn.authType === 'interactive') {
        args.push(
          '-o',
          'PreferredAuthentications=keyboard-interactive',
          '-o',
          'PasswordAuthentication=no'
        )
      }

      if (conn.authType === 'key-file-interactive' || conn.authType === 'key-file-passphrase-interactive') {
        args.push(
          '-o',
          'PreferredAuthentications=publickey,keyboard-interactive',
          '-o',
          'PasswordAuthentication=no'
        )
      }

      args.push(`${conn.user || ''}@${conn.host || ''}`)

      return args
    },

    getSshCommand (conn) {
      const args = [
        'ssh',
        ...this.getSshArgs(conn)
      ]

      return args.map(this.shellQuote).join(' ')
    },

    getTabbyQuickConnectQuery (conn) {
      const user = conn.user ? `${conn.user}@` : ''
      const host = String(conn.host || '')
      const tabbyHost = host.includes(':') && !host.startsWith('[')
        ? `[${host}]`
        : host

      return `${user}${tabbyHost}:${conn.port || 22}`
    },

    isKeyAuthConnection (conn) {
      return [
        'key-file',
        'key-file-passphrase',
        'key-file-interactive',
        'key-file-passphrase-interactive'
      ].includes(conn.authType)
    },

    shellQuote (value) {
      const text = String(value)

      if (/^[A-Za-z0-9_@%+=:,./-]+$/.test(text)) {
        return text
      }

      return `"${text.replace(/(["\\$`])/g, '\\$1')}"`
    },

    updateConnectionList () {
      this.$store.dispatch('REFRESH_CONNECTIONS', this.connections)
    },

    mountPointLabel (conn) {
      const mountPoint = getConnectionMountPoint(conn)

      return mountPoint === 'auto' ? 'Auto' : (shortenPathForDisplay(mountPoint) || 'Auto')
    },

    statusLabel (conn) {
      switch (conn.status) {
        case 'connected':
          return this.$t('status.connected')
        case 'connecting':
          return this.$t('status.connecting')
        case 'disconnecting':
          return this.$t('status.disconnecting')
        default:
          return this.$t('status.disconnected')
      }
    }
  },

  computed: {
    settingsFormDirty () {
      return JSON.stringify(normalizeSettings(this.settingsForm)) !== JSON.stringify(normalizeSettings(this.appSettings))
    },

    platformDisplayName () {
      return currentPlatform.name
    },

    isMac () {
      return currentPlatform.id === 'darwin'
    },

    hasConnections () {
      return this.connections.length > 0
    },

    showDragGrip () {
      return this.isEditModeEnabled && this.sortMode === 'manual'
    },

    isEditModeEnabled () {
      return this.sortMode === 'manual' && this.listMode === 'edit'
    },

    isDeleteModeEnabled () {
      return this.listMode === 'delete'
    },

    connections () {
      return this.$store.state.Data.connections
    },

    sortOptions () {
      return [
        { value: 'name', label: 'A-Z' },
        { value: 'status', label: this.$t('list.sortStatus') },
        { value: 'manual', label: this.$t('list.sortManual') }
      ]
    },

    themeSelectGroups () {
      return this.themeGroups.map(group => ({
        label: group.label,
        options: group.themes
      }))
    },

    languageOptions () {
      return this.localeOptions.map(locale => ({
        value: locale.value,
        label: this.$t(locale.labelKey)
      }))
    },

    retentionOptions () {
      return [
        { value: 'always', label: this.$t('settings.passkeyAlways') },
        { value: '1h', label: this.$t('settings.passkey1h') },
        { value: '12h', label: this.$t('settings.passkey12h') },
        { value: '1d', label: this.$t('settings.passkey1d') },
        { value: '2d', label: this.$t('settings.passkey2d') }
      ]
    },

    trayStatus () {
      if (this.trayErrorActive) {
        return 'error'
      }

      return this.connections.some(conn => conn.status === 'connected') ? 'connected' : 'idle'
    },


    filteredConnections () {
      const query = this.searchText.trim().toLowerCase()

      let items = this.connections.filter(conn => {
        if (this.activeSection === 'favorites' && !conn.favorite) {
          return false
        }

        if (!query) {
          return true
        }

        return [
          conn.name,
          conn.host,
          conn.user,
          conn.folder,
          conn.mountPoint,
          conn.preferredMountPoint
        ].filter(Boolean).some(value => String(value).toLowerCase().includes(query))
      })

      if (this.sortMode === 'name') {
        items = [...items].sort((a, b) => a.name.localeCompare(b.name))
      }

      if (this.sortMode === 'status') {
        const weight = {
          connected: 0,
          connecting: 1,
          disconnecting: 2,
          disconnected: 3
        }

        items = [...items].sort((a, b) => (weight[a.status] ?? 9) - (weight[b.status] ?? 9) || a.name.localeCompare(b.name))
      }

      return items
    },

    driveBadgeWidth () {
      const maxLen = Math.max(2, ...this.filteredConnections.map(conn => this.mountPointLabel(conn).length))

      return `calc(${maxLen}ch + 6px)`
    },

    selectedConnection () {
      return this.connections.find(conn => conn.uuid === this.selectedConnectionUuid) || this.filteredConnections[0] || null
    },

    connectedConnections () {
      return this.connections.filter(conn => conn.status === 'connected')
    },

    busyConnections () {
      return this.connections.filter(conn => conn.status === 'connecting' || conn.status === 'disconnecting')
    },

    appSettings () {
      return this.$store.state.Settings.settings
    },

    sshfsBinaryPlaceholder () {
      return currentPlatform.sshfsBinary
    }
  },

  watch: {
    trayStatus: {
      handler (status) {
        ipcRenderer.send('tray:set-status', status)
      },
      immediate: true
    },

    filteredConnections: {
      handler (connections) {
        if (!connections.length) {
          this.selectedConnectionUuid = null
          return
        }

        if (!this.selectedConnectionUuid || !connections.some(conn => conn.uuid === this.selectedConnectionUuid)) {
          this.selectedConnectionUuid = connections[0].uuid
        }
      },
      immediate: true
    }
  },

  data () {
    return {
      activeSection: 'favorites',
      expandedConnectionUuid: null,
      listMode: 'none',
      sortMode: 'manual',
      searchText: '',
      dragOverUuid: null,
      dragOverPosition: 'before',
      settingsForm: { ...defaultSettings },
      themeGroups: [
        {
          label: 'Dark',
          themes: [
            { value: 'dark-graphite', label: 'Graphite' },
            { value: 'dark-midnight', label: 'Midnight' },
            { value: 'dark-aurora', label: 'Aurora' },
            { value: 'dark-github-desktop', label: 'GitHub Desktop' },
            { value: 'dark-obsidian', label: 'Obsidian' },
            { value: 'dark-slate', label: 'Slate blue' },
            { value: 'dark-ember', label: 'Ember' },
            { value: 'dark-forest', label: 'Forest night' },
            { value: 'dark-steel', label: 'Steel' }
          ]
        },
        {
          label: 'Light',
          themes: [
            { value: 'light-quartz', label: 'Quartz' },
            { value: 'light-arctic', label: 'Arctic' },
            { value: 'light-sage', label: 'Sage' },
            { value: 'light-pearl', label: 'Pearl' },
            { value: 'light-sand', label: 'Sand' },
            { value: 'light-rose', label: 'Rose' },
            { value: 'light-lavender', label: 'Lavender' },
            { value: 'light-cloud', label: 'Cloud' }
          ]
        },
        {
          label: 'Classic',
          themes: [
            { value: 'dark-classic', label: 'Classic dark' },
            { value: 'light-neutral', label: 'Classic light' }
          ]
        }
      ],
      localeOptions: supportedLocaleOptions,
      selectedConnectionUuid: null,
      draggedConnectionUuid: null,
      runningInBackgroundNotificationShowed: false,
      notificationToast: null,
      notificationTimer: null,
      trayErrorActive: false,
      trayErrorTimer: null,
      logoSky,
      logoMaskFull,
      logoMaskHole,
      passkeyConfirmVisible: false,
      passkeyConfirmResolve: null,
      connectionFormVisible: false,
      connectionFormUuid: null,
      debugOutput: '',
      appVersion: ''
    }
  },

  mounted () {
    this.settingsForm = normalizeSettings(this.appSettings)

    this.setupWindowDrag()

    if (this.appSettings.compactMode) {
      ipcRenderer.send('main-window:set-size', { width: 440 })
    }

    setTimeout(async () => {
      if (this.appSettings.passkeyEnabled !== false) {
        await this.migratePlainTextPasswords()
        await this.unlockEncryptedSecretsAtStartup()
      }
    }, 600)

    ipcRenderer.invoke('app:get-version').then(version => {
      this.appVersion = version
    })

    ipcRenderer.on('main-window:show-section', (event, section) => {
      if (['connections', 'favorites', 'settings', 'about'].includes(section)) {
        this.activeSection = section
      }
    })

    ipcRenderer.on('passkey:unlocked', () => {
      this.notify(this.$t('notifications.passkeyUnlocked'))
    })

    const originalConsoleLog = console.log.bind(console)

    console.log = (...args) => {
      if (this.appSettings.showDebugPanel) {
        const data = args.join(' ').trim()

        this.debugOutput += '\n' + data

        this.$nextTick().then(() => {
          this.$refs.debugOutput.scrollTop = this.$refs.debugOutput.scrollHeight
        })
      }

      originalConsoleLog(...args)
    }

    this.connections.forEach(conn => {
      conn.status = 'disconnected'
      conn.pid = null
    })

    const runStartupConnections = async () => {
      // The persisted state loads asynchronously; wait for it so we work
      // with the final connection list and settings.
      await stateReady

      this.previewOpacity(this.appSettings.windowOpacity)

      // Adopt sshfs processes that survived the previous session (crash,
      // forced quit, Windows restart) so the shown status matches reality
      // and we don't run into "mount point in use" on reconnect.
      await this.adoptRunningMounts()

      for (const conn of this.connections) {
        if (conn.advanced.connectOnStartup && conn.status !== 'connected') {
          await this.connect(conn)
        }
      }
    }

    runStartupConnections()

    ProcessManager.on('terminated', pid => {
      let conn = this.getConnectionByPid(pid)

      if (conn) {
        conn.pid = null
        conn.status = 'disconnected'
      }
    })

    ProcessManager.on('not-found', pid => {
      let conn = this.getConnectionByPid(pid)

      if (conn) {
        conn.pid = null
        conn.status = 'disconnected'

        this.notify(this.$t('notifications.disconnectedError', { name: conn.name }), 'error-icon')
      }
    })

    ProcessManager.on('timeout', conn => {
      const mountPoint = getConnectionMountPoint(conn)

      if (isMountPointActive(mountPoint)) {
        ProcessManager.getLastSpawnedProcess().then(process => {
          let foundConnection = this.connections.find(i => i.pid === process.pid)

          if (!foundConnection) {
            conn.pid = process.pid
            conn.status = 'connected'

            ProcessManager.watch(process.pid)

            this.notify(this.$t('notifications.trackedAlternative', { name: conn.name }))
          }
        })
      } else {
        conn.pid = null
        conn.status = 'disconnected'

        this.notify(this.$t('notifications.processTimeout', { name: conn.name }), 'error-icon')
      }
    })
  }
}
</script>

<style lang="less" scoped>
.main-shell {
  height: 100vh;
  display: grid;
  grid-template-rows: auto 1fr auto;
  grid-template-columns: 1fr;
  overflow: hidden;
  color: var(--app-text);
  font-size: 12px;
  background:
    radial-gradient(circle at 28% 0%, rgba(42, 119, 255, 0.2), transparent 34%),
    linear-gradient(135deg, var(--app-bg), var(--app-surface));
}

.tab-bar {
  display: flex;
  align-items: center;
  gap: 2px;
  padding: 2px 0 2px 10px;
  border-bottom: 1px solid var(--app-border);
  background: color-mix(in srgb, var(--app-surface) 86%, transparent);
  -webkit-app-region: drag;
}

.brand {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-right: 12px;
}

.brand-text {
  display: flex;
  flex-direction: column;
  line-height: 1.2;
  font-size: 11px;
  white-space: nowrap;
}

.brand-text strong {
  font-weight: 700;
  color: var(--app-text);
}

.brand-text span {
  font-weight: 300;
  color: var(--app-muted);
}

.brand-text em {
  font-style: normal;
  font-weight: 600;
  color: var(--app-primary);
}

.tab-bar button {
  -webkit-app-region: no-drag;
}

.tab-spacer {
  flex: 1;
}

.window-controls {
  align-self: stretch;
  display: flex;
  margin-left: 8px;
}

.window-control {
  width: 32px;
  border: 0;
  background: transparent;
  color: var(--app-muted);
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
}

.window-control svg {
  width: 13px;
  height: 13px;
  fill: currentColor;
}

.window-control:hover {
  color: var(--app-text);
  background: color-mix(in srgb, var(--app-text) 10%, transparent);
}

.window-control.close:hover {
  color: #fff;
  background: #d41324;
}

.chevron {
  display: inline-block;
  transition: transform 0.15s ease;
  font-size: 13px;
  line-height: 1;
}

.chevron.open {
  transform: rotate(180deg);
}

.tab-bar .brand-logo {
  position: relative;
  display: block;
  width: 25px;
  height: 25px;
  flex: 0 0 auto;
}

.tab-bar .brand-logo-img {
  width: 100%;
  height: 100%;
  object-fit: contain;
}

.tab-bar .brand-logo-tint {
  display: none;
  position: absolute;
  inset: 0;
  mask-repeat: no-repeat;
  mask-size: contain;
  mask-position: center;
  -webkit-mask-repeat: no-repeat;
  -webkit-mask-size: contain;
  -webkit-mask-position: center;
}

.tab-item {
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 5px 8px;
  border: 0;
  border-radius: 7px;
  background: transparent;
  color: var(--app-muted);
  cursor: pointer;
  font-size: 12px;
}

.tab-item svg {
  width: 17px;
  height: 17px;
  fill: currentColor;
}

.tab-item:hover,
.tab-item.active {
  color: var(--app-primary);
  background: color-mix(in srgb, var(--app-primary) 12%, transparent);
}

.tab-item:disabled {
  opacity: 0.35;
  cursor: default;
  pointer-events: none;
}

.blur-secret {
  filter: blur(4px);
  transition: filter 140ms;
}

.blur-secret:hover {
  filter: none;
}

.tab-content {
  min-height: 0;
  display: flex;
  overflow: hidden;
}

.tab-content > section {
  flex: 1;
  min-width: 0;
}

.tab-workspace {
  overflow-y: auto;
  padding: 14px;
}

.tab-workspace .workspace-card {
  border: 0;
  box-shadow: none;
  background: transparent;
}

.list-footer {
  margin-top: auto;
  padding-top: 12px;
}

.list-footer .btn {
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 7px;
}

.status-bar {
  height: 26px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 14px 3px;
  border-top: 1px solid var(--app-border);
  background: color-mix(in srgb, var(--app-surface) 86%, transparent);
  font-size: 11px;
  line-height: 1;
  color: var(--app-muted);
}

.status-bar .status-left,
.status-bar .status-right {
  display: flex;
  align-items: center;
  gap: 16px;
}

.about-header.workspace-header {
  display: flex;
  align-items: center;
  gap: 14px;
}

.about-logo {
  width: 52px;
  height: 52px;
  object-fit: contain;
}

.status-bar span {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  line-height: 1;
}

.status-bar svg {
  width: 13px;
  height: 13px;
  fill: currentColor;
  display: block;
  position: relative;
  top: 1px;
}

.status-bar .status-dot {
  position: relative;
  top: 1px;
}

.status-bar .status-dot {
  width: 7px;
  height: 7px;
  box-shadow: none;
}

.status-bar .success {
  color: var(--app-success);
}

.status-bar .warning {
  color: var(--app-warning, #e2b93b);
}

.status-bar .warning .status-dot {
  background: var(--app-warning, #e2b93b);
}

.tab-content .connection-panel {
  border: 0;
  border-radius: 0;
  box-shadow: none;
  background: transparent;
  padding: 0;
}

.tab-content .panel-toolbar {
  padding: 12px 12px 0;
  margin-bottom: 0;
}

.tab-content .connection-list {
  flex: 1 1 auto;
  min-height: 0;
  display: flex;
  flex-direction: column;
  padding: 12px 6px 8px 12px;
}

.tab-content .connection-list .connection-card,
.tab-content .connection-list .connection-expanded {
  flex: 0 0 auto;
}

.tab-content .empty-list {
  flex: 1 1 auto;
}

.debug-workspace {
  display: flex;
  padding: 0;
}

.debug-workspace .debug-panel {
  flex: 1;
  height: auto;
  align-self: stretch;
  display: flex;
  flex-direction: column;
  border: 0;
  border-radius: 0;
  box-shadow: none;
}

.debug-workspace .debug-panel textarea {
  flex: 1;
  border: 0;
  border-radius: 0;
  resize: none;
}

.connection-card.expanded {
  margin-bottom: 0;
  border-bottom-left-radius: 0;
  border-bottom-right-radius: 0;
  border-color: color-mix(in srgb, var(--app-primary) 26%, var(--app-border));
  border-bottom-color: transparent;
  background: color-mix(in srgb, var(--app-surface) 92%, transparent);
}

.connection-expanded {
  margin: 0 0 8px;
  padding: 4px 12px 10px;
  border: 1px solid color-mix(in srgb, var(--app-primary) 26%, var(--app-border));
  border-top: 0;
  border-radius: 0 0 10px 10px;
  background: color-mix(in srgb, var(--app-surface) 92%, transparent);
  font-size: 11px;
}

.connection-expanded .ssh-command-row button {
  width: 18px;
  height: 18px;
  border: 0;
  border-radius: 5px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  color: var(--app-muted);
  background: color-mix(in srgb, var(--app-text) 8%, transparent);
}

.connection-expanded .ssh-command-row button:hover {
  color: #fff;
  background: var(--app-primary);
}

.connection-expanded .ssh-command-row button svg {
  width: 11px;
  height: 11px;
}

.connection-expanded .info-panel {
  border: 0;
  box-shadow: none;
  background: transparent;
  padding: 8px 0;
  margin-top: 4px;
  border-top: 1px solid var(--app-border);
  border-radius: 0;
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 0 26px;
  min-width: 0;
}

.connection-expanded .info-panel .info-row {
  padding: 6px 0;
  min-height: 0;
  border: 0;
  border-bottom: 1px solid color-mix(in srgb, var(--app-border) 60%, transparent);
  gap: 10px;
  grid-template-columns: auto minmax(0, 1fr);
}

.connection-expanded .info-panel .info-row:nth-last-child(-n+2) {
  border-bottom: 0;
}

.expanded-actions {
  display: flex;
  gap: 6px;
}

.expanded-actions .action-button {
  flex: 1 1 0;
  width: auto;
  justify-content: center;
  padding: 4px 8px;
  font-size: 11px;
}

.expanded-actions .action-button svg {
  width: 13px;
  height: 13px;
}

.app-toast {
  position: fixed;
  top: 46px;
  right: 22px;
  z-index: 50;
  max-width: min(420px, calc(100vw - 44px));
  padding: 12px 14px;
  border: 1px solid var(--app-border);
  border-radius: 8px;
  background: var(--app-surface-raised, var(--app-surface, #2b3038));
  color: var(--app-text);
  box-shadow: 0 18px 50px rgba(0, 0, 0, 0.28);
  line-height: 1.45;
  font-size: 12px;
  white-space: pre-line;
}

.modal-backdrop {
  position: fixed;
  inset: 0;
  z-index: 60;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(0, 0, 0, 0.45);
  backdrop-filter: blur(2px);
}

.modal-card {
  width: min(440px, calc(100vw - 60px));
  padding: 20px 22px;
  border: 1px solid var(--app-border);
  border-radius: 10px;
  background: var(--app-surface-raised, var(--app-surface, #2b3038));
  color: var(--app-text);
  box-shadow: 0 24px 70px rgba(0, 0, 0, 0.4);

  h2 {
    font-size: 14px;
    margin-bottom: 10px;
    color: var(--app-primary);
  }

  p {
    line-height: 1.5;
    white-space: pre-line;
    margin-bottom: 16px;
  }
}

.modal-actions {
  display: flex;
  justify-content: flex-end;
  gap: 8px;
}

.form-tab {
  display: flex;
  overflow: hidden;
}

.form-tab > * {
  flex: 1;
  min-width: 0;
}

.app-toast.error {
  border-color: color-mix(in srgb, #ff6b6b 60%, var(--app-border));
  background: color-mix(in srgb, #ff6b6b 14%, var(--app-surface-raised, var(--app-surface, #2b3038)));
}

.nav-rail,
.connection-panel,
.detail-panel,
.detail-card,
.info-panel,
.actions-panel,
.debug-panel {
  border: 1px solid var(--app-border);
  background: color-mix(in srgb, var(--app-surface) 86%, transparent);
  box-shadow: var(--app-shadow);
}

.nav-rail {
  border-radius: 10px;
  padding: 18px 8px;
  display: flex;
  flex-direction: column;
  align-items: stretch;
  gap: 12px;
}

.brand-mark,
.connection-icon,
.detail-icon {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  color: var(--app-primary);
  background: color-mix(in srgb, var(--app-primary) 16%, transparent);
  border: 1px solid color-mix(in srgb, var(--app-primary) 38%, transparent);
}

.brand-mark {
  width: 42px;
  height: 42px;
  margin: 0 auto 8px;
  border-radius: 13px;
}

.brand-mark svg,
.connection-icon svg,
.detail-icon svg,
.nav-item svg,
.btn svg,
.action-button svg,
.icon-button svg,
.round-action svg,
.stats-bar svg,
.debug-header svg,
.search-box svg {
  fill: currentColor;
}

.nav-item {
  position: relative;
  min-height: 52px;
  border: 0;
  border-radius: 8px;
  background: transparent;
  color: var(--app-muted);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 0;
  cursor: pointer;
  font-size: 12px;
}

.nav-item .nav-label {
  position: absolute;
  left: calc(100% + 12px);
  top: 50%;
  z-index: 30;
  min-width: max-content;
  padding: 7px 10px;
  border: 1px solid color-mix(in srgb, var(--app-primary) 32%, transparent);
  border-radius: 8px;
  color: var(--app-text);
  background: color-mix(in srgb, var(--app-surface) 94%, transparent);
  box-shadow: var(--app-shadow);
  opacity: 0;
  pointer-events: none;
  transform: translate(4px, -50%);
  transition: opacity 0.14s ease, transform 0.14s ease;
}

.nav-item:hover .nav-label {
  opacity: 1;
  transform: translate(0, -50%);
}

.nav-item:hover,
.nav-item.active {
  color: var(--app-primary);
  background: color-mix(in srgb, var(--app-primary) 12%, transparent);
}

.nav-item svg {
  width: 26px;
  height: 26px;
}

.service-status {
  position: relative;
  margin-top: auto;
  min-height: 58px;
  border-radius: 8px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 5px;
  color: var(--app-text);
  background: color-mix(in srgb, var(--app-bg) 48%, transparent);
  font-size: 12px;
}

.service-status strong {
  color: var(--app-success);
  font-size: 10px;
  line-height: 1;
}

.service-status-tooltip {
  position: absolute;
  left: calc(100% + 12px);
  top: 50%;
  z-index: 30;
  min-width: max-content;
  padding: 7px 10px;
  border: 1px solid color-mix(in srgb, var(--app-success) 32%, transparent);
  border-radius: 8px;
  color: var(--app-text);
  background: color-mix(in srgb, var(--app-surface) 94%, transparent);
  box-shadow: var(--app-shadow);
  opacity: 0;
  pointer-events: none;
  transform: translate(4px, -50%);
  transition: opacity 0.14s ease, transform 0.14s ease;
}

.service-status:hover .service-status-tooltip {
  opacity: 1;
  transform: translate(0, -50%);
}

.status-dot {
  width: 10px;
  height: 10px;
  display: inline-block;
  border-radius: 50%;
  background: var(--app-success);
  box-shadow: 0 0 14px color-mix(in srgb, var(--app-success) 60%, transparent);
}

.connection-panel,
.detail-panel {
  min-width: 0;
  border-radius: 10px;
}

.connection-panel {
  padding: 16px;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.panel-toolbar {
  display: grid;
  grid-template-columns: 1fr 80px;
  gap: 10px;
  margin-bottom: 16px;
}

.panel-toolbar.has-edit-toggle {
  grid-template-columns: 1fr auto 80px;
}

.search-box {
  min-width: 0;
  height: 46px;
  border: 1px solid var(--app-border);
  border-radius: 8px;
  background: color-mix(in srgb, var(--app-bg) 46%, transparent);
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 0 14px;
  color: var(--app-muted);
}

.search-box input {
  width: 100%;
  height: 100%;
  border: 0;
  outline: 0;
  color: var(--app-text);
  background: transparent;
  font-size: 13px;
}

.search-box input::placeholder {
  color: var(--app-muted);
}

.sort-select :deep(.app-select-trigger) {
  height: 46px;
  padding: 0 8px;
  gap: 4px;
  font-size: 13px;
  background: color-mix(in srgb, var(--app-bg) 46%, transparent);
}

.sort-select :deep(.app-select-trigger .chevron) {
  width: 8px;
}

.edit-toggle {
  height: 46px;
  border: 1px solid var(--app-border);
  border-radius: 8px;
  padding: 0 14px;
  color: var(--app-muted);
  background: color-mix(in srgb, var(--app-bg) 46%, transparent);
  cursor: pointer;
  font-size: 12px;
  font-weight: 700;
}

.edit-toggle:hover,
.edit-toggle.active {
  color: var(--app-primary-text);
  border-color: color-mix(in srgb, var(--app-primary) 60%, transparent);
  background: var(--app-primary);
}

.field select option {
  color: var(--app-text);
  background: var(--app-surface-soft);
}

.connection-list {
  overflow: auto;
  padding-right: 6px;
}

.connection-card {
  width: 100%;
  min-height: 0;
  margin-bottom: 8px;
  border: 1px solid transparent;
  border-radius: 9px;
  padding: 11px;
  display: grid;
  grid-template-columns: 42px minmax(0, 1fr) auto;
  align-items: center;
  gap: 10px;
  color: var(--app-text);
  background: color-mix(in srgb, var(--app-bg) 46%, transparent);
  cursor: pointer;
  text-align: left;
}

.connection-card:hover,
.connection-card.active {
  border-color: color-mix(in srgb, var(--app-primary) 70%, transparent);
  background: color-mix(in srgb, var(--app-primary) 12%, var(--app-bg));
}

.connection-card.favorite {
  border-color: color-mix(in srgb, #f7b731 45%, transparent);
}

.connection-card.favorite:hover {
  border-color: color-mix(in srgb, #f7b731 75%, transparent);
}

.connection-card.favorite.expanded {
  border-bottom-color: transparent;
}

.connection-card.favorite + .connection-expanded {
  border-color: color-mix(in srgb, #f7b731 45%, transparent);
}

.connection-card.expanded:hover + .connection-expanded,
.connection-expanded:hover {
  border-color: color-mix(in srgb, var(--app-primary) 70%, transparent);
}

.connection-card.expanded:has(+ .connection-expanded:hover) {
  border-color: color-mix(in srgb, var(--app-primary) 70%, transparent);
  border-bottom-color: transparent;
  background: color-mix(in srgb, var(--app-primary) 12%, var(--app-bg));
}

.connection-card.favorite.expanded:hover + .connection-expanded,
.connection-card.favorite + .connection-expanded:hover {
  border-color: color-mix(in srgb, #f7b731 75%, transparent);
}

.connection-card.favorite.expanded:has(+ .connection-expanded:hover) {
  border-color: color-mix(in srgb, #f7b731 75%, transparent);
  border-bottom-color: transparent;
  background: color-mix(in srgb, #f7b731 10%, var(--app-bg));
}

.connection-icon {
  width: 40px;
  height: 40px;
  border-radius: 9px;
  overflow: hidden;
}

.connection-card.favorite .connection-icon {
  color: #f7b731;
  background: color-mix(in srgb, #f7b731 16%, transparent);
  border-color: color-mix(in srgb, #f7b731 45%, transparent);
}

.connection-card.favorite .connection-main b {
  background: #f7b731;
  color: #1c1500;
}

.connection-card.favorite:hover,
.connection-card.favorite.active {
  background: color-mix(in srgb, #f7b731 10%, var(--app-bg));
}

.connection-icon img,
.detail-icon img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
}

.connection-main {
  min-width: 0;
  min-height: 40px;
  display: grid;
  grid-template-rows: auto auto;
  align-content: center;
  gap: 1px;
}

.compact-mode .connection-card {
  min-height: 0;
  padding: 5px 6px;
  grid-template-columns: 32px minmax(0, 1fr) auto;
  gap: 8px;
}

.compact-mode .connection-icon {
  width: 32px;
  height: 32px;
  border-radius: 8px;
}

.compact-mode .connection-main {
  min-height: 32px;
  grid-template-rows: auto;
  gap: 0;
}

.connection-main strong .drive-inline {
  display: none;
}

.compact-mode .connection-main strong .drive-inline {
  display: inline-flex;
}

.compact-mode .connection-meta {
  display: none;
}

.compact-mode .connection-main strong {
  font-size: 12px;
  display: flex;
  align-items: center;
  gap: 7px;
}

.connection-main strong {
  font-size: 13px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  padding-right: 0;
}

.connection-meta {
  min-width: 0;
  display: grid;
  grid-template-columns: minmax(0, 1fr);
  align-items: center;
  gap: 10px;
  font-size: 11px;
}

.compact-mode .connection-meta {
  grid-template-columns: minmax(0, 1fr) 8px auto;
  gap: 8px;
}

.connection-meta > span:first-child,
.detail-title p {
  color: var(--app-muted);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.connection-main b,
.detail-title b {
  display: inline-flex;
  width: var(--drive-badge-w, auto);
  min-width: 24px;
  flex-shrink: 0;
  justify-content: center;
  margin-right: 6px;
  padding: 1px 0;
  border-radius: 5px;
  color: #ffffff;
  background: var(--app-primary);
  font-size: 11px;
}

.compact-mode .connection-main b {
  width: var(--drive-badge-w, auto);
  min-width: 20px;
  margin-right: 0;
  padding: 1px 0;
  font-size: 10px;
  border-radius: 4px;
}

.compact-mode .connection-target {
  display: none;
}

.connection-main i,
.detail-title i {
  padding: 0 8px;
  color: color-mix(in srgb, var(--app-muted) 60%, transparent);
  font-style: normal;
}

.connection-state {
  display: inline-flex;
  align-items: center;
  padding: 3px 9px;
  border-radius: 50px;
  font-size: 10px;
  font-weight: 700;
  line-height: 1.2;
  white-space: nowrap;
  color: var(--app-muted);
  background: color-mix(in srgb, var(--app-muted) 14%, transparent);
  border: 1px solid color-mix(in srgb, var(--app-muted) 35%, transparent);
}

.connection-state.connected {
  color: var(--app-success);
  background: color-mix(in srgb, var(--app-success) 16%, transparent);
  border-color: color-mix(in srgb, var(--app-success) 55%, transparent);
  box-shadow: 0 0 10px color-mix(in srgb, var(--app-success) 35%, transparent);
}

.connection-state.connecting,
.connection-state.disconnecting {
  color: #f7b731;
  background: color-mix(in srgb, #f7b731 16%, transparent);
  border-color: color-mix(in srgb, #f7b731 55%, transparent);
  box-shadow: 0 0 10px color-mix(in srgb, #f7b731 32%, transparent);
}

.connection-state.connecting {
  animation: status-pulse 1s ease-in-out infinite;
}

.compact-mode .connection-state {
  width: 10px;
  height: 10px;
  padding: 0;
  border: 0;
  border-radius: 50%;
  font-size: 0;
  background: var(--app-muted);
}

.compact-mode .connection-state.connected {
  background: var(--app-success);
}

.compact-mode .connection-state.connecting,
.compact-mode .connection-state.disconnecting {
  background: #f7b731;
}

.connection-card.editing {
  position: relative;
  grid-template-columns: 18px 42px minmax(0, 1fr) auto;
  cursor: grab;
}

.connection-card.drop-before::before,
.connection-card.drop-after::after {
  content: '';
  position: absolute;
  left: 6px;
  right: 6px;
  height: 2px;
  border-radius: 2px;
  background: var(--app-primary);
  box-shadow: 0 0 6px color-mix(in srgb, var(--app-primary) 60%, transparent);
  pointer-events: none;
}

.connection-card.drop-before::before {
  top: -6px;
}

.connection-card.drop-after::after {
  bottom: -6px;
}

.compact-mode .connection-card.editing {
  grid-template-columns: 14px 32px minmax(0, 1fr) auto;
}

.drag-grip {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  color: var(--app-muted);
  cursor: grab;
}

.drag-grip svg {
  width: 14px;
  height: 14px;
  fill: currentColor;
}

.connection-card.editing:hover .drag-grip {
  color: var(--app-primary);
}

.connection-card.favorite.editing:hover .drag-grip {
  color: #f7b731;
}

.quick-actions {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 10px;
}

.quick-actions .connection-state {
  margin-right: 4px;
}

.round-action,
.icon-button {
  border: 0;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  color: var(--app-muted);
  background: color-mix(in srgb, var(--app-text) 8%, transparent);
}

.round-action {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  padding: 4px;
  transition: transform 0.16s ease, background 0.16s ease, color 0.16s ease, box-shadow 0.16s ease;
}

.round-action svg {
  width: 19px;
  height: 19px;
}

.compact-mode .round-action {
  width: 28px;
  height: 28px;
  padding: 0;
}

.compact-mode .round-action svg {
  width: 15px;
  height: 15px;
}

.compact-mode .quick-actions {
  gap: 6px;
}

.round-action:disabled {
  opacity: 0.38;
  cursor: not-allowed;
  transform: none;
}

.round-action:not(:disabled):hover {
  transform: translateY(-1px);
  box-shadow: 0 3px 10px color-mix(in srgb, var(--app-primary) 30%, transparent);
}

.round-action.open-folder:not(:disabled) {
  color: #ffffff;
  background: linear-gradient(135deg, var(--app-success), color-mix(in srgb, var(--app-success) 58%, var(--app-primary)));
  box-shadow: 0 0 0 1px color-mix(in srgb, var(--app-success) 38%, transparent),
    0 0 8px color-mix(in srgb, var(--app-success) 25%, transparent);
}

.round-action.open-folder:not(:disabled):hover {
  background: linear-gradient(135deg, color-mix(in srgb, var(--app-success) 78%, #ffffff), var(--app-primary));
}

.round-action.open-terminal:not(:disabled) {
  color: #ffffff;
  background: #263238;
  box-shadow: 0 0 0 1px color-mix(in srgb, #ffffff 18%, transparent),
    0 0 6px color-mix(in srgb, #90a4ae 20%, transparent);
}

.round-action.open-terminal:not(:disabled):hover {
  background: color-mix(in srgb, #263238 78%, var(--app-primary));
}

.round-action.open-terminal span,
.terminal-glyph {
  font-family: Consolas, 'Liberation Mono', monospace;
  font-size: 10px;
  font-weight: 700;
  line-height: 1;
  display: inline-flex;
  align-items: center;
  justify-content: center;
}

.terminal-glyph {
  display: inline-flex;
  width: 20px;
  justify-content: center;
}

.round-action.loading {
  color: #ffffff;
  background: #f7b731;
  opacity: 1;
  animation: action-pulse 1s ease-in-out infinite;
}

.round-action.primary,
.round-action:hover,
.icon-button:hover {
  color: #ffffff;
  background: var(--app-primary);
}

.round-action.primary {
  box-shadow: 0 0 0 1px color-mix(in srgb, var(--app-primary) 38%, transparent),
    0 0 8px color-mix(in srgb, var(--app-primary) 25%, transparent);
}

.round-action.favorite.active,
.icon-button.favorite.active {
  color: #f7b731;
  background: color-mix(in srgb, #f7b731 16%, transparent);
}

.round-action.favorite.active:not(:disabled) {
  box-shadow: 0 0 0 1px color-mix(in srgb, #f7b731 38%, transparent);
}

.round-action.favorite.active:not(:disabled):hover {
  box-shadow: 0 0 0 1px color-mix(in srgb, #f7b731 45%, transparent),
    0 3px 10px color-mix(in srgb, #f7b731 30%, transparent);
}

.detail-panel {
  position: relative;
  padding: 16px 16px 16px 30px;
  display: flex;
  flex-direction: column;
  gap: 14px;
  overflow: hidden;
}

.detail-panel.collapsed {
  width: 10px;
  min-width: 10px;
  max-width: 10px;
  justify-self: start;
  padding: 0;
  gap: 0;
  border-color: color-mix(in srgb, var(--app-primary) 32%, var(--app-border));
  background: color-mix(in srgb, var(--app-surface) 76%, transparent);
}

.detail-panel.collapsed > :not(.detail-collapse-handle) {
  display: none !important;
}

.detail-collapse-handle {
  position: absolute;
  top: 0;
  bottom: 0;
  left: 0;
  width: 10px;
  border: 0;
  border-radius: 10px 0 0 10px;
  color: var(--app-muted);
  background: color-mix(in srgb, var(--app-text) 5%, transparent);
  cursor: pointer;
  font-size: 16px;
  font-weight: 800;
  line-height: 1;
  transition: color 0.16s ease, background 0.16s ease, box-shadow 0.16s ease;
  z-index: 2;
}

.detail-collapse-handle:hover {
  color: #ffffff;
  background: linear-gradient(180deg, var(--app-success), color-mix(in srgb, var(--app-success) 58%, var(--app-primary)));
  box-shadow: 0 0 0 1px color-mix(in srgb, var(--app-success) 30%, transparent),
    0 14px 30px color-mix(in srgb, var(--app-success) 22%, transparent);
}

.detail-panel.collapsed .detail-collapse-handle {
  width: 100%;
  border-right: 0;
  border-radius: 10px;
}

.detail-panel.can-collapse:not(.collapsed) .detail-topbar,
.detail-panel.can-collapse:not(.collapsed) .detail-card,
.detail-panel.can-collapse:not(.collapsed) .empty-detail,
.detail-panel.can-collapse:not(.collapsed) .workspace-card,
.detail-panel.can-collapse:not(.collapsed) .stats-bar,
.detail-panel.can-collapse:not(.collapsed) .debug-panel {
  margin-left: 0;
}

.detail-topbar {
  display: flex;
  align-items: center;
}

.btn,
.action-button {
  border: 0;
  border-radius: 8px;
  min-height: 42px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
  color: var(--app-text);
  background: color-mix(in srgb, var(--app-text) 8%, transparent);
  cursor: pointer;
  font-weight: 600;
  font-size: 12px;
}

.primary-action,
.action-button.primary {
  min-width: 210px;
  color: var(--app-primary-text) !important;
  background: linear-gradient(135deg, var(--app-primary), color-mix(in srgb, var(--app-primary) 70%, #7aa8ff)) !important;
}

.detail-card {
  min-height: 0;
  flex: 1;
  border-radius: 12px;
  overflow: hidden;
  display: flex;
  flex-direction: column;
}

.workspace-card {
  min-height: 0;
  flex: 1;
  border: 1px solid var(--app-border);
  border-radius: 12px;
  background: color-mix(in srgb, var(--app-surface) 86%, transparent);
  box-shadow: var(--app-shadow);
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.workspace-header {
  min-height: 118px;
  padding: 24px;
  border-bottom: 1px solid var(--app-border);
  display: flex;
  align-items: center;
}

.workspace-header h1 {
  margin: 0;
  font-size: 22px;
  color: var(--app-text);
}

.workspace-header p {
  margin: 8px 0 0;
  color: var(--app-muted);
}

.about-content {
  min-height: 0;
  padding: 22px;
  overflow: auto;
}

.settings-grid {
  display: grid;
  grid-template-columns: minmax(0, 1fr) 180px;
  gap: 14px;
}

.settings-tab {
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.settings-scroll {
  flex: 1;
  min-height: 0;
  overflow-y: auto;
  padding: 12px 12px 0;
}

.settings-scroll .workspace-card {
  border: 0;
  box-shadow: none;
  background: transparent;
  padding: 0;
}

.settings-scroll .workspace-header {
  margin-bottom: 12px;
  border-bottom: 0;
  min-height: 0;
  padding: 6px 4px 0;
}

.edit-toggle.icon-only {
  width: 46px;
  flex: 0 0 auto;
  padding: 0;
  display: flex;
  align-items: center;
  justify-content: center;
}

.edit-toggle.icon-only svg {
  width: 16px;
  height: 16px;
  fill: currentColor;
}

input[type='number']::-webkit-outer-spin-button,
input[type='number']::-webkit-inner-spin-button {
  -webkit-appearance: none;
  margin: 0;
}

.compact-mode .tab-label,
.compact-mode .brand-text {
  display: none;
}

.compact-mode .tab-item {
  padding: 6px 8px;
}

.compact-mode .tab-content .panel-toolbar {
  padding: 8px 8px 0;
}

.compact-mode .tab-content .connection-list {
  padding: 8px 2px 6px 8px;
  scrollbar-gutter: stable;
}

.compact-mode .search-box {
  padding: 0 10px;
  gap: 7px;
}

.compact-mode .settings-scroll {
  padding: 8px 8px 0;
}

.compact-mode .tab-workspace {
  padding: 8px;
}

.compact-mode .settings-grid {
  grid-template-columns: 1fr;
  gap: 10px;
}

.compact-mode .toggle-list {
  grid-template-columns: 1fr;
}

.compact-mode .passkey-grid .field {
  max-width: 100%;
}

.compact-mode .connection-expanded .info-panel {
  grid-template-columns: 1fr;
}

.compact-mode .expanded-actions {
  flex-wrap: wrap;
}

.compact-mode .settings-section .settings-actions {
  grid-template-columns: 1fr;
}

.settings-grid.is-disabled {
  opacity: 0.45;
  pointer-events: none;
}

.passkey-grid .field {
  max-width: 50%;
}

.settings-tab .settings-form-actions {
  justify-content: space-between;
}

.settings-form-actions .cancel-action {
  background: color-mix(in srgb, var(--app-danger, #d64545) 22%, transparent);
  color: var(--app-text);
}

.settings-form-actions .cancel-action:hover {
  background: var(--app-danger, #d64545);
  color: #fff;
}

.settings-form-actions .save-action {
  background: color-mix(in srgb, var(--app-success) 26%, transparent);
  color: var(--app-text);
}

.settings-form-actions .save-action:hover {
  background: var(--app-success);
  color: #fff;
}

.settings-section {
  border: 1px solid var(--app-border);
  border-radius: 10px;
  padding: 14px;
  margin-bottom: 12px;
  background: color-mix(in srgb, var(--app-surface) 60%, transparent);
}

.settings-section h2 {
  margin: 0 0 12px;
  font-size: 12px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.06em;
  color: var(--app-primary);
}

.settings-section .toggle-list,
.settings-section .settings-actions {
  border: 0;
  padding: 0;
  background: transparent;
}

.settings-section .settings-grid + .toggle-list {
  margin-top: 12px;
}

.settings-section .toggle-list + .settings-grid {
  margin-top: 12px;
}

.settings-section .settings-actions {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 8px;
}

.settings-section .settings-actions .action-button {
  width: 100%;
  justify-content: center;
}

.settings-tab .settings-form-actions {
  padding: 6px 12px;
  border-top: 1px solid var(--app-border);
  background: color-mix(in srgb, var(--app-surface) 86%, transparent);
  align-items: center;
}

.settings-tab .settings-form-actions .btn {
  min-width: 110px;
  margin-bottom: 0;
}

.field {
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.field span {
  color: var(--app-muted);
  font-size: 11px;
  text-transform: uppercase;
}

.field input,
.field select {
  height: 44px;
  border: 1px solid var(--app-border);
  border-radius: 8px;
  padding: 0 12px;
  color: var(--app-text);
  background: color-mix(in srgb, var(--app-bg) 42%, transparent);
  outline: 0;
  font-size: 12px;
}

.field input:focus,
.field select:focus {
  border-color: var(--app-primary);
}

.opacity-row {
  grid-column: 1 / -1;
  cursor: default;
}

.opacity-row .toggle-text {
  flex: 0 0 auto;
}

.opacity-row input[type='range'] {
  position: static;
  opacity: 1;
  pointer-events: auto;
  flex: 0 0 auto;
  width: calc(50% - 20px);
  margin-left: auto;
  padding: 0;
  height: 6px;
  appearance: none;
  -webkit-appearance: none;
  border-radius: 4px;
  background: color-mix(in srgb, var(--app-text) 16%, transparent);
  outline: none;
}

.opacity-row input[type='range']::-webkit-slider-thumb {
  -webkit-appearance: none;
  width: 16px;
  height: 16px;
  margin: 0;
  border-radius: 50%;
  background: var(--app-primary);
  cursor: pointer;
  box-shadow: 0 0 6px color-mix(in srgb, var(--app-primary) 40%, transparent);
}

.passkey-retention.is-disabled {
  opacity: 0.45;
  pointer-events: none;
}

.toggle-list,
.settings-actions {
  border: 1px solid var(--app-border);
  border-radius: 9px;
  padding: 14px;
  background: color-mix(in srgb, var(--app-bg) 38%, transparent);
}

.toggle-list {
  grid-column: 1 / -1;
  display: grid;
  grid-template-columns: 1fr 1fr;
  align-items: center;
  column-gap: 14px;
  row-gap: 2px;
}

.settings-toggle {
  position: relative;
  min-height: 42px;
  border-radius: 8px;
  padding: 0 12px;
  display: flex;
  align-items: center;
  justify-content: flex-start;
  gap: 12px;
  color: var(--app-text);
  cursor: pointer;
}

.settings-toggle:hover {
  background: color-mix(in srgb, var(--app-text) 6%, transparent);
}

.settings-toggle.is-disabled {
  opacity: 0.4;
  cursor: default;
  pointer-events: none;
}

.settings-toggle input {
  position: absolute;
  opacity: 0;
  pointer-events: none;
}

.toggle-text {
  flex: 0 1 auto;
  min-width: 0;
  line-height: 1.35;
  color: var(--app-muted);
  font-size: 12px;
}

.switch-track {
  position: relative;
  flex: 0 0 auto;
  width: 38px;
  height: 22px;
  border-radius: 999px;
  background: color-mix(in srgb, var(--app-muted) 28%, transparent);
  border: 1px solid var(--app-border);
  transition: background 0.16s ease, border-color 0.16s ease;
}

.switch-track::after {
  content: '';
  position: absolute;
  top: 3px;
  left: 3px;
  width: 14px;
  height: 14px;
  border-radius: 50%;
  background: var(--app-text);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.28);
  transition: transform 0.16s ease, background 0.16s ease;
}

.settings-toggle input:checked + .switch-track {
  background: var(--app-primary);
  border-color: var(--app-primary);
}

.settings-toggle input:checked + .switch-track::after {
  transform: translateX(16px);
  background: var(--app-primary-text);
}

.settings-toggle input:focus-visible + .switch-track {
  outline: 2px solid color-mix(in srgb, var(--app-primary) 60%, transparent);
  outline-offset: 2px;
}

.settings-actions {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.settings-form-actions {
  grid-column: 1 / -1;
  display: flex;
  justify-content: flex-end;
  gap: 10px;
  padding-top: 4px;
}

.workspace-footer {
  margin-top: auto;
  padding: 16px 22px;
  border-top: 1px solid var(--app-border);
  display: flex;
  justify-content: flex-end;
  gap: 10px;
}

.about-content {
  color: var(--app-muted);
}

.text-link {
  border: 0;
  padding: 0;
  color: var(--app-primary);
  background: transparent;
  cursor: pointer;
  font: inherit;
}

.text-link:hover {
  text-decoration: underline;
}

.about-content h2 {
  margin: 24px 0 12px;
  color: var(--app-text);
  font-size: 15px;
}

.library-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
  gap: 10px;
}

.library-grid button {
  min-height: 42px;
  border: 1px solid var(--app-border);
  border-radius: 8px;
  color: var(--app-text);
  background: color-mix(in srgb, var(--app-text) 7%, transparent);
  cursor: pointer;
  font-size: 12px;
}

.library-grid button:hover {
  border-color: var(--app-primary);
  color: var(--app-primary);
}

.detail-header {
  min-height: 118px;
  padding: 24px;
  display: flex;
  align-items: center;
  gap: 18px;
}

.detail-icon {
  width: 72px;
  height: 72px;
  border: 0;
  border-radius: 16px;
  color: #ffffff;
  background: linear-gradient(135deg, var(--app-primary), color-mix(in srgb, var(--app-primary) 62%, #7aa8ff));
  cursor: pointer;
  overflow: hidden;
  padding: 0;
}

.detail-icon-wrap {
  position: relative;
  flex: 0 0 auto;
  display: inline-flex;
}

.detail-icon-remove {
  position: absolute;
  top: -7px;
  right: -7px;
  width: 22px;
  height: 22px;
  border: 1px solid var(--app-border);
  border-radius: 50%;
  color: var(--app-text);
  background: color-mix(in srgb, var(--app-bg) 88%, transparent);
  box-shadow: var(--app-shadow);
  cursor: pointer;
  font-size: 16px;
  line-height: 18px;
  padding: 0;
  opacity: 0;
  transform: scale(0.86);
  pointer-events: none;
  transition: opacity 0.14s ease, transform 0.14s ease, background 0.14s ease;
}

.detail-icon-wrap:hover .detail-icon-remove,
.detail-icon-wrap:focus-within .detail-icon-remove {
  opacity: 1;
  transform: scale(1);
  pointer-events: auto;
}

.detail-icon-remove:hover {
  color: #ffffff;
  background: var(--app-danger);
}

.detail-icon:hover {
  filter: brightness(1.08);
}

.detail-title {
  min-width: 0;
  flex: 1;
}

.detail-title-main,
.detail-title-actions {
  min-width: 0;
  display: flex;
  align-items: center;
  gap: 12px;
}

.detail-title-main {
  align-items: flex-start;
}

.detail-title-actions {
  flex: 0 0 auto;
  justify-content: flex-end;
}

.detail-title h1 {
  margin: 0;
  font-size: 23px;
  color: var(--app-text);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.detail-title p {
  min-width: 0;
  margin: 0;
  font-size: 13px;
}

.detail-title-meta {
  min-width: 0;
  margin-top: 10px;
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto;
  align-items: center;
  gap: 12px;
}

.status-pill {
  flex: 0 0 auto;
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 5px 12px;
  border-radius: 999px;
  color: var(--app-muted);
  background: color-mix(in srgb, var(--app-text) 7%, transparent);
  border: 1px solid var(--app-border);
  font-size: 12px;
}

.status-pill .status-dot {
  background: var(--app-muted);
  box-shadow: none;
}

.status-pill.connected {
  color: var(--app-success);
  background: color-mix(in srgb, var(--app-success) 14%, transparent);
  border-color: color-mix(in srgb, var(--app-success) 35%, transparent);
}

.status-pill.connected .status-dot {
  background: var(--app-success);
  box-shadow: 0 0 14px color-mix(in srgb, var(--app-success) 60%, transparent);
}

.status-pill.connecting {
  color: #f7b731;
  background: color-mix(in srgb, #f7b731 14%, transparent);
  border-color: color-mix(in srgb, #f7b731 35%, transparent);
}

.status-pill.connecting .status-dot {
  background: #f7b731;
  animation: status-pulse 1s ease-in-out infinite;
}

@keyframes status-pulse {
  0%, 100% {
    transform: scale(0.82);
    box-shadow: 0 0 0 0 rgba(247, 183, 49, 0.45);
  }

  50% {
    transform: scale(1.14);
    box-shadow: 0 0 0 6px rgba(247, 183, 49, 0);
  }
}

@keyframes action-pulse {
  0%, 100% {
    box-shadow: 0 0 0 0 rgba(247, 183, 49, 0.35);
  }

  50% {
    box-shadow: 0 0 0 8px rgba(247, 183, 49, 0);
  }
}

.icon-button {
  width: 34px;
  height: 34px;
  border-radius: 50%;
}

.detail-body {
  min-height: 0;
  flex: 1;
  padding: 20px;
  display: grid;
  grid-template-columns: minmax(320px, 1fr) minmax(260px, 300px);
  gap: 18px;
  overflow: auto;
}

.info-panel,
.actions-panel {
  min-width: 0;
  border-radius: 9px;
  padding: 16px;
}

.info-panel {
  min-width: 320px;
}

.info-row {
  min-height: 48px;
  border-bottom: 1px solid var(--app-border);
  display: grid;
  grid-template-columns: minmax(92px, 0.75fr) minmax(120px, 1.25fr);
  align-items: center;
  gap: 16px;
}

.info-row:last-child {
  border-bottom: 0;
}

.info-row span {
  color: var(--app-muted);
}

.info-row strong {
  color: var(--app-text);
  text-align: right;
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.ssh-command-row strong {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 8px;
}

.ssh-command-row button {
  flex: 0 0 auto;
  width: 28px;
  height: 28px;
  border: 0;
  border-radius: 50%;
  color: var(--app-muted);
  background: color-mix(in srgb, var(--app-text) 8%, transparent);
  cursor: pointer;
}

.ssh-command-row button:hover {
  color: #ffffff;
  background: var(--app-primary);
}

.ssh-command-row button svg {
  width: 15px;
  height: 15px;
  fill: currentColor;
}

.actions-panel {
  align-self: start;
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.actions-panel h2 {
  margin: 0 0 6px;
  font-size: 15px;
  color: var(--app-text);
}

.action-button {
  width: 100%;
  justify-content: flex-start;
  padding: 0 14px;
}

.action-button:hover {
  background: color-mix(in srgb, var(--app-primary) 18%, transparent);
}

.action-button.danger {
  color: var(--app-danger);
}

.action-button.loading {
  animation: action-pulse 1s ease-in-out infinite;
}

.action-button:disabled {
  opacity: 0.45;
  cursor: not-allowed;
}

.stats-bar {
  min-height: 36px;
  display: flex;
  align-items: center;
  gap: 12px;
  color: var(--app-muted);
  font-size: 12px;
}

.stats-bar > span {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 7px 12px;
  border-radius: 999px;
  background: color-mix(in srgb, var(--app-text) 7%, transparent);
}

.stats-bar .status-dot {
  width: 22px;
  height: 12px;
  flex: 0 0 22px;
  border-radius: 999px;
  padding: 0;
  background: var(--app-success);
  box-shadow: inset 0 0 0 1px color-mix(in srgb, #ffffff 18%, transparent),
    0 0 12px color-mix(in srgb, var(--app-success) 38%, transparent);
}

.stats-bar .success {
  color: var(--app-success);
}

.stats-bar .warning .status-dot {
  background: #f7b731;
  box-shadow: inset 0 0 0 1px color-mix(in srgb, #ffffff 18%, transparent),
    0 0 12px color-mix(in srgb, #f7b731 38%, transparent);
}

.debug-panel {
  height: 170px;
  border-radius: 9px;
  overflow: hidden;
  flex: 0 0 auto;
}

.debug-header {
  height: 38px;
  padding: 0 10px 0 14px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  color: var(--app-muted);
  border-bottom: 1px solid var(--app-border);
}

.debug-header button {
  width: 28px;
  height: 28px;
  margin-left: 4px;
  border: 0;
  border-radius: 50%;
  color: var(--app-muted);
  background: transparent;
  cursor: pointer;
}

.debug-panel textarea {
  width: 100%;
  height: calc(100% - 38px);
  background: transparent;
  border: none;
  font-family: 'Consolas', 'Courier New', Courier, monospace;
  padding: 10px;
  color: #2fff54;
  outline: none;
  resize: none;
}

.empty-list,
.empty-detail {
  height: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 10px;
  color: var(--app-muted);
  text-align: center;
}

.empty-list svg,
.empty-detail svg {
  width: 54px;
  height: 54px;
  fill: currentColor;
}

.empty-list h1,
.empty-detail h1 {
  margin: 0;
  color: var(--app-text);
  font-size: 17px;
}

.empty-list p,
.empty-detail p {
  margin: 0;
}

</style>
