import { createStore } from 'vuex'
import { ipcRenderer } from 'electron'

import modules from './modules/index.js'

const STORAGE_KEY = 'sshfs-win-manager-evo-state'
const SYNC_CHANNEL = 'sshfs-win-manager-evo-state-sync'

let resolveStateReady
const stateReady = new Promise(resolve => {
  resolveStateReady = resolve
})

// Connection status/pid only describe the current session; persisting them
// makes a fresh start show stale "connected" entries from the previous run.
function stripRuntimeState (state) {
  if (!state.Data || !Array.isArray(state.Data.connections)) {
    return state
  }

  return {
    ...state,
    Data: {
      ...state.Data,
      connections: state.Data.connections.map(conn => ({
        ...conn,
        status: 'disconnected',
        pid: null
      }))
    }
  }
}

function mergeState (currentState, savedState) {
  if (!savedState) {
    return currentState
  }

  return {
    ...currentState,
    ...savedState,
    Data: {
      ...currentState.Data,
      ...(savedState.Data || {}),
      connections: savedState.Data && Array.isArray(savedState.Data.connections)
        ? savedState.Data.connections
        : currentState.Data.connections
    },
    Settings: {
      ...currentState.Settings,
      ...(savedState.Settings || {}),
      settings: {
        ...currentState.Settings.settings,
        ...((savedState.Settings && savedState.Settings.settings) || {})
      }
    }
  }
}

function createPersistedState () {
  return store => {
    let isApplyingRemoteState = false
    const channel = 'BroadcastChannel' in window ? new BroadcastChannel(SYNC_CHANNEL) : null

    const applySavedState = state => {
      if (!state) {
        return
      }

      isApplyingRemoteState = true
      store.replaceState(mergeState(store.state, state))
      store.dispatch('APPLY_MIGRATIONS')
      isApplyingRemoteState = false
    }

    const savedState = window.localStorage.getItem(STORAGE_KEY)

    if (savedState) {
      try {
        applySavedState(JSON.parse(savedState))
      } catch {
        window.localStorage.removeItem(STORAGE_KEY)
      }
    }

    store.dispatch('APPLY_MIGRATIONS')

    ipcRenderer.invoke('app-state:load').then(state => {
      applySavedState(state ? stripRuntimeState(state) : state)
      store.dispatch('APPLY_MIGRATIONS')
      resolveStateReady()
    }).catch(() => {
      resolveStateReady()
    })

    if (channel) {
      channel.onmessage = event => {
        applySavedState(event.data)
      }
    }

    window.addEventListener('storage', event => {
      if (event.key === STORAGE_KEY && event.newValue) {
        applySavedState(JSON.parse(event.newValue))
      }
    })

    store.subscribe((mutation, state) => {
      if (isApplyingRemoteState) {
        return
      }

      const serializedState = JSON.stringify(state)
      const plainState = JSON.parse(serializedState)
      const persistedState = stripRuntimeState(plainState)

      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(persistedState))
      ipcRenderer.invoke('app-state:save', persistedState).catch(() => {})

      if (channel) {
        channel.postMessage(plainState)
      }
    })
  }
}

export { stateReady }

export default createStore({
  modules,
  plugins: [
    createPersistedState()
  ],
  strict: false
})
