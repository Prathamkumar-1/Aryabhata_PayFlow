// ============================================================================
// UI Store -- Active tab, sidebar, drawer state, connection status
// ============================================================================

import { create } from 'zustand'
import type { EvidencePackageResponse } from '@/lib/types'
import {
  canAccessTab,
  defaultTabForRole,
  getStoredRole,
  storeRole,
  type PayflowRole,
} from '@/lib/rbac'
import { getStoredLanguage, storeLanguage, type Language } from '@/lib/i18n'
import { getStoredTheme, storeTheme, type Theme } from '@/lib/theme'

export type TabId =
  | 'overview'
  | 'threat-sim'
  | 'investigations'
  | 'pre-fraud-intel'
  | 'intelligence'
  | 'analytics'
  | 'compliance'
  | 'system'

export const TAB_IDS: TabId[] = [
  'overview',
  'threat-sim',
  'investigations',
  'pre-fraud-intel',
  'intelligence',
  'analytics',
  'compliance',
  'system',
]

const initialRole = getStoredRole()
const initialLanguage = getStoredLanguage()
const initialTheme = getStoredTheme()

function getInitialActiveTab(): TabId {
  if (typeof window === 'undefined') return defaultTabForRole(initialRole) as TabId
  const tab = new URLSearchParams(window.location.search).get('tab') as TabId | null
  if (tab && TAB_IDS.includes(tab) && canAccessTab(initialRole, tab)) return tab
  return defaultTabForRole(initialRole) as TabId
}

interface UIState {
  activeTab: TabId
  currentRole: PayflowRole
  language: Language
  theme: Theme
  sidebarCollapsed: boolean
  expandedDrawers: Set<string>
  connected: boolean
  selectedNodeId: string | null
  selectedEventId: string | null
  activeCaseId: string | null
  latestEvidencePackage: EvidencePackageResponse | null

  // Actions
  setActiveTab: (tab: TabId) => void
  setCurrentRole: (role: PayflowRole) => void
  setLanguage: (language: Language) => void
  setTheme: (theme: Theme) => void
  toggleTheme: () => void
  toggleSidebar: () => void
  toggleDrawer: (id: string) => void
  setConnected: (connected: boolean) => void
  setSelectedNode: (nodeId: string | null) => void
  setSelectedEvent: (eventId: string | null) => void
  setActiveCaseId: (caseId: string | null) => void
  setLatestEvidencePackage: (pkg: EvidencePackageResponse | null) => void
}

export const useUIStore = create<UIState>((set) => ({
  activeTab: getInitialActiveTab(),
  currentRole: initialRole,
  language: initialLanguage,
  theme: initialTheme,
  sidebarCollapsed: false,
  expandedDrawers: new Set<string>(),
  connected: false,
  selectedNodeId: null,
  selectedEventId: null,
  activeCaseId: null,
  latestEvidencePackage: null,

  setActiveTab: (tab) =>
    set((state) => ({
      activeTab: (canAccessTab(state.currentRole, tab)
        ? tab
        : defaultTabForRole(state.currentRole)) as TabId,
    })),

  setCurrentRole: (role) =>
    set((state) => {
      storeRole(role)
      return {
        currentRole: role,
        activeTab: (canAccessTab(role, state.activeTab)
          ? state.activeTab
          : defaultTabForRole(role)) as TabId,
      }
    }),

  setLanguage: (language) =>
    set(() => {
      storeLanguage(language)
      return { language }
    }),

  setTheme: (theme) =>
    set(() => {
      storeTheme(theme)
      return { theme }
    }),

  toggleTheme: () =>
    set((state) => {
      const theme: Theme = state.theme === 'dark' ? 'light' : 'dark'
      storeTheme(theme)
      return { theme }
    }),

  toggleSidebar: () =>
    set((state) => ({ sidebarCollapsed: !state.sidebarCollapsed })),

  toggleDrawer: (id) =>
    set((state) => {
      const next = new Set(state.expandedDrawers)
      if (next.has(id)) {
        next.delete(id)
      } else {
        next.add(id)
      }
      return { expandedDrawers: next }
    }),

  setConnected: (connected) => set({ connected }),

  setSelectedNode: (nodeId) => set({ selectedNodeId: nodeId }),

  setSelectedEvent: (eventId) =>
    set((state) => {
      // Auto-open event inspector drawer when selecting an event
      const next = new Set(state.expandedDrawers)
      if (eventId) {
        next.add('event-inspector')
      } else {
        next.delete('event-inspector')
      }
      return { selectedEventId: eventId, expandedDrawers: next }
    }),

  setActiveCaseId: (caseId) =>
    set((state) => ({
      activeCaseId: caseId,
      latestEvidencePackage:
        state.latestEvidencePackage?.case_id === caseId
          ? state.latestEvidencePackage
          : null,
    })),

  setLatestEvidencePackage: (pkg) =>
    set((state) => ({
      latestEvidencePackage: pkg,
      activeCaseId: pkg?.case_id ?? state.activeCaseId,
    })),
}))
