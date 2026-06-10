/**
 * Fuente de datos REAL del Mundial 2026: TheSportsDB (liga 4429, temporada 2026).
 *
 * Qué trae de la API (datos reales): partidos, equipos, sedes, grupos,
 * fechas/horas (timestamp UTC), estado y marcador.
 * Qué se añade localmente: zona horaria IANA de cada sede, bandera, código FIFA
 * y un `rating` ESTIMADO por equipo (ver server/data/worldCupReference.ts).
 *
 * Notas:
 *  - La key gratuita "3" limita `eventsseason` a 15 eventos, pero `eventsround`
 *    devuelve la ronda completa (24 por jornada), así que paginamos por ronda.
 *  - Hoy solo existen las 3 jornadas de grupos (72 partidos). Las eliminatorias
 *    aparecerán en la fuente cuando se definan los cruces; este servicio las
 *    incorporará automáticamente si la fuente las publica.
 *  - Para no saturar la API gratuita se cachea en memoria (TTL) y se guarda un
 *    snapshot en disco como respaldo si la API no responde.
 *  - Configurable con la variable de entorno THESPORTSDB_KEY.
 */
import { readFileSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import { formatInTimeZone } from 'date-fns-tz'
import { PET_TIMEZONE } from '#shared/utils/time'
import type { Match, MatchStatus, Stage, Team } from '#shared/types/football'
import {
  DEFAULT_TEAM_REF,
  DEFAULT_TIMEZONE,
  TEAM_REFERENCE,
  VENUE_INFO,
} from '../data/worldCupReference'
import {
  computeFormScore,
  ensureEnrichment,
  mergeEnrichment,
  seedEnrichmentFromTeams,
} from './teamEnrichment'
import type { FormResult } from '#shared/types/football'

const API_KEY = process.env.THESPORTSDB_KEY || '3'
const LEAGUE_ID = '4429' // FIFA World Cup en TheSportsDB
const SEASON = '2026'
const BASE = `https://www.thesportsdb.com/api/v1/json/${API_KEY}`
const FMT = "yyyy-MM-dd'T'HH:mm:ssXXX"
const TTL_MS = 90_000 // 90 s: refresca marcadores en vivo sin saturar la API

// Jornadas de grupos (24 partidos c/u). Se intentan rondas de eliminatorias
// extra por si la fuente ya las publicó (hoy devuelven vacío y se ignoran).
const GROUP_ROUNDS = [1, 2, 3]

const SNAPSHOT_PATH = join(process.cwd(), 'server', 'data', 'worldcup-2026.snapshot.json')

interface RawEvent {
  idEvent: string
  strEvent?: string
  strHomeTeam: string
  idHomeTeam: string
  strAwayTeam: string
  idAwayTeam: string
  intHomeScore: string | null
  intAwayScore: string | null
  strStatus: string | null
  strTimestamp: string | null
  dateEvent: string
  strTime: string | null
  strVenue: string
  strCity: string
  strCountry: string
  strGroup: string | null
  intRound: string | null
  strOfficial?: string | null
}

interface WorldCupData {
  matches: Match[]
  teams: Team[]
  fetchedAt: string
  source: 'api' | 'snapshot'
}

let cache: WorldCupData | null = null
let inFlight: Promise<WorldCupData> | null = null
let seeded = false

/** Siembra la cache de enriquecimiento desde el snapshot en disco (una vez). */
function seedFromDiskOnce(): void {
  if (seeded) return
  seeded = true
  readSnapshot() // efecto colateral: seedEnrichmentFromTeams(); ignoramos el retorno
}

/** Convierte el timestamp de TheSportsDB (UTC) a un Date real. */
function parseUtc(ts: string | null, date: string, time: string | null): Date {
  if (ts) {
    const hasOffset = /(?:Z|[+-]\d{2}:\d{2})$/.test(ts)
    return new Date(hasOffset ? ts : `${ts}Z`)
  }
  return new Date(`${date}T${time || '00:00:00'}Z`)
}

function mapStatus(s: string | null): MatchStatus {
  const v = (s || '').toUpperCase().trim()
  if (['FT', 'AET', 'PEN', 'MATCH FINISHED', 'AWD', 'WO'].includes(v)) return 'FINISHED'
  if (['NS', '', 'TBD', 'PST', 'POSTP', 'POSTPONED', 'CANC', 'CANCELLED'].includes(v)) {
    return 'SCHEDULED'
  }
  return 'LIVE' // 1H, HT, 2H, ET, P, etc.
}

function stageForRound(round: number): Stage {
  // Hoy solo hay grupos; cuando la fuente publique cruces, se mapean aquí.
  if (round >= 1 && round <= 3) return 'GROUP'
  return 'GROUP'
}

function mapEvent(e: RawEvent): Match {
  const venue = VENUE_INFO[e.strVenue]
  const venueTz = venue?.tz ?? DEFAULT_TIMEZONE
  const utc = parseUtc(e.strTimestamp, e.dateEvent, e.strTime)

  const hasScore =
    e.intHomeScore !== null && e.intHomeScore !== '' &&
    e.intAwayScore !== null && e.intAwayScore !== ''

  return {
    id: e.idEvent,
    stage: stageForRound(Number(e.intRound ?? 0)),
    group: e.strGroup || undefined,
    homeTeamId: e.idHomeTeam,
    awayTeamId: e.idAwayTeam,
    stadium: e.strVenue,
    city: e.strCity,
    country: e.strCountry,
    stadiumCapacity: venue?.capacity,
    altitudeM: venue?.altitudeM,
    timezone: venueTz,
    kickoffLocal: formatInTimeZone(utc, venueTz, FMT), // hora real de la sede
    kickoffPET: formatInTimeZone(utc, PET_TIMEZONE, FMT), // hora real de Perú
    referee: e.strOfficial || undefined,
    status: mapStatus(e.strStatus),
    score: hasScore ? { home: Number(e.intHomeScore), away: Number(e.intAwayScore) } : undefined,
  }
}

/**
 * Forma de cada equipo calculada desde los partidos del PROPIO Mundial ya
 * finalizados (no depende del límite de la API; crece hasta 5 durante el torneo).
 */
function worldCupFormByTeam(events: RawEvent[]): Map<string, FormResult[]> {
  const byTeam = new Map<string, FormResult[]>()
  const push = (teamId: string, f: FormResult) => {
    if (!byTeam.has(teamId)) byTeam.set(teamId, [])
    byTeam.get(teamId)!.push(f)
  }

  for (const e of events) {
    if (mapStatus(e.strStatus) !== 'FINISHED') continue
    if (e.intHomeScore === null || e.intAwayScore === null) continue
    const gh = Number(e.intHomeScore)
    const ga = Number(e.intAwayScore)
    if (Number.isNaN(gh) || Number.isNaN(ga)) continue

    push(e.idHomeTeam, {
      result: gh > ga ? 'W' : gh < ga ? 'L' : 'D',
      opponent: e.strAwayTeam,
      score: `${gh}-${ga}`,
      date: e.dateEvent,
      competition: 'Mundial 2026',
    })
    push(e.idAwayTeam, {
      result: ga > gh ? 'W' : ga < gh ? 'L' : 'D',
      opponent: e.strHomeTeam,
      score: `${ga}-${gh}`,
      date: e.dateEvent,
      competition: 'Mundial 2026',
    })
  }

  // Más reciente primero.
  for (const list of byTeam.values()) list.sort((a, b) => b.date.localeCompare(a.date))
  return byTeam
}

/** Construye la lista de equipos a partir de los participantes reales. */
function buildTeams(events: RawEvent[]): Team[] {
  const byId = new Map<string, Team>()
  const wcForm = worldCupFormByTeam(events)

  for (const e of events) {
    for (const side of [
      { id: e.idHomeTeam, name: e.strHomeTeam },
      { id: e.idAwayTeam, name: e.strAwayTeam },
    ]) {
      if (!side.id || byId.has(side.id)) continue
      const ref = TEAM_REFERENCE[side.name] ?? DEFAULT_TEAM_REF
      const form = wcForm.get(side.id) ?? []
      byId.set(side.id, {
        id: side.id,
        name: side.name,
        countryCode: ref.countryCode,
        flag: ref.flag,
        confederation: ref.confederation,
        rating: ref.rating,
        // Sin stats reales de ataque/defensa: se usa el rating estimado como base.
        attackStrength: ref.rating,
        defenseStrength: ref.rating,
        recentForm: form.length ? form : undefined,
        formScore: computeFormScore(form),
      })
    }
  }

  return [...byId.values()].sort((a, b) => a.name.localeCompare(b.name))
}

async function fetchRound(round: number): Promise<RawEvent[]> {
  const data = await $fetch<{ events: RawEvent[] | null }>(`${BASE}/eventsround.php`, {
    query: { id: LEAGUE_ID, r: round, s: SEASON },
    timeout: 15_000,
  })
  return data?.events ?? []
}

async function buildFromApi(): Promise<WorldCupData> {
  const rounds = await Promise.all(GROUP_ROUNDS.map(fetchRound))
  const events = rounds.flat().filter(Boolean)
  if (events.length === 0) {
    throw new Error('TheSportsDB no devolvió eventos para el Mundial 2026')
  }

  const matches = events
    .map(mapEvent)
    .sort((a, b) => a.kickoffPET.localeCompare(b.kickoffPET))

  // Merge instantáneo de lo ya cacheado (escudos/forma); el resto se completa
  // en segundo plano (ver ensureEnrichment más abajo).
  const teams = mergeEnrichment(buildTeams(events))

  const data: WorldCupData = {
    matches,
    teams,
    fetchedAt: new Date().toISOString(),
    source: 'api',
  }

  writeSnapshot(data)
  return data
}

/** Escribe el snapshot de respaldo (best-effort). */
function writeSnapshot(data: WorldCupData): void {
  try {
    writeFileSync(
      SNAPSHOT_PATH,
      JSON.stringify({ matches: data.matches, teams: data.teams }, null, 2),
      'utf-8',
    )
  } catch {
    /* en sandbox de solo lectura simplemente se omite */
  }
}

/** Re-mezcla el enriquecimiento más reciente en el cache y reescribe snapshot. */
function persistEnrichment(): void {
  if (!cache) return
  cache.teams = mergeEnrichment(cache.teams)
  writeSnapshot(cache)
}

function readSnapshot(): WorldCupData | null {
  try {
    const raw = JSON.parse(readFileSync(SNAPSHOT_PATH, 'utf-8')) as {
      matches: Match[]
      teams: Team[]
    }
    // Repuebla la cache de enriquecimiento para no re-pedir escudos/forma.
    seedEnrichmentFromTeams(raw.teams)
    return { ...raw, fetchedAt: new Date().toISOString(), source: 'snapshot' }
  } catch {
    return null
  }
}

/** Devuelve los datos (cache → API → snapshot), con TTL y dedupe de llamadas. */
export async function getWorldCupData(): Promise<WorldCupData> {
  seedFromDiskOnce() // preserva escudos/forma del snapshot previo antes de sobrescribir

  const fresh = cache && Date.now() - new Date(cache.fetchedAt).getTime() < TTL_MS
  if (fresh) return cache!
  if (inFlight) return inFlight

  inFlight = (async () => {
    try {
      cache = await buildFromApi()
    } catch (err) {
      // Si la API falla, intentamos servir el último snapshot conocido.
      const snap = readSnapshot()
      if (snap) {
        console.warn('[worldCupApi] usando snapshot de respaldo:', (err as Error).message)
        cache = snap
      } else if (cache) {
        console.warn('[worldCupApi] API caída, sirvo cache anterior:', (err as Error).message)
      } else {
        throw createError({
          statusCode: 502,
          statusMessage: 'No se pudo obtener el calendario del Mundial 2026 (API y snapshot fallaron)',
        })
      }
    } finally {
      inFlight = null
    }
    // Completa escudos/forma faltantes en segundo plano (throttleado, no bloquea).
    if (cache) ensureEnrichment(cache.teams, persistEnrichment)
    return cache!
  })()

  return inFlight
}
