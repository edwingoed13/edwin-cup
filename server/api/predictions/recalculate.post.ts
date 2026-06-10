/**
 * POST /api/predictions/recalculate
 * Body: { matchIds: string[] }
 * Recalcula las predicciones indicadas y las guarda en el cache en memoria.
 */
import { recalculatePredictions } from '../../services/predictionService'
import type { Prediction } from '#shared/types/football'

export default defineEventHandler(async (event): Promise<{ predictions: Prediction[] }> => {
  const body = await readBody<{ matchIds?: unknown }>(event)

  if (
    !body ||
    !Array.isArray(body.matchIds) ||
    body.matchIds.length === 0 ||
    !body.matchIds.every((id): id is string => typeof id === 'string')
  ) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Body inválido: se espera { matchIds: string[] } con al menos un id',
    })
  }

  return { predictions: await recalculatePredictions(body.matchIds) }
})
