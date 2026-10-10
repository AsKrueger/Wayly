# Wayly

> Tu tiempo. Tu lugar. Tu plan.

Wayly es una aplicación web que ayuda a decidir qué hacer en una ciudad o zona, combinando tiempo disponible, presupuesto y preferencias para proponer actividades. Discover genera propuestas explicables a partir de lugares locales de demostración y permite comparar y elegir entre sus recomendaciones compatibles.

## Stack inicial

- Angular 18 con Standalone Components y Angular Router
- TypeScript strict
- Leaflet para mapas interactivos opcionales
- Jest y Angular Testing Utilities
- ESLint
- npm

## Requisitos

- Node.js `18.19.1`, `20.11.1` o `22.x`
- npm `10.2` o superior

Estas versiones corresponden al rango soportado por Angular 18.

## Instalación y desarrollo

```bash
npm ci
npm start
```

La aplicación queda disponible en `http://localhost:4200/`. La ruta inicial es Discover: permite elegir preferencias y generar una propuesta ordenada y explicable con datos locales ficticios. El mapa solo carga teselas si se proporcionan coordenadas válidas. Para las condiciones del servicio de teselas de OpenStreetMap y sus limitaciones de uso, consulta [ADR-0008](docs/ADR/ADR-0008-Interactive-Map-Provider.md).

## Calidad

```bash
npm test
npm run lint
npm run build
```

También están disponibles `npm run test:watch` y `npm run test:coverage`.

La estrategia, estructura y línea base medible de las pruebas están en [docs/TESTING.md](docs/TESTING.md).

## Estructura

```text
src/
├── app/
│   ├── core/
│   ├── shared/
│   ├── features/
│   ├── app.component.*
│   ├── app.config.ts
│   └── app.routes.ts
├── assets/
└── styles.css
```

La estructura crecerá conforme se incorporen funcionalidades. Los modelos de lugares y preferencias están definidos, junto con un catálogo local intercambiable. No se incluyen proveedores externos de lugares, geolocalización, Firebase ni autenticación.

## Documentación del producto

La definición inicial de producto y arquitectura está en [`docs/`](docs/).

La pantalla Discover, sus datos de ejemplo, la propuesta y el mapa opcional están descritos en [docs/DISCOVER.md](docs/DISCOVER.md).

El modelo de lugares, el catálogo tipado y las fixtures están descritos en [docs/PLACE-MODEL.md](docs/PLACE-MODEL.md).

La decisión de aplazar el proveedor externo hasta definir una búsqueda geográfica está en [ADR-0007](docs/ADR/ADR-0007-Defer-External-Place-Provider.md).

La visualización cartográfica opcional usa Leaflet y, solo para lugares con coordenadas válidas, el servicio de teselas OSM bajo los límites documentados en [ADR-0008](docs/ADR/ADR-0008-Interactive-Map-Provider.md). Las fixtures actuales no tienen coordenadas, no se realizan peticiones de teselas para ellas y la aplicación sigue funcionando si el mapa no está disponible.

La identidad visual, tokens y estados accesibles se describen en [docs/DESIGN-SYSTEM.md](docs/DESIGN-SYSTEM.md).
