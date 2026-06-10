import tailwindcss from '@tailwindcss/vite'

export default defineNuxtConfig({
  compatibilityDate: '2026-06-01',
  devtools: { enabled: true },

  modules: ['@pinia/nuxt'],

  // Pinia: escanea los stores (ruta relativa a srcDir, es decir app/)
  pinia: {
    storesDirs: ['./stores/**'],
  },

  // Tailwind v4 se integra como plugin de Vite (no requiere tailwind.config)
  vite: {
    plugins: [tailwindcss()],
  },

  css: ['~/assets/css/main.css'],

  typescript: {
    strict: true,
    // typeCheck en build lo puedes activar instalando vue-tsc
    typeCheck: false,
  },

  app: {
    head: {
      title: 'Mundial 2026 – Panel analítico (hora Perú)',
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
