/**
 * Servicio de predicción "baseline".
 *
 * Features simples por partido:
 *  - Diferencia de rating general.
 *  - Diferencia ataque local vs defensa visitante (y viceversa).
 *  - Ventaja de "localía continental": el Mundial 2026 se juega en
 *    Norteamérica, así que los equipos CONCACAF reciben un pequeño bonus.
 *
 * Las tres puntuaciones (local/empate/visita) pasan por softmax para
 * garantizar probabilidades válidas que suman 1.
 *
 * Cuando exista un modelo real (red neuronal), basta con implementar
 * runNeuralModelPlaceholder() y el resto del servicio no cambia.
 */
import type { Match, Prediction, Team } from '#shared/types/football'
import { getMatchById, getTeamById } from '../utils/data'

/** Confederación "anfitriona" del Mundial 2026 (EE.UU. / México / Canadá). */
const HOST_CONFEDERATION = 'CONCACAF'

/** Cache en memoria: matchId → Prediction. Se pierde al reiniciar el dev server. */
const predictionsStore = new Map<string, Prediction>()

function softmax(scores: number[]): number[] {
  const max = Math.max(...scores)
  const exps = scores.map((s) => Math.exp(s - max))
  const sum = exps.reduce((a, b) => a + b, 0)
  return exps.map((e) => e / sum)
}

function round3(n: number): number {
  return Math.round(n * 1000) / 1000
}

interface MatchFeatures {
  ratingDiff: number
  homeAttackVsAwayDefense: number
  awayAttackVsHomeDefense: number
  homeContinentalBonus: number
  awayContinentalBonus: number
  formDiff: number // (forma local − forma visita), rango −1..1; 0 si no hay datos
}

function buildFeatures(home: Team, away: Team): MatchFeatures {
  // 0.5 = neutral cuando un equipo aún no tiene forma reciente registrada.
  const homeForm = home.formScore ?? 0.5
  const awayForm = away.formScore ?? 0.5
  return {
    ratingDiff: home.rating - away.rating,
    homeAttackVsAwayDefense: home.attackStrength - away.defenseStrength,
    awayAttackVsHomeDefense: away.attackStrength - home.defenseStrength,
    homeContinentalBonus: home.confederation === HOST_CONFEDERATION ? 1 : 0,
    awayContinentalBonus: away.confederation === HOST_CONFEDERATION ? 1 : 0,
    formDiff: homeForm - awayForm,
  }
}

function buildExplanation(home: Team, away: Team, f: MatchFeatures, probs: number[]): string {
  const [pHome, , pAway] = probs
  const favorite = pHome >= pAway ? home : away
  const parts: string[] = []

  if (Math.abs(f.ratingDiff) >= 6) {
    parts.push(`${favorite.name} llega con un rating claramente superior`)
  } else if (Math.abs(f.ratingDiff) >= 2) {
    parts.push(`${favorite.name} tiene una ligera ventaja de rating`)
  } else {
    parts.push('Los ratings son muy parejos, partido abierto')
  }

  if (f.homeContinentalBonus && !f.awayContinentalBonus) {
    parts.push(`${home.name} suma ventaja de localía continental (sede CONCACAF)`)
  } else if (f.awayContinentalBonus && !f.homeContinentalBonus) {
    parts.push(`${away.name} juega en su propia confederación`)
  }

  if (f.homeAttackVsAwayDefense - f.awayAttackVsHomeDefense >= 5) {
    parts.push(`el ataque de ${home.name} supera a la defensa rival`)
  } else if (f.awayAttackVsHomeDefense - f.homeAttackVsAwayDefense >= 5) {
    parts.push(`el ataque de ${away.name} supera a la defensa rival`)
  }

  if (f.formDiff >= 0.25) {
    parts.push(`${home.name} llega en mejor forma reciente`)
  } else if (f.formDiff <= -0.25) {
    parts.push(`${away.name} llega en mejor forma reciente`)
  }

  return parts.join('; ') + '.'
}

/**
 * Esqueleto del futuro modelo avanzado. Cuando exista una red neuronal real
 * (ONNX, TF.js, llamada a un microservicio Python, etc.), debe devolver
 * [probHome, probDraw, probAway]. Mientras devuelva null se usa el baseline.
 */
