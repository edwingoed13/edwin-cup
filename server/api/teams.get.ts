/**
 * GET /api/teams
 * Lista completa de equipos (la usa el select de filtros).
 */
import type { Team } from '#shared/types/football'

export default defineEventHandler(async (): Promise<Team[]> => {
  return getTeams()
})
