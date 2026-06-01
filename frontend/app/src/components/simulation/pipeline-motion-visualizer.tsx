// ============================================================================
// Pipeline Motion Visualizer — Animated real-time processing pipeline flow
// Shows events flowing through: Ingestion → ML → Graph → Circuit Breaker → AI → Verdict
// Driven entirely by real SSE events from backend.
// ============================================================================

import { useMemo, useState, useEffect, useRef } from 'react'
import { useActivityStore, type EventLifecycle, type PipelineStage } from '@/stores/use-activity-store'
import { cn, fmtOptionalTimestamp } from '@/lib/utils'
import {
  ArrowRight,
  Database,
  BrainCircuit,
  Network,
  ShieldCheck,
  Bot,
  Scale,
  Sparkles,
  ChevronDown,
  ChevronUp,
  Radio,
  Zap,
  Clock,
  Activity,
  X,
} from 'lucide-react'

// ── Stage Constants ──────────────────────────────────────────────────────────

interface StageConfig {
  key: PipelineStage
  label: string
  shortLabel: string
  icon: typeof Database
  description: string
  color: string       // oklch color for active state
  glowColor: string   // glow shadow color
}

function isFallbackLifecycle(lifecycle: EventLifecycle): boolean {
  return (
    lifecycle.confidenceSource === 'deterministic_evidence_fallback' ||
    lifecycle.llmParseStatus?.includes('fallback') ||
    (lifecycle.confidence === 0.5 &&
      (lifecycle.evidenceCited?.length ?? 0) === 0 &&
      Boolean(lifecycle.reasoningSummary?.includes('Unable to reach definitive conclusion')))
  )
}

const PIPELINE_STAGES: StageConfig[] = [
  {
    key: 'ingested',
    label: 'Event Ingestion',
    shortLabel: 'IN',
    icon: Database,
    description: 'Schema validation + CRC32 checksum verification',
    color: '#00579C',
    glowColor: 'rgba(0, 87, 156, 0.35)',
  },
  {
    key: 'ml_scored',
    label: 'ML Feature Engine',
    shortLabel: 'ML',
    icon: BrainCircuit,
    description: 'Backend feature vector + Union Bank domain sidecar + XGBoost fraud scoring',
    color: '#003f75',
    glowColor: 'rgba(0, 63, 117, 0.35)',
  },
  {
    key: 'graph_investigated',
    label: 'Graph Analysis',
    shortLabel: 'GR',
    icon: Network,
    description: 'NetworkX pattern scan — mule detection, cycle detection, centrality',
    color: '#2f79b5',
    glowColor: 'rgba(47, 121, 181, 0.35)',
  },
  {
    key: 'cb_evaluated',
    label: 'Circuit Breaker',
    shortLabel: 'CB',
    icon: ShieldCheck,
    description: 'Available-model consensus — ML + graph evidence, plus GNN only when backend-loaded',
    color: '#f5b400',
    glowColor: 'rgba(245, 180, 0, 0.35)',
  },
  {
    key: 'llm_started',
    label: 'LLM Agent',
    shortLabel: 'AI',
    icon: Bot,
    description: 'Bounded LangGraph forensic explanation; runtime model comes from backend LLM status',
    color: '#DA251C',
    glowColor: 'rgba(218, 37, 28, 0.35)',
  },
  {
    key: 'verdict',
    label: 'Final Verdict',
    shortLabel: 'VD',
    icon: Scale,
    description: 'Classification verdict + HITL escalation decision + blockchain anchor',
    color: '#B51A13',
    glowColor: 'rgba(181, 26, 19, 0.35)',
  },
]

const PIPELINE_STAGE_KEYS = new Set<PipelineStage>(PIPELINE_STAGES.map((stage) => stage.key))

function countRecognizedStages(lifecycle: EventLifecycle | undefined): number {
  if (!lifecycle) return 0
  const reached = new Set<PipelineStage>()
  lifecycle.stages.forEach((detail) => {
    if (PIPELINE_STAGE_KEYS.has(detail.stage)) reached.add(detail.stage)
  })
  return reached.size
}

