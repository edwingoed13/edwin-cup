<script setup lang="ts">
import type { Team } from '#shared/types/football'

const props = withDefaults(defineProps<{ team: Team; size?: number }>(), { size: 24 })

// Si la imagen del escudo falla, caemos a la bandera emoji.
const failed = ref(false)
watch(() => props.team.id, () => (failed.value = false))
</script>

<template>
  <img
    v-if="team.badge && !failed"
    :src="team.badge"
    :alt="team.name"
    :style="{ width: `${size}px`, height: `${size}px` }"
    class="inline-block shrink-0 object-contain"
    loading="lazy"
    @error="failed = true"
  >
  <span v-else :style="{ fontSize: `${size * 0.9}px`, lineHeight: 1 }">{{ teamFlag(team) }}</span>
</template>
