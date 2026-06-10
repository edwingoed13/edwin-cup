/**
 * Polling de "tiempo real" simple: mientras el partido seleccionado esté
 * LIVE, cada `intervalMs` se re-fetchea el partido y su predicción.
 * El intervalo se crea/destruye automáticamente al cambiar de selección
 * y se limpia al desmontar el componente que usa el composable.
 */
export function useLiveUpdates(intervalMs = 45_000) {
  const store = useMatchesStore()
  let timer: ReturnType<typeof setInterval> | null = null

  const isPolling = ref(false)

  function stop() {
    if (timer) {
      clearInterval(timer)
      timer = null
    }
    isPolling.value = false
  }

  watch(
    () => store.selectedMatch,
    (match) => {
      stop()
      if (match?.status === 'LIVE') {
        isPolling.value = true
        timer = setInterval(() => {
          void store.refreshSelectedMatch()
        }, intervalMs)
      }
    },
    { immediate: true },
  )

  onUnmounted(stop)

  return { isPolling }
}
