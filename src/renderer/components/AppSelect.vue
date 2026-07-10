<template>
  <div class="app-select" ref="root">
    <button type="button" class="app-select-trigger" :class="{ open }" :disabled="disabled" @click="toggle">
      <span class="app-select-label">{{ selectedLabel }}</span>
      <svg class="chevron" width="10" height="6" viewBox="0 0 10 6"><path d="M1 1l4 4 4-4" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/></svg>
    </button>

    <div v-if="open" class="app-select-menu" :style="menuStyle">
      <template v-if="groups">
        <div v-for="group in groups" :key="group.label" class="app-select-group">
          <div class="app-select-group-label">{{ group.label }}</div>
          <button
            v-for="option in group.options"
            :key="option.value"
            type="button"
            class="app-select-option"
            :class="{ selected: option.value === modelValue }"
            @click="pick(option.value)"
          >
            {{ option.label }}
          </button>
        </div>
      </template>

      <template v-else>
        <button
          v-for="option in options"
          :key="option.value"
          type="button"
          class="app-select-option"
          :class="{ selected: option.value === modelValue }"
          @click="pick(option.value)"
        >
          {{ option.label }}
        </button>
      </template>
    </div>
  </div>
</template>

<script>
export default {
  name: 'app-select',

  props: {
    modelValue: {
      type: String,
      default: ''
    },

    options: {
      type: Array,
      default: () => []
    },

    groups: {
      type: Array,
      default: null
    },

    disabled: {
      type: Boolean,
      default: false
    }
  },

  emits: ['update:modelValue'],

  data () {
    return {
      open: false,
      menuStyle: {}
    }
  },

  computed: {
    flatOptions () {
      if (this.groups) {
        return this.groups.flatMap(group => group.options)
      }

      return this.options
    },

    selectedLabel () {
      const current = this.flatOptions.find(option => option.value === this.modelValue)

      return current ? current.label : this.modelValue
    }
  },

  methods: {
    toggle () {
      if (this.open) {
        this.open = false
        return
      }

      // Fixed positioning escapes overflow containers; clamp to the window.
      const rect = this.$refs.root.getBoundingClientRect()
      const menuMaxHeight = 280
      const spaceBelow = window.innerHeight - rect.bottom - 8
      const openUp = spaceBelow < Math.min(menuMaxHeight, 160) && rect.top > spaceBelow

      this.menuStyle = {
        position: 'fixed',
        left: `${Math.round(rect.left)}px`,
        width: `${Math.round(rect.width)}px`,
        maxHeight: `${menuMaxHeight}px`,
        ...(openUp
          ? { bottom: `${Math.round(window.innerHeight - rect.top + 4)}px` }
          : { top: `${Math.round(rect.bottom + 4)}px` })
      }

      this.open = true
    },

    pick (value) {
      this.open = false

      if (value !== this.modelValue) {
        this.$emit('update:modelValue', value)
      }
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
    },

    onViewportChange () {
      this.open = false
    }
  },

  mounted () {
    document.addEventListener('mousedown', this.onOutsideClick)
    document.addEventListener('keydown', this.onKeydown)
    window.addEventListener('resize', this.onViewportChange)
    document.addEventListener('scroll', this.onViewportChange, true)
  },

  beforeUnmount () {
    document.removeEventListener('mousedown', this.onOutsideClick)
    document.removeEventListener('keydown', this.onKeydown)
    window.removeEventListener('resize', this.onViewportChange)
    document.removeEventListener('scroll', this.onViewportChange, true)
  }
}
</script>

<style scoped>
.app-select {
  position: relative;
  width: 100%;
  min-width: 0;
}

.app-select-trigger {
  width: 100%;
  height: 44px;
  padding: 0 12px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  border: 1px solid var(--app-border);
  border-radius: 8px;
  color: var(--app-text);
  background: color-mix(in srgb, var(--app-bg) 42%, transparent);
  cursor: pointer;
  font-size: 12px;
  text-align: left;
  transition: border-color 140ms;
}

.app-select-trigger:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.app-select-trigger:focus,
.app-select-trigger.open {
  outline: none;
  border-color: var(--app-primary);
}

.app-select-label {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.app-select-trigger .chevron {
  flex: 0 0 auto;
  color: var(--app-muted);
  transition: transform 140ms;
}

.app-select-trigger.open .chevron {
  transform: rotate(180deg);
}

.app-select-menu {
  z-index: 100;
  padding: 6px;
  overflow: auto;
  border: 1px solid var(--app-border);
  border-radius: 8px;
  background: var(--app-surface-raised, var(--app-surface-soft));
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.35);
}

.app-select-group-label {
  padding: 6px 8px 2px;
  color: var(--app-muted);
  font-size: 10px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.4px;
}

.app-select-option {
  width: 100%;
  padding: 8px;
  display: block;
  border: 1px solid transparent;
  border-radius: 6px;
  color: var(--app-text);
  background: transparent;
  cursor: pointer;
  font-size: 12px;
  text-align: left;
}

.app-select-option:hover {
  background: color-mix(in srgb, var(--app-primary) 14%, transparent);
}

.app-select-option.selected {
  border-color: color-mix(in srgb, var(--app-primary) 60%, transparent);
  background: color-mix(in srgb, var(--app-primary) 20%, transparent);
}
</style>
