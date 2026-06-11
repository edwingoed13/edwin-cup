<script setup lang="ts">
import type { Prediction } from '#shared/types/football'

const props = withDefaults(
  defineProps<{
    prediction: Prediction
    /** mini: barra única segmentada (lista) | full: tres filas con % (detalle) */
    variant?: 'mini' | 'full'
    homeLabel?: string
    awayLabel?: string
  }>(),
  { variant: 'mini', homeLabel: 'Local', awayLabel: 'Visita' },
)

const widths = computed(() => ({
  home: `${props.prediction.probHomeWin * 100}%`,
  draw: `${props.prediction.probDraw * 100}%`,
  away: `${props.prediction.probAwayWin * 100}%`,
}))

// Resumen accesible: el lector de pantalla anuncia las 3 probabilidades en vez
// de leer la estructura de barras suelta.
const ariaSummary = computed(
  () =>
    `Probabilidades — ${props.homeLabel} ${formatPercent(props.prediction.probHomeWin)}, ` +
    `empate ${formatPercent(props.prediction.probDraw)}, ` +
    `${props.awayLabel} ${formatPercent(props.prediction.probAwayWin)}`,
)
</script>

<template>
  <!-- Mini: una sola barra segmentada, ideal para cada fila de la lista -->
  <div v-if="variant === 'mini'" class="w-full" role="img" :aria-label="ariaSummary">
    <div class="flex h-1.5 w-full overflow-hidden rounded-full bg-accented">
      <div class="bg-sky-400 transition-all duration-700" :style="{ width: widths.home }" />
      <div class="bg-slate-500 transition-all duration-700" :style="{ width: widths.draw }" />
      <div class="bg-amber-400 transition-all duration-700" :style="{ width: widths.away }" />
    </div>
    <div class="mt-1 flex justify-between text-xs tabular-nums text-muted">
      <span class="text-sky-300">1 {{ formatPercent(prediction.probHomeWin) }}</span>
      <span>X {{ formatPercent(prediction.probDraw) }}</span>
      <span class="text-amber-300">2 {{ formatPercent(prediction.probAwayWin) }}</span>
    </div>
  </div>

  <!-- Full: tres filas con etiqueta, barra y porcentaje (panel de detalle) -->
  <div v-else class="space-y-2" role="img" :aria-label="ariaSummary">
    <div
      v-for="row in [
        { label: homeLabel, prob: prediction.probHomeWin, width: widths.home, color: 'bg-sky-400' },
        { label: 'Empate', prob: prediction.probDraw, width: widths.draw, color: 'bg-slate-500' },
        { label: awayLabel, prob: prediction.probAwayWin, width: widths.away, color: 'bg-amber-400' },
      ]"
      :key="row.label"
      class="grid grid-cols-[7rem_1fr_3rem] items-center gap-3 text-sm"
    >
      <span class="truncate text-default">{{ row.label }}</span>
      <div class="h-2.5 overflow-hidden rounded-full bg-accented">
        <div
          class="h-full rounded-full transition-all duration-700"
          :class="row.color"
          :style="{ width: row.width }"
        />
      </div>
      <span class="text-right font-semibold tabular-nums">{{ formatPercent(row.prob) }}</span>
    </div>
  </div>
</template>
