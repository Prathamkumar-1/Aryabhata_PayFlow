import { useMemo, useState } from 'react'
import {
  ArrowRight,
  BadgeCheck,
  BellRing,
  Building2,
  CheckCircle2,
  ChevronRight,
  ClipboardCheck,
  FileCheck2,
  KeyRound,
  Landmark,
  LockKeyhole,
  Radio,
  Search,
  ShieldAlert,
  ShieldCheck,
  Wifi,
} from 'lucide-react'
import {
  OPERATIONAL_WORKFLOWS,
  ROLE_ORDER,
  ROLE_POLICIES,
  canAccessTab,
  defaultTabForRole,
  storeRole,
  type PayflowRole,
  type Permission,
} from '@/lib/rbac'
import { useI18n } from '@/hooks/use-i18n'
import { LANGUAGES } from '@/lib/i18n'
import type { UIStringKey } from '@/lib/translations'
import { cn } from '@/lib/utils'

const SERVICE_NAV: UIStringKey[] = [
  'landing.service.efrms',
  'landing.service.cyberCell',
  'landing.service.branch',
  'landing.service.fiu',
  'landing.service.cfr',
  'landing.service.digital',
  'landing.service.rbi',
  'landing.service.caseEvidence',
]

const ONLINE_SERVICES: { labelKey: UIStringKey; bodyKey: UIStringKey; role: PayflowRole }[] = [
  { labelKey: 'landing.online.socQueue.label', bodyKey: 'landing.online.socQueue.body', role: 'soc_analyst' },
  { labelKey: 'landing.online.cyberIr.label', bodyKey: 'landing.online.cyberIr.body', role: 'soc_l2_incident_responder' },
  { labelKey: 'landing.online.fundFlowCase.label', bodyKey: 'landing.online.fundFlowCase.body', role: 'fraud_analyst' },
  { labelKey: 'landing.online.paymentsDesk.label', bodyKey: 'landing.online.paymentsDesk.body', role: 'transaction_officer' },
  { labelKey: 'landing.online.efrmsRules.label', bodyKey: 'landing.online.efrmsRules.body', role: 'efrms_specialist' },
  { labelKey: 'landing.online.amlMule.label', bodyKey: 'landing.online.amlMule.body', role: 'aml_analyst' },
  { labelKey: 'landing.online.fiuPackage.label', bodyKey: 'landing.online.fiuPackage.body', role: 'compliance_officer' },
  { labelKey: 'landing.online.committeeGate.label', bodyKey: 'landing.online.committeeGate.body', role: 'fraud_committee' },
]

const ACTION_MATRIX: { labelKey: UIStringKey; permission: Permission; tab: string }[] = [
  { labelKey: 'landing.action.refreshIntel', permission: 'intel:write', tab: 'pre-fraud-intel' },
  { labelKey: 'landing.action.launchCase', permission: 'case:launch', tab: 'investigations' },
  { labelKey: 'landing.action.paymentHold', permission: 'alert:hold', tab: 'investigations' },
  { labelKey: 'landing.action.cardHotlist', permission: 'card:hotlist', tab: 'investigations' },
  { labelKey: 'landing.action.approveFreeze', permission: 'countermeasure:decide', tab: 'threat-sim' },
  { labelKey: 'landing.action.socIsolation', permission: 'soc:isolate', tab: 'system' },
  { labelKey: 'landing.action.amlDraft', permission: 'aml:str:draft', tab: 'compliance' },
  { labelKey: 'landing.action.fiuFiling', permission: 'regulatory:file', tab: 'compliance' },
  { labelKey: 'landing.action.toggleRule', permission: 'rules:toggle', tab: 'compliance' },
  { labelKey: 'landing.action.auditReview', permission: 'audit:review', tab: 'compliance' },
]

const STAGE_TILES: { num: string; titleKey: UIStringKey; bodyKey: UIStringKey }[] = [
  { num: '01', titleKey: 'landing.stage.efrms.title', bodyKey: 'landing.stage.efrms.body' },
  { num: '02', titleKey: 'landing.stage.frm.title', bodyKey: 'landing.stage.frm.body' },
  { num: '03', titleKey: 'landing.stage.aml.title', bodyKey: 'landing.stage.aml.body' },
  { num: '04', titleKey: 'landing.stage.audit.title', bodyKey: 'landing.stage.audit.body' },
]

