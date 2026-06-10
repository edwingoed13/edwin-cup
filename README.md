# Mundial 2026 – Panel analítico (hora Perú)

Dashboard local construido con **Nuxt 4 + TypeScript + TailwindCSS v4 + Pinia** para
visualizar el calendario del Mundial 2026, convertir horarios de las sedes a hora de
Perú (PET) y mostrar probabilidades de resultado por partido.

Los datos del calendario son **reales**, obtenidos de la API pública de
[TheSportsDB](https://www.thesportsdb.com) (liga *FIFA World Cup*, temporada 2026).

## Requisitos

- **Node.js 20.19+ (recomendado: 22 LTS o superior)** — probado con Node 24.
- npm 10+.
- Conexión a internet en el primer arranque (luego usa cache + snapshot offline).

## Arranque

```bash
npm install
npm run dev
```

Abre la URL que imprima la consola (3000, o 3001/3002 si está ocupado). Verás los
**72 partidos reales de la fase de grupos** (12 grupos A–L, 48 selecciones), ordenados
por hora PET, con filtros y panel de detalle con probabilidades.

Otros scripts: `npm run build` (producción) y `npm run preview`.

## Qué datos son reales y qué es estimado

| Dato | Origen |
| --- | --- |
| Partidos, equipos, grupos, sedes | **Real** — TheSportsDB |
| Fecha/hora (timestamp UTC), estado, marcador | **Real** — TheSportsDB |
| Zona horaria IANA de cada sede + hora PET | **Real** — calculado localmente desde el UTC |
| Código FIFA, bandera, confederación | **Real** — tabla de referencia local |
| `rating` / `attackStrength` / `defenseStrength` | **Estimado** — ranking FIFA aprox. 2025 |
| Probabilidades (1/X/2), `confidence`, explicación | **Calculado** — modelo baseline |
| Odds, noticias, alineaciones | **Stub** — pendiente de proveedor real |

> El `rating` de cada selección es una **estimación** que solo alimenta el modelo de
> predicción. Editable en [`server/data/worldCupReference.ts`](server/data/worldCupReference.ts).
> Las eliminatorias (dieciseisavos en adelante) aparecerán automáticamente cuando la
> fuente publique los cruces, una vez definidos por los resultados de grupos.

## Cómo se obtienen y cachean los datos reales

[`server/services/worldCupApi.ts`](server/services/worldCupApi.ts):

- Pagina las 3 jornadas de grupos con `eventsround` (la key gratuita limita
  `eventsseason` a 15 eventos, pero por ronda devuelve la jornada completa).
- Cachea en memoria con **TTL de 90 s** (refresca marcadores en vivo sin saturar la API)
  y deduplica llamadas concurrentes.
- Guarda un **snapshot** en `server/data/worldcup-2026.snapshot.json`; si la API no
  responde, la app sigue funcionando con ese respaldo.
- Configurable con la variable de entorno **`THESPORTSDB_KEY`** (por defecto la key de
  prueba `"3"`). Con una key premium podrías subir el detalle y los datos en vivo.

```bash
# Ejemplo con tu propia key:
$env:THESPORTSDB_KEY="123456"; npm run dev   # PowerShell
THESPORTSDB_KEY=123456 npm run dev           # bash
```

## Cómo se calculan los horarios PET

TheSportsDB entrega el kickoff como **timestamp UTC**. En `worldCupApi.ts`:

1. Se interpreta el timestamp como UTC (`new Date(ts + 'Z')`).
2. `formatInTimeZone(utc, 'America/Lima', …)` de **date-fns-tz** da la hora PET (offset `-05:00`).
3. `formatInTimeZone(utc, <tz de la sede>, …)` da la hora local de la sede (mostrada en el detalle).

La zona horaria IANA de cada estadio está en [`server/data/worldCupReference.ts`](server/data/worldCupReference.ts).
El helper genérico `convertToPET` vive en [`shared/utils/time.ts`](shared/utils/time.ts).

## Cómo se extiende el servicio de predicciones

[`server/services/predictionService.ts`](server/services/predictionService.ts):

- **Features**: diferencia de rating, ataque vs defensa cruzados y ventaja de localía
  continental (sede CONCACAF: USA/México/Canadá). Las puntuaciones pasan por **softmax**,
  así que las tres probabilidades siempre suman 1.
- **Para enchufar tu red neuronal**: implementa `runNeuralModelPlaceholder()` para que
  devuelva `[probHome, probDraw, probAway]` (inferencia ONNX/TF.js o una llamada HTTP a un
  microservicio Python). Mientras devuelva `null` se usa el baseline; cuando devuelva
  probabilidades, la predicción se marca como `model: "advanced"` automáticamente.
- Las predicciones se cachean en memoria; `POST /api/predictions/recalculate` con
  `{ "matchIds": ["..."] }` fuerza el recálculo.

## API disponible

| Método | Ruta | Descripción |
| --- | --- | --- |
| GET | `/api/matches` | Lista con filtros `stage, group, teamId, dateFrom, dateTo` |
| GET | `/api/matches/:id` | Partido con equipos resueltos (estado/marcador reales) |
| GET | `/api/teams` | Las 48 selecciones |
| GET | `/api/predictions/:matchId` | Predicción (la calcula si no existe) |
| POST | `/api/predictions/recalculate` | Body `{ matchIds: string[] }` |

## Integración futura (odds / noticias / alineaciones)

[`server/services/externalDataSources.ts`](server/services/externalDataSources.ts) deja
los stubs (`fetchLatestOdds`, `fetchNewsForMatch`, `fetchLineups`) con la forma de
respuesta ya definida; los comentarios indican dónde conectar el proveedor real (esas
fuentes suelen requerir API key de pago, por eso siguen simuladas).
