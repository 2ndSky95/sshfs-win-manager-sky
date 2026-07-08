<template>
  <div class="header">
    <div class="title">{{title}}</div>
    
    <div class="controls">
      <div v-if="minimizable" class="minimize" @click="minimize">
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32">
          <path d="M 7 23 L 25 23 L 25 25 L 7 25 Z "/>
        </svg>
      </div>
      <div class="close" @click="close">
        <svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" viewBox="0 0 32 32" version="1.1">
          <path style=" " d="M 7.21875 5.78125 L 5.78125 7.21875 L 14.5625 16 L 5.78125 24.78125 L 7.21875 26.21875 L 16 17.4375 L 24.78125 26.21875 L 26.21875 24.78125 L 17.4375 16 L 26.21875 7.21875 L 24.78125 5.78125 L 16 14.5625 Z "/>
        </svg>
      </div>
    </div>
  </div>
</template>

<script>
import { ipcRenderer } from 'electron'

export default {
  name: 'Header',

  props: {
    title: {
      type: String,
      required: false,
      default: ''
    },

    closeAction: {
      type: String,
      required: false,
      default: 'close'
    },

    minimizable: {
      type: Boolean,
      required: false,
      default: false
    }
  },

  methods: {
    minimize () {
      ipcRenderer.send('window:minimize-current')
    },

    close () {
      if (this.closeAction === 'hide') {
        ipcRenderer.send('window:hide-current')
      } else {
        ipcRenderer.send('window:close-current')
      }

      this.$emit('close')
    }
  }
}
</script>

<style lang="less" scoped>
@height: 30px;
@button-width: 46px;
@button-icon-size: 16px;

.header {
  background: @main-color;
  display: flex;
  -webkit-app-region: drag;

  > div {
    flex: 1;
  }

  .title {
    display: table-cell;
    height: @height;
    line-height: @height;
    padding-left: 8px;
    color: fade(contrast(@main-color), 80%);
    font-size: 10pt;
  }

  .controls {
    flex: 0 auto;
    -webkit-app-region: no-drag;

    > div {
      display: table-cell;
      height: @height;
      width: @button-width;
      text-align: center;
      vertical-align: middle;

      svg {
        width: @button-icon-size;
        fill: contrast(@main-color);
      }
    }

    .close {
      &:hover {
        background-color: #d41324
      }
    }

    .minimize {
      &:hover {
        background-color: fade(contrast(@main-color), 12%)
      }
    }
  }
}
</style>
