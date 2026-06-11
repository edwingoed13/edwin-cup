# Auditoría de Frontend — Mundial 2026 Dashboard

> **Stack auditado:** Nuxt 4.4.8 · Vue 3.5 · Tailwind v4 · Pinia · Nuxt UI 4.8.2 (recién instalado, **sin uso aún**)
> **Alcance real:** 1 página (`app/pages/index.vue`), 7 componentes, 1 store, 1 composable, 3 utils.
> **Veredicto:** base técnica sólida y bien tipada, pero la **capa visual es "dashboard de hobby"**: emojis decorativos, 5 colores de acento compitiendo, exceso de rings/sombras translúcidas, micro-tipografía y cero uso de la librería de componentes que se acaba de instalar. Hay un camino claro y rápido hacia un aspecto SaaS corporativo.

---

## 0. Resumen ejecutivo

| # | Hallazgo crítico | Severidad | Esfuerzo |
|---|------------------|-----------|----------|
| C1 | **Banderas emoji se rompen en Windows** (y son la identidad de equipo en el `<select>`) | 🔴 Alta | Bajo |
| C2 | **Emojis decorativos** como UI funcional (⚽ 🔴 🏟️ ⛰️ 💡) | 🔴 Alta | Bajo |
| C3 | **Nuxt UI instalado pero 0% usado** — se paga el bundle (icons, fonts, reka-ui, color-mode) sin beneficio; todo hand-rolled | 🔴 Alta | Medio |
| C4 | **Sin design tokens**: `slate/sky/amber/emerald/red` hardcodeados en ~10 archivos, 6 radios de borde, 2 escalas de sombra | 🟠 Media | Medio |
| C5 | **A11y**: toggle sin `role=tab`/`aria-selected`, sin `focus-visible` en controles, contraste < AA en `slate-500/600`, `animate-pulse` sin `prefers-reduced-motion` | 🟠 Media | Bajo-Medio |
| C6 | **N+1 de red**: al cargar se disparan ~72 `$fetch` de predicción en paralelo (`useMatchesStore.ts:72`) | 🟠 Media | Medio |
| C7 | **Flujo móvil confuso**: 3 columnas colapsan en pila; tocar un partido manda el detalle al fondo de la página | 🟠 Media | Medio |
| C8 | **Sin SSR de datos** (`onMounted` + `$fetch`): primer paint en blanco, LCP pobre, sin deep-link del partido seleccionado | 🟡 Baja | Medio |
| C9 | **Estados de carga pobres**: solo un "Cargando…" en texto; sin skeletons; errores de standings/predicción silenciados | 🟡 Baja | Bajo |

---

## 1. Diseño Visual

### 1.1 Emojis como UI (eliminar)
| Ubicación | Emoji | Problema | Reemplazo profesional |
|---|---|---|---|
| `index.vue:26` | ⚽ | Logo informal | `UIcon name="i-lucide-trophy"` o logo SVG propio |
| `index.vue:42` | 🔴 | Estado "en vivo" | Punto `<span>` animado + texto, dentro de `UBadge` |
| `MatchDetail.vue:102` | 🏟️ | Sede | `i-lucide-map-pin` |
| `MatchDetail.vue:109` | ⛰️ | Altitud exigente | `i-lucide-mountain` |
| `MatchDetail.vue:187` | 💡 | Explicación | `i-lucide-sparkles` / `i-lucide-info` |
| `MatchFilters.vue:78` | 🇧🇷… | Bandera en `<option>` | **No usar emoji** (ver C1) → escudo o `flagcdn` |

> **C1 — crítico y específico de tu plataforma:** Windows **no** renderiza emojis de bandera de país; muestra las dos letras del indicador regional (p. ej. `🇧🇷` → `BR`). Como `teamFlag()` (`app/utils/flags.ts`) es el *fallback* de identidad de equipo y se usa crudo en el `<select>` de equipos (`MatchFilters.vue:78`), en tu propio entorno se ve roto. **Solución:** usar siempre el escudo real (`team.badge`, que ya tienes de TheSportsDB) y, como fallback, imágenes de bandera por código de país vía `https://flagcdn.com/{cc}.svg` — nunca emoji.

