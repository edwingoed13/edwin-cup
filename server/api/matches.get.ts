/**
 * GET /api/matches
 * Query params opcionales: stage, group, teamId, dateFrom, dateTo
 * (dateFrom/dateTo en formato YYYY-MM-DD, comparados contra la fecha PET).
 * Devuelve MatchWithTeams[] ordenado por kickoffPET ascendente.
 */
import type { MatchStatus, MatchWithTeams, Stage } from '#shared/types/football'

export default defineEventHandler(async (event): Promise<MatchWithTeams[]> => {
  const q = getQuery(event)

  let list = await getMatches()

  if (q.stage) {
    list = list.filter((m) => m.stage === (q.stage as Stage))
  }
  if (q.status) {
    list = list.filter((m) => m.status === (q.status as MatchStatus))
  }
  if (q.group) {
    list = list.filter((m) => m.group === String(q.group).toUpperCase())
  }
  if (q.teamId) {
    const teamId = String(q.teamId)
    list = list.filter((m) => m.homeTeamId === teamId || m.awayTeamId === teamId)
  }
  if (q.dateFrom) {
    list = list.filter((m) => m.kickoffPET.slice(0, 10) >= String(q.dateFrom))
  }
  if (q.dateTo) {
    list = list.filter((m) => m.kickoffPET.slice(0, 10) <= String(q.dateTo))
  }

  // Orden por relevancia: en vivo primero, luego programados (más próximo arriba)
  // y al final los finalizados (más reciente primero).
  const STATUS_ORDER: Record<MatchStatus, number> = { LIVE: 0, SCHEDULED: 1, FINISHED: 2 }
  const resolved = await Promise.all(list.map(resolveMatchTeams))
  return resolved.sort((a, b) => {
    if (STATUS_ORDER[a.status] !== STATUS_ORDER[b.status]) {
      return STATUS_ORDER[a.status] - STATUS_ORDER[b.status]
    }
    return a.status === 'FINISHED'
      ? b.kickoffPET.localeCompare(a.kickoffPET)
      : a.kickoffPET.localeCompare(b.kickoffPET)
  })
})
