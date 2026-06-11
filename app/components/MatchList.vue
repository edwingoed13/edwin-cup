<script setup lang="ts">
import type { MatchWithTeams } from '#shared/types/football'

const store = useMatchesStore()

function stageLine(match: MatchWithTeams): string {
  const stage = STAGE_LABELS[match.stage]
  const group = match.group ? ` · Grupo ${match.group}` : ''
  return `${stage}${group} · ${match.stadium}`
}
</script>

<template>
  <section class="space-y-3">
    <div class="flex items-baseline justify-between">
      <h2 class="text-sm font-semibold text-highlighted">
        Partidos <span class="text-muted">({{ store.matches.length }})</span>
      </h2>
      <span v-if="store.loadingMatches" class="text-xs text-muted">Cargando…</span>
    </div>

    <UAlert
      v-if="store.error"
      color="error"
      variant="soft"
      icon="i-lucide-triangle-alert"
      :title="store.error"
    />

    <!-- Skeletons mientras llega la primera tanda -->
    <div v-else-if="store.loadingMatches && !store.matches.length" class="space-y-2">
      <USkeleton v-for="i in 6" :key="i" class="h-28 w-full rounded-card" />
    </div>

    <p
      v-else-if="!store.matches.length"
      class="rounded-card border border-default bg-muted p-6 text-center text-sm text-muted"
    >
      No hay partidos con los filtros actuales.
    </p>

    <ul v-else class="space-y-2">
      <li v-for="match in store.matches" :key="match.id">
        <button
          type="button"
          :aria-label="`${match.homeTeam.name} vs ${match.awayTeam.name} · ${STATUS_UI[match.status].label}`"
          :aria-pressed="match.id === store.selectedMatchId"
          class="w-full rounded-card border bg-muted p-4 text-left transition-colors
                 hover:border-accented hover:bg-elevated
                 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
          :class="match.id === store.selectedMatchId
            ? 'border-primary ring-1 ring-primary/50'
            : 'border-default'"
          @click="store.setSelectedMatchId(match.id)"
        >
          <div class="mb-2 flex items-center justify-between gap-2">
            <span class="text-xs font-medium tabular-nums text-muted">
              {{ formatPET(match.kickoffPET) }} <span class="text-dimmed">PET</span>
            </span>
            <UBadge
              :color="STATUS_UI[match.status].color"
              :icon="STATUS_UI[match.status].icon"
              variant="soft"
              size="sm"
              :class="match.status === 'LIVE' && 'animate-pulse'"
            >
              {{ STATUS_UI[match.status].label }}
            </UBadge>
          </div>

          <div class="mb-2 flex items-center justify-between gap-3">
            <div class="flex min-w-0 items-center gap-2">
              <TeamCrest :team="match.homeTeam" :size="22" />
              <span class="truncate font-semibold">{{ match.homeTeam.name }}</span>
            </div>
            <div class="shrink-0 text-sm font-bold tabular-nums text-muted">
              <template v-if="match.score">{{ match.score.home }} – {{ match.score.away }}</template>
              <template v-else>vs</template>
            </div>
            <div class="flex min-w-0 items-center justify-end gap-2">
              <span class="truncate text-right font-semibold">{{ match.awayTeam.name }}</span>
              <TeamCrest :team="match.awayTeam" :size="22" />
            </div>
          </div>

          <p class="mb-2 truncate text-xs text-muted">{{ stageLine(match) }}</p>

          <ProbabilityBars
            v-if="store.predictions[match.id]"
            :prediction="store.predictions[match.id]!"
            variant="mini"
          />
        </button>
      </li>
    </ul>
  </section>
</template>
