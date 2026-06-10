import { formatInTimeZone } from 'date-fns-tz'
import { es } from 'date-fns/locale'
import { PET_TIMEZONE } from '#shared/utils/time'

/** Formatea un ISO cualquiera en hora de Perú con locale español. */
export function formatPET(iso: string, pattern = "EEE d 'de' MMM · HH:mm"): string {
  return formatInTimeZone(new Date(iso), PET_TIMEZONE, pattern, { locale: es })
}

/** Hora local de la sede (el ISO de la sede ya viene "en pared" o con offset). */
export function formatLocalKickoff(kickoffLocal: string): string {
  // kickoffLocal viene sin offset (hora de pared de la sede), así que basta
  // con mostrar el texto tal cual, formateado de forma amigable.
  const [date, time] = kickoffLocal.split('T')
  return `${date} ${time?.slice(0, 5) ?? ''}`
}

export function formatPercent(p: number): string {
  return `${Math.round(p * 100)}%`
}
