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
  fuel: {
    list: (branch) => ipcRenderer.invoke('fuel:list', branch),
    save: (branch, payload) => ipcRenderer.invoke('fuel:save', branch, payload)
  },
  maintenance: {
    list: (branch) => ipcRenderer.invoke('maintenance:list', branch),
    save: (branch, payload) => ipcRenderer.invoke('maintenance:save', branch, payload)
  },
  drivers: {
    list: (branch) => ipcRenderer.invoke('drivers:list', branch)
  },
  workers: {
    list: (branch) => ipcRenderer.invoke('workers:list', branch)
  },
  auth: {
    login: (email, password) => ipcRenderer.invoke('auth:login', email, password),
    logout: () => ipcRenderer.invoke('auth:logout'),
    session: () => ipcRenderer.invoke('auth:session'),
    updateProfile: (newEmail, newPassword, currentPassword) =>
      ipcRenderer.invoke('auth:updateProfile', newEmail, newPassword, currentPassword),
    deleteAccount: () => ipcRenderer.invoke('auth:deleteAccount')
  }
}

if (process.contextIsolated) {
  contextBridge.exposeInMainWorld('api', api)
} else {
  // Fallback (should not happen: contextIsolation is on)
  window.api = api
}
