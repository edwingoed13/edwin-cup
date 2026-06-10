/**
 * Acceso a datos del Mundial 2026 — ahora desde la fuente REAL (TheSportsDB),
 * a través de server/services/worldCupApi.ts (con cache + snapshot de respaldo).
 *
 * Todas las funciones son async porque los datos se obtienen por red.
 * Las funciones de server/utils/ se auto-importan en las rutas de Nitro.
 */
import { getWorldCupData } from '../services/worldCupApi'
import type { Match, MatchWithTeams, Team } from '#shared/types/football'

export async function getTeams(): Promise<Team[]> {
  return (await getWorldCupData()).teams
}

export async function getTeamById(id: string): Promise<Team | undefined> {
  return (await getWorldCupData()).teams.find((t) => t.id === id)
}

export async function getMatches(): Promise<Match[]> {
  return (await getWorldCupData()).matches
}

export async function getMatchById(id: string): Promise<Match | undefined> {
  return (await getWorldCupData()).matches.find((m) => m.id === id)
}

/** Adjunta los objetos Team completos (la UI nunca trabaja solo con IDs). */
export async function resolveMatchTeams(match: Match): Promise<MatchWithTeams> {
  const { teams } = await getWorldCupData()
  const homeTeam = teams.find((t) => t.id === match.homeTeamId)
  const awayTeam = teams.find((t) => t.id === match.awayTeamId)
  if (!homeTeam || !awayTeam) {
    throw createError({
      statusCode: 500,
      statusMessage: `Equipos no encontrados para el partido ${match.id}`,
    })
  }
  return { ...match, homeTeam, awayTeam }
}
