// ============================================================================
// Pipeline Transparency Panel — Full "X-ray" of every pipeline stage
// No black box: Shows ML features, Graph analysis, CB consensus, LLM reasoning
// ============================================================================

import { useMemo, useState } from 'react'
import { useActivityStore, type EventLabRunActivity, type EventLifecycle, type PipelineStage } from '@/stores/use-activity-store'
import { cn, fmtOptionalTimestamp } from '@/lib/utils'
import { useLLMStatus } from '@/hooks/use-api'
import { resolveLLMRuntime, type LLMRuntimeSummary } from '@/lib/llm-runtime'
import {
  Eye,
  Database,
  BrainCircuit,
  Network,
  ShieldCheck,
  Bot,
  Scale,
  ChevronDown,
  ChevronRight,
  Activity,
  BarChart3,
  GitBranch,
  Shield,
  Cpu,
  MessageSquare,
  FileText,
  AlertTriangle,
  CheckCircle2,
  Zap,
  TrendingUp,
  Layers,
  Wrench,
  Brain,
  Target,
  type LucideIcon,
} from 'lucide-react'

// ── Stage transparency configs ───────────────────────────────────────────

interface TransparencyStageConfig {
  key: PipelineStage
  label: string
  icon: LucideIcon
  color: string
  algorithmName: string
  algorithmDetail: string
  techStack: string[]
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

function buildTransparencyStages(llmRuntime: LLMRuntimeSummary): TransparencyStageConfig[] {
  return [
  {
    key: 'ingested',
    label: 'Event Ingestion & Validation',
    icon: Database,
    color: '#00579C',
    algorithmName: 'Schema Validator + CRC32',
    algorithmDetail: 'Pydantic schema validation with strict field typing, CRC32 checksum integrity verification, timestamp normalization, and amount-to-paisa conversion.',
    techStack: ['Pydantic V2', 'CRC32 Checksum', 'Field Normalizer'],
  },
  {
    key: 'ml_scored',
    label: 'ML Feature Engine + XGBoost',
    icon: BrainCircuit,
    color: '#003f75',
    algorithmName: 'Feature Vector + Union Bank Sidecar -> XGBoost Classifier',
    algorithmDetail: 'Extracts the backend model feature vector plus Union Bank domain flags for RBI/FIU thresholds, beneficiary pre-registration, mule pass-through, dormant activation, branch mismatch, and structuring watch. XGBoost scoring remains model-contract compatible while sidecar controls feed explanations and analyst workflows.',
    techStack: ['XGBoost', 'Feature Engine', 'Union Bank Sidecar', 'Velocity Engine'],
  },
  {
    key: 'graph_investigated',
    label: 'Graph Structural Analysis',
    icon: Network,
    color: '#2f79b5',
    algorithmName: 'NetworkX Structural Pattern Scanner',
    algorithmDetail: 'Builds the directed transaction graph. Detects mule chains, circular laundering cycles, hub anomalies from betweenness centrality, community anomalies from greedy modularity, and star patterns around collector nodes.',
    techStack: ['NetworkX', 'Cycle Detection', 'Betweenness Centrality', 'Greedy Modularity', 'DFS Mule Chains'],
  },
  {
    key: 'cb_evaluated',
    label: 'Circuit Breaker — Multi-Model Consensus',
    icon: ShieldCheck,
    color: '#f5b400',
    algorithmName: 'Weighted Consensus Scoring (ML + Graph + optional GNN)',
    algorithmDetail: 'Combines ML risk score, structural graph evidence, and a GNN score only when the backend reports that the GNN scorer is loaded. If GNN is unavailable, the circuit breaker reweights the available ML and graph evidence before issuing freeze or escalation orders.',
    techStack: ['Weighted Ensemble', 'Freeze Orders', 'Alert Dedup', 'Available-Model Reweighting'],
  },
  {
    key: 'llm_started',
    label: llmRuntime.model === 'configured LLM' ? 'LLM Forensic Agent' : `${llmRuntime.model} Forensic Agent`,
    icon: Bot,
    color: '#DA251C',
    algorithmName: `LangGraph ReAct Agent via Ollama (${llmRuntime.statusLabel})`,
    algorithmDetail: `Runs a bounded LangGraph ReAct loop: (1) Analyze transaction context, (2) Query graph neighbors, (3) Check historical patterns, (4) Cross-reference velocity data, (5) Generate forensic explanation. Runtime model: ${llmRuntime.model}. ${llmRuntime.statusDetail} PayFlow rules, ML, graph, circuit breaker, and ledger remain authoritative.`,
    techStack: [llmRuntime.model, 'LangGraph ReAct', 'Ollama', 'Tool-Calling Agent', 'Bounded Copilot'],
  },
  {
    key: 'verdict',
    label: 'Final Verdict + Blockchain Anchor',
    icon: Scale,
    color: '#B51A13',
    algorithmName: 'Classification → HITL Decision → Immutable Ledger',
    algorithmDetail: 'Aggregates all evidence into final verdict (legitimate / suspicious / fraudulent). High-confidence fraud triggers automatic freeze; borderline cases escalate to Human-in-the-Loop (HITL). Verdict + evidence hash anchored to append-only blockchain ledger with Ed25519 signatures.',
    techStack: ['Ed25519 Signatures', 'Append-Only Ledger', 'HITL Escalation', 'ZKP Anchoring'],
  },
  ]
}

// ── Helper: format duration ──────────────────────────────────────────────

function fmtDuration(ms?: number | null): string {
  if (typeof ms !== 'number' || !Number.isFinite(ms) || ms < 0) return 'n/a'
  return ms < 1000 ? `${ms.toFixed(0)}ms` : `${(ms / 1000).toFixed(1)}s`
}

function fmtScore(score?: number): string {
  if (score == null) return '—'
  return `${(score * 100).toFixed(1)}%`
}

function hasScore(score: number | null | undefined): score is number {
  return typeof score === 'number' && Number.isFinite(score) && score >= 0
}

function clampScore(score: number): number {
  return Math.min(1, Math.max(0, score))
}

function hasBackendTimestamp(timestamp: number | null | undefined): timestamp is number {
  return typeof timestamp === 'number' && Number.isFinite(timestamp) && timestamp > 0
}

function stageElapsedMs(lifecycle: EventLifecycle | undefined, stageKey: PipelineStage): number | undefined {
  if (!lifecycle) return undefined
  const stageDetail = lifecycle.stages.find((s) => s.stage === stageKey)
  if (!stageDetail) return undefined
  if (typeof stageDetail.durationMs === 'number' && Number.isFinite(stageDetail.durationMs) && stageDetail.durationMs >= 0) {
    return stageDetail.durationMs
  }
  const idx = lifecycle.stages.findIndex((s) => s.stage === stageKey)
  if (idx <= 0) return undefined
  const current = lifecycle.stages[idx].timestamp
  const previous = lifecycle.stages[idx - 1].timestamp
  if (!hasBackendTimestamp(current) || !hasBackendTimestamp(previous) || current < previous) return undefined
  return (current - previous) * 1000
}

function countReachedStages(
  lifecycle: EventLifecycle | undefined,
  stages: TransparencyStageConfig[],
): number {
  if (!lifecycle) return 0
  const recognized = new Set(stages.map((stage) => stage.key))
  const reached = new Set<PipelineStage>()
  lifecycle.stages.forEach((detail) => {
    if (recognized.has(detail.stage)) reached.add(detail.stage)
  })
  return reached.size
}

// ── Risk Score Gauge ─────────────────────────────────────────────────────

function RiskGauge({ score, tier }: { score: number; tier?: string }) {
  const clamped = clampScore(score)
  const pct = clamped * 100
  const color = clamped > 0.7 ? '#DA251C' : clamped > 0.4 ? '#f5b400' : '#00579C'

  return (
    <div className="flex items-center gap-3">
      <div className="relative w-20 h-2 bg-bg-deep rounded-full overflow-hidden">
        <div
          className="absolute inset-y-0 left-0 rounded-full transition-all duration-700"
          style={{ width: `${pct}%`, background: color, boxShadow: `0 0 8px ${color}66` }}
        />
      </div>
      <span className="text-[10px] font-mono font-bold" style={{ color }}>{pct.toFixed(1)}%</span>
      {tier && (
        <span className="text-[8px] px-1.5 py-0.5 rounded-full font-bold uppercase tracking-wider" style={{
          color,
          background: `${color}15`,
          border: `1px solid ${color}30`,
        }}>{tier}</span>
      )}
    </div>
  )
}

// ── Consensus Score Bars ─────────────────────────────────────────────────

function ConsensusBar({ label, score, icon: Icon }: { label: string; score: number | null | undefined; icon: LucideIcon }) {
  const available = hasScore(score)
  const clamped = available ? clampScore(score) : 0
  const color = available
    ? clamped > 0.7 ? '#DA251C' : clamped > 0.4 ? '#f5b400' : '#00579C'
    : '#617189'
  return (
    <div className="flex items-center gap-2">
      <Icon className="w-3 h-3 text-text-muted shrink-0" />
      <span className="text-[8px] font-semibold text-text-muted uppercase tracking-wider w-10">{label}</span>
      <div className="flex-1 h-1.5 bg-bg-deep rounded-full overflow-hidden">
        <div
          className="h-full rounded-full transition-all duration-500"
          style={{ width: `${clamped * 100}%`, background: color }}
        />
      </div>
      <span className="text-[9px] font-mono font-bold w-10 text-right" style={{ color }}>
        {available ? `${(clamped * 100).toFixed(0)}%` : 'N/A'}
      </span>
    </div>
  )
}

// ── Stage Transparency Card ──────────────────────────────────────────────

function StageTransparencyCard({
  config,
  lifecycle,
  isReached,
  isActive,
  llmRuntime,
}: {
  config: TransparencyStageConfig
  lifecycle: EventLifecycle | undefined
  isReached: boolean
  isActive: boolean
  llmRuntime: LLMRuntimeSummary
}) {
  const [expanded, setExpanded] = useState(isActive)
  const Icon = config.icon
  const stageDetail = lifecycle?.stages.find((s) => s.stage === config.key)
  const duration = stageElapsedMs(lifecycle, config.key)

  return (
    <div
      className={cn(
        'border rounded-lg overflow-hidden transition-all duration-300',
        isActive && 'ring-1 ring-offset-0',
        isReached ? 'bg-bg-elevated/95 border-border-default' : 'bg-bg-overlay/40 border-border-subtle/50 opacity-50',
      )}
      style={isActive ? { outlineColor: `${config.color}60`, outlineWidth: '1px', outlineStyle: 'solid' } : undefined}
    >
      {/* Header — always visible */}
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-bg-overlay/30 transition-colors"
      >
        {/* Stage icon */}
        <div
          className={cn(
            'w-8 h-8 rounded-lg flex items-center justify-center shrink-0 transition-all',
            isReached ? 'text-white' : 'bg-bg-deep/80 text-text-muted/50',
          )}
          style={isReached ? { background: config.color, boxShadow: `0 0 12px ${config.color}40` } : undefined}
        >
          <Icon className="w-4 h-4" />
        </div>

        {/* Label + algorithm */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className={cn(
              'text-[10px] font-bold uppercase tracking-wider',
              isReached ? 'text-text-primary' : 'text-text-muted/60',
            )}>
              {config.label}
            </span>
            {isActive && (
              <span className="flex items-center gap-1 text-[7px] px-1.5 py-0.5 rounded-full bg-accent-primary/15 text-accent-primary font-bold uppercase animate-pulse">
                <Activity className="w-2.5 h-2.5" /> Processing
              </span>
            )}
            {isReached && !isActive && (
              <CheckCircle2 className="w-3 h-3 text-[#00579C] shrink-0" />
            )}
          </div>
          <div className="text-[8px] text-text-muted mt-0.5 flex items-center gap-2">
            <Cpu className="w-2.5 h-2.5 shrink-0" />
            <span className="truncate">{config.algorithmName}</span>
            {duration != null && (
              <span className="flex items-center gap-0.5 shrink-0" style={{ color: config.color }}>
                <Zap className="w-2.5 h-2.5" />{fmtDuration(duration)}
              </span>
            )}
          </div>
        </div>

        {/* Expand arrow */}
        {expanded ? (
          <ChevronDown className="w-4 h-4 text-text-muted shrink-0" />
        ) : (
          <ChevronRight className="w-4 h-4 text-text-muted shrink-0" />
        )}
      </button>

      {/* Expanded detail */}
      {expanded && (
        <div className="px-4 pb-4 space-y-3 border-t border-border-subtle/50 pt-3 animate-fade-in">
          {/* Algorithm explanation */}
          <div className="space-y-1.5">
            <div className="flex items-center gap-1.5 text-[8px] font-semibold text-text-muted uppercase tracking-wider">
              <Brain className="w-3 h-3" /> How it works
            </div>
            <p className="text-[9px] text-text-secondary leading-relaxed">{config.algorithmDetail}</p>
          </div>

          {/* Tech stack pills */}
          <div className="flex flex-wrap gap-1">
            {config.techStack.map((tech) => (
              <span
                key={tech}
                className="px-1.5 py-0.5 rounded text-[7px] font-bold uppercase tracking-wider border"
                style={{
                  color: config.color,
                  borderColor: `${config.color}30`,
                  background: `${config.color}08`,
                }}
              >
                {tech}
              </span>
            ))}
          </div>

          {/* Stage-specific live data */}
          {config.key === 'ingested' && lifecycle && (
            <StageDataIngestion lifecycle={lifecycle} />
          )}
          {config.key === 'ml_scored' && lifecycle && (
            <StageDataML lifecycle={lifecycle} />
          )}
          {config.key === 'graph_investigated' && lifecycle && (
            <StageDataGraph stageDetail={stageDetail} />
          )}
          {config.key === 'cb_evaluated' && lifecycle && (
            <StageDataCircuitBreaker lifecycle={lifecycle} />
          )}
          {config.key === 'llm_started' && lifecycle && (
            <StageDataLLM lifecycle={lifecycle} llmRuntime={llmRuntime} />
          )}
          {config.key === 'verdict' && lifecycle && (
            <StageDataVerdict lifecycle={lifecycle} />
          )}

          {/* Raw meta dump */}
          {stageDetail?.meta && Object.keys(stageDetail.meta).length > 0 && (
            <details className="group">
              <summary className="flex items-center gap-1.5 text-[7px] font-semibold text-text-muted/60 uppercase tracking-wider cursor-pointer hover:text-text-muted transition-colors select-none list-none">
                <svg className="w-2.5 h-2.5 transition-transform group-open:rotate-90" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
                Raw Stage Metadata
              </summary>
              <div className="mt-1.5 p-2 rounded bg-bg-deep/80 border border-border-subtle/30 space-y-0.5">
                {Object.entries(stageDetail.meta).map(([k, v]) => (
                  <div key={k} className="flex justify-between text-[7px] font-mono">
                    <span className="text-text-muted">{k}</span>
                    <span className="text-text-secondary truncate max-w-[200px] ml-4">{JSON.stringify(v)}</span>
                  </div>
                ))}
              </div>
            </details>
          )}
        </div>
      )}
    </div>
  )
}

// ── Stage-specific data renderers ────────────────────────────────────────

function StageDataIngestion({ lifecycle }: { lifecycle: EventLifecycle }) {
  return (
    <div className="p-2.5 rounded-md bg-bg-deep/60 border border-border-subtle/30 space-y-2">
      <div className="text-[8px] font-semibold text-text-muted uppercase tracking-wider flex items-center gap-1.5">
        <Database className="w-3 h-3" /> Ingested Event Summary
      </div>
      <div className="grid grid-cols-2 gap-x-4 gap-y-1">
        <KV label="Transaction ID" value={lifecycle.txnId} mono />
        <KV label="Sender" value={lifecycle.sender || '—'} mono />
        <KV label="Receiver" value={lifecycle.receiver || '—'} mono />
        <KV label="Amount" value={lifecycle.amountPaisa ? `₹${(lifecycle.amountPaisa / 100).toLocaleString()}` : '—'} />
        <KV label="Fraud Label" value={lifecycle.fraudLabel > 0 ? `⚠ ${lifecycle.fraudLabel}` : '✓ Clean'} />
        <KV label="First Seen" value={fmtOptionalTimestamp(lifecycle.firstSeen)} />
      </div>
    </div>
  )
}

function StageDataML({ lifecycle }: { lifecycle: EventLifecycle }) {
  return (
    <div className="p-2.5 rounded-md bg-bg-deep/60 border border-border-subtle/30 space-y-2.5">
      <div className="text-[8px] font-semibold text-text-muted uppercase tracking-wider flex items-center gap-1.5">
        <BarChart3 className="w-3 h-3" /> ML Scoring Output
      </div>
      {lifecycle.riskScore != null ? (
        <>
          <RiskGauge score={lifecycle.riskScore} tier={lifecycle.riskTier} />
          {lifecycle.topFeatures && lifecycle.topFeatures.length > 0 && (
            <div className="space-y-1">
              <div className="text-[7px] font-semibold text-text-muted uppercase tracking-wider">Top Contributing Features</div>
              <div className="flex flex-wrap gap-1">
                {lifecycle.topFeatures.map((f, i) => (
                  <span key={i} className="px-1.5 py-0.5 rounded text-[7px] font-mono bg-[#00579C]/10 text-[#00579C] border border-[#00579C]/20">
                    {f}
                  </span>
                ))}
              </div>
            </div>
          )}
        </>
      ) : (
        <WaitingIndicator label="Awaiting XGBoost scoring..." />
      )}
    </div>
  )
}

function StageDataGraph({ stageDetail }: { stageDetail?: { meta?: Record<string, unknown> } }) {
  const meta = stageDetail?.meta ?? {}
  return (
    <div className="p-2.5 rounded-md bg-bg-deep/60 border border-border-subtle/30 space-y-2">
      <div className="text-[8px] font-semibold text-text-muted uppercase tracking-wider flex items-center gap-1.5">
        <GitBranch className="w-3 h-3" /> Graph Analysis Results
      </div>
      {Object.keys(meta).length > 0 ? (
        <div className="grid grid-cols-2 gap-x-4 gap-y-1">
          {meta.mule_detected != null && <KV label="Mule Detected" value={meta.mule_detected ? '⚠ YES' : '✓ No'} />}
          {meta.cycle_found != null && <KV label="Cycles Found" value={meta.cycle_found ? '⚠ YES' : '✓ No'} />}
          {meta.centrality_score != null && <KV label="Centrality Score" value={fmtScore(meta.centrality_score as number)} />}
          {meta.community_id != null && <KV label="Community ID" value={String(meta.community_id)} />}
          {meta.degree != null && <KV label="Node Degree" value={String(meta.degree)} />}
          {meta.connected_fraud_nodes != null && <KV label="Connected Fraud Nodes" value={String(meta.connected_fraud_nodes)} />}
        </div>
      ) : (
        <div className="text-[8px] text-text-muted/50 italic">
          Graph structural analysis active — detecting mule chains, cycles, and centrality anomalies in the transaction network
        </div>
      )}
    </div>
  )
}

function StageDataCircuitBreaker({ lifecycle }: { lifecycle: EventLifecycle }) {
  const scores = lifecycle.consensusScores
  const availableScores = scores
    ? [scores.ml, scores.gnn, scores.graph].filter(hasScore)
    : []
  const weightedConsensus = scores?.consensus ?? (
    availableScores.length > 0
      ? availableScores.reduce((sum, score) => sum + score, 0) / availableScores.length
      : null
  )

  return (
    <div className="p-2.5 rounded-md bg-bg-deep/60 border border-border-subtle/30 space-y-2.5">
      <div className="text-[8px] font-semibold text-text-muted uppercase tracking-wider flex items-center gap-1.5">
        <Shield className="w-3 h-3" /> Multi-Model Consensus
      </div>
      {scores ? (
        <div className="space-y-1.5">
          <ConsensusBar label="ML" score={scores.ml} icon={BrainCircuit} />
          <ConsensusBar label="GNN" score={scores.gnn} icon={Layers} />
          <ConsensusBar label="Graph" score={scores.graph} icon={Network} />
          <div className="pt-1.5 border-t border-border-subtle/30">
            <div className="flex items-center justify-between text-[8px]">
              <span className="text-text-muted font-semibold uppercase tracking-wider">Weighted Consensus</span>
              <span className="font-mono font-bold" style={{
                color: !hasScore(weightedConsensus) ? '#617189' : weightedConsensus > 0.5 ? '#DA251C' : '#00579C',
              }}>
                {hasScore(weightedConsensus) ? `${(clampScore(weightedConsensus) * 100).toFixed(1)}%` : 'N/A'}
              </span>
            </div>
          </div>
        </div>
      ) : (
        <WaitingIndicator label="Awaiting multi-model consensus evaluation..." />
      )}
    </div>
  )
}

function StageDataLLM({ lifecycle, llmRuntime }: { lifecycle: EventLifecycle; llmRuntime: LLMRuntimeSummary }) {
  return (
    <div className="p-2.5 rounded-md bg-bg-deep/60 border border-border-subtle/30 space-y-2.5">
      <div className="text-[8px] font-semibold text-text-muted uppercase tracking-wider flex items-center gap-1.5">
        <MessageSquare className="w-3 h-3" /> {llmRuntime.model} Investigation
      </div>
      {lifecycle.thinkingSteps != null || lifecycle.toolsUsed ? (
        <div className="space-y-2">
          <div className="grid grid-cols-2 gap-x-4 gap-y-1">
            <KV label="Runtime" value={`${llmRuntime.model} (${llmRuntime.statusLabel})`} />
            <KV label="Rationale Steps" value={String(lifecycle.thinkingSteps ?? '—')} />
            <KV label="Investigation Time" value={fmtDuration(lifecycle.totalDurationMs)} />
            <KV label="NLU Findings" value={String(lifecycle.nluFindingsCount ?? '—')} />
            <KV label="Escalated" value={lifecycle.nluEscalated ? '⚠ YES' : '✓ No'} />
          </div>
          {lifecycle.toolsUsed && lifecycle.toolsUsed.length > 0 && (
            <div className="space-y-1">
              <div className="text-[7px] font-semibold text-text-muted uppercase tracking-wider flex items-center gap-1">
                <Wrench className="w-2.5 h-2.5" /> Tools Called by Agent
              </div>
              <div className="flex flex-wrap gap-1">
                {lifecycle.toolsUsed.map((tool, i) => (
                  <span key={i} className="px-1.5 py-0.5 rounded text-[7px] font-mono bg-[#DA251C]/10 text-[#DA251C] border border-[#DA251C]/20">
                    {tool}
                  </span>
                ))}
              </div>
            </div>
          )}
          {lifecycle.reasoningSummary && (
            <div className="space-y-1">
              <div className="text-[7px] font-semibold text-text-muted uppercase tracking-wider flex items-center gap-1">
                <Brain className="w-2.5 h-2.5" /> Evidence Rationale
              </div>
              <p className="text-[8px] text-text-secondary leading-relaxed bg-bg-overlay/40 rounded p-2 border border-border-subtle/30 italic">
                "{lifecycle.reasoningSummary}"
              </p>
            </div>
          )}
        </div>
      ) : (
        <WaitingIndicator label={`${llmRuntime.model} agent stage active — awaiting ReAct lifecycle evidence...`} />
      )}
    </div>
  )
}

function StageDataVerdict({ lifecycle }: { lifecycle: EventLifecycle }) {
  const verdictColor =
    lifecycle.verdict === 'fraudulent' ? '#DA251C'
    : lifecycle.verdict === 'suspicious' ? '#f5b400'
    : lifecycle.verdict === 'legitimate' ? '#00579C'
    : '#6b7280'

  return (
    <div className="p-2.5 rounded-md bg-bg-deep/60 border border-border-subtle/30 space-y-2.5">
      <div className="text-[8px] font-semibold text-text-muted uppercase tracking-wider flex items-center gap-1.5">
        <Target className="w-3 h-3" /> Final Verdict
      </div>
      {lifecycle.verdict ? (
        <div className="space-y-2">
          {/* Verdict badge */}
          <div className="flex items-center gap-3">
            <span
              className="px-3 py-1.5 rounded-md text-[11px] font-black uppercase tracking-wider"
              style={{
                color: verdictColor,
                background: `${verdictColor}15`,
                border: `1px solid ${verdictColor}40`,
                boxShadow: `0 0 12px ${verdictColor}20`,
              }}
            >
              {lifecycle.verdict}
            </span>
            {lifecycle.confidence != null && (
              <div className="flex items-center gap-1.5">
                <span className="text-[8px] text-text-muted">Confidence:</span>
                <span className="text-[10px] font-mono font-bold" style={{ color: verdictColor }}>
                  {isFallbackLifecycle(lifecycle) ? 'n/a' : `${(lifecycle.confidence * 100).toFixed(1)}%`}
                </span>
              </div>
            )}
          </div>

          {lifecycle.fraudTypology && (
            <div className="flex items-center gap-2 text-[8px]">
              <AlertTriangle className="w-3 h-3 text-[#DA251C]" />
              <span className="text-text-muted">Typology:</span>
              <span className="font-semibold text-text-primary">{lifecycle.fraudTypology}</span>
            </div>
          )}

          {lifecycle.recommendedAction && (
            <div className="flex items-center gap-2 text-[8px]">
              <Shield className="w-3 h-3 text-accent-primary" />
              <span className="text-text-muted">Action:</span>
              <span className="font-semibold text-text-primary">{lifecycle.recommendedAction}</span>
            </div>
          )}

          {lifecycle.analystStatus && (
            <div className="rounded border border-border-subtle bg-bg-overlay/45 p-2 text-[8px]">
              <div className="flex items-center justify-between gap-2">
                <span className="text-text-muted uppercase tracking-wider">Analyst outcome</span>
                <span className="font-mono font-bold uppercase text-text-primary">
                  {lifecycle.analystStatus.replace(/_/g, ' ')}
                </span>
              </div>
              {lifecycle.analystReason && (
                <p className="mt-1 leading-relaxed text-text-secondary">
                  {lifecycle.analystReason.replace(/_/g, ' ')}
                </p>
              )}
            </div>
          )}

          {lifecycle.evidenceCited && lifecycle.evidenceCited.length > 0 && (
            <div className="space-y-1">
              <div className="text-[7px] font-semibold text-text-muted uppercase tracking-wider flex items-center gap-1">
                <FileText className="w-2.5 h-2.5" /> Evidence Cited
              </div>
              <ul className="space-y-0.5">
                {lifecycle.evidenceCited.map((ev, i) => (
                  <li key={i} className="flex items-start gap-1.5 text-[8px] text-text-secondary">
                    <span className="text-accent-primary mt-0.5">•</span>
                    <span>{ev}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      ) : (
        <WaitingIndicator label="Awaiting final classification verdict..." />
      )}
    </div>
  )
}

// ── Shared small components ──────────────────────────────────────────────

function KV({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return (
    <div className="flex justify-between text-[8px]">
      <span className="text-text-muted uppercase tracking-wider">{label}</span>
      <span className={cn('text-text-secondary truncate max-w-[140px] ml-2', mono && 'font-mono')}>{value}</span>
    </div>
  )
}

function WaitingIndicator({ label }: { label: string }) {
  return (
    <div className="flex items-center gap-2 py-1.5 text-[8px] text-text-muted/60 italic">
      <div className="w-1.5 h-1.5 rounded-full bg-accent-primary/60 animate-pulse" />
      {label}
    </div>
  )
}

function eventLabStageLabel(stage: string): string {
  return stage.replace(/_/g, ' ')
}

function EventLabBackendTrace({
  run,
  llmRuntime,
}: {
  run: EventLabRunActivity
  llmRuntime: LLMRuntimeSummary
}) {
  const latestStage = run.stages.at(-1)
  const visibleStages = run.stages.slice(-10)

  return (
    <div className="rounded-lg border border-[#00579C]/35 bg-[linear-gradient(135deg,#071427_0%,#003f75_58%,#101827_100%)] p-3 text-white shadow-sm">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex items-center gap-2 text-[9px] font-bold uppercase tracking-[0.14em] text-white/70">
            <Activity className="h-3.5 w-3.5 text-[#DA251C]" />
            Event Lab backend execution stream
          </div>
          <div className="mt-2 flex flex-wrap items-center gap-2">
            <span className="rounded-md border border-white/15 bg-white/10 px-2 py-1 font-mono text-[9px] font-bold text-white">
              {run.runId}
            </span>
            <span className="rounded-md border border-white/15 bg-white/10 px-2 py-1 text-[9px] font-bold uppercase tracking-[0.1em] text-white">
              {run.status}
            </span>
            <span className="rounded-md border border-[#DA251C]/35 bg-[#DA251C]/20 px-2 py-1 text-[9px] font-bold uppercase tracking-[0.1em] text-white">
              {run.eventIds.length} generated events
            </span>
          </div>
          <p className="mt-2 max-w-4xl text-[10px] leading-relaxed text-white/78">
            {run.templateTitle} is flowing through ingestion, ML, graph, circuit breaker, bounded {llmRuntime.model}, analyst gate,
            and audit stages. This panel is fed by live Event Lab SSE run stages.
          </p>
        </div>
        <div className="grid min-w-[260px] grid-cols-2 gap-2 text-[8px]">
          <div className="rounded-md border border-white/15 bg-white/10 p-2">
            <div className="uppercase tracking-[0.12em] text-white/55">Correlation</div>
            <div className="mt-1 truncate font-mono text-[10px] font-bold text-white">{run.correlationId || 'pending'}</div>
          </div>
          <div className="rounded-md border border-white/15 bg-white/10 p-2">
            <div className="uppercase tracking-[0.12em] text-white/55">Latest backend stage</div>
            <div className="mt-1 truncate text-[10px] font-bold uppercase text-white">{latestStage ? eventLabStageLabel(latestStage.stage) : 'waiting'}</div>
          </div>
        </div>
      </div>

      <div className="mt-3 grid gap-2 lg:grid-cols-[minmax(0,1fr)_340px]">
        <div className="grid gap-2 md:grid-cols-5">
          {visibleStages.length === 0 ? (
            <div className="md:col-span-5 rounded-md border border-white/15 bg-white/10 p-3 text-[10px] text-white/70">
              Waiting for the first backend run stage from SSE.
            </div>
          ) : visibleStages.map((stage, index) => (
            <div key={`${stage.stage}-${stage.timestamp}-${index}`} className="rounded-md border border-white/15 bg-white/10 p-2">
              <div className="flex items-center justify-between gap-2">
                <span className="truncate text-[8px] font-bold uppercase tracking-[0.12em] text-white">{eventLabStageLabel(stage.stage)}</span>
                <span className="h-2 w-2 rounded-full bg-[#DA251C] shadow-[0_0_12px_rgba(218,37,28,0.75)]" />
              </div>
              <div className="mt-2 flex items-center justify-between gap-2 font-mono text-[8px] text-white/60">
                <span>{stage.event_ids?.length ?? 0} ids</span>
                <span>{stage.duration_ms != null ? fmtDuration(stage.duration_ms) : fmtOptionalTimestamp(stage.timestamp)}</span>
              </div>
            </div>
          ))}
        </div>

        <div className="rounded-md border border-white/15 bg-black/20 p-3">
          <div className="mb-2 flex items-center gap-2 text-[9px] font-bold uppercase tracking-[0.12em] text-white">
            <Bot className="h-3.5 w-3.5 text-[#DA251C]" />
            {llmRuntime.model} bounded role
          </div>
          <p className="line-clamp-5 text-[10px] leading-relaxed text-white/76">
            {run.qwenExplanation || `${llmRuntime.model} is available for explanation only; PayFlow ML, graph, rules, and analyst approval remain authoritative.`}
          </p>
          <div className="mt-3 flex flex-wrap gap-1">
            {['FastAPI SSE', 'Feature Engine', 'NetworkX', 'Circuit Breaker', llmRuntime.model, 'Audit Hash'].map((tech) => (
              <span key={tech} className="rounded border border-white/15 bg-white/10 px-1.5 py-0.5 text-[7px] font-bold uppercase tracking-[0.1em] text-white/75">
                {tech}
              </span>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

// ── Main Component ──────────────────────────────────────────────────────────

interface PipelineTransparencyProps {
  className?: string
}

export function PipelineTransparency({ className }: PipelineTransparencyProps) {
  const events = useActivityStore((s) => s.events)
  const orderedIds = useActivityStore((s) => s.orderedIds)
  const trackedEventId = useActivityStore((s) => s.trackedEventId)
  const eventLabRuns = useActivityStore((s) => s.eventLabRuns)
  const activeEventLabRunId = useActivityStore((s) => s.activeEventLabRunId)
  const {
    data: llmStatus,
    isLoading: llmStatusLoading,
    isError: llmStatusError,
  } = useLLMStatus()

  const activeRun = activeEventLabRunId ? eventLabRuns[activeEventLabRunId] : undefined
  const trackedLifecycleId = trackedEventId && events.has(trackedEventId) ? trackedEventId : null
  const runLifecycleId = activeRun?.eventIds.find((id) => events.has(id)) ?? null
  const activeId = trackedLifecycleId ?? runLifecycleId ?? orderedIds.find((id) => events.has(id)) ?? null
  const lifecycle = activeId ? events.get(activeId) : undefined
  const llmRuntime = useMemo(
    () => resolveLLMRuntime(llmStatus, {
      lifecycleModel: lifecycle?.modelUsed,
      loading: llmStatusLoading,
      error: llmStatusError,
    }),
    [llmStatus, lifecycle?.modelUsed, llmStatusLoading, llmStatusError],
  )
  const transparencyStages = useMemo(() => buildTransparencyStages(llmRuntime), [llmRuntime])

  const completedStages = useMemo(() => {
    if (!lifecycle) return new Set<PipelineStage>()
    return new Set(lifecycle.stages.map((s) => s.stage))
  }, [lifecycle])

  // Determine active stage (the next one after the last completed)
  const activeStage = useMemo<PipelineStage | null>(() => {
    if (!lifecycle) return null
    let lastIdx = -1
    for (let i = transparencyStages.length - 1; i >= 0; i--) {
      if (completedStages.has(transparencyStages[i].key)) {
        lastIdx = i
        break
      }
    }
    if (lastIdx < transparencyStages.length - 1) {
      return transparencyStages[lastIdx + 1].key
    }
    return null
  }, [lifecycle, completedStages, transparencyStages])

  // Overall progress
  const stagesReached = countReachedStages(lifecycle, transparencyStages)
  const totalStages = transparencyStages.length

  return (
    <div className={cn('bg-bg-elevated/95 border border-border-default rounded-lg overflow-hidden backdrop-blur-sm', className)}>
      {/* Header */}
      <div className="px-4 py-3 border-b border-border-subtle flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-[#f5b400]/10 border border-[#f5b400]/25 flex items-center justify-center">
            <Eye className="w-3.5 h-3.5 text-[#DA251C]" />
          </div>
          <div>
            <h3 className="text-[11px] font-bold text-text-primary uppercase tracking-[0.12em]">
              Pipeline Transparency — Full X-Ray
            </h3>
            <p className="text-[8px] text-text-muted mt-0.5">
              {lifecycle
                ? `Tracking ${activeId?.slice(0, 16)} — ${stagesReached}/${totalStages} stages • Every algorithm, every decision, zero black boxes`
                : 'Inject an event to see the full processing pipeline with complete transparency'
              }
            </p>
          </div>
        </div>
        {lifecycle && (
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1.5 text-[8px]">
              <TrendingUp className="w-3 h-3 text-text-muted" />
              <span className="text-text-muted">Progress:</span>
              <span className="font-mono font-bold text-text-primary">{stagesReached}/{totalStages}</span>
            </div>
            <div className="w-16 h-1.5 bg-bg-deep rounded-full overflow-hidden">
              <div
                className="h-full rounded-full transition-all duration-700"
                style={{
                  width: `${(stagesReached / totalStages) * 100}%`,
                  background: stagesReached === totalStages
                    ? 'linear-gradient(90deg, #00579C, #2f79b5)'
                    : 'linear-gradient(90deg, #f5b400, #DA251C)',
                }}
              />
            </div>
          </div>
        )}
      </div>

      {/* Stage cards */}
      <div className="p-4 space-y-2">
        {activeRun && (
          <EventLabBackendTrace run={activeRun} llmRuntime={llmRuntime} />
        )}

        {!lifecycle && !activeRun ? (
          <div className="flex flex-col items-center justify-center py-10 text-center">
            <Eye className="w-8 h-8 text-text-muted/30 mb-3" />
            <p className="text-[11px] font-semibold text-text-muted">No Active Event</p>
            <p className="text-[9px] text-text-muted/60 mt-1 max-w-sm">
              Prime fields from a backend Event Lab template or inject a custom event to see the full pipeline processing
              with complete transparency
            </p>
          </div>
        ) : !lifecycle ? (
          <div className="rounded-lg border border-[#00579C]/20 bg-[#00579C]/10 p-4 text-[10px] leading-relaxed text-text-secondary">
            Event Lab run stages are live. Waiting for the generated transaction lifecycle to finish hydrating through the
            ingestion, ML, graph, circuit breaker, and LLM SSE channels.
          </div>
        ) : (
          transparencyStages.map((config) => (
            <StageTransparencyCard
              key={config.key}
              config={config}
              lifecycle={lifecycle}
              isReached={completedStages.has(config.key)}
              isActive={activeStage === config.key}
              llmRuntime={llmRuntime}
            />
          ))
        )}
      </div>
    </div>
  )
}