// ── Helper: compute stage status ──────────────────────────────────────────────

type StageStatus = 'idle' | 'active' | 'complete' | 'error'

function hasScore(score: number | null | undefined): score is number {
  return typeof score === 'number' && Number.isFinite(score) && score >= 0
}

function hasBackendTimestamp(timestamp: number | null | undefined): timestamp is number {
  return typeof timestamp === 'number' && Number.isFinite(timestamp) && timestamp > 0
}

function formatDurationMs(ms: number): string {
  return ms < 1000 ? `${ms.toFixed(0)}ms` : `${(ms / 1000).toFixed(1)}s`
}

function getStageStatuses(lifecycle: EventLifecycle | undefined): Map<PipelineStage, StageStatus> {
  const map = new Map<PipelineStage, StageStatus>()
  const completedStages = new Set(lifecycle?.stages.map((s) => s.stage) ?? [])

  let lastCompleteIdx = -1
  for (let i = PIPELINE_STAGES.length - 1; i >= 0; i--) {
    if (completedStages.has(PIPELINE_STAGES[i].key)) {
      lastCompleteIdx = i
      break
    }
  }

  for (let i = 0; i < PIPELINE_STAGES.length; i++) {
    const stage = PIPELINE_STAGES[i]
    if (completedStages.has(stage.key)) {
      map.set(stage.key, 'complete')
    } else if (i === lastCompleteIdx + 1 && lifecycle) {
      map.set(stage.key, 'active')
    } else {
      map.set(stage.key, 'idle')
    }
  }
  return map
}

function getStageDuration(lifecycle: EventLifecycle | undefined, stageKey: PipelineStage): string | null {
  if (!lifecycle) return null
  const detail = lifecycle.stages.find((s) => s.stage === stageKey)
  if (!detail) return null
  if (typeof detail.durationMs === 'number' && Number.isFinite(detail.durationMs) && detail.durationMs >= 0) {
    return formatDurationMs(detail.durationMs)
  }

  if (!detail.durationMs) {
    // Calculate from stage timestamps
    const idx = lifecycle.stages.findIndex((s) => s.stage === stageKey)
    if (idx > 0) {
      const current = lifecycle.stages[idx].timestamp
      const previous = lifecycle.stages[idx - 1].timestamp
      if (!hasBackendTimestamp(current) || !hasBackendTimestamp(previous)) return null
      const delta = current - previous
      if (delta < 0) return null
      if (delta < 1) return `${(delta * 1000).toFixed(0)}ms`
      return `${delta.toFixed(1)}s`
    }
    return null
  }
  return null
}

// ── Flowing Particles (CSS-driven animated dots along connectors) ─────────

function FlowingParticles({ active }: { active: boolean }) {
  if (!active) return null
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {[0, 1, 2].map((i) => (
        <div
          key={i}
          className="absolute top-1/2 -translate-y-1/2 w-1.5 h-1.5 rounded-full bg-accent-primary"
          style={{
            animation: `pipeline-flow 1.5s ease-in-out infinite`,
            animationDelay: `${i * 0.5}s`,
            filter: 'blur(0.5px)',
            boxShadow: '0 0 6px 2px rgba(0,87,156,0.35)',
          }}
        />
      ))}
    </div>
  )
}

// ── Stage Node (individual pipeline stage card) ────────────────────────────

