# Motor de planes (v2)

Desde la #67 Wayly propone **planes**: varias paradas ordenadas, con horas de llegada y salida, trayectos a pie y totales. El motor es TypeScript puro en `src/app/core/domain` (ADR-0003): no depende de Angular ni de la red.

El motor v1 (`recommendation-engine.ts`, [RECOMMENDATION-ENGINE.md](RECOMMENDATION-ENGINE.md)) solo lo usa la pantalla Discover antigua y se retira con ella en la #68.

## Entrada

`PlanContext`: lugares, punto de partida, preferencias (categorías, duración y presupuesto), hora de inicio, tiempo meteorológico (opcional) y semilla (opcional).

| Preferencia | Valores |
| --- | --- |
| Duración | 60, 120, 180, 240 o 480 minutos |
| Presupuesto | `free` (solo gratis), `low`, `medium`, `any` |
| Categorías | Las siete de `place-category.ts`; ninguna significa «cualquiera» |

## Candidatos

Un lugar entra en la lista de candidatos si:

- tiene coordenadas;
- es de una categoría elegida;
- su coste estimado no supera el presupuesto (sin dato se asume `low`);
- está dentro del radio según la duración (1 km para 1 h, 1,6 km para 2 h, 2,2 km para 3 h, 2,8 km para 4 h y 4 km para el día entero, con un 15 % de margen);
- su visita cabe en el tiempo disponible.

## Horarios

`opening-hours.ts` interpreta el subconjunto habitual de `opening_hours`: `24/7`, días y rangos (`Mo-Fr`, `Fr-Mo`), listas, varios tramos, tramos que pasan de medianoche, final abierto (`18:00+`), `off` y reglas posteriores que sustituyen a las anteriores. **Cualquier otra cosa se trata como desconocida**: meses, festivos, `sunrise` o comentarios. Wayly no adivina horarios.

Un lugar **cerrado durante la visita** (no solo a la llegada) no entra en el plan. Si el horario es desconocido, puede entrar, y la parada lo dice.

Las horas son las del dispositivo del usuario.

## Puntuación explicable

Cada parada suma puntos y guarda la razón que se muestra al usuario:

| Señal | Puntos | Razón mostrada |
| --- | ---: | --- |
| Coincide con una categoría elegida | +30 (+20 si no se eligió ninguna) | `category` |
| Relevancia (Wikipedia, patrimonio…) | relevancia × peso de la estrategia | `notable` si es ≥ 0,5 |
| Abierto toda la visita | +10 | `open`; si no se sabe, `hours-unknown` |
| Llueve o es probable: a cubierto / al aire libre | +15 / −25 | `indoor-bad-weather` |
| Buen tiempo de día: naturaleza o vistas al aire libre | +6 | `outdoor-good-weather` |
| Gratis / barato | +5 / +2 | `free` |
| Comer a la hora de comer o cenar (13–15 h, 20–22 h) | +18 | `meal-time` |
| Tiene web | +2 | — |
| A 6 minutos o menos a pie | — | `close` |

Al elegir la siguiente parada se resta el **paseo** (minutos × penalización de la estrategia) y la **repetición**: misma categoría que la anterior (−15), mismo tipo ya visitado (−25), tercera parada de la misma categoría (−20) y segunda comida (−40). Una parada con menos de 8 puntos no se añade.

La **afinidad** del plan es la media de las puntuaciones de sus paradas (0–100). Orienta, no valora objetivamente el lugar.

## Construcción

Algoritmo voraz: desde el punto de partida, en cada paso se elige el mejor candidato cuyo paseo y visita caben en el tiempo restante y que está abierto a esa hora. Se para al llegar al máximo de paradas (2, 3, 4, 5 o 7 según la duración) o cuando ninguna parada merece la pena.

Paseo estimado: distancia en línea recta × 1,3 por el trazado de las calles, a 4,8 km/h.

## Tres planes

| Estrategia | Para quién | Pesos |
| --- | --- | --- |
| `balanced` (equilibrado) | Opción por defecto | Relevancia ×30, paseo −1,2/min |
| `nearby` (cerca y tranquilo) | Poco paseo, sin prisas | Relevancia ×15, paseo −3,5/min, 85 % del tiempo y menos paradas |
| `highlights` (imprescindibles) | Lo más destacado | Relevancia ×65, paseo −0,7/min |

Los planes posteriores penalizan (−35) las paradas ya usadas, y un plan con las mismas paradas que otro se descarta. Por eso salen de uno a tres planes distintos.

## Edición

- `removeStop`: quita una parada y recalcula horas y trayectos.
- `alternativesForStop`: hasta 3 sustitutos que mantienen el plan dentro del tiempo y abiertos; primero los de la misma categoría.
- `rebuildPlan` devuelve `null` si el plan ya no cabe o algún lugar estaría cerrado.

## Sorpréndeme

`surprisePreferences(semilla)`: de 2 a 3 categorías al azar, de 1 a 3 horas y presupuesto bajo o indiferente. La semilla hace el resultado reproducible; `seed` en el contexto añade una variación pequeña y reproducible al regenerar.

## Pruebas

`opening-hours.spec.ts` y `plan-generator.spec.ts`: tiempo nunca superado, cronología coherente, lugares cerrados excluidos, lluvia, comidas, estrategias, edición y semillas.
