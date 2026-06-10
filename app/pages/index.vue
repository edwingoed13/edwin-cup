<script setup lang="ts">
const store = useMatchesStore()

const liveCount = computed(() => store.matches.filter((m) => m.status === 'LIVE').length)

type View = 'matches' | 'groups'
const view = ref<View>('matches')

// Carga inicial en el cliente (app local, no necesitamos SSR de datos).
onMounted(async () => {
  await Promise.all([store.fetchTeams(), store.fetchMatches(), store.fetchStandings()])
  // Selecciona por defecto el primer partido LIVE, o el primero de la lista.
  if (!store.selectedMatchId && store.matches.length > 0) {
    const live = store.matches.find((m) => m.status === 'LIVE')
    await store.setSelectedMatchId((live ?? store.matches[0]!).id)
  }
})
</script>

<template>
  <div class="mx-auto flex min-h-screen max-w-7xl flex-col px-4 pb-8">
    <!-- Barra superior -->
    <header class="sticky top-0 z-10 -mx-4 mb-6 border-b border-slate-800 bg-slate-950/90 px-4 py-4 backdrop-blur">
      <div class="flex flex-wrap items-center justify-between gap-3">
        <div class="flex items-center gap-3">
          <span class="text-2xl">⚽</span>
          <div>
            <h1 class="text-lg font-bold leading-tight sm:text-xl">
              Mundial 2026 – Panel analítico
              <span class="font-normal text-slate-400">(hora Perú)</span>
            </h1>
            <p class="text-xs text-slate-500">
              Calendario, conversión automática a PET y probabilidades por partido
            </p>
          </div>
        </div>
        <div class="flex items-center gap-3">
          <span
            v-if="liveCount > 0"
            class="rounded-full bg-red-500/15 px-3 py-1 text-xs font-bold text-red-300 ring-1 ring-red-500/40"
          >
            🔴 {{ liveCount }} en vivo
          </span>
          <!-- Toggle de vista: Partidos / Grupos -->
          <div class="flex rounded-lg border border-slate-700 p-0.5 text-xs font-medium">
            <button
              type="button"
              class="rounded-md px-3 py-1.5 transition-colors"
              :class="view === 'matches' ? 'bg-sky-500/20 text-sky-200' : 'text-slate-400 hover:text-white'"
              @click="view = 'matches'"
            >
              Partidos
            </button>
            <button
              type="button"
              class="rounded-md px-3 py-1.5 transition-colors"
              :class="view === 'groups' ? 'bg-sky-500/20 text-sky-200' : 'text-slate-400 hover:text-white'"
              @click="view = 'groups'"
            >
              Grupos
            </button>
          </div>
        </div>
      </div>
    </header>

    <!-- Vista Partidos: filtros / lista / detalle -->
    <main v-if="view === 'matches'" class="grid flex-1 gap-6 lg:grid-cols-[16rem_1fr_24rem]">
      <MatchFilters class="h-fit lg:sticky lg:top-24" />
      <MatchList />
      <MatchDetail class="h-fit lg:sticky lg:top-24" />
    </main>

    <!-- Vista Grupos: tabla de posiciones -->
    <main v-else class="flex-1">
      <GroupStandings />
    </main>
  </div>
</template>
