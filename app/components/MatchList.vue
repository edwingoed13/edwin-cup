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
      <h2 class="text-sm font-semibold uppercase tracking-wider text-slate-300">
        Partidos <span class="text-slate-500">({{ store.matches.length }})</span>
      </h2>
      <span v-if="store.loadingMatches" class="text-xs text-slate-500">Cargando…</span>
    </div>

    <p v-if="store.error" class="rounded-lg border border-red-500/30 bg-red-500/10 p-3 text-sm text-red-300">
      {{ store.error }}
    </p>

    <p
      v-else-if="!store.loadingMatches && store.matches.length === 0"
      class="rounded-lg border border-slate-800 bg-slate-900/60 p-6 text-center text-sm text-slate-400"
    >
      No hay partidos con los filtros actuales.
    </p>

    <ul class="space-y-2">
      <li v-for="match in store.matches" :key="match.id">
        <button
          type="button"
          class="w-full rounded-2xl border bg-slate-900/60 p-4 text-left shadow-md shadow-black/20
                 transition-all hover:border-slate-600 hover:bg-slate-900"
          :class="match.id === store.selectedMatchId
            ? 'border-sky-500/60 ring-1 ring-sky-500/40'
            : 'border-slate-800'"
          @click="store.setSelectedMatchId(match.id)"
        >
          <div class="mb-2 flex items-center justify-between gap-2">
            <span class="text-xs font-medium tabular-nums text-slate-400">
              {{ formatPET(match.kickoffPET) }} <span class="text-slate-600">PET</span>
            </span>
            <span
              class="rounded-full px-2 py-0.5 text-[10px] font-bold tracking-wide"
              :class="STATUS_BADGE_CLASSES[match.status]"
            >
              {{ STATUS_LABELS[match.status] }}
            </span>
          </div>

          <div class="mb-2 flex items-center justify-between gap-3">
            <div class="flex min-w-0 items-center gap-2">
              <TeamCrest :team="match.homeTeam" :size="22" />
              <span class="truncate font-semibold">{{ match.homeTeam.name }}</span>
            </div>
            <div class="shrink-0 text-sm font-bold tabular-nums text-slate-300">
              <template v-if="match.score">{{ match.score.home }} – {{ match.score.away }}</template>
              <template v-else>vs</template>
            </div>
            <div class="flex min-w-0 items-center justify-end gap-2">
              <span class="truncate text-right font-semibold">{{ match.awayTeam.name }}</span>
              <TeamCrest :team="match.awayTeam" :size="22" />
            </div>
          </div>

          <p class="mb-2 truncate text-xs text-slate-500">{{ stageLine(match) }}</p>

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
