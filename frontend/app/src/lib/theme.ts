// ============================================================================
// theme.ts -- PayFlow visual theme (light / dark)
// ============================================================================
// Dependency-free theme selection. Mirrors the rbac.ts / i18n.ts persistence
// pattern: a private storage key, an SSR-guarded getter/setter, and a guard.
// The active theme is applied to <html data-theme="..."> by App.tsx so the
// CSS token blocks in index.css (light defaults + [data-theme="dark"]) flip
// the whole application at once.
// ============================================================================

export type Theme = 'light' | 'dark'

export const DEFAULT_THEME: Theme = 'dark'

export const THEMES: { id: Theme; label: string }[] = [
  { id: 'dark', label: 'Command Center' },
  { id: 'light', label: 'Institutional' },
]

const THEME_STORAGE_KEY = 'payflow.theme'

// ── Persistence ────────────────────────────────────────────────────────────

export function getStoredTheme(): Theme {
  if (typeof window === 'undefined') return DEFAULT_THEME
  const stored = window.localStorage.getItem(THEME_STORAGE_KEY)
  return isTheme(stored) ? stored : DEFAULT_THEME
}

export function storeTheme(theme: Theme): void {
  if (typeof window !== 'undefined') {
    window.localStorage.setItem(THEME_STORAGE_KEY, theme)
  }
}

function isTheme(value: unknown): value is Theme {
  return value === 'light' || value === 'dark'
}

/**
 * Apply the active theme to the document root and set `color-scheme` so native
 * form controls / scrollbars render correctly for the chosen theme. Safe to
 * call repeatedly. No-ops on the server.
 */
export function applyThemeToDocument(theme: Theme): void {
  if (typeof document === 'undefined') return
  const root = document.documentElement
  root.setAttribute('data-theme', theme)
  root.style.colorScheme = theme
}
