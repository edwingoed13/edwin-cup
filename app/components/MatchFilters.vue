<script setup lang="ts">
import type { Stage } from '#shared/types/football'

const store = useMatchesStore()

// Centinela para la opción "Todas/Todos": reka-ui (base de USelect/USelectMenu)
// prohíbe value="" en un item. En el store, '' sigue significando "sin filtro".
const ALL = '__all__'

const stageItems: Array<{ label: string; value: string }> = [
  { label: 'Todas las fases', value: ALL },
  { label: STAGE_LABELS.GROUP, value: 'GROUP' },
  { label: STAGE_LABELS.ROUND_OF_32, value: 'ROUND_OF_32' },
  { label: STAGE_LABELS.ROUND_OF_16, value: 'ROUND_OF_16' },
  { label: STAGE_LABELS.QUARTER_FINAL, value: 'QUARTER_FINAL' },
  { label: STAGE_LABELS.SEMI_FINAL, value: 'SEMI_FINAL' },
  { label: STAGE_LABELS.FINAL, value: 'FINAL' },
]

// Grupos presentes en los datos cargados (evita ofrecer grupos vacíos).
const groupItems = computed(() => {
  const present = new Set(store.matches.filter((m) => m.group).map((m) => m.group as string))
  const groups = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L'].filter(
    (g) => present.size === 0 || present.has(g),
  )
  return [
    { label: 'Todos los grupos', value: ALL },
    ...groups.map((g) => ({ label: `Grupo ${g}`, value: g })),
  ]
})

// Equipos con escudo real (UAvatar cae a iniciales si falta `badge`).
const teamItems = computed(() => [
  { label: 'Todos los equipos', value: ALL },
  ...store.teams.map((t) => ({ label: t.name, value: t.id, avatar: { src: t.badge, alt: t.name } })),
])

// Puentes v-model hacia el store (cada cambio dispara el re-fetch de partidos).
// El centinela ALL se traduce a '' al escribir, y '' se muestra como ALL al leer.
const stage = computed<string>({
  get: () => store.filters.stage || ALL,
  set: (v) => store.setFilters({ stage: v === ALL ? '' : (v as Stage) }),
})
const group = computed<string>({
  get: () => store.filters.group || ALL,
  set: (v) => store.setFilters({ group: v === ALL ? '' : v }),
})
const teamId = computed<string>({
  get: () => store.filters.teamId || ALL,
  set: (v) => store.setFilters({ teamId: v === ALL ? '' : (v ?? '') }),
})
const dateFrom = computed({
  get: () => store.filters.dateFrom,
  set: (v) => store.setFilters({ dateFrom: v ?? '' }),
})
const dateTo = computed({
  get: () => store.filters.dateTo,
  set: (v) => store.setFilters({ dateTo: v ?? '' }),
})

const activeCount = computed(() => Object.values(store.filters).filter((v) => v !== '').length)
</script>

<template>
  <aside class="space-y-4 rounded-card border border-default bg-muted p-5">
    <div class="flex items-center justify-between">
      <h2 class="text-sm font-semibold text-highlighted">Filtros</h2>
      <UBadge v-if="activeCount" color="primary" variant="soft" size="sm">
        {{ activeCount }} activo{{ activeCount > 1 ? 's' : '' }}
      </UBadge>
    </div>

    <UFormField label="Fase">
      <USelect v-model="stage" :items="stageItems" class="w-full" />
    </UFormField>

    <!-- El grupo solo tiene sentido en fase de grupos -->
    <UFormField v-if="store.filters.stage === 'GROUP'" label="Grupo">
      <USelect v-model="group" :items="groupItems" class="w-full" />
    </UFormField>

    <UFormField label="Equipo">
      <USelectMenu
        v-model="teamId"
        :items="teamItems"
        value-key="value"
        icon="i-lucide-search"
        placeholder="Todos los equipos"
        class="w-full"
      />
    </UFormField>

    <div class="grid grid-cols-2 gap-3">
      <UFormField label="Desde (PET)">
        <UInput v-model="dateFrom" type="date" class="w-full" />
      </UFormField>
      <UFormField label="Hasta (PET)">
        <UInput v-model="dateTo" type="date" class="w-full" />
      </UFormField>
    </div>

    <UButton
      block
      color="neutral"
      variant="outline"
      icon="i-lucide-filter-x"
      :disabled="!activeCount"
      @click="store.clearFilters()"
    >
      Limpiar filtros
    </UButton>
  </aside>
</template>