function openApp(role: PayflowRole, tab = 'pre-fraud-intel') {
  storeRole(role)
  const landingTab = canAccessTab(role, tab) ? tab : defaultTabForRole(role)
  window.location.href = `/app?tab=${landingTab}`
}

function roleCan(role: PayflowRole, permission: Permission) {
  return ROLE_POLICIES[role].permissions.includes(permission)
}

export function LandingPage() {
  const [selectedRole, setSelectedRole] = useState<PayflowRole>('fraud_analyst')
  const { language, setLanguage, t, tr, tw } = useI18n()
  const selectedPolicy = tr(ROLE_POLICIES[selectedRole])
  const roleRows = useMemo(
    () => ROLE_ORDER.map((role) => tr(ROLE_POLICIES[role])),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [language],
  )
  const workflows = useMemo(
    () => OPERATIONAL_WORKFLOWS.map((wf) => tw(wf)),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [language],
  )
  const allowedActions = ACTION_MATRIX.filter((item) => roleCan(selectedRole, item.permission)).length

  return (
    <main className="h-screen overflow-y-auto bg-[#003f73] text-[#111827]">
      <div className="h-1.5 bg-[#4b2a1f]" />

      <div className="border-b border-[#d9e2ef] bg-[#f8fbff] text-[12px] font-semibold text-[#24364f]">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-3 px-5 py-2">
          <div className="flex flex-wrap items-center gap-4">
            <a className="font-bold text-[#00579C]" href="#main-content">{t('landing.skipToMain')}</a>
            <span className="h-4 w-px bg-[#d9e2ef]" />
            <span>{t('landing.screenReader')}</span>
            <span>A-</span>
            <span>A</span>
            <span>A+</span>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <span>{t('landing.contactUs')}</span>
            <a className="rounded-full bg-[#00579C] px-4 py-1.5 font-extrabold text-white" href="/app">
              {t('landing.portal')}
            </a>
            <a className="font-bold text-[#00579C]" href="/api/v1/rbac/roles">{t('landing.rbacApi')}</a>
            <div className="flex items-center gap-1 rounded-full border border-[#d9e2ef] bg-white p-0.5">
              {LANGUAGES.map((lang) => (
                <button
                  key={lang.id}
                  type="button"
                  onClick={() => setLanguage(lang.id)}
                  aria-pressed={language === lang.id}
                  className={cn(
                    'rounded-full px-2.5 py-1 text-[11px] font-bold transition-colors',
                    language === lang.id
                      ? 'bg-[#00579C] text-white'
                      : 'text-[#00579C] hover:bg-[#dff2ff]',
                  )}
                >
                  {lang.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      <header className="bg-white shadow-[0_2px_14px_rgba(20,33,61,0.14)]">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-5 px-5 py-4">
          <div className="flex min-w-0 items-center gap-4">
            <span className="ubi-brand-mark h-14 w-14 rounded-xl" />
            <div>
              <div className="text-3xl font-extrabold leading-none text-[#DA251C]">
                Union Bank <span className="text-[#00579C]">of India</span>
              </div>
              <div className="mt-1 text-[12px] font-bold uppercase tracking-[0.2em] text-[#617189]">
                {t('landing.govtUndertaking')}
              </div>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <button className="inline-flex h-10 items-center gap-2 rounded-full border border-[#d7e3f1] bg-[#f4f8fc] px-4 text-[12px] font-bold text-[#24364f]">
              <Search className="h-4 w-4 text-[#00579C]" />
              {t('landing.searchPlaceholder')}
            </button>
            <button
              type="button"
              onClick={() => openApp(selectedRole)}
              className="inline-flex h-11 items-center gap-2 rounded-md bg-[#00579C] px-5 text-[12px] font-extrabold uppercase tracking-[0.13em] text-white shadow-[0_8px_18px_rgba(0,87,156,0.26)] transition-colors hover:bg-[#00477f]"
            >
              {t('landing.loginCta')}
              <ArrowRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      </header>

      <nav className="bg-[#00579C] text-white shadow-[0_8px_20px_rgba(0,87,156,0.18)]">
        <div className="mx-auto flex max-w-7xl items-center gap-1 overflow-x-auto px-5">
          {SERVICE_NAV.map((key) => (
            <button
              key={key}
              type="button"
              className="shrink-0 border-r border-white/15 px-4 py-3 text-[12px] font-extrabold uppercase tracking-[0.08em] hover:bg-white/12"
            >
              {t(key)}
            </button>
          ))}
        </div>
      </nav>

      <section id="main-content" className="relative overflow-hidden bg-[#00579C]">
        <div className="absolute inset-y-0 right-0 hidden w-[38%] bg-[#003f75] xl:block" />
        <div className="absolute inset-y-0 left-[24%] hidden w-32 skew-x-[-14deg] bg-[#DA251C] xl:block" />
        <div className="absolute inset-x-0 top-0 h-px bg-white/35" />
        <div className="absolute inset-x-0 bottom-0 h-2 bg-[#DA251C]" />
        <div className="relative mx-auto grid max-w-7xl gap-0 px-5 py-10 xl:min-h-[calc(100vh-190px)] xl:grid-cols-[310px_minmax(0,1fr)_380px]">
          <aside className="border border-white/20 bg-white shadow-[0_16px_36px_rgba(0,23,52,0.22)]">
            <div className="bg-[#DA251C] px-4 py-3 text-[12px] font-extrabold uppercase tracking-[0.14em] text-white">
              {t('landing.onlineServices')}
            </div>
            {ONLINE_SERVICES.map((item) => (
              <button
                key={item.labelKey}
                type="button"
                onClick={() => setSelectedRole(item.role)}
                className={cn(
                  'flex w-full items-start gap-3 border-b border-[#d7e3f1] px-4 py-4 text-left transition-colors',
                  selectedRole === item.role ? 'bg-white text-[#00579C]' : 'bg-[#f4f8fc] text-[#24364f] hover:bg-white',
                )}
              >
                <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0 text-[#00579C]" />
                <span>
                  <span className="block text-[13px] font-extrabold">{t(item.labelKey)}</span>
                  <span className="mt-1 block text-[11px] leading-5 text-[#617189]">{t(item.bodyKey)}</span>
                </span>
              </button>
            ))}
            <button
              type="button"
              onClick={() => openApp(selectedRole)}
              className="m-4 inline-flex h-10 w-[calc(100%-2rem)] items-center justify-center gap-2 rounded-md bg-[#00579C] text-[11px] font-extrabold uppercase tracking-[0.12em] text-white"
            >
              {t('landing.openService')}
              <ChevronRight className="h-4 w-4" />
            </button>
          </aside>

          <div className="min-w-0 bg-[#004b86] px-7 py-8 text-white xl:min-h-[500px]">
            <div className="mb-4 inline-flex items-center gap-2 rounded-sm bg-white px-3 py-1.5 text-[11px] font-extrabold uppercase tracking-[0.16em] text-[#DA251C]">
              <Landmark className="h-4 w-4" />
              {t('landing.commandPortal')}
            </div>
            <h1 className="max-w-3xl text-5xl font-black leading-[1.04] tracking-normal text-white">
              {t('landing.heroHeadline')}
            </h1>
            <p className="mt-4 max-w-2xl text-[15px] leading-7 text-white/86">
              {t('landing.heroSubtitle')}
            </p>

            <div className="mt-6 grid gap-3 sm:grid-cols-4">
              {STAGE_TILES.map((tile) => (
                <div key={tile.titleKey} className="border border-white/18 bg-white/10 p-3 shadow-sm">
                  <div className="font-mono text-[11px] font-extrabold text-white">{tile.num}</div>
                  <div className="mt-1 text-[11px] font-extrabold uppercase tracking-[0.1em] text-white">{t(tile.titleKey)}</div>
                  <div className="mt-1 text-[10px] leading-4 text-white/72">{t(tile.bodyKey)}</div>
                </div>
              ))}
            </div>

            <div className="mt-6 grid gap-2 border border-white/18 bg-white/10 p-3 lg:grid-cols-3">
              <HeroControl label={t('landing.control.roleHeader')} value={`X-Payflow-Role: ${selectedRole}`} />
              <HeroControl label={t('landing.control.tabs')} value={`${selectedPolicy.tabs.length}/8`} />
              <HeroControl label={t('landing.control.actions')} value={`${allowedActions}/${ACTION_MATRIX.length}`} />
            </div>

            <div className="mt-6 flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => openApp(selectedRole, 'overview')}
                className="inline-flex h-11 items-center gap-2 rounded-md border-2 border-white bg-white px-4 text-[12px] font-extrabold uppercase tracking-[0.12em] text-[#00579C]"
              >
                <Building2 className="h-4 w-4" />
                {t('landing.openOverview')}
              </button>
              <button
                type="button"
                onClick={() => openApp(selectedRole, 'threat-sim')}
                className="inline-flex h-11 items-center gap-2 rounded-md bg-[#DA251C] px-4 text-[12px] font-extrabold uppercase tracking-[0.12em] text-white shadow-[0_10px_22px_rgba(117,16,10,0.3)]"
              >
                <ShieldAlert className="h-4 w-4" />
                {t('landing.testRbac')}
              </button>
            </div>
          </div>

          <aside className="bg-[#003f75] p-5 text-white shadow-[0_16px_36px_rgba(0,23,52,0.22)]">
            <div className="mb-4 flex items-center justify-between gap-3 border-b border-white/20 pb-3">
              <div>
                <div className="text-[11px] font-extrabold uppercase tracking-[0.18em] text-white/75">{t('landing.selectedRole')}</div>
                <div className="mt-1 text-xl font-extrabold">{selectedPolicy.label}</div>
              </div>
              <KeyRound className="h-8 w-8 text-white/85" />
            </div>
            <div className="space-y-3">
              <InfoMetric label={t('landing.infoMetric.domain')} value={selectedPolicy.domain} />
              <InfoMetric label={t('landing.infoMetric.tabs')} value={`${selectedPolicy.tabs.length}/8`} />
              <InfoMetric label={t('landing.infoMetric.actions')} value={`${allowedActions}/${ACTION_MATRIX.length}`} />
              <InfoMetric label={t('landing.infoMetric.shift')} value={selectedPolicy.shift} />
              <InfoMetric label={t('landing.infoMetric.reportsTo')} value={selectedPolicy.reportingLine} />
            </div>
            <p className="mt-4 text-[12px] leading-6 text-white/82">{selectedPolicy.escalationScope}</p>
            <div className="mt-4 border border-white/18 bg-white/10 p-3">
              <div className="text-[9px] font-extrabold uppercase tracking-[0.16em] text-white/65">{t('landing.toolStack')}</div>
              <div className="mt-2 flex flex-wrap gap-1.5">
                {selectedPolicy.toolStack.slice(0, 5).map((tool) => (
                  <span key={tool} className="rounded-sm bg-white px-2 py-1 text-[9px] font-bold uppercase tracking-[0.08em] text-[#00579C]">
                    {tool}
                  </span>
                ))}
              </div>
            </div>
            <div className="mt-4 grid grid-cols-2 gap-2">
              {ACTION_MATRIX.map((item) => {
                const allowed = roleCan(selectedRole, item.permission)
                return (
                  <button
                    key={item.labelKey}
                    type="button"
                    onClick={() => allowed && openApp(selectedRole, item.tab)}
                    disabled={!allowed}
                    className={cn(
                      'flex min-h-14 items-center gap-2 rounded-md border px-2 text-left text-[10px] font-extrabold uppercase tracking-[0.08em]',
                      allowed
                        ? 'border-white/30 bg-white text-[#00579C]'
                        : 'border-white/15 bg-white/8 text-white/45',
                    )}
                  >
                    {allowed ? <CheckCircle2 className="h-4 w-4 shrink-0 text-[#00579C]" /> : <LockKeyhole className="h-4 w-4 shrink-0" />}
                    {t(item.labelKey)}
                  </button>
                )
              })}
            </div>
          </aside>
        </div>
      </section>

      <section className="border-y border-[#d7e3f1] bg-[#f4f8fc]">
        <div className="mx-auto grid max-w-7xl gap-4 px-5 py-5 lg:grid-cols-[1fr_1fr_1fr_1fr]">
          <PortalBlock icon={Wifi} title={t('landing.portal.digital.title')} value={t('landing.portal.digital.value')} />
          <PortalBlock icon={BellRing} title={t('landing.portal.efrms.title')} value={t('landing.portal.efrms.value')} />
          <PortalBlock icon={FileCheck2} title={t('landing.portal.rbi.title')} value={t('landing.portal.rbi.value')} />
          <PortalBlock icon={Radio} title={t('landing.portal.backend.title')} value={t('landing.portal.backend.value')} />
        </div>
      </section>

      <section className="border-b border-[#d7e3f1] bg-white">
        <div className="mx-auto max-w-7xl px-5 py-7">
          <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
            <div>
              <div className="inline-flex items-center gap-2 bg-[#DA251C] px-3 py-1.5 text-[10px] font-extrabold uppercase tracking-[0.16em] text-white">
                <ClipboardCheck className="h-4 w-4" />
                {t('landing.authority.badge')}
              </div>
              <h2 className="mt-3 text-2xl font-black text-[#111827]">{t('landing.authority.heading')}</h2>
            </div>
            <div className="rounded-md bg-[#00579C] px-4 py-2 text-[11px] font-extrabold uppercase tracking-[0.13em] text-white">
              {ROLE_ORDER.length} {t('landing.authority.rolesWired')}
            </div>
          </div>

          <div className="grid gap-4 lg:grid-cols-2">
            {workflows.map((workflow) => (
              <article key={workflow.id} className="border border-[#d7e3f1] bg-[#f7fbff] shadow-sm">
                <div className="border-b border-[#d7e3f1] bg-white px-4 py-3">
                  <div className="text-[15px] font-black text-[#111827]">{workflow.title}</div>
                  <div className="mt-1 text-[11px] leading-5 text-[#4b5d76]">{workflow.trigger}</div>
                </div>
                <div className="divide-y divide-[#d7e3f1]">
                  {workflow.stages.map((stage, index) => {
                    const owner = tr(ROLE_POLICIES[stage.owner])
                    const active = stage.owner === selectedRole
                    return (
                      <button
                        key={`${workflow.id}-${stage.owner}-${index}`}
                        type="button"
                        onClick={() => setSelectedRole(stage.owner)}
                        className={cn(
                          'grid w-full gap-3 px-4 py-3 text-left sm:grid-cols-[124px_minmax(0,1fr)]',
                          active ? 'bg-[#00579C] text-white' : 'bg-[#f7fbff] text-[#24364f] hover:bg-white',
                        )}
                      >
                        <span
                          className={cn(
                            'inline-flex h-8 items-center justify-center rounded-sm px-2 text-[9px] font-extrabold uppercase tracking-[0.08em]',
                            active ? 'bg-white text-[#00579C]' : 'bg-[#00579C] text-white',
                          )}
                        >
                          {owner.label}
                        </span>
                        <span className={cn('text-[12px] font-semibold leading-5', active ? 'text-white' : 'text-[#4b5d76]')}>
                          {stage.action}
                        </span>
                      </button>
                    )
                  })}
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-5 py-7">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-2xl font-black text-[#111827]">{t('landing.rolePicker.heading')}</h2>
            <p className="mt-1 text-[13px] text-[#4b5d76]">
              {t('landing.rolePicker.body')}
            </p>
          </div>
          <div className="inline-flex items-center gap-2 rounded-md bg-[#00579C] px-4 py-2 text-[11px] font-extrabold uppercase tracking-[0.12em] text-white">
            <Radio className="h-4 w-4" />
            {t('landing.rolePicker.liveConsole')}
          </div>
        </div>

        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          {roleRows.map((policy) => {
            const active = policy.role === selectedRole
            const allowed = ACTION_MATRIX.filter((item) => roleCan(policy.role, item.permission)).length
            return (
              <article
                key={policy.role}
                className={cn(
                  'border bg-white shadow-[0_10px_24px_rgba(20,33,61,0.08)] transition-colors',
                  active ? 'border-[#00579C] ring-2 ring-[#00579C]/20' : 'border-[#d7e3f1]',
                )}
              >
                <button type="button" onClick={() => setSelectedRole(policy.role)} className="block w-full p-4 text-left">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="text-base font-black text-[#111827]">{policy.label}</div>
                      <div className="mt-1 text-[11px] font-extrabold uppercase tracking-[0.14em] text-[#00579C]">{policy.domain}</div>
                    </div>
                    {active ? <BadgeCheck className="h-5 w-5 text-[#00579C]" /> : <LockKeyhole className="h-4 w-4 text-[#617189]" />}
                  </div>
                  <p className="mt-3 min-h-12 text-[12px] leading-6 text-[#4b5d76]">{policy.summary}</p>
                  <div className="mt-3 border-l-4 border-[#DA251C] bg-[#f7fbff] px-3 py-2">
                    <div className="text-[8px] font-extrabold uppercase tracking-[0.14em] text-[#617189]">{t('landing.rolePicker.authority')}</div>
                    <div className="mt-1 line-clamp-2 text-[11px] font-semibold leading-5 text-[#24364f]">
                      {policy.decisionAuthority}
                    </div>
                  </div>
                  <div className="mt-3 grid grid-cols-3 gap-2">
                    <RoleStat label={t('landing.rolePicker.statTabs')} value={`${policy.tabs.length}/8`} />
                    <RoleStat label={t('landing.rolePicker.statActions')} value={`${allowed}/${ACTION_MATRIX.length}`} />
                    <RoleStat label={t('landing.rolePicker.statPerms')} value={String(policy.permissions.length)} />
                  </div>
                </button>
                <div className="flex border-t border-[#d7e3f1]">
                  <button
                    type="button"
                    onClick={() => setSelectedRole(policy.role)}
                    className="flex-1 px-3 py-3 text-[11px] font-extrabold uppercase tracking-[0.12em] text-[#00579C] hover:bg-[#dff2ff]"
                  >
                    {t('landing.rolePicker.previewAccess')}
                  </button>
                  <button
                    type="button"
                    onClick={() => openApp(policy.role)}
                    className="flex-1 bg-[#00579C] px-3 py-3 text-[11px] font-extrabold uppercase tracking-[0.12em] text-white hover:bg-[#00477f]"
                  >
                    {t('landing.rolePicker.launchAsRole')}
                  </button>
                </div>
              </article>
            )
          })}
        </div>
      </section>
    </main>
  )
}

function InfoMetric({ label, value }: { label: string; value: string }) {
  return (
    <div className="border border-white/18 bg-white/10 px-3 py-2">
      <div className="text-[9px] font-extrabold uppercase tracking-[0.15em] text-white/65">{label}</div>
      <div className="mt-1 truncate text-[13px] font-extrabold text-white" title={value}>{value}</div>
    </div>
  )
}

function HeroControl({ label, value }: { label: string; value: string }) {
  return (
    <div className="min-w-0 border-l-4 border-[#DA251C] bg-white px-3 py-2">
      <div className="text-[8px] font-extrabold uppercase tracking-[0.14em] text-[#617189]">{label}</div>
      <div className="mt-1 truncate font-mono text-[11px] font-black text-[#00579C]" title={value}>
        {value}
      </div>
    </div>
  )
}

function PortalBlock({ icon: Icon, title, value }: { icon: typeof Radio; title: string; value: string }) {
  return (
    <div className="flex items-center gap-3 border border-[#d7e3f1] bg-white p-4 shadow-sm">
      <div className="flex h-11 w-11 shrink-0 items-center justify-center bg-[#00579C] text-white">
        <Icon className="h-5 w-5" />
      </div>
      <div className="min-w-0">
        <div className="text-[11px] font-extrabold uppercase tracking-[0.12em] text-[#DA251C]">{title}</div>
        <div className="mt-1 truncate text-[12px] font-bold text-[#24364f]" title={value}>{value}</div>
      </div>
    </div>
  )
}

function RoleStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="bg-[#f4f8fc] px-2 py-2">
      <div className="text-[8px] font-extrabold uppercase tracking-[0.12em] text-[#617189]">{label}</div>
      <div className="mt-1 font-mono text-[12px] font-extrabold text-[#00579C]">{value}</div>
    </div>
  )
}