function StageNode({
  config,
  status,
  duration,
  isLast,
  onClick,
  selected,
}: {
  config: StageConfig
  status: StageStatus
  duration: string | null
  isLast: boolean
  onClick?: () => void
  selected?: boolean
}) {
  const Icon = config.icon

  return (
    <div className="flex items-center flex-1 min-w-0">
      {/* Stage card */}
      <button
        onClick={onClick}
        className={cn(
          'relative flex flex-col items-center gap-1.5 px-3 py-3 rounded-lg border transition-all duration-500 w-full min-w-0 cursor-pointer group overflow-hidden',
          status === 'complete' && 'bg-gradient-to-b border-[#00579C]/30',
          status === 'active' && 'border-accent-primary/60',
          status === 'idle' && 'bg-bg-overlay/60 border-border-subtle/70',
          status === 'error' && 'bg-[#DA251C]/5 border-[#DA251C]/30',
          selected && 'ring-1 ring-accent-primary/50',
        )}
        style={
          status === 'complete'
            ? { background: `linear-gradient(to bottom, ${config.color}15, transparent)`, boxShadow: `0 0 12px ${config.glowColor}` }
            : status === 'active'
              ? { boxShadow: `0 0 20px ${config.glowColor}, 0 0 40px ${config.glowColor}` }
              : undefined
        }
      >
        {/* Active processing state */}
        {status === 'active' && (
          <>
            <div
              className="absolute inset-0 rounded-lg"
              style={{
                background: `linear-gradient(135deg, ${config.color}1F, rgba(255,255,255,0.84), ${config.color}14)`,
              }}
            />
            <div className="absolute inset-x-3 top-2 h-0.5 overflow-hidden rounded-full bg-[#00579C]/15">
              <div
                className="relative h-full w-1/2 rounded-full bg-[#00579C]"
                style={{
                  animation: 'pipeline-flow 1.4s ease-in-out infinite',
                  boxShadow: '0 0 8px rgba(0,87,156,0.55)',
                }}
              />
            </div>
            <div
              className="absolute right-3 top-3 h-2 w-2 rounded-full"
              style={{
                background: config.color,
                boxShadow: `0 0 12px ${config.glowColor}`,
                animation: 'pipeline-icon-pulse 1.5s ease-in-out infinite',
              }}
            />
          </>
        )}

        {/* Icon */}
        <div
          className={cn(
            'relative z-10 w-8 h-8 rounded-lg flex items-center justify-center transition-all duration-500',
            status === 'complete' && 'text-white',
            status === 'active' && 'text-white',
            status === 'idle' && 'bg-bg-deep/80 text-text-muted/70',
            status === 'error' && 'bg-[#DA251C]/20 text-[#DA251C]',
          )}
          style={
            status === 'complete'
              ? { background: config.color }
              : status === 'active'
                ? { background: `${config.color}BB`, animation: 'pipeline-icon-pulse 1.5s ease-in-out infinite' }
                : undefined
          }
        >
          <Icon className="w-4 h-4" />
        </div>

        {/* Label */}
        <span
          className={cn(
            'relative z-10 text-[9px] font-bold uppercase tracking-[0.1em] text-center leading-tight transition-colors duration-300',
            status === 'complete' && 'text-text-primary',
            status === 'active' && 'text-accent-primary',
            status === 'idle' && 'text-text-muted/70',
          )}
        >
          {config.label}
        </span>

        {/* Duration / status badge */}
        <div className="relative z-10 h-4 flex items-center">
          {status === 'complete' && duration && (
            <span
              className="text-[8px] font-mono tabular-nums font-bold px-1.5 py-0.5 rounded-full"
              style={{ color: config.color, background: `${config.color}15` }}
            >
              {duration}
            </span>
          )}
          {status === 'active' && (
            <div className="flex items-center gap-1">
              <div
                className="w-1.5 h-1.5 rounded-full"
                style={{ background: config.color, animation: 'pipeline-dot-pulse 1s ease-in-out infinite' }}
              />
              <span className="text-[7px] uppercase tracking-wider text-accent-primary/80 font-semibold">
                Processing
              </span>
            </div>
          )}
          {status === 'idle' && (
            <span className="text-[7px] text-text-muted/50 uppercase tracking-wider">Pending</span>
          )}
        </div>

        {/* Hover description */}
        <div className="absolute -bottom-8 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity z-30 pointer-events-none">
          <div className="px-2 py-1 rounded bg-bg-deep border border-border-default shadow-lg whitespace-nowrap">
            <span className="text-[7px] text-text-secondary">{config.description}</span>
          </div>
        </div>
      </button>

      {/* Connector arrow */}
      {!isLast && (
        <div className="relative w-8 h-px shrink-0 mx-0.5">
          <div
            className={cn(
              'absolute inset-y-0 left-0 right-0 transition-all duration-500',
              status === 'complete' ? 'bg-[#00579C]/50' : 'bg-border-subtle/50',
            )}
            style={status === 'complete' ? { boxShadow: `0 0 8px ${config.glowColor}` } : undefined}
          />
          <FlowingParticles active={status === 'active'} />
          <ArrowRight
            className={cn(
              'absolute -right-1.5 top-1/2 -translate-y-1/2 w-3 h-3 transition-colors duration-500',
              status === 'complete' ? 'text-[#00579C]' : 'text-border-subtle/70',
            )}
          />
        </div>
      )}
    </div>
  )
}

