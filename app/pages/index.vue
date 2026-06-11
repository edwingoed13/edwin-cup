<script setup lang="ts">
import type { MatchStatus, Stage } from '#shared/types/football'

// Fuerza el modo oscuro en esta página: el plugin de color-mode respeta este
// meta (ignora la preferencia de localStorage, que en localhost la pueden
// haber escrito otras apps). La app no tiene toggle de tema.
definePageMeta({ colorMode: 'dark' })

const store = useMatchesStore()
const route = useRoute()
const router = useRouter()

const liveCount = computed(() => store.matches.filter((m) => m.status === 'LIVE').length)

// Vista (Partidos / Grupos). Se inicializa desde la URL y se mantiene en sync
// junto con filtros y partido seleccionado (deep-link compartible / refrescable).
type View = 'matches' | 'groups'
const view = ref<View>(route.query.view === 'groups' ? 'groups' : 'matches')

const viewTabs = [
  { label: 'Partidos', value: 'matches', icon: 'i-lucide-list' },
  { label: 'Grupos', value: 'groups', icon: 'i-lucide-table-2' },
]

// Estado completo (vista + filtros + selección) → query string, omitiendo vacíos.
function buildQuery(): Record<string, string> {
  const q: Record<string, string> = {}
  if (view.value === 'groups') q.view = 'groups'
  const f = store.filters
  if (f.stage) q.stage = f.stage
  if (f.status) q.status = f.status
  if (f.group) q.group = f.group
  if (f.teamId) q.teamId = f.teamId
  if (f.dateFrom) q.from = f.dateFrom
  if (f.dateTo) q.to = f.dateTo
  if (store.selectedMatchId) q.match = store.selectedMatchId
  return q
}

function str(v: unknown): string {
  return typeof v === 'string' ? v : ''
}

// Responsive: en escritorio (lg+) el detalle es una columna fija; en móvil se
// muestra en un drawer (USlideover) al tocar un partido. Default true para que
// el SSR y el primer render del cliente coincidan (sin mismatch de hidratación).
const isDesktop = ref(true)
const detailOpen = ref(false)
let allowAutoOpen = false

// En móvil, elegir un partido abre el drawer; la selección automática inicial
// (al cargar) no debe abrirlo de golpe.
watch(
  () => store.selectedMatchId,
  (id) => {
    if (allowAutoOpen && id && !isDesktop.value) detailOpen.value = true
  },
)

onMounted(async () => {
  const mq = window.matchMedia('(min-width: 1024px)')
  isDesktop.value = mq.matches
  mq.addEventListener('change', (e) => (isDesktop.value = e.matches))

  // 1) Aplica los filtros de la URL ANTES del primer fetch (sin disparar uno extra).
  const q = route.query
  store.filters = {
    stage: str(q.stage) as Stage | '',
    status: str(q.status) as MatchStatus | '',
    group: str(q.group),
    teamId: str(q.teamId),
    dateFrom: str(q.from),
    dateTo: str(q.to),
  }
  if (store.filters.stage !== 'GROUP') store.filters.group = ''

  await Promise.all([store.fetchTeams(), store.fetchMatches(), store.fetchStandings()])

  // 2) Selección: la de la URL si sigue siendo válida; si no, el primer LIVE / primero.
  const urlMatch = str(q.match)
  if (urlMatch && store.matches.some((m) => m.id === urlMatch)) {
    await store.setSelectedMatchId(urlMatch)
  } else if (!store.selectedMatchId && store.matches.length > 0) {
    const live = store.matches.find((m) => m.status === 'LIVE')
    await store.setSelectedMatchId((live ?? store.matches[0]!).id)
  }

  // 3) A partir de aquí, cualquier cambio de estado se refleja en la URL.
  await nextTick()
  watch(
    [view, () => store.filters, () => store.selectedMatchId],
    () => router.replace({ query: buildQuery() }),
    { deep: true },
  )
  allowAutoOpen = true
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

      <!-- Escritorio: columna fija de detalle -->
      <MatchDetail v-if="isDesktop" class="h-fit lg:sticky lg:top-24" />

      <!-- Móvil: detalle en drawer, se abre al tocar un partido -->
      <USlideover v-if="!isDesktop" v-model:open="detailOpen" title="Detalle del partido">
        <template #body>
          <MatchDetail />
        </template>
      </USlideover>
    </main>

    <!-- Vista Grupos: tabla de posiciones -->
    <main v-else class="flex-1">
      <GroupStandings />
    </main>
  </div>
</template>
