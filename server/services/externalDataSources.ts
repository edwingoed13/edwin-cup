/**
 * Stubs de fuentes de datos externas.
 *
 * Aquí es donde, más adelante, se conectarán proveedores reales:
 *  - fetchLatestOdds  → API de casas de apuestas / agregadores de cuotas.
 *                       El parsing típico convierte cuotas decimales en
 *                       probabilidades implícitas (1/cuota, normalizadas).
 *  - fetchNewsForMatch→ API de noticias deportivas o RSS; se filtraría por
 *                       equipos del partido y se resumiría para la UI.
 *  - fetchLineups     → proveedor de alineaciones confirmadas (suelen
 *                       publicarse ~1h antes del kickoff).
 *
 * Por ahora devuelven datos simulados con la misma forma que tendría la
 * respuesta real, para que la UI y el modelo puedan desarrollarse sin red.
 */

export interface OddsSnapshot {
  matchId: string
  source: string
  decimalOdds: { home: number; draw: number; away: number }
  fetchedAt: string
}

export interface NewsItem {
  matchId: string
  title: string
  summary: string
  publishedAt: string
}

export interface Lineup {
  matchId: string
  homeFormation: string
  awayFormation: string
  confirmed: boolean
}

export async function fetchLatestOdds(matchId: string): Promise<OddsSnapshot> {
  // TODO: reemplazar por llamada HTTP real ($fetch a un proveedor de cuotas).
  return {
    matchId,
    source: 'stub-odds-provider',
    decimalOdds: { home: 2.1, draw: 3.3, away: 3.6 },
    fetchedAt: new Date().toISOString(),
  }
}

export async function fetchNewsForMatch(matchId: string): Promise<NewsItem[]> {
  // TODO: reemplazar por integración con API de noticias y filtrado por equipo.
  return [
    {
      matchId,
      title: 'Noticia simulada: ambos equipos completan su último entrenamiento',
      summary: 'Contenido de ejemplo generado localmente para desarrollo.',
      publishedAt: new Date().toISOString(),
    },
  ]
}

export async function fetchLineups(matchId: string): Promise<Lineup> {
  // TODO: reemplazar por proveedor de alineaciones confirmadas.
  return {
    matchId,
    homeFormation: '4-3-3',
    awayFormation: '4-2-3-1',
    confirmed: false,
  }
}