### 1.2 Coherencia visual — inconsistencias detectadas
- **Color:** 5 hues de acento sin jerarquía — `sky` (local), `amber` (visita), `emerald` (éxito/top-2), `red` (live/derrota), `slate` (base). Corporativo = **1 marca + neutros + 3 semánticos**.
- **Radios:** conviven `rounded-2xl` (cards), `rounded-xl` (cajas internas), `rounded-lg` (botones/inputs), `rounded-md`, `rounded`, `rounded-full`. → reducir a **3 niveles**.
- **Sombras:** `shadow-md shadow-black/20` y `shadow-lg shadow-black/30` sobre fondo oscuro → barro visual. En dark corporativo se usa **borde sutil, no sombra negra**.
- **Fondos translúcidos:** `bg-slate-900/60`, `bg-slate-950/50`, `ring-1` por todos lados → estética "glass gamer", no Stripe/Linear.
- **Tipografía:** 8 tamaños (`text-[10px]` … `text-3xl`) sin escala; abuso de `uppercase tracking-wider` (look de dashboard 2018).

---

## 2. Experiencia de Usuario (UX)

| Problema | Dónde | Impacto | Solución |
|---|---|---|---|
| Detalle al fondo en móvil | `index.vue:68` grid colapsa a pila | Tocar partido → scroll perdido | Detalle en `USlideover` (drawer) en `< lg` |
| Toggle Partidos/Grupos pierde estado al refrescar | `index.vue:7` `ref('matches')` | No compartible, no deep-link | Sincronizar con query `?view=` |
| Partido seleccionado no está en URL | `useMatchesStore.ts:23` | No se puede compartir un partido | `?match={id}` con `useRouteQuery` |
| "Limpiar filtros" sin feedback de cuántos activos | `MatchFilters.vue:106` | Usuario no sabe qué filtra | Badge con conteo de filtros activos |
| Estados de carga invisibles | `MatchList.vue:19` | Pantalla vacía al inicio | **Skeletons** (`USkeleton`) |
| Errores silenciados | `useMatchesStore.ts:83,91` | Standings/predicción fallan sin avisar | Estado de error visible con reintento |

---

## 3. Interfaz Profesional (objetivo Notion/Linear/Stripe/Vercel)

**Principios a adoptar:**
1. **Menos color, más neutro.** Un acento de marca (sugerido: un verde "cancha" sobrio o un azul corporativo) + grises. Semánticos solo para estado.
2. **Borde > sombra.** `border border-(--ui-border)` en vez de `shadow-*`.
3. **Más aire.** Subir el padding base de cards (de `p-3/p-4` a `p-5/p-6`) y el ritmo vertical.
4. **Tipografía clara.** Una escala de 6 pasos, pesos 400/500/600/700, fuente variable (Inter/Geist vía `@nuxt/fonts`, ya disponible con Nuxt UI).
5. **Componentes consistentes** vía Nuxt UI en lugar de re-implementar botones/inputs/badges.

---

## 4. Componentes — hallazgos por pieza

### 4.1 Barra superior (`index.vue` header)
- **Problemas:** logo emoji (`:26`); badge "en vivo" con 🔴 (`:42`); toggle hecho con dos `<button>` sin semántica de tabs ni `focus-visible`; `-mx-4 px-4` para romper el contenedor.
- **Impacto:** apariencia amateur + a11y (tabs no anunciadas a lectores de pantalla).
- **Solución:** `UIcon` para el logo, `UBadge` para el live, y `UTabs` (o `role="tablist"`) para la vista. Código en §10.

### 4.2 MatchFilters
- **Problemas:** `<select>` nativos con clases de input duplicadas en string (`:31-33`); opción de equipo con emoji bandera (`:78`); sin búsqueda en el selector de 48 equipos; "Limpiar" sin indicar filtros activos.
- **Impacto:** UX pobre con 48 equipos (scroll largo, sin typeahead); roto en Windows por el emoji.
- **Solución:** `USelectMenu` (búsqueda + slot con escudo), `UFormField` para labels. Código en §10.3.

### 4.3 MatchList
- **Problemas:** card-como-`<button>` que envuelve todo (`:34-78`) → un lector de pantalla lee toda la tarjeta como una sola etiqueta de botón; `transition-all` (`:38`, anima `all` = costo); sin skeleton; sin `focus-visible` ring (solo `hover:` y ring en seleccionado).
- **Impacto:** a11y y rendimiento menores; primer paint vacío.
- **Solución:** mantener clic en card pero añadir `:aria-label`, cambiar a `transition-colors`, anillo en `focus-visible`, skeletons mientras `loadingMatches`.

