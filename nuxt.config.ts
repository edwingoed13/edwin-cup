export default defineNuxtConfig({
  compatibilityDate: '2026-06-01',
  devtools: { enabled: true },

  // @nuxt/ui integra Tailwind v4 (su propio plugin de Vite), color-mode, iconos y fuentes;
  // por eso no instalamos ni registramos @tailwindcss/vite por separado.
  modules: ['@nuxt/ui', '@pinia/nuxt'],

  // Pinia: escanea los stores (ruta relativa a srcDir, es decir app/)
  pinia: {
    storesDirs: ['./stores/**'],
  },

  css: ['~/assets/css/main.css'],

  // Tema oscuro FIJO (app sin toggle).
  // - `storageKey` propio: en localhost:3000 conviven varias apps Nuxt y
  //   comparten localStorage; con la key por defecto ("nuxt-color-mode") una
  //   preferencia "light/system" de OTRA app forzaba modo claro aquí.
  // - El forzado real se hace por página: definePageMeta({ colorMode: 'dark' })
  //   en app/pages/index.vue (única vía que el plugin runtime respeta).
  colorMode: {
    preference: 'dark',
    fallback: 'dark',
    storageKey: 'mundial2026-color-mode',
  },

  typescript: {
    strict: true,
    // typeCheck en build lo puedes activar instalando vue-tsc
    typeCheck: false,
  },

  app: {
    head: {
      title: 'Mundial 2026 – Panel analítico (hora Perú)',
      // `class: dark` → tokens oscuros ya en el HTML del SSR (sin FOUC).
      // El plugin de color-mode la mantiene porque la página fuerza 'dark'
      // vía definePageMeta (ver app/pages/index.vue).
      htmlAttrs: { lang: 'es', class: 'dark' },
      meta: [
        { name: 'viewport', content: 'width=device-width, initial-scale=1' },
        {
          name: 'description',
          content:
            'Dashboard local del Mundial 2026: calendario, horarios en hora de Perú (PET) y probabilidades por partido.',
        },
      ],
    },
  },
})
