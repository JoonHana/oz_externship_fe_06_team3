const MANUAL_LOGOUT_MARKER_KEY = 'auth-manual-logout'
const AUTH_PERSIST_STORAGE_KEY = 'auth-storage'

function canUseStorage() {
  return typeof window !== 'undefined' && typeof window.localStorage !== 'undefined'
}

export function markManualLogout() {
  if (!canUseStorage()) return
  window.localStorage.setItem(MANUAL_LOGOUT_MARKER_KEY, '1')
}

export function clearManualLogoutMark() {
  if (!canUseStorage()) return
  window.localStorage.removeItem(MANUAL_LOGOUT_MARKER_KEY)
}

export function isManualLogoutMarked() {
  if (!canUseStorage()) return false
  return window.localStorage.getItem(MANUAL_LOGOUT_MARKER_KEY) === '1'
}

export function clearPersistedAuthState() {
  if (!canUseStorage()) return
  window.localStorage.removeItem(AUTH_PERSIST_STORAGE_KEY)
}