// ── Event Particle Trail (animated dots showing recent events flowing) ────

function EventParticleTrail({ events, orderedIds }: { events: Map<string, EventLifecycle>; orderedIds: string[] }) {
  const recentActive = useMemo(() => {
    const active: { id: string; stageIdx: number; fraud: boolean }[] = []
    for (const id of orderedIds.slice(0, 30)) {
      const lc = events.get(id)
      if (!lc) continue
      const completedStages = new Set(lc.stages.map((s) => s.stage))
      let lastIdx = -1
      for (let i = PIPELINE_STAGES.length - 1; i >= 0; i--) {
        if (completedStages.has(PIPELINE_STAGES[i].key)) { lastIdx = i; break }
      }
      if (lastIdx >= 0 && lastIdx < PIPELINE_STAGES.length - 1) {
        active.push({ id, stageIdx: lastIdx, fraud: lc.fraudLabel > 0 })
      }
    }
    return active.slice(0, 8)
  }, [events, orderedIds])

  if (recentActive.length === 0) return null

  return (
    <div className="absolute inset-0 pointer-events-none z-20">
      {recentActive.map((ev, i) => {
        const pct = ((ev.stageIdx + 0.5) / PIPELINE_STAGES.length) * 100
        return (
          <div
            key={ev.id}
            className="absolute top-0 bottom-0 flex items-center"
            style={{
              left: `${pct}%`,
              animation: `pipeline-particle-drift 3s ease-in-out infinite`,
              animationDelay: `${i * 0.4}s`,
            }}
          >
            <div
              className={cn(
                'w-2 h-2 rounded-full',
                ev.fraud ? 'bg-[#DA251C]' : 'bg-accent-primary',
              )}
              style={{
                boxShadow: ev.fraud
                  ? '0 0 8px 3px rgba(248, 113, 113, 0.5)'
                  : '0 0 8px 3px rgba(0,87,156,0.35)',
                animation: 'pipeline-dot-pulse 1.2s ease-in-out infinite',
              }}
            />
          </div>
        )
      })}
    </div>
  )
}

// ── Stage Detail Panel (expanded info for selected stage) ─────────────────

