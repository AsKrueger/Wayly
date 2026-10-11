# Roadmap de Wayly

- **Última revisión:** 2026-10-11
- **Estado:** Fase 0 en curso
- **Principio rector:** coste cero. No se contrata ningún servicio ni se activa ninguna función de pago.

## Punto de partida

`docs/PRODUCT.md` define un MVP de 15 puntos: planes con varios lugares, distancia, edición del plan y mapa sincronizado. Hoy Wayly es un recomendador de lugares sueltos sobre 8 fixtures ficticias, sin coordenadas, sin backend y sobre Angular 18, que ya no recibe parches. Esta roadmap cierra esa distancia por orden de dependencias.

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
| F1-1 | | Migración de Angular | A una versión mayor con soporte, de mayor en mayor |
| F1-2 | | Migración de herramientas | Entorno de pruebas, ESLint y TypeScript |
| F1-3 | | Vaciado de la línea base | Eliminar entradas resueltas y retirar la exclusión de versiones mayores en Dependabot |
| F1-4 | | Endurecimiento menor | CSP en `src/index.html`, CI sin ejecución doble y pruebas de las rutas de error del gate |

**Salida:** cero avisos altos o críticos en dependencias de producción y línea base vacía o casi vacía.

### Fase 2: Demo sólida y desplegada

**Objetivo:** que lo que ya existe funcione bien, se pueda enseñar y esté descrito con exactitud.

| ID | Issue | Título | Alcance |
| --- | --- | --- | --- |
| F2-1 | | Mapa robusto | Leaflet en diferido y tolerancia a fallos aislados de tesela |
| F2-2 | | Refactor de Discover | Partir `discover-page.component.ts`, extraer la tarjeta de recomendación y unificar etiquetas |
| F2-3 | | Doble llamada a `selectPlace` | Corrección de error; rama `bugfix/...` |
| F2-4 | | Documentación fiel | Alinear `docs/ARCHITECTURE.md` con lo implementado, marcando lo previsto como previsto |
| F2-5 | | Despliegue | Hosting gratuito (GitHub Pages o plan gratuito de Firebase Hosting), separado del CI |

**Salida:** URL pública de la demo y documentación que no promete de más.

### Fase 3: Decisiones de producto

**Objetivo:** resolver los criterios que ADR-0007 dejó abiertos. Bloquea las fases 4 a 6.

| ID | Issue | Título | Alcance |
| --- | --- | --- | --- |
| F3-1 | | Geografía y ubicación | Ciudad de lanzamiento, entrada de ubicación con consentimiento, radio, límite de resultados y lugar de la atribución, recogidos en un ADR |

**Salida:** un ADR nuevo que sustituya los criterios de revisión de ADR-0007.

Esta fase no depende del código y puede resolverse en paralelo a las fases 1 y 2.

### Fase 4: Datos reales sin coste

**Objetivo:** sustituir las fixtures ficticias por lugares reales sin proveedor de pago, sin clave y sin backend.

| ID | Issue | Título | Alcance |
| --- | --- | --- | --- |
| F4-1 | | Catálogo desde OpenStreetMap | Generar un catálogo estático a partir de un extracto de la ciudad elegida, procesado fuera de línea, y documentar cómo se regenera |
| F4-2 | | Adaptador de catálogo estático | Nuevo adaptador de `PlaceCatalog` sobre JSON, con atribución de OpenStreetMap y cumplimiento de ODbL |

**Salida:** Discover muestra lugares reales con coordenadas y el mapa se ve.

**Limitaciones asumidas:** el catálogo se actualiza a mano y OpenStreetMap no aporta precios, así que el presupuesto sigue siendo una estimación por categoría.

### Fase 5: Motor v2

**Objetivo:** que la recomendación use la información que ya tendrá el catálogo.

| ID | Issue | Título | Alcance |
| --- | --- | --- | --- |
| F5-1 | | Consulta geográfica y distancia | Ampliar el puerto `PlaceCatalog` e incorporar la distancia al filtrado y a la puntuación |
| F5-2 | | Horarios de apertura | Usar `openingHours` en la compatibilidad |
| F5-3 | | Preferencias y puntuación | Preferencias cualitativas y revisión de la puntuación por tiempo, que hoy premia llenar el hueco disponible |

**Salida:** puntos 3, 5 y 10 del MVP cubiertos, con razones explicables.

### Fase 6: Planes de verdad

**Objetivo:** pasar de recomendar lugares a proponer planes.

| ID | Issue | Título | Alcance |
| --- | --- | --- | --- |
| F6-1 | | Generador de planes | Planes de varios lugares con coste, duración y desplazamiento totales, mostrando el progreso real |
| F6-2 | | Plan Battle entre planes | Comparar planes completos en lugar de lugares sueltos |
| F6-3 | | Edición del plan | Modificar el plan elegido |
| F6-4 | | Sincronización | Mapa, lista y plan sincronizados en ambos sentidos |

**Salida:** los 15 puntos del MVP de `docs/PRODUCT.md` cumplidos.

## Después del MVP

Solo si sigue siendo gratis:

- PWA.
- «Sorpréndeme».
- Clima mediante una API abierta sin clave.
- Planes guardados en el dispositivo, en lugar de con autenticación.

## Fuera de alcance

- Proveedores de lugares de pago.
- Backend propio, autenticación y base de datos.
- Funciones de GitHub que requieran plan de pago.

## Registro de reevaluaciones

| Fecha | Fase cerrada | Ritmo frente a lo previsto | Cambios en la roadmap | Siguiente |
| --- | --- | --- | --- | --- |
| 2026-10-11 | Ninguna (creación) | Sin referencia todavía | Versión inicial, reestructurada desde cero | Fase 0 |
