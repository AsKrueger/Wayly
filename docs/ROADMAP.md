# Roadmap de Wayly

- **Última revisión:** 2026-10-25
- **Estado:** Fase 0 cerrada; fase 1 en curso (F1-1 y F1-2 integradas en `develop`)
- **Principio rector:** coste cero. No se contrata ningún servicio ni se activa ninguna función de pago.

## Punto de partida

`docs/PRODUCT.md` define un MVP de 15 puntos: planes con varios lugares, distancia, edición del plan y mapa sincronizado. Hoy Wayly es un recomendador de lugares sueltos sobre 8 fixtures ficticias, sin coordenadas, sin backend. Partía de Angular 18, que ya no recibe parches; la F1-1 lo llevó a Angular 20. Esta roadmap cierra esa distancia por orden de dependencias.

La roadmap se estructura desde cero. El código existente se mantiene; el trabajo de seguridad ya hecho se integra como una issue más de la fase 0.

## Forma de trabajo

Las reglas completas, con los comandos y la plantilla de PR, están en [CONTRIBUTING.md](../CONTRIBUTING.md). Este apartado las resume.

### Ramas

- No se crea ninguna rama sin aprobación del propietario del repositorio.
- Todas las fases se trabajan sobre `develop`.
- Una rama por issue: `feature/issueN`, donde N es el número que GitHub asigna a la issue.
- Si la rama corrige un error: `bugfix/...`.
- Las ramas de issue se integran en `develop`. `main` solo recibe cambios al cerrar una fase.

### Commits

Formato: `feature/issueN: lo que se hizo`

Ejemplo: `feature/issue21: carga diferida de Leaflet`

### Identificadores de esta roadmap

Las issues se identifican aquí por fase y orden (F0-1, F0-2…), porque GitHub no permite reiniciar la numeración. Al crear cada issue se anota su número real en la columna «Issue».

### Cierre de fase

Al terminar una fase se notifica y se hacen tres cosas, en este orden:

1. **Code review de la fase:** revisión del conjunto de cambios en `develop` frente a `main`.
2. **PR de `develop` a `main`** con todas las issues de la fase.
3. **Reevaluación de la roadmap:** qué va después, si vamos más rápido o más lento de lo previsto y si hay que reordenar o recortar. El resultado se anota en el registro del final de este documento.

### Excepciones heredadas

- La rama `security/issue-14-hardening`, ya fusionada en `develop` y eliminada, y los commits anteriores a esta roadmap no siguen la convención. No se reescribe la historia; la convención se aplica desde ahora.
- `develop` ya existía antes de esta roadmap.

## Fases

### Fase 0: Base del proyecto

**Objetivo:** dejar fijadas las reglas de trabajo y la seguridad del repositorio antes de tocar producto.

| ID | Issue | Título | Alcance |
| --- | --- | --- | --- |
| F0-1 | #15 | Flujo de trabajo y roadmap | `docs/ROADMAP.md`, `CONTRIBUTING.md` y plantilla de PR de cierre de fase |
| F0-2 | #16 | Ajustes finales de seguridad | `target-branch: develop` y exclusión temporal de versiones mayores en Dependabot, runner fijado a una versión concreta, explicación de 67 paquetes frente a 37 avisos y política de línea base aprobada en `DEPENDENCY_SECURITY.md` |
| F0-3 | #17 | Protección de ramas | Checks requeridos en `main` y `develop`, y ajustes gratuitos de Code security |

**Salida:** `develop` y `main` protegidas, CI, CodeQL y Dependency Review en verde, y flujo documentado.

### Fase 1: Plataforma soportada

**Objetivo:** salir de versiones sin soporte, que son el origen de casi todos los avisos de seguridad.

| ID | Issue | Título | Alcance |
| --- | --- | --- | --- |
| F1-1 | #18 | Migración de Angular | De la 18 a la 20, de mayor en mayor. Se detiene en la 20 porque la 21 exigía Jest 30 (F1-2) |
| F1-2 | #19 | Migración de herramientas | Jest 30 y ESLint 9 con configuración plana. TypeScript se queda en la 5.9 hasta la F1-5 |
| F1-3 | #43 | Vaciado de la línea base | Eliminar entradas resueltas y retirar la exclusión de versiones mayores en Dependabot |
| F1-4 | #44 | Endurecimiento menor | CSP en `src/index.html`, CI sin ejecución doble y pruebas de las rutas de error del gate |
| F1-5 | #42 | Migración de Angular a la 22 | Saltos 20 → 21 → 22. Va después de la F1-2 y antes de la F1-3; el LTS de Angular 20 termina el 2026-11-28 |

