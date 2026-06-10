/**
 * Tablas de referencia para enriquecer los datos reales de TheSportsDB.
 *
 * QUÉ ES REAL Y QUÉ ES ESTIMADO:
 *  - VENUE_TIMEZONES: zonas horarias IANA reales de cada sede del Mundial 2026.
 *  - TEAM_REFERENCE.code / flag / confederation: datos reales (códigos FIFA,
 *    banderas, confederación de cada selección).
 *  - TEAM_REFERENCE.rating: ESTIMACIÓN basada en el ranking FIFA (~2025). NO es
 *    un dato oficial; es solo la "fuerza" que alimenta el modelo baseline de
 *    predicción. Cuando se conecte la red neuronal, este número deja de usarse.
 *
 * Los nombres de equipo son las claves EXACTAS que devuelve TheSportsDB
 * (p. ej. "South Korea", "Bosnia-Herzegovina", "DR Congo", "Curaçao").
 */
import type { Team } from '#shared/types/football'

interface VenueInfo {
  tz: string // zona IANA real
  capacity: number // aforo aproximado para el Mundial
  altitudeM: number // altitud de la ciudad en metros
}

/**
 * Sede (strVenue de TheSportsDB) → info real (zona horaria, aforo, altitud).
 * Aforos aproximados para 2026; altitudes reales de cada ciudad.
 */
export const VENUE_INFO: Record<string, VenueInfo> = {
  'Estadio Azteca': { tz: 'America/Mexico_City', capacity: 87523, altitudeM: 2240 },
  'Estadio Akron': { tz: 'America/Mexico_City', capacity: 46232, altitudeM: 1560 },
  'Estadio BBVA': { tz: 'America/Monterrey', capacity: 53500, altitudeM: 540 },
  'BC Place': { tz: 'America/Vancouver', capacity: 54500, altitudeM: 0 },
  'BMO Field': { tz: 'America/Toronto', capacity: 45000, altitudeM: 76 },
  'AT&T Stadium': { tz: 'America/Chicago', capacity: 80000, altitudeM: 180 },
  'GEHA Field at Arrowhead Stadium': { tz: 'America/Chicago', capacity: 76416, altitudeM: 270 },
  'Reliant Stadium': { tz: 'America/Chicago', capacity: 72220, altitudeM: 15 },
  'Gillette Stadium': { tz: 'America/New_York', capacity: 65878, altitudeM: 90 },
  'Hard Rock Stadium': { tz: 'America/New_York', capacity: 64767, altitudeM: 2 },
  'Lincoln Financial Field': { tz: 'America/New_York', capacity: 69176, altitudeM: 12 },
  'Mercedes-Benz Stadium': { tz: 'America/New_York', capacity: 71000, altitudeM: 320 },
  'MetLife Stadium': { tz: 'America/New_York', capacity: 82500, altitudeM: 3 },
  'Levi\'s Stadium': { tz: 'America/Los_Angeles', capacity: 68500, altitudeM: 9 },
  'Lumen Field': { tz: 'America/Los_Angeles', capacity: 68740, altitudeM: 5 },
  'SoFi Stadium': { tz: 'America/Los_Angeles', capacity: 70240, altitudeM: 30 },
}

/** Compatibilidad: sede → zona horaria (derivado de VENUE_INFO). */
export const VENUE_TIMEZONES: Record<string, string> = Object.fromEntries(
  Object.entries(VENUE_INFO).map(([venue, info]) => [venue, info.tz]),
)

/** Zona por defecto si apareciera una sede no mapeada. */
export const DEFAULT_TIMEZONE = 'America/New_York'

type TeamRef = Pick<Team, 'countryCode' | 'confederation' | 'rating'> & { flag: string }

/**
 * code = código FIFA (real) · flag = emoji (real) · confederation = real
 * rating = ESTIMADO (ranking FIFA aprox. 2025, escala ~70–95)
 */
