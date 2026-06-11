<script setup lang="ts">
const store = useMatchesStore()

// Las dos primeras posiciones clasifican directo; la 3ª puede hacerlo como
// "mejor tercero" (formato 2026), por eso se resalta distinto.
function rowAccent(index: number): string {
  if (index < 2) return 'border-l-2 border-emerald-500'
  if (index === 2) return 'border-l-2 border-amber-500/70'
  return 'border-l-2 border-transparent'
}

// Texto accesible del estado de clasificación (no depender solo del color).
function qualifyLabel(index: number): string | undefined {
  if (index < 2) return 'Clasifica directo'
  if (index === 2) return 'Posible mejor tercero'
  return undefined
}
</script>

<template>
  <section class="space-y-3">
    <div class="flex items-center justify-between">
      <h2 class="text-sm font-semibold uppercase tracking-wider text-highlighted">
        Grupos <span class="text-muted">({{ store.standings.length }})</span>
      </h2>
      <div class="flex items-center gap-3 text-xs text-muted">
        <span class="flex items-center gap-1"><span class="inline-block h-2 w-2 rounded-full bg-emerald-500" /> Top 2</span>
        <span class="flex items-center gap-1"><span class="inline-block h-2 w-2 rounded-full bg-amber-500/70" /> 3.º</span>
      </div>
    </div>

    <div class="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
      <div
        v-for="g in store.standings"
        :key="g.group"
        class="rounded-card border border-default bg-muted p-3"
      >
        <h3 class="mb-2 text-xs font-bold uppercase tracking-wider text-muted">
          Grupo {{ g.group }}
        </h3>

        <table class="w-full border-collapse text-sm">
          <caption class="sr-only">Clasificación del Grupo {{ g.group }}</caption>
          <thead>
            <tr class="text-xs uppercase text-muted">
              <th scope="col" class="w-6 pb-1 text-center font-medium">#</th>
              <th scope="col" class="pb-1 text-left font-medium">Equipo</th>
              <th scope="col" class="w-8 pb-1 text-center font-medium">PJ</th>
              <th scope="col" class="w-9 pb-1 text-center font-medium">DG</th>
              <th scope="col" class="w-9 pb-1 text-center font-medium">Pts</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="(row, i) in g.rows" :key="row.team.id">
              <td class="py-1 pl-1 text-center text-xs tabular-nums text-muted" :class="rowAccent(i)">
                {{ i + 1 }}
              </td>
              <th scope="row" class="py-1 font-normal">
                <span class="flex min-w-0 items-center gap-1.5">
                  <TeamCrest :team="row.team" :size="18" />
                  <span class="truncate">{{ row.team.name }}</span>
                  <span v-if="qualifyLabel(i)" class="sr-only">— {{ qualifyLabel(i) }}</span>
                </span>
              </th>
              <td class="py-1 text-center tabular-nums text-muted">{{ row.played }}</td>
              <td
                class="py-1 text-center tabular-nums"
                :class="row.goalDiff > 0 ? 'text-emerald-300' : row.goalDiff < 0 ? 'text-red-300' : 'text-muted'"
              >
                {{ row.goalDiff > 0 ? '+' : '' }}{{ row.goalDiff }}
              </td>
              <td class="py-1 text-center font-bold tabular-nums">{{ row.points }}</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <p
      v-if="store.standings.length && store.standings.every((g) => g.rows.every((r) => r.played === 0))"
      class="rounded-card border border-default bg-muted p-3 text-center text-xs text-muted"
    >
      El Mundial aún no comienza: la tabla se actualizará automáticamente con cada resultado real.
    </p>
  </section>
</template>
