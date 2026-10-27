const { buildCatalogs, categorize, haversineKm, polygonContains, RADIUS_KM } = require('./generate-place-catalogs.cjs');

const square = (minLon, minLat, maxLon, maxLat) => ({
  type: 'Polygon',
  coordinates: [[[minLon, minLat], [maxLon, minLat], [maxLon, maxLat], [minLon, maxLat], [minLon, minLat]]]
});

const adminRegion = { type: 'Feature', id: 'r1', properties: { admin_level: '4', name: 'Región A' }, geometry: square(-4, 39, 0, 42) };
const adminProvince = { type: 'Feature', id: 'p1', properties: { admin_level: '6', name: 'Provincia A' }, geometry: square(-4, 39, 0, 42) };

const point = (id, lon, lat, tags) => ({ type: 'Feature', id, properties: tags, geometry: { type: 'Point', coordinates: [lon, lat] } });

describe('place catalogue generation', () => {
  describe('category mapping', () => {
    it('maps OSM tags to the four Wayly categories', () => {
      expect(categorize({ amenity: 'restaurant' })).toBe('food');
      expect(categorize({ amenity: 'nightclub' })).toBe('leisure');
      expect(categorize({ tourism: 'museum' })).toBe('culture');
      expect(categorize({ leisure: 'park' })).toBe('nature');
    });

    it('returns null for tags without a supported category', () => {
      expect(categorize({ amenity: 'bench' })).toBeNull();
    });
  });

  describe('distance', () => {
    it('measures one degree of latitude as about 111 km', () => {
      const distance = haversineKm({ latitude: 40, longitude: -3 }, { latitude: 41, longitude: -3 });

      expect(distance).toBeCloseTo(111.2, 0);
    });

    it('is zero for the same point', () => {
      expect(haversineKm({ latitude: 40, longitude: -3 }, { latitude: 40, longitude: -3 })).toBe(0);
    });
  });

  describe('point in polygon', () => {
    it('excludes points inside a hole', () => {
      const withHole = {
        type: 'Polygon',
        coordinates: [
          [[0, 0], [10, 0], [10, 10], [0, 10], [0, 0]],
          [[4, 4], [6, 4], [6, 6], [4, 6], [4, 4]]
        ]
      };

      expect(polygonContains(withHole.coordinates, { latitude: 5, longitude: 5 })).toBe(false);
      expect(polygonContains(withHole.coordinates, { latitude: 1, longitude: 1 })).toBe(true);
    });
  });

  describe('buildCatalogs', () => {
    const input = (overrides = {}) => ({
      admin: [adminRegion, adminProvince],
      localities: [point('loc-1', -2, 40, { name: 'Localidad A', place: 'town' })],
      places: [
        point('near', -2.05, 40.02, { name: 'Museo Cercano', tourism: 'museum' }),
        point('far', -1, 41.5, { name: 'Museo Lejano', tourism: 'museum' }),
        point('unnamed', -2.01, 40.01, { tourism: 'museum' }),
        point('unmapped', -2.02, 40.01, { name: 'Banco', amenity: 'bench' })
      ],
      countryCode: 'ES',
      countryName: 'España',
      ...overrides
    });

    it('keeps only places within the radius and discards unnamed or unmapped ones', () => {
      const { catalogs, report } = buildCatalogs(input());
      const places = catalogs[0].document.places;

      expect(places.map((place) => place.name)).toEqual(['Museo Cercano']);
      expect(report.placesDiscarded).toBe(2);
    });

    it('marks every generated place as OpenStreetMap data pending verification', () => {
      const { catalogs } = buildCatalogs(input());

      expect(catalogs[0].document.places[0]).toMatchObject({
        source: 'openstreetmap',
        dataStatus: 'unverified',
        coordinates: { latitude: 40.02, longitude: -2.05 }
      });
    });

    it('records the radius, attribution and licence in each catalogue', () => {
      const { catalogs, index } = buildCatalogs(input());

      expect(catalogs[0].document).toMatchObject({
        radiusKm: RADIUS_KM,
        attribution: '© OpenStreetMap contributors',
        license: 'ODbL'
      });
      expect(index.attribution).toBe('© OpenStreetMap contributors');
    });

    it('builds the country, region, province and locality hierarchy', () => {
      const { index } = buildCatalogs(input());
      const country = index.countries[0];

      expect(country).toMatchObject({ code: 'ES', name: 'España' });
      expect(country.regions[0].name).toBe('Región A');
      expect(country.regions[0].provinces[0].name).toBe('Provincia A');
      expect(country.regions[0].provinces[0].localities[0]).toMatchObject({
        id: 'ES-osm-loc-1',
        name: 'Localidad A',
        placeCount: 1
      });
    });

    it('skips localities outside any administrative boundary and reports them', () => {
      const { catalogs, index, report } = buildCatalogs(input({
        localities: [point('loc-out', 10, 60, { name: 'Fuera', place: 'town' })]
      }));

      expect(catalogs).toHaveLength(0);
      expect(index.countries[0].regions).toHaveLength(0);
      expect(report.localitiesWithoutAdmin).toEqual(['Fuera']);
    });

    it('reports localities with no places within the radius', () => {
      const { report } = buildCatalogs(input({
        places: [point('far', -1, 41.5, { name: 'Lejos', tourism: 'museum' })]
      }));

      expect(report.localitiesWithoutPlaces).toEqual(['Localidad A']);
    });

    it('sorts places by identifier so repeated runs produce identical output', () => {
      const first = buildCatalogs(input());
      const second = buildCatalogs(input());

      expect(JSON.stringify(first.catalogs)).toBe(JSON.stringify(second.catalogs));
    });
  });
});
