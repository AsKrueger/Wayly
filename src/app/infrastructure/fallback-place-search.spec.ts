import { TestBed } from '@angular/core/testing';
import { DataServiceError, PlaceSearchQuery } from '../core/application/ports/place-search';
import { Place } from '../core/domain/models/place';
import { PLACE_CATEGORIES } from '../core/domain/models/place-category';
import { FallbackPlaceSearch } from './fallback-place-search';
import { FETCH } from './http/fetch-json';
import { OverpassPlaceSearch } from './overpass/overpass-place-search';
import { PhotonPlaceSearch, placeFromPhoton } from './photon/photon-place-search';
import { fakeFetch } from './testing/fake-fetch';

const query: PlaceSearchQuery = {
  center: { latitude: 37.38912, longitude: -5.98446 },
  radiusMeters: 2000,
  categories: ['culture', 'nature'],
  language: 'es',
};

const pilatos = {
  geometry: { coordinates: [-5.9862, 37.3911] },
  properties: {
    osm_type: 'R',
    osm_id: 2912100,
    osm_key: 'tourism',
    osm_value: 'museum',
    name: 'Casa de Pilatos',
    street: 'Plaza de Pilatos',
    housenumber: '1',
  },
};

describe('placeFromPhoton', () => {
  it('maps a Photon feature with the shared OpenStreetMap rules', () => {
    expect(placeFromPhoton(pilatos)).toEqual(
      expect.objectContaining({
        id: 'osm-r2912100',
        name: 'Casa de Pilatos',
        category: 'culture',
        kind: 'museum',
        location: 'Plaza de Pilatos 1',
        estimatedVisitMinutes: 75,
        costLevel: 'medium',
        indoor: true,
        notability: 0,
      }),
    );
  });

  it('discards features without name, known type, id or position', () => {
    expect(placeFromPhoton({ ...pilatos, properties: { ...pilatos.properties, name: ' ' } })).toBeNull();
    expect(placeFromPhoton({ ...pilatos, properties: { ...pilatos.properties, osm_value: 'hotel' } })).toBeNull();
    expect(placeFromPhoton({ ...pilatos, properties: { ...pilatos.properties, osm_type: undefined } })).toBeNull();
    expect(placeFromPhoton({ properties: pilatos.properties })).toBeNull();
  });

  it('discards features without properties or without an OpenStreetMap key', () => {
    expect(placeFromPhoton({ geometry: pilatos.geometry })).toBeNull();
    expect(placeFromPhoton({ ...pilatos, properties: { ...pilatos.properties, osm_key: undefined } })).toBeNull();
    expect(placeFromPhoton({ ...pilatos, properties: { ...pilatos.properties, osm_id: undefined } })).toBeNull();
  });

  it('leaves the location empty when Photon has no street', () => {
    const place = placeFromPhoton({
      ...pilatos,
      properties: { ...pilatos.properties, street: undefined, housenumber: undefined },
    });
    expect(place?.location).toBeUndefined();
  });

  it('keeps the street without house number', () => {
    const place = placeFromPhoton({ ...pilatos, properties: { ...pilatos.properties, housenumber: undefined } });
    expect(place?.location).toBe('Plaza de Pilatos');
  });
});

