// ============================================================================
// Top Bar -- Union Bank-facing institutional shell
// ============================================================================

import { useCallback, useEffect, useState } from 'react'
import { useUIStore } from '@/stores/use-ui-store'
import { ConnectionStatus } from '@/components/shared/connection-status'
import { ROLE_POLICIES, rolePolicy, type PayflowRole } from '@/lib/rbac'
import { useT, useLanguage } from '@/hooks/use-i18n'
import { translateRole } from '@/lib/i18n'
import { Building2, Moon, Radio, Search, ShieldCheck, Sun, UserRound } from 'lucide-react'

export function TopBar() {
  const t = useT()
  const language = useLanguage()
  const locale = language === 'hi' ? 'hi-IN' : 'en-IN'
  const [clock, setClock] = useState(formatClock(locale))
  const [date, setDate] = useState(formatDate(locale))

  useEffect(() => {
    const interval = setInterval(() => {
      setClock(formatClock(locale))
      setDate(formatDate(locale))
    }, 1000)
    return () => clearInterval(interval)
  }, [locale])

  const connected = useUIStore((s) => s.connected)
  const currentRole = useUIStore((s) => s.currentRole)
  const setCurrentRole = useUIStore((s) => s.setCurrentRole)
  const theme = useUIStore((s) => s.theme)
  const toggleTheme = useUIStore((s) => s.toggleTheme)
  const activePolicy = translateRole(rolePolicy(currentRole), language)
  const skipToMain = useCallback(() => {
    const main = document.getElementById('main-content')
    if (main instanceof HTMLElement) {
      main.focus({ preventScroll: false })
      main.scrollIntoView({ block: 'start' })
    }
  }, [])

  return (
    <>
      <div className="ubi-access-strip hidden shrink-0 items-center justify-between px-5 text-[10px] font-medium lg:flex">
        <div className="flex items-center gap-4">
          <button
            onClick={skipToMain}
            className="font-semibold text-accent-primary underline-offset-4 hover:underline focus:outline-none focus:ring-2 focus:ring-accent-primary/30"
          >
            {t('topbar.skipToMain')}
          </button>
          <span className="h-3 w-px bg-border-subtle" />
          <span>{t('topbar.workspaceStrip')}</span>
        </div>
        <div className="flex items-center gap-3">
          <a href="/landing" className="rounded-full bg-accent-primary px-3 py-1 font-bold text-white">{t('topbar.landingPage')}</a>
          <a href="/docs" className="font-semibold text-accent-primary underline-offset-4 hover:underline">{t('topbar.apiDocs')}</a>
        </div>
      </div>

      <header className="ubi-official-header flex h-16 shrink-0 items-center justify-between border-b border-border-default px-5">
        <a href="/landing" title={t('topbar.brandTitle')} target="_self" className="flex min-w-0 items-center gap-3">
          <span className="ubi-brand-mark shrink-0">
            <span className="sr-only">{t('topbar.bankOfIndia')}</span>
          </span>
          <span className="flex min-w-0 flex-col">
            <span className="ubi-wordmark-title truncate text-[16px] leading-tight">
              Union Bank <span>of India</span>
            </span>
            <span className="truncate text-[9px] font-semibold uppercase tracking-[0.12em] text-text-muted leading-tight">
              {t('topbar.brandUndertaking')}
            </span>
          </span>
        </a>

        {/* Primary navigation lives in the dedicated TabNav bar below; the
            header keeps only contextual actions so the two never duplicate. */}
        <div className="flex min-w-0 flex-1 items-center justify-end px-2" />

        <div className="flex shrink-0 items-center gap-3">
          <a href="/docs" className="hidden items-center gap-2 rounded-full bg-bg-elevated px-3 py-1.5 text-[10px] font-semibold text-text-secondary lg:flex">
            <Search className="h-3.5 w-3.5" />
            {t('topbar.apiDocs')}
          </a>
          <div className="hidden items-center gap-2 md:flex">
            <Building2 className="h-3.5 w-3.5 text-accent-primary" />
            <span className="text-[9px] font-bold uppercase tracking-[0.16em] text-text-secondary">
              {t('topbar.tagline')}
            </span>
          </div>
          <button
            type="button"
            onClick={toggleTheme}
            title={theme === 'dark' ? 'Switch to institutional light theme' : 'Switch to command-center dark theme'}
            aria-label={theme === 'dark' ? 'Switch to light theme' : 'Switch to dark theme'}
            className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-border-subtle bg-bg-elevated text-text-secondary transition-colors hover:border-accent-primary hover:text-accent-primary focus:outline-none focus:ring-2 focus:ring-accent-primary/30"
          >
            {theme === 'dark'
              ? <Sun className="h-3.5 w-3.5" />
              : <Moon className="h-3.5 w-3.5" />}
          </button>
          <label
            title={`${activePolicy.domain}: ${activePolicy.escalationScope}`}
            className="hidden items-center gap-2 rounded-full border border-border-subtle bg-bg-elevated px-2.5 py-1 text-[9px] font-bold uppercase tracking-[0.12em] text-text-secondary xl:flex"
          >
            <UserRound className="h-3.5 w-3.5 text-accent-primary" />
            <span className="sr-only">{t('topbar.roleSrOnly')}</span>
            <select
              value={currentRole}
              onChange={(event) => setCurrentRole(event.target.value as PayflowRole)}
              className="max-w-[180px] bg-transparent text-[9px] font-bold uppercase tracking-[0.12em] text-text-primary outline-none"
            >
              {Object.values(ROLE_POLICIES).map((policy) => (
                <option key={policy.role} value={policy.role}>
                  {translateRole(policy, language).label}
                </option>
              ))}
            </select>
          </label>
          <div className="hidden h-4 w-px bg-border-subtle md:block" />
          <ShieldCheck className="hidden h-3.5 w-3.5 text-alert-low md:block" />
          <ConnectionStatus connected={connected} />
          <div className="h-4 w-px bg-border-subtle" />
          <div className="flex items-center gap-2">
            <Radio className="w-3 h-3 text-text-muted" />
            <div className="flex flex-col items-end">
              <span className="text-[11px] font-mono font-semibold text-text-primary tabular-nums leading-tight">
                {clock}
              </span>
              <span className="text-[8px] font-mono text-text-muted uppercase leading-tight">
                {date}
              </span>
            </div>
          </div>
        </div>
      </header>
    </>
  )
}

function formatClock(locale: string): string {
  return new Date().toLocaleTimeString(locale, {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
  })
}

function formatDate(locale: string): string {
  return new Date().toLocaleDateString(locale, {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  })
}
