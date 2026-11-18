# Product Definition

## Nombre y tagline

- Nombre: Wayly
- Tagline: Tu tiempo. Tu lugar. Tu plan. (EN: Your time. Your place. Your plan.)

## Descripción

Wayly es una aplicación web responsive y mobile-first que ayuda a decidir qué hacer en una ciudad o una zona determinada. El sistema interpreta restricciones, preferencias y contexto para convertirlos en planes concretos y accionables.

## Wayly 2.0 (desde el 2026-11-18)

La propuesta de valor se rehízo a partir del [análisis de competencia](COMPETITORS.md):

- **Valor en 10 segundos:** sin registro; «Sorpréndeme» o tres decisiones y hay plan.
- **Planes, no listas:** tres planes completos con horas, trayectos a pie, duración, distancia y coste estimado.
- **Explicable:** cada parada dice por qué está en el plan.
- **Cualquier sitio del mundo** con datos abiertos ([ADR-0010](ADR/ADR-0010-Open-Data-At-Runtime.md)).
- **Contexto real:** horarios de apertura y el tiempo que hace.
- **Gratis de verdad, privado y en español e inglés.**
- **Publicidad honesta** tras el MVP: siempre etiquetada, nunca dentro del plan y con consentimiento.

Los 15 puntos del MVP de abajo siguen siendo el criterio de cierre de la fase 5.

## Problema que resuelve

El usuario suele tener que:

- buscar lugares;
- consultar horarios;
- comprobar precios;
- calcular distancias;
- decidir qué actividades combinar;
- validar si encajan en el tiempo disponible;
- valorar alternativas.

Wayly reduce esa carga de decisión con una respuesta clara a la pregunta: "¿Qué puedo hacer ahora que encaje conmigo?"

## Usuarios objetivo

- turista;
- residente;
- persona con tiempo libre;
- pareja;
- grupo de amigos;
- persona que busca una actividad espontánea.

## Contextos principales

- Tiempo libre: "Tengo dos horas y no sé qué hacer."
- Restricción económica: "Tengo 15 €."
- Ubicación: "Estoy cerca del centro."
- Preferencias: "Quiero algo tranquilo."
- Condiciones externas: "Está lloviendo."
- Decisión rápida: "Sorpréndeme."

## Dispositivos objetivo

- Smartphone: prioridad P0, experiencia mobile-first.
- Laptop / desktop: prioridad P1 para comparación y planificación.
- Tablet: soporte responsive completo.

## MVP definido

El MVP debe permitir:

1. configurar tiempo;
2. configurar presupuesto;
3. configurar distancia;
4. seleccionar categorías;
5. seleccionar preferencias;
6. obtener actividades compatibles;
7. generar varios planes;
8. calcular coste;
9. calcular duración;
10. calcular distancia;
11. puntuar compatibilidad;
12. comparar planes;
13. seleccionar un plan;
14. modificarlo;
15. visualizarlo en un mapa.

## Experiencias diferenciadoras

### Plan generator

La generación debe tener una experiencia visual clara que muestre el progreso real del proceso sin animaciones artificiales:

- Analizando preferencias...
- Buscando actividades...
- Comprobando horarios...
- Optimizando ruta...
- Tu plan está listo

### Interactive map

Debe existir sincronización entre mapa, lista, actividad seleccionada y plan. Al seleccionar un elemento, el mapa debe actualizarse y viceversa.

### Plan battle

Es necesario comparar dos propuestas visualmente en formato de enfrentamiento, evaluando:

- precio;
- duración;
- distancia;
- actividades;
- compatibilidad;
- ventajas.

## Resultados esperados de la Issue #0

Wayly queda definido lo suficiente para iniciar implementación sin volver a debatir sus decisiones fundamentales.
