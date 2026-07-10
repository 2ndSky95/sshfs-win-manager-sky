<template>
  <div class="form-root">
    <div class="form-title">{{ title }}</div>
    <div class="wrap">
      <Tabs>
        <Tab :label="$t('connectionForm.basic')" active>
          <div class="form-item">
            <label>{{ $t('connectionForm.name') }}</label>
            <input type="text" autofocus :placeholder="$t('connectionForm.namePlaceholder')" v-model="conn.name">
          </div>

          <h1 class="section-title">{{ $t('connectionForm.connection') }}</h1>
          <div class="form-row">
            <div class="form-item">
              <label>{{ $t('connectionForm.host') }}</label>
              <input type="text" :placeholder="$t('connectionForm.hostPlaceholder')" v-model="conn.host">
            </div>
            <div class="form-item" style="flex: 0 0 80px">
              <label>{{ $t('detail.port') }}</label>
              <input type="text" :placeholder="$t('connectionForm.portPlaceholder')" v-model.number="conn.port">
            </div>
          </div>
          <div class="form-item">
            <label>{{ $t('connectionForm.user') }}</label>
            <input type="text" :placeholder="$t('connectionForm.userPlaceholder')" v-model="conn.user">
          </div>
          <div class="form-item">
            <label>{{ $t('connectionForm.authMethod') }}</label>
            <select v-model="conn.authType" @change="authTypeChange">
              <option value="key-file">{{ $t('auth.keyFile') }}</option>
              <option value="key-file-passphrase">{{ $t('auth.keyFilePassphrase') }}</option>
              <option value="key-file-interactive">{{ $t('auth.keyFileInteractive') }}</option>
              <option value="key-file-passphrase-interactive">{{ $t('auth.keyFilePassphraseInteractive') }}</option>
              <option value="password">{{ $t('auth.password') }}</option>
              <option value="password-ask">{{ $t('auth.passwordAsk') }}</option>
              <option value="interactive">{{ $t('auth.interactive') }}</option>
              <!-- <option value="key-input" disabled>Private Key (input)</option> -->
            </select>
            <p class="auth-hint" v-if="conn.authType === 'interactive'">
              <Icon icon="info"/>
              <span>
                {{ $t('auth.interactiveHint') }}
              </span>
            </p>
            <p class="auth-hint" v-if="conn.authType === 'key-file-passphrase'">
              <Icon icon="info"/>
              <span>
                {{ $t('auth.keyPassphraseHint') }}
              </span>
            </p>
            <p class="auth-hint" v-if="conn.authType === 'key-file-interactive'">
              <Icon icon="info"/>
              <span>
                {{ $t('auth.keyInteractiveHint') }}
              </span>
            </p>
            <p class="auth-hint" v-if="conn.authType === 'key-file-passphrase-interactive'">
              <Icon icon="info"/>
              <span>
                {{ $t('auth.keyPassphraseInteractiveHint') }}
              </span>
            </p>
          </div>
          <div v-show="conn.authType === 'password'" class="form-item">
            <label>{{ $t('connectionForm.password') }}</label>
            <input type="password" v-model="conn.password" :placeholder="passwordPlaceholder">
          </div>
          <div v-show="conn.authType === 'key-file' || conn.authType === 'key-file-passphrase' || conn.authType === 'key-file-interactive' || conn.authType === 'key-file-passphrase-interactive'" class="form-row">
            <div class="form-item">
              <label>{{ $t('connectionForm.keyFile') }}</label>
              <input type="text" :placeholder="$t('connectionForm.keyFilePlaceholder')" v-model="conn.keyFile">
            </div>
            <div class="form-item" style="flex: 0">
              <button class="btn icon-btn" style="margin-top: 23px" @click="selectPrivateKey" v-tooltip="$t('connectionForm.selectPrivateKey')">
                <Icon icon="openFolder"/>
              </button>
            </div>
          </div>
          <div v-show="conn.authType === 'key-input'" class="form-item">
            <label>{{ $t('connectionForm.key') }}</label>
            <textarea :placeholder="$t('connectionForm.keyPlaceholder')" v-model="conn.key"></textarea>
          </div>

          <h1 class="section-title">{{ $t('connectionForm.remote') }}</h1>
          <div class="form-item">
            <label>{{ $t('connectionForm.path') }}</label>
            <input type="text" :placeholder="$t('connectionForm.pathPlaceholder')" v-model="conn.folder">
          </div>

          <h1 class="section-title">{{ $t('connectionForm.local') }}</h1>
          <div v-if="usesDriveLetters" class="form-item">
            <label>{{ $t('connectionForm.driveLetter') }}</label>
            <DriveSelect v-model="conn.mountPoint" :drives="drives" :used-drives="usedDrives" :auto-label="$t('connectionForm.autoDrive')"/>
          </div>
          <div v-else class="form-item">
            <label>{{ $t('connectionForm.mountPath') }}</label>
            <div class="form-row">
              <div class="form-item">
                <input type="text" :placeholder="$t('connectionForm.mountPathPlaceholder')" v-model="conn.mountPoint">
              </div>
              <div class="form-item" style="flex: 0">
                <button class="btn icon-btn" @click="selectMountPath" v-tooltip="$t('connectionForm.selectMountPath')">
                  <Icon icon="openFolder"/>
                </button>
              </div>
            </div>
            <p class="mount-hint">{{ $t('connectionForm.autoMountPath', { path: autoMountPath }) }}</p>
          </div>
        </Tab>
        <Tab :label="$t('connectionForm.advanced')" class="advanced-tab">
          <div class="form-item">
            <SwitchLabel :label="$t('connectionForm.connectOnStartup')" v-model="conn.advanced.connectOnStartup"/>
            <SwitchLabel :label="$t('connectionForm.reconnect')" v-model="conn.advanced.reconnect"/>
          </div>

          <div class="form-item">
            <SwitchLabel :label="$t('connectionForm.customOptions')" v-model="conn.advanced.customCmdlOptionsEnabled"/>

            <CustomCmdlOptions v-model="conn.advanced.customCmdlOptions"/>
          </div>
        </Tab>
      </Tabs>

      <div class="footer">
        <button class="btn cancel-action" @click="cancel">{{ $t('common.cancel') }}</button>
        <button class="btn save-action" @click="save">{{ $t('common.save') }}</button>
      </div>
    </div>
  </div>
