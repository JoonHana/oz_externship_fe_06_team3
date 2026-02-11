const MANUAL_LOGOUT_MARKER_KEY = 'auth-manual-logout'
const AUTH_PERSIST_STORAGE_KEY = 'auth-storage'
const AUTH_COOKIE_NAMES = ['access_token', 'refresh_token', 'sessionid'] as const

function canUseStorage() {
  return typeof window !== 'undefined' && typeof window.localStorage !== 'undefined'
}

function canUseDocument() {
  return typeof document !== 'undefined'
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

export function clearClientAuthCookies() {
  if (!canUseDocument()) return

  const hostname =
    typeof window !== 'undefined' && window.location?.hostname
      ? window.location.hostname
      : ''

  const domainCandidates = new Set<string>([''])
  if (hostname) {
    domainCandidates.add(hostname)
    domainCandidates.add(`.${hostname}`)

    const parts = hostname.split('.').filter(Boolean)
    if (parts.length >= 2) {
      const parentDomain = parts.slice(-2).join('.')
      domainCandidates.add(parentDomain)
      domainCandidates.add(`.${parentDomain}`)
    }
  }

  AUTH_COOKIE_NAMES.forEach((cookieName) => {
    domainCandidates.forEach((domain) => {
      const domainPart = domain ? `; Domain=${domain}` : ''
      document.cookie = `${cookieName}=; Max-Age=0; Path=/${domainPart}`
      document.cookie = `${cookieName}=; Expires=Thu, 01 Jan 1970 00:00:00 GMT; Path=/${domainPart}`
    })
  })
}

export function clearPersistedAuthState() {
  if (!canUseStorage()) return
  window.localStorage.removeItem(AUTH_PERSIST_STORAGE_KEY)
}
