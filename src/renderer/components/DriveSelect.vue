<template>
  <div class="drive-select" ref="root">
    <button type="button" class="drive-select-trigger" :class="{ open }" @click="open = !open">
      <span :class="{ 'is-used': isUsed(modelValue) }">{{ displayLabel }}</span>
      <svg class="chevron" width="10" height="6" viewBox="0 0 10 6"><path d="M1 1l4 4 4-4" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/></svg>
    </button>

    <div v-if="open" class="drive-select-menu">
      <button type="button" class="drive-option auto" :class="{ selected: modelValue === 'auto' }" @click="pick('auto')">
        {{ autoLabel }}
      </button>

      <div class="drive-grid">
        <button
          v-for="letter in letters"
          :key="letter"
          type="button"
          class="drive-option letter"
          :class="{ selected: modelValue === letter + ':', used: usedDrives.includes(letter) }"
          @click="pick(letter + ':')"
        >
          {{ letter }}:
        </button>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  name: 'drive-select',

  props: {
    modelValue: {
      type: String,
      default: 'auto'
    },

    drives: {
      type: [String, Array],
      required: true
    },

    usedDrives: {
      type: Array,
      default: () => []
    },

    autoLabel: {
      type: String,
      default: 'Auto'
    }
  },

  emits: ['update:modelValue'],

  data () {
    return {
      open: false
    }
  },

  computed: {
    letters () {
      return Array.isArray(this.drives) ? this.drives : this.drives.split('')
    },

    displayLabel () {
      return this.modelValue === 'auto' ? this.autoLabel : this.modelValue
    }
  },

  methods: {
    pick (value) {
      this.$emit('update:modelValue', value)
      this.open = false
    },

    isUsed (value) {
      return value !== 'auto' && this.usedDrives.includes(String(value).substr(0, 1))
    },

    onOutsideClick (event) {
      if (this.open && this.$refs.root && !this.$refs.root.contains(event.target)) {
        this.open = false
      }
    },

    onKeydown (event) {
      if (event.key === 'Escape') {
        this.open = false
      }
    }
  },

  mounted () {
    document.addEventListener('mousedown', this.onOutsideClick)
    document.addEventListener('keydown', this.onKeydown)
  },

  beforeUnmount () {
    document.removeEventListener('mousedown', this.onOutsideClick)
    document.removeEventListener('keydown', this.onKeydown)
  }
}
</script>

<style scoped>
.drive-select {
  position: relative;
  width: 100%;
}

.drive-select-trigger {
  width: 100%;
  padding: 10px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  border: 1px solid var(--app-faint);
  border-radius: 6px;
  color: var(--app-text);
  background: var(--app-surface-soft);
  cursor: pointer;
  font-size: inherit;
  text-align: left;
  transition: border-color 140ms, background-color 140ms;
}

.drive-select-trigger:focus,
.drive-select-trigger.open {
  outline: none;
  border-color: var(--app-primary);
}

.drive-select-trigger .is-used {
  color: #f7b731;
  font-weight: 600;
}

.drive-select-trigger .chevron {
  flex: 0 0 auto;
  color: var(--app-muted);
  transition: transform 140ms;
}

.drive-select-trigger.open .chevron {
  transform: rotate(180deg);
}

.drive-select-menu {
  position: absolute;
  left: 0;
  right: 0;
  top: calc(100% + 4px);
  z-index: 40;
  padding: 8px;
  border: 1px solid var(--app-border);
  border-radius: 8px;
  background: var(--app-surface-raised, var(--app-surface-soft));
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.35);
}

.drive-option {
  border: 1px solid transparent;
  border-radius: 6px;
  padding: 8px;
  color: var(--app-text);
  background: transparent;
  cursor: pointer;
  font-size: inherit;
  text-align: center;
}

.drive-option.auto {
  width: 100%;
  margin-bottom: 8px;
  text-align: left;
}

.drive-option:hover {
  background: color-mix(in srgb, var(--app-primary) 14%, transparent);
}

.drive-option.selected {
  border-color: color-mix(in srgb, var(--app-primary) 60%, transparent);
  background: color-mix(in srgb, var(--app-primary) 20%, transparent);
}

.drive-option.used {
  color: #f7b731;
  font-weight: 600;
}

.drive-grid {
  display: grid;
  grid-template-columns: repeat(6, 1fr);
  gap: 4px;
}
</style>
