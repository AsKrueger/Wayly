# Cómo se trabaja en Wayly

Estas reglas se aplican a todas las issues desde la F0-1. Las fases y las issues previstas están en [docs/ROADMAP.md](docs/ROADMAP.md).

## Coste cero

No se contrata ningún servicio ni se activa ninguna función de pago. Cualquier herramienta, proveedor o ajuste de GitHub que se proponga tiene que ser gratuito.

## Ramas

- **Ninguna rama se crea sin aprobación del propietario del repositorio.**
- `develop` es la rama de trabajo de todas las fases.
- `main` solo recibe cambios al cerrar una fase, mediante una PR desde `develop`.
- Una rama por issue, creada desde `develop`: `feature/issueN`, donde N es el número que GitHub asigna a la issue.
- Si la rama corrige un error: `bugfix/...`, con una descripción corta.
- Las ramas de issue se integran en `develop`.

```bash
git switch develop
git pull
git switch -c feature/issue15
```

## Commits

Formato: `feature/issueN: lo que se hizo`

Ejemplo: `feature/issue21: carga diferida de Leaflet`

En una rama `bugfix/...` el prefijo es el nombre de esa rama.

## Antes de integrar una issue

```bash
npm run lint
npm test
npm run build
```

El CI ejecuta estas mismas comprobaciones en cada push. Los detalles están en [docs/TESTING.md](docs/TESTING.md).

## Integración y ramas protegidas

`main` y `develop` están protegidas con reglas de rama de GitHub (Settings → Rules → Rulesets):

- Solo se integra mediante pull request; un push directo a `main` o a `develop` es rechazado.
- La PR no se puede fusionar hasta que estos tres checks estén en verde:
  - `Quality checks`
  - `Dependency review`
  - `Analyze JavaScript and TypeScript`
- En `develop`, la rama de la issue tiene que estar actualizada con `develop` antes de fusionar. En `main` no se exige, porque `main` solo recibe cambios desde `develop`.
- No se puede forzar un push ni eliminar ninguna de las dos ramas.
- No se exigen aprobaciones de revisión: el repositorio tiene un único mantenedor, que no puede aprobarse a sí mismo.

Las reglas no tienen excepciones para el propietario.

## Cierre de fase

Al terminar una fase se notifica al propietario y se hacen tres cosas, en este orden:

1. **Code review de la fase.** Se revisa el conjunto de cambios de `develop` frente a `main`.
2. **PR de `develop` a `main`** con todas las issues de la fase, usando la plantilla de cierre de fase.
3. **Reevaluación de la roadmap.** Se decide qué va después, si se va más rápido o más lento de lo previsto y si hay que reordenar o recortar. El resultado se anota en el registro de reevaluaciones de [docs/ROADMAP.md](docs/ROADMAP.md).

### Plantilla de la PR

La plantilla está en [.github/PULL_REQUEST_TEMPLATE/cierre-de-fase.md](.github/PULL_REQUEST_TEMPLATE/cierre-de-fase.md) y se carga abriendo la PR con este enlace:

<https://github.com/AsKrueger/Wayly/compare/main...develop?expand=1&template=cierre-de-fase.md>

GitHub solo lee las plantillas de la rama por defecto, que es `main`. Hasta que el primer cierre de fase lleve la plantilla a `main`, el enlace abre la PR vacía y hay que pegar a mano el contenido del archivo.

## Excepciones heredadas

- Los commits anteriores a estas reglas no siguen el formato. No se reescribe el historial.
- La rama `security/issue-14-hardening`, ya fusionada en `develop` y eliminada, no sigue la convención de nombres.
- `develop` ya existía antes de estas reglas.