### 4.4 MatchDetail
- **Problemas:** emojis (`:102,109,187`); `<br>` en empty state (`:26`); micro-texto `text-[10px]/[11px]`; bloques con `bg-slate-950/50 border` repetidos (candidato a `UCard`/sub-componente); empty state poco trabajado.
- **Solución:** iconos + `UCard` para secciones + `UAlert` para la explicación del modelo + `USlideover` en móvil.

### 4.5 GroupStandings
- **Problemas:** tabla hecha a mano con `grid-cols-[…]` (`:35,44`); significado solo por color (borde izquierdo emerald/amber) con leyenda diminuta (`text-[10px]`); sin orden interactivo.
- **Impacto:** a11y (no es `<table>` semántica) y legibilidad.
- **Solución:** `UTable` con columnas tipadas; estado de clasificación como `UBadge` (texto + color), no solo color.

### 4.6 ProbabilityBars
- **Bien:** componente reutilizable con variantes `mini`/`full`, `tabular-nums`.
- **Problemas:** colores de barra hardcodeados (`bg-sky-400`/`bg-amber-400`); sin `role="img"`/`aria-label` que resuma "Local 55%, Empate 25%, Visita 20%".
- **Solución:** tokens de color + `aria-label` accesible; opción de usar `UProgress` o `UMeter`.

### 4.7 TeamCrest — **el mejor componente**
- **Bien:** `loading="lazy"`, fallback con `@error`, reset por `watch(team.id)`. Mantener.
- **Mejora menor:** definir `width/height` reales para evitar CLS (hoy va por `:style`), y usar `<NuxtImg>` si se añade `@nuxt/image`.

### 4.8 FormDots
- **Bien:** semántica W/D/L con letra + color (no solo color) y `title` informativo.
- **Mejora:** el `title` no es accesible por teclado; mover a `UTooltip` y añadir `aria-label`.

### 4.9 Componentes inexistentes que el objetivo SaaS pedirá
**No existen** y conviene planificarlos al crecer: Sidebar/Navbar de navegación, Breadcrumbs, Paginación (la lista hoy pinta 72 ítems sin virtualizar ni paginar), Modales/Slideovers, Menús desplegables de usuario, sistema de Notificaciones (`useToast()` de Nuxt UI ya disponible vía `<UApp>`).

---

## 5. Accesibilidad (WCAG AA)

