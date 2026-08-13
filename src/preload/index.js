import { contextBridge, ipcRenderer } from 'electron'

/**
 * Safe, minimal API exposed to the renderer.
 * The renderer never touches Node, sqlite, or ipcRenderer directly.
 */
const api = {
  jobs: {
    list: (branch, filters) => ipcRenderer.invoke('jobs:list', branch, filters),
    save: (branch, payload) => ipcRenderer.invoke('jobs:save', branch, payload),
    delete: (id) => ipcRenderer.invoke('jobs:delete', id)
  },
  maintenance: {
    list: (branch) => ipcRenderer.invoke('maintenance:list', branch),
    save: (branch, payload) => ipcRenderer.invoke('maintenance:save', branch, payload),
    delete: (id) => ipcRenderer.invoke('maintenance:delete', id)
  }
}

if (process.contextIsolated) {
  contextBridge.exposeInMainWorld('api', api)
} else {
  // Fallback (should not happen: contextIsolation is on)
  window.api = api
}
