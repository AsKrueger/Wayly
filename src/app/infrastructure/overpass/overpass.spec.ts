import { TestBed } from '@angular/core/testing';
import { PlaceSearchQuery } from '../../core/application/ports/place-search';
import { FETCH } from '../http/fetch-json';
import { fakeFetch } from '../testing/fake-fetch';
import { OverpassElement, placeFromOverpass } from './osm-mapper';
import { findRule, OSM_RULES } from './osm-rules';
import { buildOverpassQuery } from './overpass-query';
import { cacheKeyFor, OVERPASS_ENDPOINTS, OverpassPlaceSearch } from './overpass-place-search';

const museum: OverpassElement = {
  type: 'way',
  id: 42,
  center: { lat: 37.39, lon: -5.99 },
  tags: {
    tourism: 'museum',
    name: 'Museo de Bellas Artes',
    'name:en': 'Fine Arts Museum',
    opening_hours: 'Tu-Sa 09:00-21:00',
    wikidata: 'Q1',
    wikipedia: 'es:Museo de Bellas Artes de Sevilla',
    heritage: '2',
    website: 'museosdeandalucia.es',
    wheelchair: 'yes',
    'addr:street': 'Plaza del Museo',
    'addr:housenumber': '9',
  },
};

const query: PlaceSearchQuery = {
  center: { latitude: 37.38912, longitude: -5.98446 },
  radiusMeters: 2000,
  categories: ['culture', 'drinks'],
  language: 'es',
};

describe('OpenStreetMap rules', () => {
  it('have unique key/value/requires combinations', () => {
    const keys = OSM_RULES.map((rule) => `${rule.key}=${rule.value}|${rule.requires ?? ''}`);
    expect(new Set(keys).size).toBe(keys.length);
  });

  it('require a Wikidata item for very common minor features', () => {
    expect(findRule({ amenity: 'place_of_worship' })).toBeNull();
    expect(findRule({ amenity: 'place_of_worship', wikidata: 'Q2' })?.category).toBe('sights');
    expect(findRule({ shop: 'bakery' })).toBeNull();
  });
});

describe('placeFromOverpass', () => {
  it('maps tags to a Wayly place with estimates', () => {
    const place = placeFromOverpass(museum, 'es');
    expect(place).toEqual(
      expect.objectContaining({
        id: 'osm-w42',
        name: 'Museo de Bellas Artes',
        category: 'culture',
        kind: 'museum',
        coordinates: { latitude: 37.39, longitude: -5.99 },
        location: 'Plaza del Museo 9',
        estimatedVisitMinutes: 75,
        costLevel: 'medium',
        indoor: true,
        openingHoursText: 'Tu-Sa 09:00-21:00',
        notability: 0.8,
        website: 'https://museosdeandalucia.es/',
        wheelchair: 'yes',
        source: 'openstreetmap',
        dataStatus: 'unverified',
      }),
    );
  });

  it('prefers the name in the user language', () => {
    expect(placeFromOverpass(museum, 'en')?.name).toBe('Fine Arts Museum');
  });

  it('applies fee tags to the estimated cost', () => {
    const free = placeFromOverpass({ ...museum, tags: { ...museum.tags, fee: 'no' } }, 'es');
    const paidPark = placeFromOverpass(
      { type: 'node', id: 1, lat: 1, lon: 1, tags: { leisure: 'park', name: 'Parque', fee: 'yes' } },
      'es',
    );
    expect(free?.costLevel).toBe('free');
    expect(paidPark?.costLevel).toBe('low');
    expect(paidPark?.id).toBe('osm-n1');
  });

  it('discards places without name, rule or position and unsafe websites', () => {
    expect(placeFromOverpass({ type: 'node', id: 1, lat: 1, lon: 1, tags: { tourism: 'museum' } }, 'es')).toBeNull();
    expect(placeFromOverpass({ type: 'node', id: 1, lat: 1, lon: 1, tags: { shop: 'x', name: 'X' } }, 'es')).toBeNull();
    expect(placeFromOverpass({ type: 'way', id: 1, tags: { tourism: 'museum', name: 'X' } }, 'es')).toBeNull();
    const odd = placeFromOverpass(
      { type: 'relation', id: 3, lat: 1, lon: 1, tags: { amenity: 'cafe', name: 'C', website: 'javascript:alert(1)', indoor: 'yes' } },
      'es',
    );
    expect(odd?.website).toBeUndefined();
    expect(odd?.id).toBe('osm-r3');
    expect(odd?.notability).toBe(0.05);
  });
});

