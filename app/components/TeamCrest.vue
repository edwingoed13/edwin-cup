<script setup lang="ts">
import type { Team } from '#shared/types/football'

const props = withDefaults(defineProps<{ team: Team; size?: number }>(), { size: 24 })

// Si la imagen del escudo falla, caemos al monograma del código de país.
const failed = ref(false)
watch(() => props.team.id, () => (failed.value = false))
</script>

<template>
  <img
    v-if="team.badge && !failed"
    :src="team.badge"
    :alt="`Escudo de ${team.name}`"
    :width="size"
    :height="size"
    :style="{ width: `${size}px`, height: `${size}px` }"
    class="inline-block shrink-0 object-contain"
    loading="lazy"
    decoding="async"
    @error="failed = true"
  >
  <span
    v-else
    :style="{
      width: `${size}px`,
      height: `${size}px`,
      fontSize: `${Math.max(Math.round(size * 0.34), 8)}px`,
    }"
    :aria-label="team.name"
    class="inline-flex shrink-0 items-center justify-center rounded border border-default bg-elevated font-semibold uppercase leading-none text-muted"
  >{{ teamMonogram(team) }}</span>
</template>
