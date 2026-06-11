import type { MatchStatus, Stage } from '#shared/types/football'

export const STAGE_LABELS: Record<Stage, string> = {
  GROUP: 'Fase de grupos',
  ROUND_OF_32: 'Dieciseisavos',
  ROUND_OF_16: 'Octavos de final',
  QUARTER_FINAL: 'Cuartos de final',
  SEMI_FINAL: 'Semifinal',
  FINAL: 'Final',
}

/**
 * Estado de un partido → props de `UBadge` (label + color semántico + icono
 * Lucide). Centraliza la presentación del estado para toda la UI (auditoría §10.1).
 */
export const STATUS_UI: Record<
  MatchStatus,
  { label: string; color: 'neutral' | 'error' | 'success'; icon: string }
> = {
  SCHEDULED: { label: 'Programado', color: 'neutral', icon: 'i-lucide-clock' },
  LIVE: { label: 'En vivo', color: 'error', icon: 'i-lucide-radio' },
  FINISHED: { label: 'Finalizado', color: 'success', icon: 'i-lucide-circle-check' },
}
