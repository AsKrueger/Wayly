# Fuentes de datos

Wayly obtiene todos los datos en tiempo real desde el navegador, con servicios abiertos, gratuitos y sin clave ([ADR-0010](ADR/ADR-0010-Open-Data-At-Runtime.md)). No hay backend.

## Arquitectura

La aplicación solo conoce **puertos** (`src/app/core/application/ports`). Los **adaptadores** (`src/app/infrastructure`) traducen cada servicio al modelo de Wayly. Las pruebas usan un `fetch` falso (`FETCH`), así que nunca llaman a la red.

| Puerto | Adaptador | Servicio |
| --- | --- | --- |
| `PlaceSearch` | `FallbackPlaceSearch` → `OverpassPlaceSearch`, después `PhotonPlaceSearch` | Overpass (OpenStreetMap); Photon como respaldo |
| `Geocoder` | `PhotonGeocoder` | Photon: buscar sitios y nombrar la posición del usuario |
| `Locator` | `BrowserLocator` | API de geolocalización del navegador, solo al pulsar el botón |
| `WeatherProvider` | `OpenMeteoWeather` | Open-Meteo: tiempo actual y probabilidad de lluvia en las próximas 3 horas |
| `PlaceDetails` | `WikipediaDetails` | Wikidata (artículo en el idioma del usuario) y resumen de Wikipedia con foto |

## Lugares

### Reglas de OpenStreetMap

`src/app/infrastructure/overpass/osm-rules.ts` es la **única tabla** que decide qué etiquetas se buscan y cómo se convierten en lugares de Wayly. La usan la consulta de Overpass, el traductor de resultados y el respaldo de Photon.

Cada regla fija la categoría, la duración estimada de la visita, el coste estimado (`free`, `low`, `medium`, `high`) y si es a cubierto. Algunas etiquetas muy frecuentes (iglesias, memoriales, obras de arte) solo se aceptan si tienen elemento de Wikidata, para no llenar el plan de lugares menores.

Ajustes por etiquetas reales: `fee=no` hace gratis el lugar; `fee=yes` evita que figure como gratis; `indoor=yes` lo marca a cubierto.

**Relevancia** (`notability`, de 0 a 1): artículo de Wikipedia o Wikidata +0,55; patrimonio (`heritage`) +0,2; atracción o mirador +0,1; foto +0,1; web +0,05.

### Consulta

- Radio limitado entre 100 m y 5 km.
- Una salida por categoría con un máximo de 70 elementos, para que una categoría densa (por ejemplo, bares) no expulse a las demás.
- Hasta 60 lugares destacados con Wikidata cuando se piden cultura o monumentos.
- Límite de 12 s en el servidor y 15 s en el cliente.

### Respaldo y errores

1. Overpass `overpass-api.de`, después `overpass.private.coffee`.
2. Si fallan los dos (saturación, 429, 5xx, tiempo agotado), Photon con las mismas reglas. Photon no tiene horarios ni Wikidata: el plan sale igual y esos datos quedan como desconocidos.
3. Si también falla, se muestra el error de Overpass con opción de reintentar.

El 2026-11-18 la instancia principal respondió «a plena capacidad» durante las pruebas, así que el respaldo no es teórico.

### Caché

Los resultados de Overpass se guardan 24 horas en el dispositivo, con la posición redondeada a unos 100 m, las categorías y el idioma como clave. Se guardan como máximo 6 búsquedas; la más antigua se borra primero.

## Seguridad

- La CSP de `src/index.html` solo permite conectar con estos servicios y cargar imágenes de `tile.openstreetmap.org` y `upload.wikimedia.org`.
- Las webs de los lugares solo se aceptan con `http` o `https`.
- El idioma de Wikipedia se valida antes de construir la URL, y solo se aceptan fotos de `upload.wikimedia.org`.
