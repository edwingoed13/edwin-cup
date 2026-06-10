/**
 * GET /api/matches/:id
 * Devuelve un partido (datos reales de TheSportsDB) con los equipos resueltos.
 * El estado y el marcador reflejan la fuente real; el polling del frontend
 * vuelve a pedir esta ruta y la cache (TTL 90 s) trae los cambios en vivo.
 */
import type { MatchWithTeams } from '#shared/types/football'

export default defineEventHandler(async (event): Promise<MatchWithTeams> => {
  const id = getRouterParam(event, 'id')
  const match = id ? await getMatchById(id) : undefined

  if (!match) {
    throw createError({ statusCode: 404, statusMessage: `Partido ${id} no encontrado` })
  }

  return resolveMatchTeams(match)
})
