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

La estructura crecerá conforme se incorporen funcionalidades. Existen modelos mínimos para lugares y preferencias, pero todavía no se incluyen APIs, mapas, Firebase, autenticación ni lógica avanzada de recomendaciones.

## Documentación del producto

La definición inicial de producto y arquitectura está en [`docs/`](docs/).

La pantalla Discover, sus datos de ejemplo y sus interacciones están descritos en [docs/DISCOVER.md](docs/DISCOVER.md).

La identidad visual, tokens y estados accesibles se describen en [docs/DESIGN-SYSTEM.md](docs/DESIGN-SYSTEM.md).
