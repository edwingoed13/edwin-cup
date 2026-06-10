<script setup lang="ts">
const store = useMatchesStore()

// Las dos primeras posiciones clasifican directo; la 3ª puede hacerlo como
// "mejor tercero" (formato 2026), por eso se resalta distinto.
function rowAccent(index: number): string {
  if (index < 2) return 'border-l-2 border-emerald-500'
  if (index === 2) return 'border-l-2 border-amber-500/70'
  return 'border-l-2 border-transparent'
}
</script>

<template>
  <section class="space-y-3">
    <div class="flex items-center justify-between">
      <h2 class="text-sm font-semibold uppercase tracking-wider text-slate-300">
        Grupos <span class="text-slate-500">({{ store.standings.length }})</span>
      </h2>
      <div class="flex items-center gap-3 text-[10px] text-slate-500">
        <span class="flex items-center gap-1"><span class="inline-block h-2 w-2 rounded-full bg-emerald-500" /> Top 2</span>
        <span class="flex items-center gap-1"><span class="inline-block h-2 w-2 rounded-full bg-amber-500/70" /> 3.º</span>
      </div>
    </div>

    <div class="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
      <div
        v-for="g in store.standings"
        :key="g.group"
        class="rounded-2xl border border-slate-800 bg-slate-900/60 p-3 shadow-md shadow-black/20"
      >
        <h3 class="mb-2 text-xs font-bold uppercase tracking-wider text-slate-400">
          Grupo {{ g.group }}
        </h3>

        <div class="grid grid-cols-[1.2rem_1fr_2rem_2rem_2.2rem] items-center gap-1 px-1 pb-1 text-[10px] uppercase text-slate-500">
          <span>#</span><span>Equipo</span><span class="text-center">PJ</span>
          <span class="text-center">DG</span><span class="text-center">Pts</span>
        </div>

        <ul class="space-y-0.5">
          <li
            v-for="(row, i) in g.rows"
            :key="row.team.id"
            class="grid grid-cols-[1.2rem_1fr_2rem_2rem_2.2rem] items-center gap-1 rounded-md py-1 pl-1 pr-1 text-sm"
            :class="rowAccent(i)"
          >
            <span class="text-center text-xs tabular-nums text-slate-500">{{ i + 1 }}</span>
            <span class="flex min-w-0 items-center gap-1.5">
              <TeamCrest :team="row.team" :size="18" />
              <span class="truncate">{{ row.team.name }}</span>
            </span>
            <span class="text-center tabular-nums text-slate-400">{{ row.played }}</span>
            <span
              class="text-center tabular-nums"
              :class="row.goalDiff > 0 ? 'text-emerald-300' : row.goalDiff < 0 ? 'text-red-300' : 'text-slate-400'"
            >
              {{ row.goalDiff > 0 ? '+' : '' }}{{ row.goalDiff }}
            </span>
            <span class="text-center font-bold tabular-nums">{{ row.points }}</span>
          </li>
        </ul>
      </div>
    </div>

    <p
      v-if="store.standings.length && store.standings.every((g) => g.rows.every((r) => r.played === 0))"
      class="rounded-lg border border-slate-800 bg-slate-900/40 p-3 text-center text-xs text-slate-500"
    >
      El Mundial aún no comienza: la tabla se actualizará automáticamente con cada resultado real.
    </p>
  </section>
</template>
