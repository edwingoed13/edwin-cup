<script setup lang="ts">
import type { FormResult } from '#shared/types/football'

const props = defineProps<{ form: FormResult[] }>()

const CLASSES: Record<FormResult['result'], string> = {
  W: 'bg-emerald-500',
  D: 'bg-slate-500',
  L: 'bg-red-500',
}

// Se muestra del más antiguo (izq) al más reciente (der), como en Flashscore.
const ordered = computed(() => [...props.form].reverse())
</script>

<template>
  <div v-if="form.length" class="flex gap-1">
    <span
      v-for="(f, i) in ordered"
      :key="i"
      class="flex h-5 w-5 items-center justify-center rounded text-[10px] font-bold text-white"
      :class="CLASSES[f.result]"
      :title="`vs ${f.opponent} ${f.score} · ${f.date}${f.competition ? ' · ' + f.competition : ''}`"
    >
      {{ f.result }}
    </span>
  </div>
  <span v-else class="text-xs text-slate-500">sin partidos recientes</span>
</template>
