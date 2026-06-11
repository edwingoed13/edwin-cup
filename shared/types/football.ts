/**
 * Modelo de datos compartido entre el backend (server/) y el frontend (app/).
 * En Nuxt 4 todo lo que vive en shared/ puede importarse desde ambos lados
 * con el alias #shared, p. ej.: import type { Match } from '#shared/types/football'
 */

export type Stage =
  | 'GROUP'
  | 'ROUND_OF_32'
  | 'ROUND_OF_16'
  | 'QUARTER_FINAL'
  | 'SEMI_FINAL'
  | 'FINAL'

export type MatchStatus = 'SCHEDULED' | 'LIVE' | 'FINISHED'

/** Un resultado reciente desde el punto de vista del equipo. */
export interface FormResult {
  result: 'W' | 'D' | 'L'
  opponent: string
  score: string // ej: "5-1"
  date: string // YYYY-MM-DD
  competition?: string
}

export interface Team {
  id: string
  name: string
  countryCode: string // ej: "BRA", "ARG" (código FIFA)
  flag?: string // emoji de bandera (opcional; la UI cae a las iniciales)
  badge?: string // URL del escudo real (TheSportsDB); la UI cae a la bandera
  confederation: 'UEFA' | 'CONMEBOL' | 'CONCACAF' | 'AFC' | 'CAF' | 'OFC'
  rating: number // fuerza general ESTIMADA (ranking FIFA ~2025), alimenta el modelo
  attackStrength: number
  defenseStrength: number
  recentForm?: FormResult[] // últimos resultados reales, más reciente primero
  formScore?: number // 0..1 derivado de recentForm (alimenta el modelo)
}

export interface MatchScore {
  home: number
  away: number
}

export interface MatchExtraData {
  possessionHome?: number
  xGHome?: number
  xGAway?: number
  cardsHome?: number
  cardsAway?: number
}

export interface Match {
  id: string
  stage: Stage
  group?: string // solo fase de grupos: "A", "B", ...
  homeTeamId: string
  awayTeamId: string
  stadium: string
  city: string
  country: string
  stadiumCapacity?: number // aforo aproximado de la sede
  altitudeM?: number // altitud de la sede en metros (contexto, p. ej. Azteca ~2240)
  timezone: string // IANA, ej: "America/New_York"
  kickoffLocal: string // ISO en hora de la sede
  kickoffPET: string // ISO en America/Lima (se calcula si viene vacío)
  referee?: string
  status: MatchStatus
  score?: MatchScore
  extraData?: MatchExtraData
}

/** Partido con los equipos resueltos (no solo IDs) — lo que consume la UI. */
export interface MatchWithTeams extends Match {
  homeTeam: Team
  awayTeam: Team
}

export interface Prediction {
  matchId: string
  probHomeWin: number
  probDraw: number
  probAwayWin: number
  confidence: number // 0 a 1
  model: 'baseline' | 'advanced'
  explanation: string
  /**
   * Cuotas decimales ESTIMADAS por el modelo (1 ÷ probabilidad), NO de casas
   * de apuestas. Para mostrar el formato 1.85 / 3.40 / 4.20 sin fuente externa.
   */
  estimatedOdds: { home: number; draw: number; away: number }
}

/** Una fila de la tabla de un grupo (clasificación calculada). */
export interface StandingRow {
  team: Team
  played: number
  won: number
  drawn: number
  lost: number
  goalsFor: number
  goalsAgainst: number
  goalDiff: number
  points: number
}

export interface GroupStanding {
  group: string // "A", "B", ...
  rows: StandingRow[] // ya ordenadas: pts → DG → GF
}

/** Filtros que acepta GET /api/matches y que maneja el store de Pinia. */
export interface MatchFiltersState {
  stage: Stage | ''
  status: MatchStatus | '' // Programado / En vivo / Finalizado
  group: string
  teamId: string
  dateFrom: string // YYYY-MM-DD (en PET)
  dateTo: string // YYYY-MM-DD (en PET)
}
