<script setup lang="ts">
const store = useMatchesStore()

// Polling automático cuando el partido seleccionado está LIVE (punto 7).
const { isPolling } = useLiveUpdates(45_000)

const match = computed(() => store.selectedMatch)
const prediction = computed(() => store.selectedPrediction)

const teamStatRows = computed(() => {
  if (!match.value) return []
  return [
    { label: 'Rating', home: match.value.homeTeam.rating, away: match.value.awayTeam.rating },
    { label: 'Ataque', home: match.value.homeTeam.attackStrength, away: match.value.awayTeam.attackStrength },
    { label: 'Defensa', home: match.value.homeTeam.defenseStrength, away: match.value.awayTeam.defenseStrength },
  ]
})
</script>

<template>
  <aside class="rounded-card border border-default bg-muted p-5">
    <div
      v-if="!match"
      class="flex h-64 flex-col items-center justify-center gap-2 text-center"
    >
      <UIcon name="i-lucide-mouse-pointer-click" class="size-8 text-dimmed" />
      <p class="max-w-48 text-sm text-muted">
        Selecciona un partido de la lista para ver el análisis completo.
      </p>
    </div>

    <div v-else class="space-y-5">
      <!-- Cabecera: fase + estado -->
      <div class="flex items-center justify-between gap-2">
        <p class="text-xs font-medium uppercase tracking-wider text-muted">
          {{ STAGE_LABELS[match.stage] }}<template v-if="match.group"> · Grupo {{ match.group }}</template>
        </p>
        <UBadge
          :color="STATUS_UI[match.status].color"
          :icon="STATUS_UI[match.status].icon"
          variant="soft"
          size="sm"
          :class="match.status === 'LIVE' && 'animate-pulse'"
        >
          {{ STATUS_UI[match.status].label
          }}<template v-if="match.status === 'LIVE' && isPolling"> · actualizando</template>
        </UBadge>
      </div>

      <!-- Marcador / enfrentamiento -->
      <div class="grid grid-cols-[1fr_auto_1fr] items-center gap-3 text-center">
        <div class="flex flex-col items-center">
          <TeamCrest :team="match.homeTeam" :size="44" />
          <p class="mt-1 font-semibold leading-tight">{{ match.homeTeam.name }}</p>
        </div>
        <div class="text-3xl font-black tabular-nums text-highlighted">
          <template v-if="match.score">{{ match.score.home }}–{{ match.score.away }}</template>
          <template v-else>vs</template>
        </div>
        <div class="flex flex-col items-center">
          <TeamCrest :team="match.awayTeam" :size="44" />
          <p class="mt-1 font-semibold leading-tight">{{ match.awayTeam.name }}</p>
        </div>
      </div>

      <!-- Forma reciente (datos reales: últimos resultados de cada selección) -->
      <div
        v-if="match.homeTeam.recentForm?.length || match.awayTeam.recentForm?.length"
        class="space-y-2 rounded-lg border border-default bg-default p-3"
      >
        <h3 class="text-xs font-semibold uppercase tracking-wider text-muted">
          Forma reciente <span class="font-normal normal-case text-dimmed">· crece con el Mundial</span>
        </h3>
        <div class="flex items-center justify-between gap-2">
          <span class="truncate text-sm text-default">{{ match.homeTeam.name }}</span>
          <FormDots :form="match.homeTeam.recentForm ?? []" />
        </div>
        <div class="flex items-center justify-between gap-2">
          <span class="truncate text-sm text-default">{{ match.awayTeam.name }}</span>
          <FormDots :form="match.awayTeam.recentForm ?? []" />
        </div>
      </div>

      <!-- Datos en vivo (solo LIVE y si existen en extraData) -->
      <div
        v-if="match.status === 'LIVE' && match.extraData"
        class="grid grid-cols-3 gap-2 rounded-lg border border-error/20 bg-error/10 p-3 text-center text-sm"
      >
        <div v-if="match.extraData.possessionHome != null">
          <p class="text-xs uppercase tracking-wide text-muted">Posesión</p>
          <p class="font-bold tabular-nums">
            {{ match.extraData.possessionHome }}% – {{ 100 - match.extraData.possessionHome }}%
          </p>
        </div>
        <div v-if="match.extraData.xGHome != null">
          <p class="text-xs uppercase tracking-wide text-muted">xG</p>
          <p class="font-bold tabular-nums">{{ match.extraData.xGHome }} – {{ match.extraData.xGAway }}</p>
        </div>
        <div v-if="match.extraData.cardsHome != null">
          <p class="text-xs uppercase tracking-wide text-muted">Tarjetas</p>
          <p class="font-bold tabular-nums">{{ match.extraData.cardsHome }} – {{ match.extraData.cardsAway }}</p>
        </div>
      </div>

      <!-- Sede y horarios -->
      <div class="space-y-1.5 rounded-lg border border-default bg-default p-3 text-sm">
        <p class="flex items-center gap-1.5 font-medium text-default">
          <UIcon name="i-lucide-map-pin" class="size-4 shrink-0 text-muted" />
          {{ match.stadium }} · {{ match.city }}, {{ match.country }}
        </p>
        <p v-if="match.stadiumCapacity || match.altitudeM != null" class="text-muted">
          <span v-if="match.stadiumCapacity">Aforo ~{{ match.stadiumCapacity.toLocaleString('es-PE') }}</span>
          <span v-if="match.stadiumCapacity && match.altitudeM != null" class="text-dimmed"> · </span>
          <span v-if="match.altitudeM != null">
            Altitud {{ match.altitudeM.toLocaleString('es-PE') }} m
            <span
              v-if="match.altitudeM >= 1500"
              class="inline-flex items-center gap-1 align-middle text-warning"
            >
              <UIcon name="i-lucide-mountain" class="size-3.5" /> exigente
            </span>
          </span>
        </p>
        <p class="text-muted">
          Hora sede: <span class="tabular-nums text-default">{{ formatLocalKickoff(match.kickoffLocal) }}</span>
          <span class="text-dimmed"> ({{ match.timezone }})</span>
        </p>
        <p class="text-muted">
          Hora Perú: <span class="font-semibold tabular-nums text-sky-300">{{ formatPET(match.kickoffPET) }} PET</span>
        </p>
        <p v-if="match.referee" class="text-muted">Árbitro: {{ match.referee }}</p>
      </div>

      <!-- Comparativa de equipos -->
      <div>
        <h3 class="mb-2 text-xs font-semibold uppercase tracking-wider text-muted">
          Comparativa
        </h3>
        <div class="space-y-1 text-sm">
          <div
            v-for="row in teamStatRows"
            :key="row.label"
            class="grid grid-cols-[3rem_1fr_3rem] items-center gap-2 tabular-nums"
          >
            <span class="font-semibold" :class="row.home >= row.away ? 'text-sky-300' : 'text-default'">
              {{ row.home }}
            </span>
            <span class="text-center text-xs text-muted">{{ row.label }}</span>
            <span
              class="text-right font-semibold"
              :class="row.away >= row.home ? 'text-amber-300' : 'text-default'"
            >
              {{ row.away }}
            </span>
          </div>
        </div>
      </div>

      <!-- Predicción -->
      <div v-if="prediction">
        <div class="mb-2 flex items-center justify-between">
          <h3 class="text-xs font-semibold uppercase tracking-wider text-muted">
            Probabilidades
          </h3>
          <span class="text-xs text-muted">
            modelo {{ prediction.model }} · confianza {{ formatPercent(prediction.confidence) }}
          </span>
        </div>
        <ProbabilityBars
          :prediction="prediction"
          variant="full"
          :home-label="match.homeTeam.name"
          :away-label="match.awayTeam.name"
        />

        <!-- Cuotas estimadas (del modelo, NO de casas de apuestas) -->
        <div class="mt-3">
          <div class="mb-1 flex items-center justify-between">
            <span class="text-xs font-semibold uppercase tracking-wider text-muted">Cuotas</span>
            <span class="text-xs text-muted">estimadas del modelo · no de mercado</span>
          </div>
          <div class="grid grid-cols-3 gap-2 text-center">
            <div class="rounded-lg border border-default bg-default py-2">
              <p class="text-xs uppercase text-muted">1 · {{ match.homeTeam.countryCode }}</p>
              <p class="font-bold tabular-nums text-sky-300">{{ prediction.estimatedOdds.home.toFixed(2) }}</p>
            </div>
            <div class="rounded-lg border border-default bg-default py-2">
              <p class="text-xs uppercase text-muted">X · empate</p>
              <p class="font-bold tabular-nums text-default">{{ prediction.estimatedOdds.draw.toFixed(2) }}</p>
            </div>
            <div class="rounded-lg border border-default bg-default py-2">
              <p class="text-xs uppercase text-muted">2 · {{ match.awayTeam.countryCode }}</p>
              <p class="font-bold tabular-nums text-amber-300">{{ prediction.estimatedOdds.away.toFixed(2) }}</p>
            </div>
          </div>
        </div>

        <UAlert
          class="mt-3"
          color="neutral"
          variant="soft"
          icon="i-lucide-sparkles"
          :description="prediction.explanation"
        />
      </div>
      <p v-else class="text-sm text-muted">Calculando predicción…</p>
    </div>
  </aside>
</template>