export function runNeuralModelPlaceholder(_features: MatchFeatures): number[] | null {
  // TODO: cargar pesos / invocar inferencia y devolver las 3 probabilidades.
  return null
}

/** Calcula la predicción de un partido (sin tocar el cache). */
export async function computePrediction(match: Match): Promise<Prediction> {
  const home = await getTeamById(match.homeTeamId)
  const away = await getTeamById(match.awayTeamId)
  if (!home || !away) {
    throw createError({ statusCode: 500, statusMessage: `Equipos no encontrados (${match.id})` })
  }

  const f = buildFeatures(home, away)

  const neural = runNeuralModelPlaceholder(f)
  let probs: number[]
  let model: Prediction['model'] = 'baseline'

  if (neural) {
    probs = neural
    model = 'advanced'
  } else {
    // Puntuaciones lineales sencillas; los pesos están elegidos a mano para
    // producir distribuciones razonables con ratings 60–100.
    const homeScore =
      f.ratingDiff * 0.055 +
      (f.homeAttackVsAwayDefense - f.awayAttackVsHomeDefense) * 0.02 +
      (f.homeContinentalBonus - f.awayContinentalBonus) * 0.35 +
      f.formDiff * 0.6 + // racha reciente real (eventslast)
      0.12 // pequeño sesgo por ser "local" administrativo del fixture

    const awayScore =
      -f.ratingDiff * 0.055 +
      (f.awayAttackVsHomeDefense - f.homeAttackVsAwayDefense) * 0.02 +
      (f.awayContinentalBonus - f.homeContinentalBonus) * 0.35 -
      f.formDiff * 0.6

    // El empate es más probable cuanto más parejos son los equipos.
    const drawScore = 0.25 - Math.abs(f.ratingDiff) * 0.03

    probs = softmax([homeScore, drawScore, awayScore])
  }

  // Confianza: crece con la diferencia de rating, acotada a [0.3, 0.95].
  const confidence = Math.min(0.95, Math.max(0.3, 0.35 + Math.abs(f.ratingDiff) / 25))

  return {
    matchId: match.id,
    probHomeWin: round3(probs[0]!),
    probDraw: round3(probs[1]!),
    probAwayWin: round3(probs[2]!),
    confidence: round3(confidence),
    model,
    explanation: buildExplanation(home, away, f, probs),
    estimatedOdds: toEstimatedOdds(probs),
  }
}

/**
 * Cuotas decimales "justas" estimadas a partir de las probabilidades del modelo
 * (cuota = 1 / probabilidad). No llevan margen de casa porque NO son de mercado;
 * son orientativas del propio modelo.
 */
function toEstimatedOdds(probs: number[]): Prediction['estimatedOdds'] {
  const fair = (p: number) => Math.round((1 / Math.max(p, 0.001)) * 100) / 100
  return { home: fair(probs[0]!), draw: fair(probs[1]!), away: fair(probs[2]!) }
}

/**
 * Devuelve la predicción cacheada o la calcula al momento.
 * Son probabilidades previas al partido (el baseline no usa el marcador en
 * vivo); cuando exista el modelo avanzado podrá incorporar el estado real.
 */
export async function getOrComputePrediction(matchId: string): Promise<Prediction> {
  const match = await getMatchById(matchId)
  if (!match) {
    throw createError({ statusCode: 404, statusMessage: `Partido ${matchId} no existe` })
  }

  const cached = predictionsStore.get(matchId)
  if (cached) return cached

  const fresh = await computePrediction(match)
  predictionsStore.set(matchId, fresh)
  return fresh
}

/** Recalcula y guarda en memoria las predicciones de varios partidos. */
export async function recalculatePredictions(matchIds: string[]): Promise<Prediction[]> {
  const out: Prediction[] = []
  for (const id of matchIds) {
    const match = await getMatchById(id)
    if (!match) {
      throw createError({ statusCode: 404, statusMessage: `Partido ${id} no existe` })
    }
    const prediction = await computePrediction(match)
    predictionsStore.set(id, prediction)
    out.push(prediction)
  }
  return out
}
