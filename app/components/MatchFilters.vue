<script setup lang="ts">
import type { Stage } from '#shared/types/football'

const store = useMatchesStore()

const stageOptions: Array<{ value: Stage | ''; label: string }> = [
  { value: '', label: 'Todas las fases' },
  { value: 'GROUP', label: STAGE_LABELS.GROUP },
  { value: 'ROUND_OF_32', label: STAGE_LABELS.ROUND_OF_32 },
  { value: 'ROUND_OF_16', label: STAGE_LABELS.ROUND_OF_16 },
  { value: 'QUARTER_FINAL', label: STAGE_LABELS.QUARTER_FINAL },
  { value: 'SEMI_FINAL', label: STAGE_LABELS.SEMI_FINAL },
  { value: 'FINAL', label: STAGE_LABELS.FINAL },
]

// Grupos presentes en los datos cargados (evita ofrecer grupos vacíos).
const groupOptions = computed(() => {
  const groups = new Set(
    store.matches.filter((m) => m.group).map((m) => m.group as string),
  )
  return ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L'].filter(
    (g) => groups.size === 0 || groups.has(g),
  )
})

const hasActiveFilters = computed(() =>
  Object.values(store.filters).some((v) => v !== ''),
)

const labelClass = 'mb-1 block text-xs font-medium uppercase tracking-wide text-slate-400'
const inputClass =
  'w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-slate-100 ' +
  'focus:border-sky-500 focus:outline-none focus:ring-1 focus:ring-sky-500 [color-scheme:dark]'
</script>

<template>
  <aside class="space-y-4 rounded-2xl border border-slate-800 bg-slate-900/60 p-4 shadow-lg shadow-black/30">
    <h2 class="text-sm font-semibold uppercase tracking-wider text-slate-300">Filtros</h2>

    <div>
      <label :class="labelClass" for="filter-stage">Fase</label>
      <select
        id="filter-stage"
        :class="inputClass"
        :value="store.filters.stage"
        @change="store.setFilters({ stage: ($event.target as HTMLSelectElement).value as Stage | '' })"
      >
        <option v-for="opt in stageOptions" :key="opt.value" :value="opt.value">
          {{ opt.label }}
        </option>
      </select>
    </div>

    <!-- El grupo solo tiene sentido en fase de grupos -->
    <div v-if="store.filters.stage === 'GROUP'">
      <label :class="labelClass" for="filter-group">Grupo</label>
      <select
        id="filter-group"
        :class="inputClass"
        :value="store.filters.group"
        @change="store.setFilters({ group: ($event.target as HTMLSelectElement).value })"
      >
        <option value="">Todos los grupos</option>
        <option v-for="g in groupOptions" :key="g" :value="g">Grupo {{ g }}</option>
      </select>
    </div>

    <div>
      <label :class="labelClass" for="filter-team">Equipo</label>
      <select
        id="filter-team"
        :class="inputClass"
        :value="store.filters.teamId"
        @change="store.setFilters({ teamId: ($event.target as HTMLSelectElement).value })"
      >
        <option value="">Todos los equipos</option>
        <option v-for="team in store.teams" :key="team.id" :value="team.id">
          {{ teamFlag(team) }} {{ team.name }}
        </option>
      </select>
    </div>

    <div class="grid grid-cols-2 gap-3">
      <div>
        <label :class="labelClass" for="filter-from">Desde (PET)</label>
        <input
          id="filter-from"
          type="date"
          :class="inputClass"
          :value="store.filters.dateFrom"
          @change="store.setFilters({ dateFrom: ($event.target as HTMLInputElement).value })"
        >
      </div>
      <div>
        <label :class="labelClass" for="filter-to">Hasta (PET)</label>
        <input
          id="filter-to"
          type="date"
          :class="inputClass"
          :value="store.filters.dateTo"
          @change="store.setFilters({ dateTo: ($event.target as HTMLInputElement).value })"
        >
      </div>
    </div>

    <button
      type="button"
      class="w-full rounded-lg border border-slate-700 px-3 py-2 text-sm font-medium text-slate-300
             transition-colors hover:border-slate-500 hover:text-white
             disabled:cursor-not-allowed disabled:opacity-40"
      :disabled="!hasActiveFilters"
      @click="store.clearFilters()"
    >
      Limpiar filtros
    </button>
  </aside>
</template>
