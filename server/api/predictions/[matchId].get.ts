/**
 * GET /api/predictions/:matchId
 * Devuelve la predicción del partido; si no existe en cache la calcula
 * al momento con el predictionService (modelo baseline).
 */
import { getOrComputePrediction } from '../../services/predictionService'
import type { Prediction } from '#shared/types/football'

export default defineEventHandler(async (event): Promise<Prediction> => {
  const matchId = getRouterParam(event, 'matchId')
  if (!matchId) {
    throw createError({ statusCode: 400, statusMessage: 'matchId requerido' })
  }
  return getOrComputePrediction(matchId)
})
