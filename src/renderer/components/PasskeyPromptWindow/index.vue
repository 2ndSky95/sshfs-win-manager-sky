<template>
  <Window :title="title" @close="cancel">
    <div class="wrap">
      <div class="intro">
        <strong>{{ title }}</strong>
        <p>{{ description }}</p>
      </div>

      <div class="form-item">
        <label>{{ $t('passkeyPrompt.passkey') }}</label>
        <input type="password" autofocus v-model="passkey" @keydown.enter="ok" @keydown.esc="cancel">
      </div>

      <div v-if="isCreateMode" class="form-item">
        <label>{{ $t('passkeyPrompt.confirmPasskey') }}</label>
        <input type="password" v-model="confirmPasskey" @keydown.enter="ok" @keydown.esc="cancel">
      </div>

      <p v-if="error" class="error">{{ error }}</p>

      <div class="footer">
        <button class="btn" @click="cancel">{{ $t('common.cancel') }}</button>
        <button class="btn default" @click="ok">{{ $t('common.ok') }}</button>
      </div>
    </div>
  </Window>
</template>

<script>
import { ipcRenderer } from 'electron'

import Window from '@/components/Window/index.vue'

export default {
  name: 'passkey-prompt-window',

  components: {
    Window
  },

  data () {
    return {
      passkey: '',
      confirmPasskey: '',
      error: ''
    }
  },

  computed: {
    isCreateMode () {
      return this.$route.params.mode === 'create'
    },

    title () {
      return this.isCreateMode
        ? this.$t('passkeyPrompt.createTitle')
        : this.$t('passkeyPrompt.unlockTitle')
    },

    description () {
      return this.isCreateMode
        ? this.$t('passkeyPrompt.createDescription')
        : this.$t('passkeyPrompt.unlockDescription')
    }
  },

  methods: {
    cancel () {
      ipcRenderer.send('passkey-prompt:response', {
        requestId: this.$route.params.requestId,
        passkey: null
      })
      ipcRenderer.send('window:close-current')
    },

    ok () {
      this.error = ''

      if (!this.passkey) {
        this.error = this.$t('passkeyPrompt.emptyError')
        return
      }

      if (this.isCreateMode && this.passkey !== this.confirmPasskey) {
        this.error = this.$t('passkeyPrompt.mismatchError')
        return
      }

      ipcRenderer.send('passkey-prompt:response', {
        requestId: this.$route.params.requestId,
        passkey: this.passkey
      })
      ipcRenderer.send('window:close-current')
    }
  }
}
</script>

<style lang="less" scoped>
.wrap {
  height: 100%;
  padding: 18px 22px 0;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.intro {
  margin-bottom: 14px;
  padding: 12px;
  border: 1px solid var(--app-border);
  border-radius: 9px;
  background: color-mix(in srgb, var(--app-primary) 12%, transparent);
}

.intro strong {
  display: block;
  margin-bottom: 6px;
}

.intro p {
  color: var(--app-muted);
  font-size: 12px;
  line-height: 1.45;
}

.error {
  margin-top: 8px;
  color: #ff6b6b;
  font-size: 12px;
}

.footer {
  margin-top: auto;
  padding: 15px 0;
  text-align: right;
}

.footer .btn + .btn {
  margin-left: 10px;
}
</style>
