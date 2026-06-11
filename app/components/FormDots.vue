<script setup lang="ts">
import type { FormResult } from '#shared/types/football'

const props = defineProps<{ form: FormResult[] }>()

const CLASSES: Record<FormResult['result'], string> = {
  W: 'bg-emerald-500',
  D: 'bg-slate-500',
  L: 'bg-red-500',
}

const RESULT_WORD: Record<FormResult['result'], string> = {
  W: 'Victoria',
  D: 'Empate',
  L: 'Derrota',
}

// Texto del tooltip y de la etiqueta accesible de cada resultado.
function describe(f: FormResult): string {
  const comp = f.competition ? ` · ${f.competition}` : ''
  return `${RESULT_WORD[f.result]} vs ${f.opponent} ${f.score} · ${f.date}${comp}`
}

// Se muestra del más antiguo (izq) al más reciente (der), como en Flashscore.
const ordered = computed(() => [...props.form].reverse())
</script>

<template>
  <div v-if="form.length" class="flex gap-1">
    <UTooltip v-for="(f, i) in ordered" :key="i" :text="describe(f)">
      <span
        :aria-label="describe(f)"
        class="flex h-5 w-5 items-center justify-center rounded text-xs font-bold text-white"
        :class="CLASSES[f.result]"
      >
        {{ f.result }}
      </span>
    </UTooltip>
  </div>
  <span v-else class="text-xs text-muted">sin partidos recientes</span>
</template>
