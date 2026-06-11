/**
 * GET /api/predictions?ids=a,b,c
 * Devuelve un mapa { matchId -> Prediction } en una sola petición (evita el N+1
 * del cliente, que antes pedía una predicción por partido). Sin `ids` calcula
 * las de todos los partidos. Las predicciones se cachean en el predictionService.
 */
import { getOrComputePrediction } from '../../services/predictionService'
import { getMatches } from '../../utils/data'
import type { Prediction } from '#shared/types/football'

export default defineEventHandler(async (event): Promise<Record<string, Prediction>> => {
  const q = getQuery(event)

  let ids: string[]
  if (q.ids) {
    ids = String(q.ids)
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean)
  } else {
    ids = (await getMatches()).map((m) => m.id)
  }

  const out: Record<string, Prediction> = {}
  await Promise.all(
    ids.map(async (id) => {
      try {
        out[id] = await getOrComputePrediction(id)
      } catch {
        // Un id inválido no debe tumbar el lote completo; simplemente se omite.
      }
    }),
  )
  return out
})
