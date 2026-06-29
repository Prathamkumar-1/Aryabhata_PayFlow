// ============================================================================
// use-i18n.ts -- React hook for the English/Hindi language layer
// ============================================================================
// Mirrors the use-rbac.ts pattern: read shared UI-store state and expose
// bound helpers. Components subscribe to `language` so they re-render when
// the user toggles language.
// ============================================================================

import { useMemo } from 'react'
import { useUIStore } from '@/stores/use-ui-store'
import { makeTranslator, translateRole, translateWorkflow, type Language, type TFunction } from '@/lib/i18n'
import type { OperationalWorkflow, RolePolicy } from '@/lib/rbac'
import type { UIStringKey } from '@/lib/translations'

export function useI18n() {
  const language = useUIStore((s) => s.language)
  const setLanguage = useUIStore((s) => s.setLanguage)
  const t = useMemo(() => makeTranslator(language), [language])

  return {
    language,
    setLanguage,
    t,
    /** Translate a RolePolicy for the active language (no-op for English). */
    tr: (policy: RolePolicy) => translateRole(policy, language),
    /** Translate an OperationalWorkflow for the active language. */
    tw: (workflow: OperationalWorkflow) => translateWorkflow(workflow, language),
  }
}

/** Convenience selector returning only the bound translator. */
export function useT(): TFunction {
  const language = useUIStore((s) => s.language)
  return useMemo(() => makeTranslator(language), [language])
}

/** Convenience selector returning the active language code. */
export function useLanguage(): Language {
  return useUIStore((s) => s.language)
}

export type { UIStringKey }
