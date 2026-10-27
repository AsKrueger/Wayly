# Generación del catálogo por localidad

Este documento describe cómo se genera el catálogo estático de lugares a partir de OpenStreetMap, según el [ADR-0009](ADR/ADR-0009-Location-Selection.md). El catálogo se procesa fuera de línea: la aplicación nunca consulta OpenStreetMap en tiempo de ejecución.

## Entradas

Se necesitan tres GeoJSON, derivados de un extracto de OpenStreetMap:

| Archivo | Contenido | Uso |
|---|---|---|
| `places.geojson` | Nodos con etiquetas de lugares (`amenity`, `tourism`, `leisure`, `natural`, `historic`) | Lugares candidatos |
| `localities.geojson` | Nodos `place=town`, `village` o `city` con `name` | Centro de cada localidad |
| `admin.geojson` | Polígonos `boundary=administrative` con `admin_level` 4 (comunidad autónoma) y 6 (provincia) | Región y provincia de cada localidad |

El extracto de España se descarga a mano desde una fuente oficial de extractos de OpenStreetMap. Los comandos de extracción de estos tres archivos con `osmium` **se validan en F4-1 sobre el extracto real**: esta documentación no los da por probados.

## Generación

```powershell
node scripts/generate-place-catalogs.cjs --places places.geojson --localities localities.geojson --admin admin.geojson --out catalog-output
```

Opciones:

- `--country` (por defecto `ES`) y `--country-name` (por defecto `España`).

Salida en `catalog-output/`:

- `index.json`: jerarquía país → región → provincia → localidad, con el número de lugares de cada localidad.
- `localities/<id>.json`: lugares dentro de 15 km del centro de la localidad, con atribución y licencia.

El directorio `catalog-output/` está excluido del repositorio hasta que se mida su volumen.

## Reglas

- **Radio:** 15 km desde el centro de la localidad (ADR-0009).
- **Sin límite de resultados:** se incluyen todos los lugares dentro del radio.
- **Categorías:** las de `src/app/core/domain/models/place-category.ts`, según la tabla de `scripts/generate-place-catalogs.cjs`.
- **Estado de los datos:** cada lugar lleva `source: 'openstreetmap'` y `dataStatus: 'unverified'`.
- **Descartes:** un lugar sin nombre o sin categoría reconocida se descarta y se cuenta en el informe.
- **Localidades sin región o provincia:** se omiten y se listan en el informe.
- **Solapamiento:** un lugar puede aparecer en varios catálogos si está dentro del radio de varias localidades. Es intencionado y es un factor del volumen.

## Verificación pendiente en F4-1

- Mapeo de niveles de España, incluidos Ceuta y Melilla, contra el etiquetado real de OpenStreetMap.
- Comandos de extracción con `osmium` sobre el extracto real.
- Volumen medido: número de archivos, tamaño en disco y tiempo de generación. Decide si el catálogo entra en el repositorio o se guarda de otra forma.

## Pruebas

```powershell
npx jest scripts/generate-place-catalogs.spec.cjs
```

Las pruebas usan datos sintéticos pequeños y no requieren el extracto real.
