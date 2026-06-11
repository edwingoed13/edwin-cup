<script setup lang="ts">
const store = useMatchesStore()

const match = computed(() => store.selectedMatch)
const isLive = computed(() => match.value?.status === 'LIVE')

// Posesión local (0..100); 50 neutro cuando no hay dato en vivo.
const possHome = computed(() => match.value?.extraData?.possessionHome ?? 50)
const hasPossession = computed(
  () => isLive.value && match.value?.extraData?.possessionHome != null,
)

// Desplazamiento del balón en unidades del viewBox (centro = 0).
// Más posesión local → el balón presiona hacia el arco rival (derecha).
const ballOffset = computed(() => (hasPossession.value ? (possHome.value - 50) * 1.5 : 0))
</script>

<template>
  <aside v-if="match" class="rounded-card border border-default bg-muted p-4">
    <div class="mb-3 flex items-center justify-between gap-2">
      <h2 class="text-sm font-semibold text-highlighted">Cancha</h2>
      <UBadge
        v-if="isLive"
        color="error"
        variant="soft"
        size="sm"
        icon="i-lucide-radio"
        class="animate-pulse"
      >
        En vivo
      </UBadge>
    </div>

    <div class="relative">
      <svg
        viewBox="0 0 320 200"
        class="w-full"
        role="img"
        :aria-label="`Cancha — ${match.homeTeam.name} contra ${match.awayTeam.name}`"
      >
        <!-- Césped + franjas de corte -->
        <rect x="0" y="0" width="320" height="200" rx="6" class="fill-emerald-950" />
        <g class="fill-white/[0.03]">
          <rect x="40" y="0" width="40" height="200" />
          <rect x="120" y="0" width="40" height="200" />
          <rect x="200" y="0" width="40" height="200" />
          <rect x="280" y="0" width="40" height="200" />
        </g>

        <!-- Líneas -->
        <g class="fill-none stroke-white/25" stroke-width="1.5">
          <rect x="8" y="8" width="304" height="184" rx="2" />
          <line x1="160" y1="8" x2="160" y2="192" />
          <circle cx="160" cy="100" r="26" />
          <rect x="8" y="58" width="48" height="84" />
          <rect x="8" y="78" width="20" height="44" />
          <rect x="264" y="58" width="48" height="84" />
          <rect x="292" y="78" width="20" height="44" />
        </g>
        <g class="fill-white/40">
          <circle cx="160" cy="100" r="2" />
          <circle cx="44" cy="100" r="1.5" />
          <circle cx="276" cy="100" r="1.5" />
        </g>

        <!-- Balón: centrado por defecto; en vivo se desplaza con la posesión -->
        <g
          class="transition-transform duration-700 ease-out"
          :style="{ transform: `translateX(${ballOffset}px)` }"
        >
          <circle v-if="isLive" cx="160" cy="100" r="9" class="animate-pulse fill-white/15" />
          <circle cx="160" cy="100" r="4.5" class="fill-white" />
        </g>
      </svg>

      <!-- Escudos sobre cada mitad -->
      <div class="pointer-events-none absolute inset-0 flex items-center justify-between px-[16%]">
        <TeamCrest :team="match.homeTeam" :size="24" />
        <TeamCrest :team="match.awayTeam" :size="24" />
      </div>
    </div>

    <div class="mt-2 flex items-center justify-between gap-2 text-xs">
      <span class="truncate font-medium text-sky-300">{{ match.homeTeam.name }}</span>
      <span class="truncate text-right font-medium text-amber-300">{{ match.awayTeam.name }}</span>
    </div>

    <!-- Posesión en vivo -->
    <div v-if="hasPossession" class="mt-3">
      <div class="mb-1 flex justify-between text-xs tabular-nums text-muted">
        <span>Posesión</span>
        <span>{{ possHome }}% – {{ 100 - possHome }}%</span>
      </div>
      <div class="flex h-1.5 overflow-hidden rounded-full bg-accented">
        <div class="bg-sky-400 transition-all duration-700" :style="{ width: `${possHome}%` }" />
        <div class="bg-amber-400 transition-all duration-700" :style="{ width: `${100 - possHome}%` }" />
      </div>
    </div>
    <p v-else class="mt-3 text-center text-xs text-muted">
      {{ match.status === 'FINISHED'
        ? 'Partido finalizado'
        : 'La posesión en vivo aparecerá al arrancar el partido' }}
    </p>
  </aside>
</template>