describe('PhotonPlaceSearch', () => {
  it('asks once per category with that category tags and merges the results', async () => {
    const fetch = fakeFetch({ body: { features: [pilatos, pilatos] } }, { body: { features: [] } });
    TestBed.configureTestingModule({ providers: [{ provide: FETCH, useValue: fetch }] });

    const places = await TestBed.inject(PhotonPlaceSearch).findNear(query);

    expect(places).toHaveLength(1);
    expect(fetch.calls).toHaveLength(2);
    expect(fetch.calls[0].url).toContain('radius=2.0');
    expect(fetch.calls[0].url).toContain('osm_tag=tourism%3Amuseum');
    expect(fetch.calls[0].url).not.toContain('place_of_worship');
    expect(fetch.calls[1].url).toContain('osm_tag=leisure%3Apark');
  });

  it('asks for every category when the query has none', async () => {
    const fetch = fakeFetch(...PLACE_CATEGORIES.map(() => ({ body: {} })));
    TestBed.configureTestingModule({ providers: [{ provide: FETCH, useValue: fetch }] });

    const places = await TestBed.inject(PhotonPlaceSearch).findNear({ ...query, categories: [] });

    expect(places).toEqual([]);
    expect(fetch.calls).toHaveLength(PLACE_CATEGORIES.length);
  });

  it('uses a minimum radius and asks in English for English users', async () => {
    const fetch = fakeFetch({ body: { features: [pilatos] } });
    TestBed.configureTestingModule({ providers: [{ provide: FETCH, useValue: fetch }] });

    await TestBed.inject(PhotonPlaceSearch).findNear({
      ...query,
      radiusMeters: 20,
      categories: ['culture'],
      language: 'en',
    });

    expect(fetch.calls[0].url).toContain('radius=0.1');
    expect(fetch.calls[0].url).toContain('lang=en');
    expect(fetch.calls[0].url).toContain('lat=37.38912&lon=-5.98446');
  });

  it('asks with the default language for languages other than English', async () => {
    const fetch = fakeFetch({ body: { features: [] } });
    TestBed.configureTestingModule({ providers: [{ provide: FETCH, useValue: fetch }] });

    await TestBed.inject(PhotonPlaceSearch).findNear({ ...query, categories: ['culture'], language: 'fr' });

    expect(fetch.calls[0].url).toContain('lang=default');
  });

  it('reports a failure of any category request', async () => {
    const fetch = fakeFetch({ body: { features: [pilatos] } }, { status: 503 });
    TestBed.configureTestingModule({ providers: [{ provide: FETCH, useValue: fetch }] });

    await expect(TestBed.inject(PhotonPlaceSearch).findNear(query)).rejects.toBeInstanceOf(DataServiceError);
  });
});

describe('FallbackPlaceSearch', () => {
  const place = { id: 'p', name: 'P', description: '', category: 'culture', source: 's', dataStatus: 'unverified' } satisfies Place;

  function setup(primary: () => Promise<readonly Place[]>, backup: () => Promise<readonly Place[]>) {
    TestBed.configureTestingModule({
      providers: [
        FallbackPlaceSearch,
        { provide: OverpassPlaceSearch, useValue: { findNear: jest.fn(primary) } },
        { provide: PhotonPlaceSearch, useValue: { findNear: jest.fn(backup) } },
      ],
    });
    return TestBed.inject(FallbackPlaceSearch);
  }

  it('uses Overpass when it answers', async () => {
    const backup = jest.fn();
    await expect(setup(async () => [place], backup).findNear(query)).resolves.toEqual([place]);
    expect(backup).not.toHaveBeenCalled();
  });

  it('falls back to Photon when Overpass fails', async () => {
    const search = setup(
      async () => {
        throw new DataServiceError('unavailable', 'busy');
      },
      async () => [place],
    );
    await expect(search.findNear(query)).resolves.toEqual([place]);
  });

  it('reports the Overpass error when both fail', async () => {
    const search = setup(
      async () => {
        throw new DataServiceError('rate-limited', 'busy');
      },
      async () => {
        throw new DataServiceError('unavailable', 'down');
      },
    );
    await expect(search.findNear(query)).rejects.toMatchObject({ failure: 'rate-limited' });
  });

  it('does not fall back after the caller aborts', async () => {
    const controller = new AbortController();
    controller.abort();
    const backup = jest.fn();
    const search = setup(async () => {
      throw new Error('aborted');
    }, backup);
    await expect(search.findNear(query, controller.signal)).rejects.toThrow('aborted');
    expect(backup).not.toHaveBeenCalled();
  });
});
