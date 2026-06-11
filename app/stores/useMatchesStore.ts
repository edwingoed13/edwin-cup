import { defineStore } from 'pinia'
import type {
  GroupStanding,
  MatchFiltersState,
  MatchWithTeams,
  Prediction,
  Team,
} from '#shared/types/football'

const EMPTY_FILTERS: MatchFiltersState = {
  stage: '',
  group: '',
  teamId: '',
  dateFrom: '',
  dateTo: '',
}

interface MatchesState {
  matches: MatchWithTeams[]
  teams: Team[]
  predictions: Record<string, Prediction>
  standings: GroupStanding[]
  selectedMatchId: string | null
  filters: MatchFiltersState
  loadingMatches: boolean
  error: string | null
}

export const useMatchesStore = defineStore('matches', {
  state: (): MatchesState => ({
    matches: [],
    teams: [],
    predictions: {},
    standings: [],
    selectedMatchId: null,
    filters: { ...EMPTY_FILTERS },
    loadingMatches: false,
    error: null,
  }),

  getters: {
    selectedMatch(state): MatchWithTeams | null {
      return state.matches.find((m) => m.id === state.selectedMatchId) ?? null
    },
    selectedPrediction(state): Prediction | null {
      return state.selectedMatchId ? (state.predictions[state.selectedMatchId] ?? null) : null
    },
  },

  actions: {
    async fetchTeams(): Promise<void> {
      if (this.teams.length > 0) return
      this.teams = await $fetch<Team[]>('/api/teams')
    },

    async fetchMatches(): Promise<void> {
      this.loadingMatches = true
      this.error = null
      try {
        // Solo se envían los filtros con valor para no ensuciar la query.
        const query = Object.fromEntries(
          Object.entries(this.filters).filter(([, v]) => v !== '' && v !== null),
        )
        this.matches = await $fetch<MatchWithTeams[]>('/api/matches', { query })

        // Si el partido seleccionado ya no pasa los filtros, se deselecciona.
        if (this.selectedMatchId && !this.matches.some((m) => m.id === this.selectedMatchId)) {
          this.selectedMatchId = null
        }

        // Pre-carga las predicciones de la lista en UNA sola petición batch
        // (antes era un N+1: una llamada HTTP por partido, ~72 al cargar).
        await this.fetchPredictions(this.matches.map((m) => m.id))
      } catch (e) {
        this.error = e instanceof Error ? e.message : 'Error cargando partidos'
      } finally {
        this.loadingMatches = false
      }
    },

    async fetchStandings(): Promise<void> {
      try {
        this.standings = await $fetch<GroupStanding[]>('/api/standings')
      } catch {
        // La tabla es secundaria; un fallo no debe romper el dashboard.
      }
    },

    async fetchPrediction(matchId: string): Promise<void> {
      try {
        this.predictions[matchId] = await $fetch<Prediction>(`/api/predictions/${matchId}`)
      } catch {
        // Una predicción fallida no debe romper el dashboard completo.
      }
    },

    /** Carga en lote las predicciones de varios partidos en una sola petición. */
    async fetchPredictions(ids: string[]): Promise<void> {
      if (!ids.length) return
      try {
        const map = await $fetch<Record<string, Prediction>>('/api/predictions', {
          query: { ids: ids.join(',') },
        })
        this.predictions = { ...this.predictions, ...map }
      } catch {
        // Las predicciones son secundarias; un fallo no debe romper el dashboard.
      }
    },

    /** Re-fetch del partido seleccionado + su predicción (lo usa el polling LIVE). */
    async refreshSelectedMatch(): Promise<void> {
      const id = this.selectedMatchId
      if (!id) return
      const fresh = await $fetch<MatchWithTeams>(`/api/matches/${id}`)
      const idx = this.matches.findIndex((m) => m.id === id)
      if (idx !== -1) this.matches[idx] = fresh
      await this.fetchPrediction(id)
    },

    async setSelectedMatchId(matchId: string | null): Promise<void> {
      this.selectedMatchId = matchId
      if (matchId && !this.predictions[matchId]) {
        await this.fetchPrediction(matchId)
      }
    },

    async setFilters(partial: Partial<MatchFiltersState>): Promise<void> {
      this.filters = { ...this.filters, ...partial }
      // El grupo solo aplica a fase de grupos.
      if (this.filters.stage !== 'GROUP') this.filters.group = ''
      await this.fetchMatches()
    },

    async clearFilters(): Promise<void> {
      this.filters = { ...EMPTY_FILTERS }
      await this.fetchMatches()
    },
  },
})
