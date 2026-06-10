import type { MatchStatus, Stage } from '#shared/types/football'

export const STAGE_LABELS: Record<Stage, string> = {
  GROUP: 'Fase de grupos',
  ROUND_OF_32: 'Dieciseisavos',
  ROUND_OF_16: 'Octavos de final',
  QUARTER_FINAL: 'Cuartos de final',
  SEMI_FINAL: 'Semifinal',
  FINAL: 'Final',
}

export const STATUS_LABELS: Record<MatchStatus, string> = {
  SCHEDULED: 'Programado',
  LIVE: 'EN VIVO',
  FINISHED: 'Finalizado',
}

/** Clases Tailwind del badge según estado (punto 6 del diseño). */
export const STATUS_BADGE_CLASSES: Record<MatchStatus, string> = {
  SCHEDULED: 'bg-sky-500/15 text-sky-300 ring-1 ring-sky-500/30',
  LIVE: 'bg-red-500/15 text-red-300 ring-1 ring-red-500/40 animate-pulse',
  FINISHED: 'bg-emerald-500/15 text-emerald-300 ring-1 ring-emerald-500/30',
}
