/**
 * Refresco automático del panel mientras la pestaña está visible: cada
 * `intervalMs` re-trae partidos y tabla (silencioso, sin skeletons) para seguir
 * los resultados reales. Se pausa cuando la pestaña está oculta y refresca al
 * instante cuando vuelve a primer plano. Se limpia al desmontar.
 *
 * Nota: el backend cachea con TTL ~90 s, así que un intervalo de 60 s mantiene
 * el panel al día sin saturar la API gratuita (la mayoría de polls dan en caché).
 */
export function useAutoRefresh(intervalMs = 60_000) {
  const store = useMatchesStore()
  let timer: ReturnType<typeof setInterval> | null = null

  function tick() {
    if (document.hidden) return
    void store.refresh()
  }

  function onVisibility() {
    if (!document.hidden) void store.refresh()
  }

  onMounted(() => {
    timer = setInterval(tick, intervalMs)
    document.addEventListener('visibilitychange', onVisibility)
  })

  onUnmounted(() => {
    if (timer) clearInterval(timer)
    document.removeEventListener('visibilitychange', onVisibility)
  })
}