</template>

<script>
import { ipcRenderer } from 'electron'
import { exec } from 'child_process'
import { v4 as uuid } from 'uuid'

import Tabs from '@/components/Tabs/Tabs.vue'
import Tab from '@/components/Tabs/Tab.vue'
import SwitchLabel from '@/components/SwitchLabel.vue'
import CustomCmdlOptions from './CustomCmdlOptions.vue'
import Icon from '../Icon.vue'
import DriveSelect from '@/components/DriveSelect.vue'
import SecretManager from '@/SecretManager.js'
import { currentPlatform, getAutoMountPoint, usesDriveLetters } from '@/platform/index.js'

export default {
  name: 'add-edit-connection-window',

  props: {
    embedded: {
      type: Boolean,
      default: false
    },

    editUuid: {
      type: String,
      default: null
    }
  },

  emits: ['close'],

  components: {
    Tabs,
    Tab,
    SwitchLabel,
    CustomCmdlOptions,
    Icon,
    DriveSelect
  },

  methods: {
    loadUsedDrives () {
      // Only drive letters that are actually mounted on the system count as used.
      exec('powershell -NoProfile -NonInteractive -Command "Get-PSDrive -PSProvider FileSystem | Select-Object -ExpandProperty Name"', (err, stdout) => {
        if (err) {
          return
        }

        this.usedDrives = stdout.toString().trim().split(/\r?\n/)
          .map(line => line.trim().substr(0, 1).toUpperCase())
          .filter(Boolean)
      })
    },

    closeForm () {
      if (this.embedded) {
        this.$emit('close')
      } else {
        ipcRenderer.send('window:close-current')
      }
    },

    cancel () {
      this.closeForm()
    },

    async save () {
      this.conn.advanced.customCmdlOptions =
        this.conn.advanced.customCmdlOptions.filter(a => a.name !== '')

      if (!this.usesDriveLetters && !String(this.conn.mountPoint || '').trim()) {
        this.conn.mountPoint = 'auto'
      }

      if (!await this.prepareSecretsBeforeSave()) {
        return
      }

      if (this.isEditingMode) {
        this.$store.dispatch('UPDATE_CONNECTION', this.conn)
      } else {
        this.$store.dispatch('ADD_CONNECTION', this.conn)
      }

      this.closeForm()
    },

    authTypeChange () {
      this.conn.password = ''
      this.conn.keyFile = currentPlatform.defaultKeyFile
    },

    async selectPrivateKey () {
      const file = await ipcRenderer.invoke('dialog:select-private-key')

      if (file) {
        this.conn.keyFile = file
      }
    },

    async selectMountPath () {
      const directory = await ipcRenderer.invoke('dialog:select-mount-path')

      if (directory) {
        this.conn.mountPoint = directory
      }
    },

    hasExistingEncryptedSecrets () {
      return this.$store.state.Data.connections.some(conn => conn.secrets && conn.secrets.password)
    },

    getFirstEncryptedPassword () {
      const conn = this.$store.state.Data.connections.find(conn => conn.secrets && conn.secrets.password)

      return conn && conn.secrets.password
    },

    async prepareSecretsBeforeSave () {
      this.conn.secrets = this.conn.secrets || {}

      if (this.conn.authType !== 'password') {
        delete this.conn.secrets.password
        this.conn.password = ''
        return true
      }

      // empty field while editing means "keep the stored password", not "delete it"
      if (!this.conn.password && this.isEditingMode) {
        this.conn.password = this.existingPlainPassword
      }

      if (!this.conn.password) {
        return true
      }

      if (this.$store.state.Settings.settings.passkeyEnabled === false) {
        delete this.conn.secrets.password
        return true
      }

      const existingSecret = this.getFirstEncryptedPassword()

      if (existingSecret) {
        const activePasskey = await SecretManager.getPasskey(this.$store.state.Settings.settings, 'unlock')

        if (!activePasskey) {
          return false
        }

        try {
          SecretManager.decryptWithPasskey(existingSecret, activePasskey)
        } catch {
          SecretManager.lock()
          window.alert(this.$t('notifications.passkeyInvalid'))
          return false
        }

        this.conn.secrets.password = SecretManager.encryptWithPasskey(this.conn.password, activePasskey)
        this.conn.password = ''
        return true
      }

      const encrypted = await SecretManager.encryptSecret(this.conn.password, this.$store.state.Settings.settings, 'create')

      if (!encrypted) {
        return false
      }

      this.conn.secrets.password = encrypted
      this.conn.password = ''
      return true
    }
  },

  data () {
    return {
      isEditingMode: false,
      existingPlainPassword: '',
      hasStoredSecret: false,

      title: this.$t('connectionForm.addTitle'),
      drives: 'DEFGHIJKLMNOPQRSTUVWXYZ',
      usedDrives: [],
      usesDriveLetters: usesDriveLetters(),

      conn: {
        uuid: uuid(),
        name: '',
        host: '',
        port: 22,
        user: '',
        folder: '/',
        authType: 'password',
        password: '',
        secrets: {},
        keyFile: currentPlatform.defaultKeyFile,
        key: '',
        mountPoint: usesDriveLetters() ? 'auto' : '',
        status: 'disconnected',
        pid: 0,
        advanced: {
          customCmdlOptionsEnabled: false,
          customCmdlOptions: [],
          connectOnStartup: false,
          reconnect: false
        }
      }
    }
  },

  computed: {
    autoMountPath () {
      return getAutoMountPoint(this.conn)
    },

    passwordPlaceholder () {
      // '#' = stored encrypted (passkey), '*' = stored in plain text
      if (this.hasStoredSecret) {
        return '########'
      }

      if (this.existingPlainPassword) {
        return '********'
      }

      return ''
    }
  },

  mounted () {
    const editUuid = this.editUuid || (this.$route.name === 'edit-connection' ? this.$route.params.uuid : null)

    if (editUuid) {
      this.isEditingMode = true

      this.title = this.$t('connectionForm.editTitle')

      this.conn = JSON.parse(JSON.stringify(this.$store.state.Data.connections.find(a => a.uuid === editUuid)))
      this.existingPlainPassword = this.conn.password || ''
      this.hasStoredSecret = !!(this.conn.secrets && this.conn.secrets.password)
      this.conn.password = ''
      this.conn.secrets = this.conn.secrets || {}

      if (!this.usesDriveLetters && this.conn.mountPoint === 'auto') {
        this.conn.mountPoint = ''
      }
    }

    this.loadUsedDrives()
  }
}
</script>

