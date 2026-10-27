const { readFileSync, writeFileSync, mkdirSync } = require('node:fs');
const path = require('node:path');

const RADIUS_KM = 15;
const EARTH_RADIUS_KM = 6371;
const ATTRIBUTION = '© OpenStreetMap contributors';
const LICENSE = 'ODbL';

const CATEGORY_RULES = [
  { category: 'food', match: (t) => ['restaurant', 'cafe', 'fast_food', 'ice_cream'].includes(t.amenity) },
  { category: 'leisure', match: (t) => ['bar', 'pub', 'nightclub'].includes(t.amenity) || ['sports_centre', 'bowling_alley', 'fitness_centre'].includes(t.leisure) },
  { category: 'culture', match: (t) => ['museum', 'gallery', 'artwork', 'attraction'].includes(t.tourism) || ['theatre', 'cinema', 'arts_centre'].includes(t.amenity) || t.historic != null },
  { category: 'nature', match: (t) => ['park', 'garden', 'nature_reserve'].includes(t.leisure) || t.natural != null }
];

function categorize(tags) {
  const rule = CATEGORY_RULES.find((candidate) => candidate.match(tags));
  return rule ? rule.category : null;
}

function haversineKm(a, b) {
  const toRad = (deg) => (deg * Math.PI) / 180;
  const dLat = toRad(b.latitude - a.latitude);
  const dLon = toRad(b.longitude - a.longitude);
  const h = Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(a.latitude)) * Math.cos(toRad(b.latitude)) * Math.sin(dLon / 2) ** 2;
  return 2 * EARTH_RADIUS_KM * Math.asin(Math.sqrt(h));
}

function ringContains(ring, point) {
  let inside = false;
  for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
    const [xi, yi] = ring[i];
    const [xj, yj] = ring[j];
    const crosses = (yi > point.latitude) !== (yj > point.latitude) &&
      point.longitude < ((xj - xi) * (point.latitude - yi)) / (yj - yi) + xi;
    if (crosses) {
      inside = !inside;
    }
  }
  return inside;
}

function polygonContains(rings, point) {
  const [outer, ...holes] = rings;
  return ringContains(outer, point) && !holes.some((hole) => ringContains(hole, point));
}

function geometryContains(geometry, point) {
  if (geometry.type === 'Polygon') {
    return polygonContains(geometry.coordinates, point);
  }
  if (geometry.type === 'MultiPolygon') {
    return geometry.coordinates.some((polygon) => polygonContains(polygon, point));
  }
  return false;
}

function findAdminName(adminFeatures, point, adminLevel) {
  const match = adminFeatures.find((feature) =>
    String(feature.properties.admin_level) === String(adminLevel) &&
    geometryContains(feature.geometry, point));
  return match ? match.properties.name : null;
}

function placeFromFeature(feature, countryCode) {
  const tags = feature.properties;
  const name = tags.name;
  const category = categorize(tags);
  if (!name || !category) {
    return null;
  }
  const [longitude, latitude] = feature.geometry.coordinates;
  return {
    id: `${countryCode}-osm-${feature.id}`,
    name,
    description: tags.description ?? '',
    category,
    coordinates: { latitude, longitude },
    source: 'openstreetmap',
    dataStatus: 'unverified'
  };
}

function buildCatalogs({ places, localities, admin, countryCode, countryName }) {
  const report = { localitiesWithoutAdmin: [], localitiesWithoutPlaces: [], placesDiscarded: 0 };
  const extracted = places.map((feature) => placeFromFeature(feature, countryCode));
  const usable = extracted.filter(Boolean);
  report.placesDiscarded = extracted.length - usable.length;

  const regions = new Map();
  const catalogs = [];

  for (const feature of localities) {
    const centre = { latitude: feature.geometry.coordinates[1], longitude: feature.geometry.coordinates[0] };
    const regionName = findAdminName(admin, centre, 4);
    const provinceName = findAdminName(admin, centre, 6);
    const name = feature.properties.name;
    if (!name || !regionName || !provinceName) {
      report.localitiesWithoutAdmin.push(name ?? `osm-${feature.id}`);
      continue;
    }

    const localityPlaces = usable
      .filter((place) => haversineKm(centre, place.coordinates) <= RADIUS_KM)
      .sort((a, b) => a.id.localeCompare(b.id));

    if (localityPlaces.length === 0) {
      report.localitiesWithoutPlaces.push(name);
    }

    const id = `${countryCode}-osm-${feature.id}`;
    const summary = { id, name, placeCount: localityPlaces.length };

    if (!regions.has(regionName)) {
      regions.set(regionName, new Map());
    }
    const provinces = regions.get(regionName);
    if (!provinces.has(provinceName)) {
      provinces.set(provinceName, []);
    }
    provinces.get(provinceName).push(summary);

    catalogs.push({
      file: `${id}.json`,
      document: {
        locality: { id, name, region: regionName, province: provinceName, centre },
        radiusKm: RADIUS_KM,
        attribution: ATTRIBUTION,
        license: LICENSE,
        places: localityPlaces
      }
    });
  }

  const index = {
    attribution: ATTRIBUTION,
    license: LICENSE,
    radiusKm: RADIUS_KM,
    countries: [{
      code: countryCode,
      name: countryName,
      regions: [...regions.entries()]
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([regionName, provinces]) => ({
          name: regionName,
          provinces: [...provinces.entries()]
            .sort(([a], [b]) => a.localeCompare(b))
            .map(([provinceName, localities]) => ({
              name: provinceName,
              localities: localities.sort((a, b) => a.name.localeCompare(b.name))
            }))
        }))
    }]
  };

  return { index, catalogs, report };
}

function readGeoJson(filePath) {
  return JSON.parse(readFileSync(filePath, 'utf8')).features;
}

function parseArgs(argv) {
  const args = {};
  for (let i = 0; i < argv.length; i += 2) {
    args[argv[i].replace(/^--/, '')] = argv[i + 1];
  }
  return args;
}

function run() {
  const args = parseArgs(process.argv.slice(2));
  const required = ['places', 'localities', 'admin', 'out'];
  const missing = required.filter((key) => !args[key]);
  if (missing.length > 0) {
    console.error(`Missing arguments: ${missing.map((key) => `--${key}`).join(', ')}`);
    process.exitCode = 1;
    return;
  }

  const countryCode = args.country ?? 'ES';
  const countryName = args['country-name'] ?? 'España';
  const { index, catalogs, report } = buildCatalogs({
    places: readGeoJson(args.places),
    localities: readGeoJson(args.localities),
    admin: readGeoJson(args.admin),
    countryCode,
    countryName
  });

  const localitiesDir = path.join(args.out, 'localities');
  mkdirSync(localitiesDir, { recursive: true });
  writeFileSync(path.join(args.out, 'index.json'), JSON.stringify(index, null, 2) + '\n');
  for (const catalog of catalogs) {
    writeFileSync(path.join(localitiesDir, catalog.file), JSON.stringify(catalog.document) + '\n');
  }

  console.log(`Localities written: ${catalogs.length}`);
  console.log(`Places discarded (no name or unmapped category): ${report.placesDiscarded}`);
  console.log(`Localities without administrative match (skipped): ${report.localitiesWithoutAdmin.length}`);
  console.log(`Localities without places within ${RADIUS_KM} km: ${report.localitiesWithoutPlaces.length}`);
}

module.exports = { buildCatalogs, categorize, haversineKm, polygonContains, RADIUS_KM };

if (require.main === module) {
  run();
}