function StageDetailPanel({
  lifecycle,
  stageKey,
  onClose,
}: {
  lifecycle: EventLifecycle
  stageKey: PipelineStage
  onClose: () => void
}) {
  const stageConfig = PIPELINE_STAGES.find((s) => s.key === stageKey)
  const stageDetail = lifecycle.stages.find((s) => s.stage === stageKey)
  if (!stageConfig) return null
  const Icon = stageConfig.icon

  return (
    <div className="animate-fade-in bg-bg-overlay/80 border border-border-default rounded-lg p-3 mt-2 backdrop-blur-sm">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <div
            className="w-5 h-5 rounded flex items-center justify-center text-white shadow-sm"
            style={{ background: stageConfig.color }}
          >
            <Icon className="w-3 h-3" />
          </div>
          <span className="text-[10px] font-bold text-text-primary uppercase tracking-wider">
            {stageConfig.label}
          </span>
        </div>
        <button onClick={onClose} className="text-text-muted hover:text-text-primary">
          <X className="w-3.5 h-3.5" />
        </button>
      </div>

      <p className="text-[8px] text-text-secondary mb-2">{stageConfig.description}</p>

      {stageDetail && (
        <div className="space-y-1.5">
          <div className="flex items-center gap-2 text-[8px]">
            <Clock className="w-2.5 h-2.5 text-text-muted" />
            <span className="text-text-muted">Timestamp:</span>
            <span className="font-mono text-text-secondary">
              {fmtOptionalTimestamp(stageDetail.timestamp)}
            </span>
          </div>
          {typeof stageDetail.durationMs === 'number' && Number.isFinite(stageDetail.durationMs) && stageDetail.durationMs >= 0 && (
            <div className="flex items-center gap-2 text-[8px]">
              <Zap className="w-2.5 h-2.5 text-text-muted" />
              <span className="text-text-muted">Duration:</span>
              <span className="font-mono text-accent-primary font-bold">{formatDurationMs(stageDetail.durationMs)}</span>
            </div>
          )}
          {stageDetail.meta && Object.keys(stageDetail.meta).length > 0 && (
            <div className="mt-1 pt-1 border-t border-border-subtle/50 space-y-0.5">
              {Object.entries(stageDetail.meta).slice(0, 6).map(([k, v]) => (
                <div key={k} className="flex justify-between text-[7px]">
                  <span className="text-text-muted uppercase tracking-wider">{k.replace(/_/g, ' ')}</span>
                  <span className="font-mono text-text-secondary truncate max-w-[140px]">{String(v)}</span>
                </div>
              ))}
            </div>
          )}

          {/* Stage-specific enrichment */}
          {stageKey === 'ml_scored' && lifecycle.riskScore != null && (
            <div className="flex items-center gap-2 text-[8px] pt-1 border-t border-border-subtle/50">
              <Activity className="w-2.5 h-2.5 text-[#DA251C]" />
              <span className="text-text-muted">Risk Score:</span>
              <span className={cn(
                'font-mono font-bold',
                lifecycle.riskScore > 0.7 ? 'text-[#DA251C]' : lifecycle.riskScore > 0.4 ? 'text-[#7a5a00]' : 'text-[#00579C]',
              )}>
                {(lifecycle.riskScore * 100).toFixed(1)}%
              </span>
              {lifecycle.riskTier && (
                <span className="text-[7px] px-1 py-0.5 rounded bg-bg-deep text-text-muted uppercase">{lifecycle.riskTier}</span>
              )}
            </div>
          )}
          {stageKey === 'verdict' && lifecycle.verdict && (
            <div className="space-y-1 pt-1 border-t border-border-subtle/50">
              <div className="flex items-center gap-2 text-[8px]">
                <Scale className="w-2.5 h-2.5 text-accent-primary" />
                <span className="text-text-muted">Verdict:</span>
                <span className={cn(
                  'font-bold uppercase text-[8px]',
                  lifecycle.verdict === 'fraudulent' ? 'text-[#DA251C]' : lifecycle.verdict === 'suspicious' ? 'text-[#7a5a00]' : 'text-[#00579C]',
                )}>
                  {lifecycle.verdict}
                </span>
                {lifecycle.confidence != null && (
                  <span className="font-mono text-text-secondary">
                    ({isFallbackLifecycle(lifecycle) ? 'n/a' : `${(lifecycle.confidence * 100).toFixed(0)}%`})
                  </span>
                )}
              </div>
              {lifecycle.fraudTypology && (
                <div className="text-[7px] text-text-muted">
                  Typology: <span className="text-text-secondary">{lifecycle.fraudTypology}</span>
                </div>
              )}
            </div>
          )}
          {stageKey === 'cb_evaluated' && lifecycle.consensusScores && (
            <div className="flex flex-wrap gap-3 pt-1 border-t border-border-subtle/50">
              {([
                ['ml', 'ML'],
                ['gnn', 'GNN'],
                ['graph', 'Graph'],
              ] as const).map(([model, label]) => {
                const score = lifecycle.consensusScores?.[model]
                return (
                  <div key={model} className="text-[7px]">
                    <span className="text-text-muted uppercase">{label}:</span>{' '}
                    <span className={cn(
                      'font-mono font-bold',
                      !hasScore(score) ? 'text-text-muted' : score > 0.7 ? 'text-[#DA251C]' : score > 0.4 ? 'text-[#7a5a00]' : 'text-[#00579C]',
                    )}>
                      {hasScore(score) ? `${(score * 100).toFixed(0)}%` : 'N/A'}
                    </span>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      )}
      {!stageDetail && (
        <div className="text-[8px] text-text-muted/50 italic">Stage has not been reached yet</div>
      )}
    </div>
  )
}

// ── Global Pipeline Stats Bar ─────────────────────────────────────────────

function PipelineGlobalStats({ events, orderedIds }: { events: Map<string, EventLifecycle>; orderedIds: string[] }) {
  const stats = useMemo(() => {
    let processing = 0
    let completed = 0
    let fraudulent = 0

    for (const id of orderedIds.slice(0, 50)) {
      const lc = events.get(id)
      if (!lc) continue
      const stages = new Set(lc.stages.map((s) => s.stage))
      if (stages.has('verdict')) {
        completed++
        if (lc.verdict === 'fraudulent') fraudulent++
      } else if (stages.size > 0) {
        processing++
      }
    }

    return { processing, completed, fraudulent, total: orderedIds.length }
  }, [events, orderedIds])

  return (
    <div className="flex items-center gap-4 text-[8px]">
      <div className="flex items-center gap-1">
        <div className="w-1.5 h-1.5 rounded-full bg-accent-primary animate-pulse" />
        <span className="text-text-muted">In Pipeline:</span>
        <span className="font-mono font-bold text-accent-primary">{stats.processing}</span>
      </div>
      <div className="flex items-center gap-1">
        <div className="w-1.5 h-1.5 rounded-full bg-[#00579C]" />
        <span className="text-text-muted">Completed:</span>
        <span className="font-mono font-bold text-[#00579C]">{stats.completed}</span>
      </div>
      <div className="flex items-center gap-1">
        <div className="w-1.5 h-1.5 rounded-full bg-[#DA251C]" />
        <span className="text-text-muted">Flagged:</span>
        <span className="font-mono font-bold text-[#DA251C]">{stats.fraudulent}</span>
      </div>
      <div className="flex items-center gap-1 ml-auto">
        <span className="text-text-muted">Total tracked:</span>
        <span className="font-mono text-text-secondary">{stats.total}</span>
      </div>
    </div>
  )
}

// ── Event Selector (choose which event to track) ──────────────────────────

function EventSelector({
  events,
  orderedIds,
  selectedId,
  onSelect,
}: {
  events: Map<string, EventLifecycle>
  orderedIds: string[]
  selectedId: string | null
  onSelect: (id: string | null) => void
}) {
  const recentEvents = useMemo(() => {
    return orderedIds.slice(0, 12).map((id) => {
      const lc = events.get(id)!
      const stagesCompleted = countRecognizedStages(lc)
      const totalStages = PIPELINE_STAGES.length
      return { id, lifecycle: lc, stagesCompleted, totalStages }
    }).filter((e) => e.lifecycle)
  }, [events, orderedIds])

  if (recentEvents.length === 0) {
    return (
      <div className="text-[9px] text-text-muted/50 italic py-2 text-center">
        No events in pipeline yet — inject a custom event or launch an attack
      </div>
    )
  }

  return (
    <div className="space-y-0.5 max-h-40 overflow-y-auto pr-1">
      {recentEvents.map((ev) => {
        const isSelected = ev.id === selectedId
        const hasVerdict = ev.lifecycle.stages.some((s) => s.stage === 'verdict')
        const progressPct = (ev.stagesCompleted / ev.totalStages) * 100

        return (
          <button
            key={ev.id}
            onClick={() => onSelect(isSelected ? null : ev.id)}
            className={cn(
              'w-full flex items-center gap-2 px-2 py-1.5 rounded-md text-left transition-all',
              isSelected
                ? 'bg-accent-primary/10 border border-accent-primary/30'
                : 'hover:bg-bg-overlay/50 border border-transparent',
            )}
          >
            {/* Progress ring */}
            <div className="relative w-5 h-5 shrink-0">
              <svg className="w-5 h-5 -rotate-90" viewBox="0 0 20 20">
                <circle cx="10" cy="10" r="8" fill="none" stroke="#d7e3f1" strokeWidth="2" />
                <circle
                  cx="10" cy="10" r="8" fill="none"
                  stroke={hasVerdict ? '#00579C' : '#00579C'}
                  strokeWidth="2"
                  strokeDasharray={`${progressPct * 0.503} 50.3`}
                  strokeLinecap="round"
                  className="transition-all duration-500"
                />
              </svg>
              {!hasVerdict && ev.stagesCompleted > 0 && (
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="w-1 h-1 rounded-full bg-accent-primary animate-pulse" />
                </div>
              )}
            </div>

            {/* Event info */}
            <div className="flex-1 min-w-0 flex items-center gap-2">
              <code className="text-[8px] font-mono text-text-secondary truncate max-w-[100px]">{ev.id}</code>
              {ev.lifecycle.fraudLabel > 0 && (
                <span className="px-1 py-0.5 text-[6px] rounded bg-[#DA251C]/15 text-[#DA251C] font-bold uppercase">Fraud</span>
              )}
              {ev.lifecycle.sender && (
                <span className="text-[7px] text-text-muted truncate">{ev.lifecycle.sender} → {ev.lifecycle.receiver}</span>
              )}
            </div>

            {/* Stage count */}
            <span className="text-[8px] font-mono text-text-muted shrink-0">
              {ev.stagesCompleted}/{ev.totalStages}
            </span>
          </button>
        )
      })}
    </div>
  )
}

// ── Main Component ──────────────────────────────────────────────────────────

interface PipelineMotionVisualizerProps {
  /** Specific event ID to track from custom event injection or case launch. */
  trackedEventId?: string | null
  /** Compact mode — no event picker, just pipeline flow */
  compact?: boolean
  /** Additional CSS class */
  className?: string
}

export function PipelineMotionVisualizer({ trackedEventId, compact, className }: PipelineMotionVisualizerProps) {
  const events = useActivityStore((s) => s.events)
  const orderedIds = useActivityStore((s) => s.orderedIds)
  const eventLabRuns = useActivityStore((s) => s.eventLabRuns)
  const activeEventLabRunId = useActivityStore((s) => s.activeEventLabRunId)
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [selectedStage, setSelectedStage] = useState<PipelineStage | null>(null)
  const [expanded, setExpanded] = useState(!compact)
  const prevStagesRef = useRef<number>(0)
  const trackedLifecycleId = trackedEventId && events.has(trackedEventId) ? trackedEventId : null
  const activeRun = activeEventLabRunId ? eventLabRuns[activeEventLabRunId] : undefined

  // Use a live tracked event when it exists; if the run launched with an auth
  // precursor, fall through to the first generated event that has lifecycle data.
  const autoSelectedId = useMemo(() => {
    if (trackedLifecycleId) return null
    if (selectedId && events.has(selectedId)) return selectedId

    for (const id of activeRun?.eventIds ?? []) {
      if (events.has(id)) return id
    }

    for (const id of orderedIds.slice(0, 20)) {
      const lc = events.get(id)
      if (!lc) continue
      const hasVerdict = lc.stages.some((s) => s.stage === 'verdict')
      if (!hasVerdict && lc.stages.length > 0) return id
    }

    return orderedIds.find((id) => events.has(id)) ?? null
  }, [trackedLifecycleId, selectedId, events, activeRun?.eventIds, orderedIds])
  const activeId = trackedLifecycleId ?? autoSelectedId
  const lifecycle = activeId ? events.get(activeId) : undefined

  // Detect stage changes for animation triggers
  const currentStages = countRecognizedStages(lifecycle)
  useEffect(() => {
    if (currentStages > prevStagesRef.current) {
      // A new stage completed — could trigger a celebration animation
      prevStagesRef.current = currentStages
    }
  }, [currentStages])

  const stageStatuses = useMemo(() => getStageStatuses(lifecycle), [lifecycle])
  const completionPct = lifecycle
    ? (countRecognizedStages(lifecycle) / PIPELINE_STAGES.length) * 100
    : 0

  return (
    <div className={cn('bg-bg-elevated/95 border border-border-default rounded-lg overflow-hidden backdrop-blur-sm', className)}>
      {/* Header */}
      <div className="px-4 py-3 border-b border-border-subtle flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div
            className="w-7 h-7 rounded-lg border flex items-center justify-center"
            style={{
              background: lifecycle ? 'rgba(0,87,156,0.1)' : '#f4f8fc',
              borderColor: lifecycle ? 'rgba(0,87,156,0.2)' : '#d7e3f1',
            }}
          >
            {lifecycle ? (
              <Radio className="w-3.5 h-3.5 text-accent-primary animate-pulse" />
            ) : (
              <Sparkles className="w-3.5 h-3.5 text-text-muted/50" />
            )}
          </div>
          <div>
            <h3 className="text-[11px] font-bold text-text-primary uppercase tracking-[0.12em]">
              Live Processing Pipeline
            </h3>
            <p className="text-[8px] text-text-muted mt-0.5">
              {lifecycle
                ? `Tracking: ${activeId?.slice(0, 16)} — ${currentStages}/${PIPELINE_STAGES.length} stages complete`
                : 'Real-time event flow visualization — select an event or inject one to track'
              }
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {lifecycle && (
            <div className="flex items-center gap-1.5">
              {/* Completion progress */}
              <div className="w-16 h-1.5 bg-bg-deep rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full transition-all duration-700 ease-out"
                  style={{
                    width: `${completionPct}%`,
                    background: completionPct === 100
                      ? 'linear-gradient(90deg, #00579C, #2f79b5)'
                      : 'linear-gradient(90deg, #00579C, #2f79b5)',
                  }}
                />
              </div>
              <span className="text-[8px] font-mono font-bold text-text-secondary">
                {completionPct.toFixed(0)}%
              </span>
            </div>
          )}
          {!compact && (
            <button
              onClick={() => setExpanded(!expanded)}
              className="text-text-muted hover:text-text-primary transition-colors"
            >
              {expanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </button>
          )}
        </div>
      </div>

      {/* Main pipeline flow */}
      <div className="relative p-4">
        <PipelineGlobalStats events={events} orderedIds={orderedIds} />

        <div className="relative flex items-center gap-0 mt-3">
          <EventParticleTrail events={events} orderedIds={orderedIds} />
          {PIPELINE_STAGES.map((stage, i) => (
            <StageNode
              key={stage.key}
              config={stage}
              status={stageStatuses.get(stage.key) ?? 'idle'}
              duration={getStageDuration(lifecycle, stage.key)}
              isLast={i === PIPELINE_STAGES.length - 1}
              onClick={() => setSelectedStage(selectedStage === stage.key ? null : stage.key)}
              selected={selectedStage === stage.key}
            />
          ))}
        </div>

        {/* Expanded stage detail */}
        {selectedStage && lifecycle && (
          <StageDetailPanel
            lifecycle={lifecycle}
            stageKey={selectedStage}
            onClose={() => setSelectedStage(null)}
          />
        )}
      </div>

      {/* Event picker panel (when expanded) */}
      {expanded && !compact && (
        <div className="border-t border-border-subtle px-4 py-3">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[9px] font-semibold text-text-muted uppercase tracking-wider">
              Recent Pipeline Events
            </span>
            {activeId && (
              <button
                onClick={() => { setSelectedId(null); setSelectedStage(null) }}
                className="text-[8px] text-text-muted hover:text-accent-primary transition-colors uppercase tracking-wider"
              >
                Clear Selection
              </button>
            )}
          </div>
          <EventSelector
            events={events}
            orderedIds={orderedIds}
            selectedId={activeId ?? null}
            onSelect={(id) => { setSelectedId(id); setSelectedStage(null) }}
          />
        </div>
      )}
    </div>
  )
}
