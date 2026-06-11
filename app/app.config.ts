export default defineAppConfig({
  ui: {
    // Paleta semántica del design system (auditoría §9.1).
    // Un acento de marca (emerald "cancha") + neutros + semánticos de estado.
    colors: {
      primary: 'emerald', // marca
      secondary: 'sky', // acento dato local
      success: 'green',
      warning: 'amber', // acento dato visita / alertas suaves
      error: 'red', // live / errores
      neutral: 'slate', // base, coherente con el tema oscuro actual
    },
  },
})