export const TEAM_REFERENCE: Record<string, TeamRef> = {
  Algeria: { countryCode: 'ALG', flag: '🇩🇿', confederation: 'CAF', rating: 80 },
  Argentina: { countryCode: 'ARG', flag: '🇦🇷', confederation: 'CONMEBOL', rating: 95 },
  Australia: { countryCode: 'AUS', flag: '🇦🇺', confederation: 'AFC', rating: 80 },
  Austria: { countryCode: 'AUT', flag: '🇦🇹', confederation: 'UEFA', rating: 82 },
  Belgium: { countryCode: 'BEL', flag: '🇧🇪', confederation: 'UEFA', rating: 87 },
  'Bosnia-Herzegovina': { countryCode: 'BIH', flag: '🇧🇦', confederation: 'UEFA', rating: 78 },
  Brazil: { countryCode: 'BRA', flag: '🇧🇷', confederation: 'CONMEBOL', rating: 91 },
  Canada: { countryCode: 'CAN', flag: '🇨🇦', confederation: 'CONCACAF', rating: 80 },
  'Cape Verde': { countryCode: 'CPV', flag: '🇨🇻', confederation: 'CAF', rating: 72 },
  Colombia: { countryCode: 'COL', flag: '🇨🇴', confederation: 'CONMEBOL', rating: 85 },
  Croatia: { countryCode: 'CRO', flag: '🇭🇷', confederation: 'UEFA', rating: 86 },
  'Curaçao': { countryCode: 'CUW', flag: '🇨🇼', confederation: 'CONCACAF', rating: 70 },
  'Czech Republic': { countryCode: 'CZE', flag: '🇨🇿', confederation: 'UEFA', rating: 79 },
  'DR Congo': { countryCode: 'COD', flag: '🇨🇩', confederation: 'CAF', rating: 78 },
  Ecuador: { countryCode: 'ECU', flag: '🇪🇨', confederation: 'CONMEBOL', rating: 81 },
  Egypt: { countryCode: 'EGY', flag: '🇪🇬', confederation: 'CAF', rating: 80 },
  England: { countryCode: 'ENG', flag: '🏴󠁧󠁢󠁥󠁮󠁧󠁿', confederation: 'UEFA', rating: 92 },
  France: { countryCode: 'FRA', flag: '🇫🇷', confederation: 'UEFA', rating: 94 },
  Germany: { countryCode: 'GER', flag: '🇩🇪', confederation: 'UEFA', rating: 88 },
  Ghana: { countryCode: 'GHA', flag: '🇬🇭', confederation: 'CAF', rating: 78 },
  Haiti: { countryCode: 'HAI', flag: '🇭🇹', confederation: 'CONCACAF', rating: 70 },
  Iran: { countryCode: 'IRN', flag: '🇮🇷', confederation: 'AFC', rating: 80 },
  Iraq: { countryCode: 'IRQ', flag: '🇮🇶', confederation: 'AFC', rating: 73 },
  'Ivory Coast': { countryCode: 'CIV', flag: '🇨🇮', confederation: 'CAF', rating: 80 },
  Japan: { countryCode: 'JPN', flag: '🇯🇵', confederation: 'AFC', rating: 84 },
  Jordan: { countryCode: 'JOR', flag: '🇯🇴', confederation: 'AFC', rating: 73 },
  Mexico: { countryCode: 'MEX', flag: '🇲🇽', confederation: 'CONCACAF', rating: 82 },
  Morocco: { countryCode: 'MAR', flag: '🇲🇦', confederation: 'CAF', rating: 86 },
  Netherlands: { countryCode: 'NED', flag: '🇳🇱', confederation: 'UEFA', rating: 89 },
  'New Zealand': { countryCode: 'NZL', flag: '🇳🇿', confederation: 'OFC', rating: 71 },
  Norway: { countryCode: 'NOR', flag: '🇳🇴', confederation: 'UEFA', rating: 82 },
  Panama: { countryCode: 'PAN', flag: '🇵🇦', confederation: 'CONCACAF', rating: 77 },
  Paraguay: { countryCode: 'PAR', flag: '🇵🇾', confederation: 'CONMEBOL', rating: 78 },
  Portugal: { countryCode: 'POR', flag: '🇵🇹', confederation: 'UEFA', rating: 90 },
  Qatar: { countryCode: 'QAT', flag: '🇶🇦', confederation: 'AFC', rating: 76 },
  'Saudi Arabia': { countryCode: 'KSA', flag: '🇸🇦', confederation: 'AFC', rating: 75 },
  Scotland: { countryCode: 'SCO', flag: '🏴󠁧󠁢󠁳󠁣󠁴󠁿', confederation: 'UEFA', rating: 80 },
  Senegal: { countryCode: 'SEN', flag: '🇸🇳', confederation: 'CAF', rating: 83 },
  'South Africa': { countryCode: 'RSA', flag: '🇿🇦', confederation: 'CAF', rating: 77 },
  'South Korea': { countryCode: 'KOR', flag: '🇰🇷', confederation: 'AFC', rating: 81 },
  Spain: { countryCode: 'ESP', flag: '🇪🇸', confederation: 'UEFA', rating: 93 },
  Sweden: { countryCode: 'SWE', flag: '🇸🇪', confederation: 'UEFA', rating: 79 },
  Switzerland: { countryCode: 'SUI', flag: '🇨🇭', confederation: 'UEFA', rating: 84 },
  Tunisia: { countryCode: 'TUN', flag: '🇹🇳', confederation: 'CAF', rating: 78 },
  Turkey: { countryCode: 'TUR', flag: '🇹🇷', confederation: 'UEFA', rating: 80 },
  Uruguay: { countryCode: 'URU', flag: '🇺🇾', confederation: 'CONMEBOL', rating: 85 },
  USA: { countryCode: 'USA', flag: '🇺🇸', confederation: 'CONCACAF', rating: 83 },
  Uzbekistan: { countryCode: 'UZB', flag: '🇺🇿', confederation: 'AFC', rating: 74 },
}

/** Fallback para una selección que no esté en la tabla (no debería ocurrir). */
export const DEFAULT_TEAM_REF: TeamRef = {
  countryCode: '???',
  flag: '🏳️',
  confederation: 'UEFA',
  rating: 70,
}