**Salida:** cero avisos altos o críticos en dependencias de producción y línea base vacía o casi vacía.

### Fase 3: Decisiones de producto

**Objetivo:** resolver los criterios que ADR-0007 dejó abiertos.

| ID | Issue | Título | Alcance |
| --- | --- | --- | --- |
| F3-1 | #52 | Geografía y ubicación | Selección país → región → provincia → localidad, radio de 15 km y atribución, recogidos en el ADR-0009 |

**Salida:** ADR-0009. Cerrada el 2026-10-26 y sustituida después por el [ADR-0010](ADR/ADR-0010-Open-Data-At-Runtime.md).

### Fases 2, 4, 5 y 6 originales: sustituidas

El 2026-11-18 el propietario pidió rehacer Wayly para que sea la mejor opción frente a la competencia, con libertad total. El análisis está en [COMPETITORS.md](COMPETITORS.md) y las decisiones en el [ADR-0010](ADR/ADR-0010-Open-Data-At-Runtime.md) y el [ADR-0011](ADR/ADR-0011-GitHub-Pages-Hosting.md).

- La fase 2 (demo y despliegue) queda dentro de la fase 5.
- La fase 4 (catálogo estático de España, #53 y #54) se sustituye por datos abiertos en tiempo real de todo el mundo. El generador queda archivado en la rama `feature/issue53` como plan de salida.
- Las fases 5 (motor v2) y 6 (planes) originales se reorganizan en la nueva fase 5.

### Fase 5: Wayly 2.0 (MVP)

**Objetivo:** que cualquiera, en cualquier sitio, tenga un plan completo y explicable en segundos, gratis y sin registrarse, en español o inglés.

| ID | Issue | Título | Alcance |
| --- | --- | --- | --- |
| F5-1 | #64 | Competencia y decisiones | `COMPETITORS.md`, ADR-0010, ADR-0011, esta roadmap |
| F5-2 | #65 | Español e inglés, estructura y modo oscuro | Traducción tipada, cabecera, pie, rutas, tema |
| F5-3 | #66 | Lugares reales de todo el mundo | Photon, geolocalización opcional, Overpass, Wikipedia, Open-Meteo |
| F5-4 | #67 | Motor v2 y generador de planes | Horarios, puntuación, tres planes, razones, «Sorpréndeme» |
| F5-5 | #68 | Experiencia de plan completa | Inicio, progreso, plan, mapa con ruta, comparar, editar, compartir |
| F5-6 | #69 | Guardados y PWA | Guardados, favoritos, recientes, instalación y uso sin conexión |
| F5-7 | #70 | Despliegue gratuito y SEO | GitHub Pages, 404.html, CSP, Open Graph |

**Salida:** URL pública con los 15 puntos del MVP de `docs/PRODUCT.md` cumplidos.

### Fase 6: Publicidad

**Objetivo:** monetizar sin perder la confianza del usuario.

| ID | Issue | Título | Alcance |
| --- | --- | --- | --- |
| F6-1 | #71 | Publicidad señalizada y con consentimiento | Espacios etiquetados, consentimiento, AdSense configurable, `ads.txt` |

**Salida:** publicidad lista para activarse en cuanto haya cuenta de AdSense aprobada, sin cargar nada de terceros sin consentimiento.

## Fuera de alcance

- Proveedores de lugares de pago.
- Reseñas propias, reservas y eventos con fecha (ver [COMPETITORS.md](COMPETITORS.md)).
- Backend propio, autenticación y base de datos.
- Funciones de GitHub que requieran plan de pago.

## Registro de reevaluaciones

| Fecha | Fase cerrada | Ritmo frente a lo previsto | Cambios en la roadmap | Siguiente |
| --- | --- | --- | --- | --- |
| 2026-10-11 | Ninguna (creación) | Sin referencia todavía | Versión inicial, reestructurada desde cero | Fase 0 |
| 2026-10-11 | Fase 0 | Sin referencia previa; cerrada el mismo día que se creó la roadmap | Sin cambios de alcance; la excepción de Dependabot deja de aplicarse | Fase 1 |
| 2026-10-25 | Ninguna (revisión tras F1-2) | Según lo previsto | F1-5 (Angular 22) añadida tras el análisis de la #19; fila de la F1-1 y F1-2 confirmadas | F1-5 (#42), después F1-3 |
| 2026-11-18 | Ninguna (relanzamiento) | Más lento de lo previsto: la fase 4 estaba bloqueada por el volumen del catálogo de España | Fases 2, 4, 5 y 6 sustituidas por la fase 5 (Wayly 2.0) y la fase 6 (publicidad); #53 y #54 cerradas | F5-2 (#65) |
