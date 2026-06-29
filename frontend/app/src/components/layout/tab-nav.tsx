// ============================================================================
// Tab Navigation -- Union Bank product navigation with live alert badges
// ============================================================================

import { useEffect, useCallback } from 'react'
import { useUIStore, type TabId } from '@/stores/use-ui-store'
import { useDashboardStore } from '@/stores/use-dashboard-store'
import { useCountermeasureProposals, useEscalations, useIntelTuningStatus } from '@/hooks/use-api'
import { cn } from '@/lib/utils'
import { canAccessTab, rolePolicy } from '@/lib/rbac'
import { useT, useLanguage } from '@/hooks/use-i18n'
import { translateRole } from '@/lib/i18n'
import type { UIStringKey } from '@/lib/translations'
import {
  LayoutDashboard,
  Crosshair,
  Scale,
  BrainCircuit,
  BarChart3,
  Cpu,
  ShieldCheck,
  Radar,
  LockKeyhole,
} from 'lucide-react'
import type { LucideIcon } from 'lucide-react'

const TABS: { id: TabId; labelKey: UIStringKey; shortLabelKey: UIStringKey; icon: LucideIcon; key: string }[] = [
  { id: 'pre-fraud-intel', labelKey: 'nav.tab.preFraudIntel.full', shortLabelKey: 'nav.tab.preFraudIntel.short', icon: Radar, key: '1' },
  { id: 'overview', labelKey: 'nav.tab.overview.full', shortLabelKey: 'nav.tab.overview.short', icon: LayoutDashboard, key: '2' },
  { id: 'threat-sim', labelKey: 'nav.tab.threatSim.full', shortLabelKey: 'nav.tab.threatSim.short', icon: Crosshair, key: '3' },
  { id: 'investigations', labelKey: 'nav.tab.investigations.full', shortLabelKey: 'nav.tab.investigations.short', icon: Scale, key: '4' },
  { id: 'intelligence', labelKey: 'nav.tab.intelligence.full', shortLabelKey: 'nav.tab.intelligence.short', icon: BrainCircuit, key: '5' },
  { id: 'analytics', labelKey: 'nav.tab.analytics.full', shortLabelKey: 'nav.tab.analytics.short', icon: BarChart3, key: '6' },
  { id: 'compliance', labelKey: 'nav.tab.compliance.full', shortLabelKey: 'nav.tab.compliance.short', icon: ShieldCheck, key: '7' },
  { id: 'system', labelKey: 'nav.tab.system.full', shortLabelKey: 'nav.tab.system.short', icon: Cpu, key: '8' },
]

export function TabNav() {
  const activeTab = useUIStore((s) => s.activeTab)
  const setActiveTab = useUIStore((s) => s.setActiveTab)
  const currentRole = useUIStore((s) => s.currentRole)
  const t = useT()
  const language = useLanguage()
  const frozenCount = useDashboardStore((s) => s.frozenCount)
  const pendingAlerts = useDashboardStore((s) => s.pendingAlerts)
  const { data: intelStatus } = useIntelTuningStatus()
  const { data: escalations } = useEscalations()
  const { data: countermeasures } = useCountermeasureProposals()

  // Preserve direct keyboard navigation without rendering shortcut hints.
  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (e.altKey && !e.ctrlKey && !e.metaKey) {
        const tab = TABS.find((t) => t.key === e.key)
        if (tab) {
          e.preventDefault()
          setActiveTab(tab.id)
        }
      }
    },
    [setActiveTab],
  )

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [handleKeyDown])

  // Badge counts per tab
  const badgeCounts: Partial<Record<TabId, number>> = {}
  const pendingEscalations = (escalations ?? []).filter((item) => item.status === 'pending_review').length
  const pendingCountermeasures = (countermeasures?.proposals ?? []).filter((item) => item.status === 'proposed').length
  if (frozenCount > 0 || pendingAlerts > 0) badgeCounts['overview'] = frozenCount + pendingAlerts
  if (pendingEscalations > 0) badgeCounts['investigations'] = pendingEscalations
  if (pendingCountermeasures > 0) badgeCounts['threat-sim'] = pendingCountermeasures
  if ((intelStatus?.active_playbooks ?? 0) > 0) badgeCounts['pre-fraud-intel'] = intelStatus?.active_playbooks ?? 0

  return (
    <nav className="flex shrink-0 items-center overflow-x-auto border-b border-border-default bg-bg-surface px-2 py-1.5 shadow-sm">
      {TABS.map((tab) => {
        const Icon = tab.icon
        const allowed = canAccessTab(currentRole, tab.id)
        const policy = translateRole(rolePolicy(currentRole), language)
        const label = t(tab.labelKey)
        const shortLabel = t(tab.shortLabelKey)
        const isActive = activeTab === tab.id
        const badge = badgeCounts[tab.id]
        return (
          <button
            key={tab.id}
            onClick={() => allowed && setActiveTab(tab.id)}
            disabled={!allowed}
            aria-label={allowed ? label : `${label} restricted for ${policy.label}`}
            aria-disabled={!allowed}
            aria-current={isActive ? 'page' : undefined}
            title={allowed ? label : `${policy.label} cannot access ${label}`}
            className={cn(
              'group relative flex shrink-0 items-center gap-2 px-3 py-2.5 text-[10px] font-bold uppercase tracking-[0.1em] transition-all duration-150',
              'relative rounded-full border',
              !allowed
                ? 'cursor-not-allowed border-transparent text-text-muted/35 opacity-60'
                : isActive
                ? 'border-accent-primary bg-accent-primary text-white shadow-sm'
                : 'border-transparent text-text-muted hover:border-border-subtle hover:bg-bg-elevated/70 hover:text-accent-primary',
            )}
          >
            <Icon className={cn(
              'w-3.5 h-3.5 transition-colors',
              isActive ? 'text-white' : 'text-text-muted group-hover:text-accent-primary',
            )} />
            <span className="hidden 2xl:inline">{label}</span>
            <span className="2xl:hidden">{shortLabel}</span>
            {!allowed && <LockKeyhole className="h-3 w-3 text-text-muted/45" />}
            {/* Alert badge */}
            {badge != null && badge > 0 && (
              <span className="flex h-[14px] min-w-[14px] items-center justify-center rounded-full bg-alert-critical px-1 font-mono text-[7px] font-bold text-white animate-data-pulse">
                {badge > 99 ? '99+' : badge}
              </span>
            )}
            {isActive && (
              <span className="absolute -bottom-1 left-1/2 h-0.5 w-8 -translate-x-1/2 rounded-full bg-alert-critical" />
            )}
          </button>
        )
      })}
    </nav>
  )
}
