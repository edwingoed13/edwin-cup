/**
 * Bandera de un equipo. El backend ya envía el emoji real en `team.flag`
 * (ver server/data/worldCupReference.ts); si faltara, se cae a las iniciales
 * del código de país como placeholder.
 */
export function teamFlag(team: { flag?: string; countryCode: string }): string {
  return team.flag || team.countryCode.slice(0, 2)
}

/** Fallback por código de país suelto (cuando no hay objeto Team). */
export function flagFor(countryCode: string): string {
  return countryCode.slice(0, 2)
}
