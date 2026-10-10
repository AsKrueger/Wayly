# Wayly

> Tu tiempo. Tu lugar. Tu plan.

Wayly es una aplicación web que ayuda a decidir qué hacer en una ciudad o zona, combinando tiempo disponible, presupuesto, ubicación y preferencias para proponer planes concretos. La pantalla inicial permite seleccionar preferencias y explorar lugares de ejemplo locales; todavía no genera recomendaciones personalizadas.

## Stack inicial

- Angular 18 con Standalone Components y Angular Router
- TypeScript strict
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

La aplicación queda disponible en `http://localhost:4200/`. La ruta inicial es Discover: permite elegir preferencias básicas y filtra un conjunto local de lugares ficticios. No produce recomendaciones personalizadas.

## Calidad

```bash
npm test
npm run lint
npm run build
```

También están disponibles `npm run test:watch` y `npm run test:coverage`.

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

La estructura crecerá conforme se incorporen funcionalidades. Los modelos mínimos de lugares y preferencias están definidos, junto con un catálogo local intercambiable para datos de demostración. Todavía no se incluyen llamadas a APIs externas, mapas, Firebase, autenticación ni lógica avanzada de recomendaciones.

## Documentación del producto

La definición inicial de producto y arquitectura está en [`docs/`](docs/).

La pantalla Discover, sus datos de ejemplo y sus interacciones están descritos en [docs/DISCOVER.md](docs/DISCOVER.md).

El modelo de lugares, el catálogo tipado y las fixtures están descritos en [docs/PLACE-MODEL.md](docs/PLACE-MODEL.md).

La decisión de aplazar el proveedor externo hasta definir una búsqueda geográfica está en [ADR-0007](docs/ADR/ADR-0007-Defer-External-Place-Provider.md).

La identidad visual, tokens y estados accesibles se describen en [docs/DESIGN-SYSTEM.md](docs/DESIGN-SYSTEM.md).
