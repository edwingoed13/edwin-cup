/**
 * Conversión de horarios de sede a hora de Perú (PET).
 *
 * Dependencias (ya declaradas en package.json, se instalan con `npm install`):
 *   npm install date-fns date-fns-tz
 *
 * Cómo funciona la conversión:
 * 1. `fromZonedTime(wallTime, timezone)` interpreta el datetime "de pared"
 *    (ej: "2026-06-11T19:00:00" en "America/Mexico_City") y devuelve el
 *    instante UTC real que representa, resolviendo DST automáticamente
 *    con la base de datos IANA que trae el propio runtime (Intl).
 * 2. `formatInTimeZone(utc, 'America/Lima', ...)` re-expresa ese instante
 *    en hora de Perú y lo serializa como ISO con offset (-05:00).
 *
 * Perú no usa horario de verano (UTC-5 todo el año), pero las sedes de
 * EE.UU. y Canadá sí (EDT/PDT...), por eso es clave pasar por UTC.
 */
import { fromZonedTime, formatInTimeZone } from 'date-fns-tz'

export const PET_TIMEZONE = 'America/Lima'

/**
 * Convierte un kickoff local de la sede a ISO en hora de Perú.
 * - Si el ISO ya trae offset ("Z" o "±hh:mm"), se respeta ese instante.
 * - Si no trae offset, se interpreta como hora "de pared" en `timezone`.
 */
export function convertToPET(kickoffLocal: string, timezone: string): string {
  const hasExplicitOffset = /(?:Z|[+-]\d{2}:\d{2})$/.test(kickoffLocal)
  const utcInstant = hasExplicitOffset
    ? new Date(kickoffLocal)
    : fromZonedTime(kickoffLocal, timezone)

  if (Number.isNaN(utcInstant.getTime())) {
    throw new Error(`kickoffLocal inválido: "${kickoffLocal}" (${timezone})`)
  }

  return formatInTimeZone(utcInstant, PET_TIMEZONE, "yyyy-MM-dd'T'HH:mm:ssXXX")
}