describe('buildOverpassQuery', () => {
  it('builds one limited output per category plus notable places', () => {
    const ql = buildOverpassQuery(query);
    expect(ql.startsWith('[out:json][timeout:12];')).toBe(true);
    expect(ql).toContain('(around:2000,37.38912,-5.98446)');
    expect(ql).toContain('->.culture;.culture out center tags 70;');
    expect(ql).toContain('->.drinks;.drinks out center tags 70;');
    expect(ql).toContain('->.notable;');
    expect(ql).not.toContain('->.food;');
    expect(ql).toContain('nwr["tourism"~"^(museum|gallery)$"]["name"]');
  });

  it('queries every category when none is selected and clamps the radius', () => {
    const ql = buildOverpassQuery({ ...query, categories: [], radiusMeters: 99999 });
    for (const category of ['culture', 'sights', 'nature', 'food', 'drinks', 'leisure', 'family']) {
      expect(ql).toContain(`->.${category};`);
    }
    expect(ql).toContain('(around:5000,');
    expect(ql).toContain('nwr["amenity"~"^(place_of_worship)$"]["name"]["wikidata"]');
  });

  it('skips notable places for categories that do not need them', () => {
    expect(buildOverpassQuery({ ...query, categories: ['food'] })).not.toContain('notable');
  });
});

describe('OverpassPlaceSearch', () => {
  function setup(...replies: Parameters<typeof fakeFetch>) {
    localStorage.clear();
    const fetch = fakeFetch(...replies);
    TestBed.configureTestingModule({
      providers: [
        OverpassPlaceSearch,
        { provide: FETCH, useValue: fetch },
        { provide: OVERPASS_ENDPOINTS, useValue: ['https://a.test/api', 'https://b.test/api'] },
      ],
    });
    return { search: TestBed.inject(OverpassPlaceSearch), fetch };
  }

  it('posts the query, maps and de-duplicates the results, then caches them', async () => {
    const { search, fetch } = setup({ body: { elements: [museum, museum, { type: 'node', id: 9, lat: 1, lon: 1, tags: {} }] } });

    const places = await search.findNear(query);
    const again = await search.findNear(query);

    expect(places.map((place) => place.id)).toEqual(['osm-w42']);
    expect(again).toEqual(places);
    expect(fetch.calls).toHaveLength(1);
    expect(fetch.calls[0].url).toBe('https://a.test/api');
    expect(fetch.calls[0].init?.method).toBe('POST');
    expect(String(fetch.calls[0].init?.body)).toContain('data=');
  });

  it('falls back to the next instance when one fails', async () => {
    const { search, fetch } = setup({ status: 429 }, { body: { elements: [museum] } });
    await expect(search.findNear(query)).resolves.toHaveLength(1);
    expect(fetch.calls.map((call) => call.url)).toEqual(['https://a.test/api', 'https://b.test/api']);
  });

  it('reports the last error when every instance fails', async () => {
    const { search } = setup({ status: 504 }, { body: { remark: 'no elements' } });
    await expect(search.findNear(query)).rejects.toMatchObject({ failure: 'invalid-response' });
  });

  it('stops at once when the caller aborts', async () => {
    const controller = new AbortController();
    controller.abort();
    const { search, fetch } = setup(new Error('aborted'));
    await expect(search.findNear(query, controller.signal)).rejects.toThrow();
    expect(fetch.calls).toHaveLength(1);
  });

  it('shares cache keys for nearby positions and separates languages', () => {
    const nearby = { ...query, center: { latitude: 37.38949, longitude: -5.98449 } };
    expect(cacheKeyFor(nearby)).toBe(cacheKeyFor(query));
    expect(cacheKeyFor({ ...query, language: 'en' })).not.toBe(cacheKeyFor(query));
    expect(cacheKeyFor({ ...query, categories: [] })).toContain(':all:');
  });
});