<style lang="less" scoped>
.form-root {
  height: 100%;
  min-height: 0;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.form-title {
  flex: 0 0 auto;
  padding: 14px 14px 4px;
  font-size: 16px;
  font-weight: 600;
  text-align: center;
  color: var(--app-text);
}

.wrap  {
  flex: 1;
  min-height: 0;
  padding: 0;
  box-sizing: border-box;
  display: flex;
  flex-direction: column;
  overflow: hidden;

  :deep(.tabs-container) {
    min-height: 0;
    flex: 1;
    display: flex;
    flex-direction: column;
    overflow: hidden;
  }

  :deep(.tabs-selector) {
    flex: 0 0 auto;
    display: flex;
    justify-content: center;
    gap: 6px;
    border-bottom: 0 !important;
    padding: 2px 0 8px;
  }

  :deep(.tabs-selector .tab-selector) {
    height: auto;
    padding: 6px 16px;
    border-radius: 7px;
    color: var(--app-muted);
    background: transparent;
    font-size: 12px;
    border-bottom: 0;
  }

  :deep(.tabs-selector .tab-selector:hover),
  :deep(.tabs-selector .tab-selector--selected) {
    color: var(--app-primary);
    background: color-mix(in srgb, var(--app-primary) 12%, transparent);
    border-bottom: 0;
    font-weight: 600;
  }

  :deep(.tab) {
    min-height: 0;
    flex: 1;
    overflow: auto;
    margin: 0 12px 12px;
    border: 1px solid var(--app-border);
    border-radius: 10px;
    background: color-mix(in srgb, var(--app-surface) 60%, transparent);
    padding: 12px 14px 14px;
  }

  .advanced-tab {
    overflow: auto;
    height: auto;
  }

  .footer {
    flex: 0 0 auto;
    margin: 0;
    padding: 6px 12px;
    border-top: 1px solid var(--app-border);
    background: color-mix(in srgb, var(--app-surface) 86%, transparent);
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 10px;

    .btn {
      margin-bottom: 0;
      min-width: 110px;
    }

    .cancel-action {
      background: color-mix(in srgb, var(--app-danger, #d64545) 22%, transparent);
      color: var(--app-text);
    }

    .cancel-action:hover {
      background: var(--app-danger, #d64545);
      color: #fff;
    }

    .save-action {
      background: color-mix(in srgb, var(--app-success) 26%, transparent);
      color: var(--app-text);
    }

    .save-action:hover {
      background: var(--app-success);
      color: #fff;
    }
  }

  .auth-hint {
    margin: 10px 0 0;
    padding: 10px 12px;
    border: 1px dashed var(--app-border);
    border-radius: 8px;
    color: var(--app-muted);
    background: color-mix(in srgb, var(--app-primary) 14%, transparent);
    font-size: 12px;
    line-height: 1.35;
    display: flex;
    align-items: flex-start;
    gap: 8px;
  }

  .auth-hint svg {
    width: 15px;
    height: 15px;
    fill: var(--app-primary);
    flex: 0 0 15px;
    margin-top: 2px;
  }

  .mount-hint {
    margin: 8px 0 0;
    color: var(--app-muted);
    font-size: 12px;
    line-height: 1.35;
  }

}

</style>
