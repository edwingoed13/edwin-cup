/**
 * Identidad textual de un equipo cuando NO hay escudo real (`team.badge`).
 *
 * IMPORTANTE: no usamos emojis de bandera. Windows no los renderiza como
 * banderas (muestra las 2 letras del indicador regional, p. ej. 🇧🇷 → "BR"),
 * por eso el campo `team.flag` (emoji) se ignora a propósito en la UI y caemos
 * a un monograma con el código FIFA, que renderiza igual en todas las plataformas.
 */
export function teamMonogram(team: { countryCode: string }): string {
  return team.countryCode.slice(0, 3).toUpperCase()
}