| Criterio | Estado | Acción |
|---|---|---|
| Contraste texto | ⚠️ `text-slate-600` (#475569) sobre slate-950 ≈ **3.0:1 (falla)**; `slate-500` ≈ 4.6:1 (justo) | Subir secundarios a `slate-400`; reservar `slate-500` para texto ≥14px |
| Navegación teclado | ⚠️ cards ok (son `<button>`), toggle ok, pero sin foco visible | `focus-visible:ring-2 ring-(--ui-primary)` global |
| Focus states | ❌ ausentes en toggle y "Limpiar" | añadir anillo de foco |
| ARIA tabs | ❌ toggle sin `role` | `UTabs` o `role=tablist/tab` + `aria-selected` |
| Lectores de pantalla | ⚠️ ProbabilityBars y cards sin `aria-label` resumido | añadir `aria-label` |
| Movimiento | ⚠️ `animate-pulse` (live) sin opt-out | `motion-reduce:animate-none` |
| Tamaño de toque | ⚠️ badges/labels `text-[10px]`; algunos toques < 44px | subir mínimos a 44px en controles |

---

## 6. Responsive

- **Móvil (`< lg`):** 3 columnas → pila Filtros / Lista / Detalle. **Flujo roto**: seleccionar en la lista no muestra el detalle (queda al fondo). → **Detalle en `USlideover`** disparado al tocar; filtros en `USlideover`/`UDrawer` con botón "Filtros".
- **Tablet:** el grid `lg:` no cubre `md:`; entre 768–1024px queda en pila ancha desaprovechada. → breakpoint intermedio (lista + detalle a 2 columnas en `md`).
- **Desktop:** correcto con `max-w-7xl`.
- **Ultrawide:** todo se centra con gutters enormes; aceptable, pero se puede subir a `max-w-screen-2xl` o añadir una 4.ª columna de contexto.
- **Otros:** empty state de `MatchDetail` usa `<br>` (`:26`), frágil; sticky `top-24` puede solapar en viewports bajos.

---

## 7. Código Nuxt 4

**Bien:**
- `shared/` con tipos compartidos (`#shared`) — patrón Nuxt 4 correcto y bien usado.
- `srcDir: app/`, auto-imports de utils/components, store tipado, `strict: true`.

**A mejorar:**
| Tema | Hoy | Recomendado |
|---|---|---|
| Fetching | `onMounted` + `$fetch` (cliente, sin SSR) en `index.vue:10` | `useAsyncData`/`useFetch` para SSR + hidratación + caché |
| N+1 | `Promise.all(matches.map(fetchPrediction))` (`store:72`) → ~72 requests | endpoint `GET /api/predictions?ids=…` batch, o incluir prob. en `/api/matches` |
| Estado en URL | `selectedMatchId`/`view`/filtros solo en memoria | `useRouteQuery` para deep-link y refresh-safe |
| Store | Options API | (opcional) setup store, más idiomático en Nuxt 4 |
| Layouts | ninguno | `app/layouts/default.vue` con el shell (header/nav) para escalar |
| Lazy | todo eager | `<LazyMatchDetail>` / `defineAsyncComponent` para piezas pesadas |
| `formatLocalKickoff` | split de string ISO (`format.ts:14`) | parsear con date-fns y formatear |

---

## 8. Rendimiento

1. **Red (C6):** 72 `$fetch` de predicción al cargar. Batch en servidor → 1 request. **El mayor quick-win de performance.**
2. **Hydration/LCP:** sin SSR de datos = primer paint vacío. `useAsyncData` mejora LCP y evita flash.
3. **Imágenes:** escudos externos sin `width/height` explícitos → CLS. Añadir `@nuxt/image` + `<NuxtImg>` con dimensiones y `format=webp`.
4. **Render:** `transition-all` en cards (`MatchList:38`) → `transition-colors`. Lista de 72 sin virtualizar; si crece, `UTable`/virtual scroll.
5. **Fuentes:** con Nuxt UI llega `@nuxt/fonts` (self-host + `font-display: swap`); definir 1 familia variable.
6. **Bundle:** ahora que Nuxt UI está, **úsalo** — re-implementar botones/inputs a mano duplica lo que ya pesa en el bundle.

---

## 9. Sistema de Diseño (propuesta)

### 9.1 Color — vía `app/app.config.ts` (alias semánticos de Nuxt UI)
```ts
export default defineAppConfig({
  ui: {
    colors: {
      primary: 'emerald',   // marca "cancha" sobria (o 'blue' si se quiere más corporativo)
      secondary: 'sky',     // dato local
      success: 'green',
      warning: 'amber',     // dato visita / alertas suaves
      error: 'red',         // live / errores
      neutral: 'slate',     // base — coherente con el tema actual
    },
  },
})
```
- **Local vs Visita:** dejar de competir con la marca → usar `secondary` (local) y `warning`/`amber` (visita) solo en barras/cuotas, no en toda la UI.
- **Live:** `error` + punto animado, no rojo saturado de fondo.

### 9.2 Tipografía
| Token | Tamaño | Uso |
|---|---|---|
| `text-2xl/3xl` (700) | títulos de pantalla | H1 |
| `text-lg` (600) | títulos de sección | H2 |
| `text-sm` (600) | subtítulos/labels | H3 |
| `text-sm` (400) | cuerpo | base |
| `text-xs` (500) | metadatos | captions |

- **Eliminar** `text-[10px]`/`[11px]` (subir a `text-xs` mínimo).
- **Reducir** `uppercase tracking-wider` a títulos de sección puntuales.
- Fuente: **Inter** o **Geist** variable (vía `@nuxt/fonts`).

### 9.3 Espaciado — escala 4px
Usar solo múltiplos de 4 de Tailwind: `1(4) · 2(8) · 3(12) · 4(16) · 6(24) · 8(32)`. Padding base de card: **`p-5`/`p-6`**. Ritmo vertical: `space-y-6` entre secciones.

### 9.4 Radios y elevación (tokens en `main.css`)
```css
@theme {
  --radius-card: 0.875rem;   /* 14px — cards */
  --radius-control: 0.5rem;  /* 8px  — botones/inputs */
  --radius-pill: 9999px;     /* badges */
}
```
- **Reemplazar sombras** `shadow-*` por `border border-(--ui-border)` en superficies.

### 9.5 Componentes base → mapear a Nuxt UI
| Hecho a mano hoy | Reemplazo |
|---|---|
| `<button>` toggle / limpiar | `UButton`, `UTabs` |
| `<select>` | `USelectMenu` (con búsqueda + slot escudo) |
| badges de estado (`stages.ts`) | `UBadge` (`color`/`variant`) |
| cards (`bg-slate-900/60 border …`) | `UCard` |
| barras de probabilidad | tokens + `aria-label` (o `UProgress`) |
| tabla de grupos (`grid`) | `UTable` |
| explicación 💡 | `UAlert` |
| detalle en móvil | `USlideover` |
| feedback de acciones | `useToast()` |

---

## 10. Código — implementaciones concretas (Nuxt 4 + Vue 3 + Tailwind + Nuxt UI)

### 10.1 Tokens de estado sin emoji (`app/utils/stages.ts`)
```ts
import type { MatchStatus } from '#shared/types/football'

// Mapea estado → props de UBadge (color + variant) e icono Lucide.
export const STATUS_UI: Record<MatchStatus, { label: string; color: 'neutral' | 'error' | 'success'; icon: string }> = {
  SCHEDULED: { label: 'Programado',  color: 'neutral', icon: 'i-lucide-clock' },
  LIVE:      { label: 'En vivo',     color: 'error',   icon: 'i-lucide-radio' },
  FINISHED:  { label: 'Finalizado',  color: 'success', icon: 'i-lucide-check' },
}
```

### 10.2 Header con `UIcon` + `UBadge` + tabs accesibles (`index.vue`)
```vue
<script setup lang="ts">
const store = useMatchesStore()
const liveCount = computed(() => store.matches.filter(m => m.status === 'LIVE').length)

// Vista sincronizada con la URL (deep-link + refresh-safe)
const route = useRoute(); const router = useRouter()
const view = computed({
  get: () => (route.query.view === 'groups' ? 'groups' : 'matches'),
  set: v => router.replace({ query: { ...route.query, view: v } }),
})
const tabs = [
  { label: 'Partidos', value: 'matches', icon: 'i-lucide-list' },
  { label: 'Grupos',   value: 'groups',  icon: 'i-lucide-table-2' },
]
</script>

<template>
  <header class="sticky top-0 z-10 border-b border-default bg-default/90 backdrop-blur">
    <div class="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-3 px-4 py-4">
      <div class="flex items-center gap-3">
        <UIcon name="i-lucide-trophy" class="size-7 text-primary" />
        <div>
          <h1 class="text-lg font-semibold leading-tight sm:text-xl">
            Mundial 2026 — Panel analítico
            <span class="font-normal text-muted">(hora Perú)</span>
          </h1>
          <p class="text-xs text-muted">Calendario, conversión a PET y probabilidades por partido</p>
        </div>
      </div>

      <div class="flex items-center gap-3">
        <UBadge v-if="liveCount" color="error" variant="soft" class="gap-1.5">
          <span class="relative flex size-2">
            <span class="absolute inline-flex size-full animate-ping rounded-full bg-error/60 motion-reduce:hidden" />
            <span class="relative inline-flex size-2 rounded-full bg-error" />
          </span>
          {{ liveCount }} en vivo
        </UBadge>

        <UTabs v-model="view" :items="tabs" size="sm" />
      </div>
    </div>
  </header>
</template>
```
*(Sustituye `⚽`, `🔴`, y el toggle hand-rolled; añade tabs accesibles y vista en URL.)*

### 10.3 Selector de equipo con búsqueda y escudo, sin emoji (`MatchFilters.vue`)
```vue
<script setup lang="ts">
const store = useMatchesStore()
const teamItems = computed(() =>
  store.teams.map(t => ({ label: t.name, value: t.id, avatar: { src: t.badge } })))
const teamId = computed({
  get: () => store.filters.teamId,
  set: v => store.setFilters({ teamId: v ?? '' }),
})
</script>

<template>
  <UFormField label="Equipo">
    <USelectMenu
      v-model="teamId"
      :items="teamItems"
      value-key="value"
      searchable
      placeholder="Todos los equipos"
      icon="i-lucide-search"
      class="w-full"
    />
  </UFormField>
</template>
```

### 10.4 Skeletons de carga (`MatchList.vue`)
```vue
<template v-if="store.loadingMatches && !store.matches.length">
  <USkeleton v-for="i in 6" :key="i" class="h-28 w-full rounded-[--radius-card]" />
</template>
```

### 10.5 Detalle como drawer en móvil (`index.vue`)
```vue
<!-- Desktop: columna fija; Móvil: USlideover -->
<MatchDetail class="hidden lg:block" />
<USlideover v-model:open="detailOpen" side="right" class="lg:hidden">
  <template #content><MatchDetail /></template>
</USlideover>
```
…y en `store.setSelectedMatchId` abrir el slideover en `< lg`.

### 10.6 Badge de estado reutilizando el token (cualquier card)
```vue
<UBadge :color="STATUS_UI[match.status].color"
        :icon="STATUS_UI[match.status].icon"
        variant="soft" size="sm"
        :class="match.status === 'LIVE' && 'motion-safe:animate-pulse'">
  {{ STATUS_UI[match.status].label }}
</UBadge>
```

### 10.7 Probabilidad accesible (`ProbabilityBars.vue`)
```vue
<div role="img"
     :aria-label="`${homeLabel} ${formatPercent(prediction.probHomeWin)}, empate ${formatPercent(prediction.probDraw)}, ${awayLabel} ${formatPercent(prediction.probAwayWin)}`">
  <!-- …barras… -->
</div>
```

### 10.8 Fetch con SSR y sin N+1 (`index.vue` + endpoint batch)
```ts
// index.vue — SSR + hidratación
const { data } = await useAsyncData('bootstrap', () =>
  Promise.all([$fetch('/api/teams'), $fetch('/api/matches'), $fetch('/api/standings')]))
// server/api/predictions/index.get.ts — batch: ?ids=a,b,c en vez de 72 llamadas
```

---

## Entregables

### 🔴 Hallazgos críticos (orden de ataque)
1. **C1** Banderas emoji rotas en Windows → escudo/`flagcdn`.
2. **C2** Quitar emojis decorativos → iconos Lucide.
3. **C3** Empezar a usar Nuxt UI (UButton/USelectMenu/UBadge/UCard/UTable).
4. **C4** Design tokens (`app.config.ts` colores + `@theme` radios) y limpiar sombras.
5. **C5** A11y: tabs ARIA, `focus-visible`, contraste, `motion-reduce`.
6. **C6** Batch de predicciones (1 request).

### ⚡ Quick wins (≤ 1–2 h c/u)
- Reemplazar los 5 emojis decorativos por `UIcon` (§1.1).
- `transition-all` → `transition-colors` en `MatchList`.
- Subir `text-[10px]/[11px]` → `text-xs`; secundarios `slate-500/600` → `slate-400`.
- Añadir `focus-visible:ring-2 ring-primary` global.
- `motion-reduce:animate-none` al badge live.
- `aria-label` en cards y en ProbabilityBars.
- Skeletons en MatchList (§10.4).

### 🗺️ Roadmap
**Corto (1 semana):** Quick wins + tokens en `app.config.ts`/`main.css` + migrar header, filtros y badges a Nuxt UI + arreglar banderas.
**Mediano (2–4 semanas):** `useAsyncData` (SSR) + endpoint batch de predicciones + `USlideover` móvil + `UTable` en grupos + estado en URL (view/match/filtros) + `app/layouts/default.vue` (shell escalable) + `@nuxt/image`.
**Largo (1–2 meses):** Design system documentado (Storybook/Histoire), navegación con sidebar/breadcrumbs si crece a multipágina, virtualización de listas, tests de a11y (axe) en CI, modo claro opcional vía color-mode.

### 🎯 Resultado esperado
Misma información, pero con **un acento de marca + neutros**, superficies con borde en vez de sombras translúcidas, iconografía Lucide en lugar de emojis, tipografía con escala, componentes Nuxt UI consistentes, y flujos móviles con drawer. Aspecto **SaaS corporativo** (Linear/Stripe), sin perder la densidad de datos que el dashboard necesita.
