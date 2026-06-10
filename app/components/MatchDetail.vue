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
  <aside class="rounded-2xl border border-slate-800 bg-slate-900/60 p-5 shadow-lg shadow-black/30">
    <div
      v-if="!match"
      class="flex h-64 items-center justify-center text-center text-sm text-slate-500"
    >
      Selecciona un partido de la lista<br >para ver el análisis completo.
    </div>

    <div v-else class="space-y-5">
      <!-- Cabecera: fase + estado -->
      <div class="flex items-center justify-between gap-2">
        <p class="text-xs font-medium uppercase tracking-wider text-slate-400">
          {{ STAGE_LABELS[match.stage] }}<template v-if="match.group"> · Grupo {{ match.group }}</template>
        </p>
        <span
          class="rounded-full px-2.5 py-1 text-[11px] font-bold tracking-wide"
          :class="STATUS_BADGE_CLASSES[match.status]"
        >
          {{ STATUS_LABELS[match.status] }}
          <template v-if="match.status === 'LIVE' && isPolling"> · actualizando</template>
        </span>
      </div>

      <!-- Marcador / enfrentamiento -->
      <div class="grid grid-cols-[1fr_auto_1fr] items-center gap-3 text-center">
        <div class="flex flex-col items-center">
          <TeamCrest :team="match.homeTeam" :size="44" />
          <p class="mt-1 font-semibold leading-tight">{{ match.homeTeam.name }}</p>
        </div>
        <div class="text-3xl font-black tabular-nums text-slate-100">
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
        class="space-y-2 rounded-xl border border-slate-800 bg-slate-950/50 p-3"
      >
        <h3 class="text-xs font-semibold uppercase tracking-wider text-slate-400">
          Forma reciente <span class="font-normal normal-case text-slate-600">· crece con el Mundial</span>
        </h3>
        <div class="flex items-center justify-between gap-2">
          <span class="truncate text-sm text-slate-300">{{ match.homeTeam.name }}</span>
          <FormDots :form="match.homeTeam.recentForm ?? []" />
        </div>
        <div class="flex items-center justify-between gap-2">
          <span class="truncate text-sm text-slate-300">{{ match.awayTeam.name }}</span>
          <FormDots :form="match.awayTeam.recentForm ?? []" />
        </div>
      </div>

      <!-- Datos en vivo (solo LIVE y si existen en extraData) -->
      <div
        v-if="match.status === 'LIVE' && match.extraData"
        class="grid grid-cols-3 gap-2 rounded-xl border border-red-500/20 bg-red-500/5 p-3 text-center text-sm"
      >
        <div v-if="match.extraData.possessionHome != null">
          <p class="text-[10px] uppercase tracking-wide text-slate-400">Posesión</p>
          <p class="font-bold tabular-nums">
            {{ match.extraData.possessionHome }}% – {{ 100 - match.extraData.possessionHome }}%
          </p>
        </div>
        <div v-if="match.extraData.xGHome != null">
          <p class="text-[10px] uppercase tracking-wide text-slate-400">xG</p>
          <p class="font-bold tabular-nums">{{ match.extraData.xGHome }} – {{ match.extraData.xGAway }}</p>
        </div>
        <div v-if="match.extraData.cardsHome != null">
          <p class="text-[10px] uppercase tracking-wide text-slate-400">Tarjetas</p>
          <p class="font-bold tabular-nums">{{ match.extraData.cardsHome }} – {{ match.extraData.cardsAway }}</p>
        </div>
      </div>

      <!-- Sede y horarios -->
      <div class="space-y-1.5 rounded-xl border border-slate-800 bg-slate-950/50 p-3 text-sm">
        <p class="font-medium text-slate-200">
          🏟️ {{ match.stadium }} · {{ match.city }}, {{ match.country }}
        </p>
        <p v-if="match.stadiumCapacity || match.altitudeM != null" class="text-slate-400">
          <span v-if="match.stadiumCapacity">Aforo ~{{ match.stadiumCapacity.toLocaleString('es-PE') }}</span>
          <span v-if="match.stadiumCapacity && match.altitudeM != null" class="text-slate-600"> · </span>
          <span v-if="match.altitudeM != null">
            Altitud {{ match.altitudeM.toLocaleString('es-PE') }} m
            <span v-if="match.altitudeM >= 1500" class="text-amber-300">⛰️ exigente</span>
          </span>
        </p>
        <p class="text-slate-400">
          Hora sede: <span class="tabular-nums text-slate-200">{{ formatLocalKickoff(match.kickoffLocal) }}</span>
          <span class="text-slate-600"> ({{ match.timezone }})</span>
        </p>
        <p class="text-slate-400">
          Hora Perú: <span class="font-semibold tabular-nums text-sky-300">{{ formatPET(match.kickoffPET) }} PET</span>
        </p>
        <p v-if="match.referee" class="text-slate-400">Árbitro: {{ match.referee }}</p>
      </div>

      <!-- Comparativa de equipos -->
      <div>
        <h3 class="mb-2 text-xs font-semibold uppercase tracking-wider text-slate-400">
          Comparativa
        </h3>
        <div class="space-y-1 text-sm">
          <div
            v-for="row in teamStatRows"
            :key="row.label"
            class="grid grid-cols-[3rem_1fr_3rem] items-center gap-2 tabular-nums"
          >
            <span class="font-semibold" :class="row.home >= row.away ? 'text-sky-300' : 'text-slate-300'">
              {{ row.home }}
            </span>
            <span class="text-center text-xs text-slate-500">{{ row.label }}</span>
            <span
              class="text-right font-semibold"
              :class="row.away >= row.home ? 'text-amber-300' : 'text-slate-300'"
            >
              {{ row.away }}
            </span>
          </div>
        </div>
      </div>

      <!-- Predicción -->
      <div v-if="prediction">
        <div class="mb-2 flex items-center justify-between">
          <h3 class="text-xs font-semibold uppercase tracking-wider text-slate-400">
            Probabilidades
          </h3>
          <span class="text-[10px] text-slate-500">
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
            <span class="text-xs font-semibold uppercase tracking-wider text-slate-400">Cuotas</span>
            <span class="text-[10px] text-slate-500">estimadas del modelo · no de mercado</span>
          </div>
          <div class="grid grid-cols-3 gap-2 text-center">
            <div class="rounded-lg border border-slate-800 bg-slate-950/50 py-2">
              <p class="text-[10px] uppercase text-slate-500">1 · {{ match.homeTeam.countryCode }}</p>
              <p class="font-bold tabular-nums text-sky-300">{{ prediction.estimatedOdds.home.toFixed(2) }}</p>
            </div>
            <div class="rounded-lg border border-slate-800 bg-slate-950/50 py-2">
              <p class="text-[10px] uppercase text-slate-500">X · empate</p>
              <p class="font-bold tabular-nums text-slate-200">{{ prediction.estimatedOdds.draw.toFixed(2) }}</p>
            </div>
            <div class="rounded-lg border border-slate-800 bg-slate-950/50 py-2">
              <p class="text-[10px] uppercase text-slate-500">2 · {{ match.awayTeam.countryCode }}</p>
              <p class="font-bold tabular-nums text-amber-300">{{ prediction.estimatedOdds.away.toFixed(2) }}</p>
            </div>
          </div>
        </div>

        <p class="mt-3 rounded-xl border border-slate-800 bg-slate-950/50 p-3 text-sm leading-relaxed text-slate-300">
          💡 {{ prediction.explanation }}
        </p>
      </div>
      <p v-else class="text-sm text-slate-500">Calculando predicción…</p>
    </div>
  </aside>
</template>
