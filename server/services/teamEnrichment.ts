/**
 * Enriquecimiento de equipos con datos REALES de TheSportsDB:
 *  - badge: URL del escudo oficial (lookupteam).
 *  - recentForm: últimos resultados (eventslast) vistos desde el equipo (W/D/L).
 *  - formScore: 0..1 derivado de la racha, que alimenta el modelo de predicción.
 *
 * La key gratuita limita a ~30 req/min (responde 429 si te pasas). Por eso el
 * enriquecimiento NO bloquea la respuesta: corre en segundo plano, throttleado
 * (una llamada cada ~2.2 s, con backoff si hay 429) y va persistiendo el
 * snapshot. El dashboard sirve al instante con lo ya cacheado (y la UI cae a la
 * bandera emoji mientras un escudo no haya llegado). Tras la primera pasada,
 * todo queda en el snapshot y se sirve al instante para siempre.
 */
import type { FormResult, Team } from '#shared/types/football'

const API_KEY = process.env.THESPORTSDB_KEY || '3'
const BASE = `https://www.thesportsdb.com/api/v1/json/${API_KEY}`
const FORM_TTL_MS = 6 * 60 * 60 * 1000 // 6 h
const MAX_FORM = 5
const MIN_INTERVAL_MS = 2200 // ~27 req/min, bajo el límite de la key gratuita
const BACKOFF_MS = 60_000 // espera tras un 429

interface Enrichment {
  badge?: string
  friendlyForm?: FormResult[] // lo que da eventslast (amistosos/clasificatorias, free=1)
  formFetchedAt: number
}

const cache = new Map<string, Enrichment>()
let running = false

/** Combina dos listas de forma: dedupe por fecha+rival, orden por fecha desc, top N. */
export function combineForms(a: FormResult[], b: FormResult[], max: number): FormResult[] {
  const seen = new Set<string>()
  return [...a, ...b]
    .filter((f) => {
      const k = `${f.date}|${f.opponent}`
      if (seen.has(k)) return false
      seen.add(k)
      return true
    })
    .sort((x, y) => y.date.localeCompare(x.date))
    .slice(0, max)
}

export function computeFormScore(form: FormResult[]): number | undefined {
  if (form.length === 0) return undefined
  const pts = form.reduce((s, f) => s + (f.result === 'W' ? 3 : f.result === 'D' ? 1 : 0), 0)
  return Math.round((pts / (3 * form.length)) * 1000) / 1000
}

const sleep = (ms: number) => new Promise<void>((r) => setTimeout(r, ms))

function is429(err: unknown): boolean {
  const e = err as { statusCode?: number; status?: number; response?: { status?: number }; message?: string }
  return e?.statusCode === 429 || e?.status === 429 || e?.response?.status === 429 ||
    (typeof e?.message === 'string' && e.message.includes('429'))
}

/** Siembra la cache desde un snapshot ya enriquecido (evita refetch offline). */
export function seedEnrichmentFromTeams(teams: Team[]): void {
  for (const t of teams) {
    if (t.badge || t.recentForm) {
      cache.set(t.id, {
        badge: t.badge,
        // El snapshot guarda la forma ya combinada; el dedup posterior evita dobles.
        friendlyForm: t.recentForm,
        formFetchedAt: Date.now(),
      })
    }
  }
}

/**
 * Mezcla (sin red) el enriquecimiento sobre la lista de equipos. La forma final
 * combina la del MUNDIAL (ya presente en t.recentForm, calculada de nuestros
 * datos) con la externa de eventslast (cacheada). Así crece hasta 5 durante el
 * torneo sin depender del límite de la API.
 */
export function mergeEnrichment(teams: Team[]): Team[] {
  return teams.map((t) => {
    const c = cache.get(t.id)
    const combined = combineForms(t.recentForm ?? [], c?.friendlyForm ?? [], MAX_FORM)
    return {
      ...t,
      badge: c?.badge ?? t.badge,
      recentForm: combined.length ? combined : t.recentForm,
      formScore: combined.length ? computeFormScore(combined) : t.formScore,
    }
  })
}

interface RawResult {
  idHomeTeam: string
  strHomeTeam: string
  strAwayTeam: string
  intHomeScore: string | null
  intAwayScore: string | null
  dateEvent: string
  strLeague?: string
}

function toFormResult(e: RawResult, teamId: string): FormResult | null {
  if (e.intHomeScore === null || e.intAwayScore === null) return null
  const home = e.idHomeTeam === teamId
  const gf = Number(home ? e.intHomeScore : e.intAwayScore)
  const ga = Number(home ? e.intAwayScore : e.intHomeScore)
  if (Number.isNaN(gf) || Number.isNaN(ga)) return null
  return {
    result: gf > ga ? 'W' : gf < ga ? 'L' : 'D',
    opponent: home ? e.strAwayTeam : e.strHomeTeam,
    score: `${gf}-${ga}`,
    date: e.dateEvent,
    competition: e.strLeague,
  }
}

async function fetchBadge(teamId: string): Promise<string | undefined> {
  const j = await $fetch<{ teams: Array<{ strBadge?: string }> | null }>(
    `${BASE}/lookupteam.php`,
    { query: { id: teamId }, timeout: 12_000, retry: 0 },
  )
  return j?.teams?.[0]?.strBadge || undefined
}

async function fetchFriendlyForm(teamId: string): Promise<FormResult[]> {
  const j = await $fetch<{ results: RawResult[] | null }>(`${BASE}/eventslast.php`, {
    query: { id: teamId },
    timeout: 12_000,
    retry: 0,
  })
  return (j?.results ?? [])
    .map((e) => toFormResult(e, teamId))
    .filter((f): f is FormResult => f !== null)
    .slice(0, MAX_FORM)
}

type Task = { teamId: string; kind: 'badge' | 'form' }

async function runQueue(tasks: Task[], persist: () => void): Promise<void> {
  for (const task of tasks) {
    // Reintenta SOLO ante 429 (con backoff); otros errores: se salta la tarea.
    for (;;) {
      try {
        const c: Enrichment = cache.get(task.teamId) ?? { formFetchedAt: 0 }
        if (task.kind === 'badge') {
          c.badge = await fetchBadge(task.teamId)
        } else {
          c.friendlyForm = await fetchFriendlyForm(task.teamId)
          c.formFetchedAt = Date.now()
        }
        cache.set(task.teamId, c)
        persist()
        await sleep(MIN_INTERVAL_MS)
        break
      } catch (err) {
        if (is429(err)) {
          await sleep(BACKOFF_MS)
          continue
        }
        break // error no recuperable para esta tarea
      }
    }
  }
}

/**
 * Arranca (si no corre ya) el enriquecimiento en segundo plano de los equipos
 * que aún no tienen escudo o cuya forma está vencida. No bloquea.
 */
export function ensureEnrichment(teams: Team[], persist: () => void): void {
  if (running) return

  const now = Date.now()
  const badgeTasks: Task[] = []
  const formTasks: Task[] = []
  for (const t of teams) {
    const c = cache.get(t.id)
    if (!c?.badge) badgeTasks.push({ teamId: t.id, kind: 'badge' })
    if (!c?.friendlyForm || now - (c?.formFetchedAt ?? 0) > FORM_TTL_MS) {
      formTasks.push({ teamId: t.id, kind: 'form' })
    }
  }
  // Escudos primero (impacto visual), luego forma.
  const tasks = [...badgeTasks, ...formTasks]
  if (tasks.length === 0) return

  running = true
  void runQueue(tasks, persist).finally(() => {
    running = false
  })
}
