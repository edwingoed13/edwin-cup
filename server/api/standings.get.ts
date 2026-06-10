/**
 * GET /api/standings
 * Tabla de posiciones de los 12 grupos, calculada desde los partidos REALES
 * de fase de grupos ya finalizados. Antes de que empiece el Mundial todo está
 * a cero (igual sirve para mostrar los 4 equipos de cada grupo y su forma).
 *
 * No usa filtros de la UI: siempre considera todos los partidos de grupos.
 */
import type { GroupStanding, StandingRow, Team } from '#shared/types/football'

export default defineEventHandler(async (): Promise<GroupStanding[]> => {
  const [matches, teams] = await Promise.all([getMatches(), getTeams()])
  const teamById = new Map(teams.map((t) => [t.id, t]))

  // Inicializa una fila por equipo dentro de cada grupo.
  const groups = new Map<string, Map<string, StandingRow>>()

  function rowFor(group: string, teamId: string): StandingRow | null {
    const team = teamById.get(teamId)
    if (!team) return null
    if (!groups.has(group)) groups.set(group, new Map())
    const table = groups.get(group)!
    if (!table.has(teamId)) {
      table.set(teamId, {
        team,
        played: 0, won: 0, drawn: 0, lost: 0,
        goalsFor: 0, goalsAgainst: 0, goalDiff: 0, points: 0,
      })
    }
    return table.get(teamId)!
  }

  for (const m of matches) {
    if (m.stage !== 'GROUP' || !m.group) continue
    const home = rowFor(m.group, m.homeTeamId)
    const away = rowFor(m.group, m.awayTeamId)
    if (!home || !away) continue

    // Solo cuentan los partidos finalizados con marcador.
    if (m.status !== 'FINISHED' || !m.score) continue

    const { home: gh, away: ga } = m.score
    home.played++; away.played++
    home.goalsFor += gh; home.goalsAgainst += ga
    away.goalsFor += ga; away.goalsAgainst += gh

    if (gh > ga) { home.won++; home.points += 3; away.lost++ }
    else if (gh < ga) { away.won++; away.points += 3; home.lost++ }
    else { home.drawn++; away.drawn++; home.points++; away.points++ }
  }

  const result: GroupStanding[] = [...groups.entries()]
    .map(([group, table]) => {
      const rows = [...table.values()]
      rows.forEach((r) => (r.goalDiff = r.goalsFor - r.goalsAgainst))
      rows.sort(
        (a, b) =>
          b.points - a.points ||
          b.goalDiff - a.goalDiff ||
          b.goalsFor - a.goalsFor ||
          a.team.name.localeCompare(b.team.name),
      )
      return { group, rows }
    })
    .sort((a, b) => a.group.localeCompare(b.group))

  return result
})
