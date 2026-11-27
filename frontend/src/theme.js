const key = 'stagelik-theme'
const systemTheme = window.matchMedia('(prefers-color-scheme: dark)')
const themeChanged = 'stagelik-theme-change'
let preference

function applyTheme(theme) {
  document.documentElement.dataset.theme = theme
  document.querySelector('meta[name="theme-color"]').content = theme === 'dark' ? '#101827' : '#f5f7fb'
  window.dispatchEvent(new Event(themeChanged))
}

function readPreference() {
  try {
    const stored = localStorage.getItem(key)
    return stored === 'dark' || stored === 'light' ? stored : undefined
  } catch {
    return undefined
  }
}

function applyPreference() {
  applyTheme(preference ?? (systemTheme.matches ? 'dark' : 'light'))
}

export function initializeTheme() {
  preference = readPreference()
  applyPreference()
  systemTheme.addEventListener('change', applyPreference)
  window.addEventListener('storage', event => {
    if (event.key !== key && event.key !== null) return
    preference = readPreference()
    applyPreference()
  })
}

export function subscribeToTheme(callback) {
  window.addEventListener(themeChanged, callback)
  return () => window.removeEventListener(themeChanged, callback)
}

export function getTheme() {
  return document.documentElement.dataset.theme
}

export function saveTheme(theme) {
  preference = theme
  applyTheme(theme)
  try {
    localStorage.setItem(key, theme)
  } catch {
    // The theme can still change when browser storage is unavailable.
  }
}
