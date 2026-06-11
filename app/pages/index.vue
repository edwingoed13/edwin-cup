<script setup lang="ts">
// Fuerza el modo oscuro en esta página: el plugin de color-mode respeta este
// meta (ignora la preferencia de localStorage, que en localhost la pueden
// haber escrito otras apps). La app no tiene toggle de tema.
definePageMeta({ colorMode: 'dark' })

const store = useMatchesStore()

const liveCount = computed(() => store.matches.filter((m) => m.status === 'LIVE').length)

// Vista (Partidos / Grupos) sincronizada con la URL: deep-link + a prueba de refresh.
type View = 'matches' | 'groups'
const route = useRoute()
const router = useRouter()
const view = computed<View>({
  get: () => (route.query.view === 'groups' ? 'groups' : 'matches'),
  set: (v) => {
    router.replace({ query: { ...route.query, view: v } })
  },
})

const viewTabs = [
  { label: 'Partidos', value: 'matches', icon: 'i-lucide-list' },
  { label: 'Grupos', value: 'groups', icon: 'i-lucide-table-2' },
]

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
    <header
      class="sticky top-0 z-10 -mx-4 mb-6 border-b border-default bg-default/90 px-4 py-4 backdrop-blur"
    >
      <div class="flex flex-wrap items-center justify-between gap-3">
        <div class="flex items-center gap-3">
          <UIcon name="i-lucide-trophy" class="size-7 shrink-0 text-primary" />
          <div>
            <h1 class="text-lg font-semibold leading-tight sm:text-xl">
              Mundial 2026 — Panel analítico
              <span class="font-normal text-muted">(hora Perú)</span>
            </h1>
            <p class="text-xs text-muted">
              Calendario, conversión automática a PET y probabilidades por partido
            </p>
          </div>
        </div>

        <div class="flex items-center gap-3">
          <UBadge v-if="liveCount > 0" color="error" variant="soft" size="md" class="gap-1.5">
            <span class="relative flex size-2">
              <span class="absolute inline-flex size-full animate-ping rounded-full bg-error opacity-75" />
              <span class="relative inline-flex size-2 rounded-full bg-error" />
            </span>
            {{ liveCount }} en vivo
          </UBadge>

          <!-- Toggle de vista accesible (role=tablist con ARIA gratis) -->
          <UTabs v-model="view" :items="viewTabs" color="primary" size="sm" :content="false" />
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
