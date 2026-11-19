import { DOCUMENT } from '@angular/common';
import { TestBed } from '@angular/core/testing';
import { Place } from '../core/domain/models/place';
import { BrowserLocator } from './geolocation/browser-locator';
import { FETCH } from './http/fetch-json';
import { OpenMeteoWeather, snapshotFromOpenMeteo } from './open-meteo/open-meteo-weather';
import { locationFromPhoton, PhotonGeocoder } from './photon/photon-geocoder';
import { FakeReply, fakeFetch } from './testing/fake-fetch';
import { parseWikipediaTag, WikipediaDetails } from './wikipedia/wikipedia-details';

function withFetch<T>(service: new () => T, ...replies: FakeReply[]) {
  const fetch = fakeFetch(...replies);
  TestBed.configureTestingModule({ providers: [service, { provide: FETCH, useValue: fetch }] });
  return { subject: TestBed.inject(service), fetch };
}

describe('PhotonGeocoder', () => {
  const seville = {
    geometry: { coordinates: [-5.99, 37.39] },
    properties: { name: 'Sevilla', city: 'Sevilla', state: 'Andalucía', country: 'España', countrycode: 'es' },
  };

  it('maps features to locations without repeating the name', () => {
    expect(locationFromPhoton(seville)).toEqual({
      name: 'Sevilla',
      detail: 'Andalucía, España',
      coordinates: { latitude: 37.39, longitude: -5.99 },
      countryCode: 'ES',
    });
    expect(
      locationFromPhoton({
        geometry: { coordinates: [2, 41] },
        properties: { street: 'Carrer Gran', housenumber: '5', city: 'Barcelona' },
      })?.name,
    ).toBe('Carrer Gran 5');
    expect(locationFromPhoton({ geometry: { coordinates: [] }, properties: { name: 'X' } })).toBeNull();
    expect(locationFromPhoton({})).toBeNull();
  });

  it('searches with the right language and removes duplicates', async () => {
    const { subject, fetch } = withFetch(PhotonGeocoder, { body: { features: [seville, seville, {}] } });
    const results = await subject.search(' Sevilla ', 'es');
    expect(results).toHaveLength(1);
    expect(fetch.calls[0].url).toContain('https://photon.komoot.io/api/?q=Sevilla&limit=6&lang=default');
    await expect(subject.search('a', 'en')).resolves.toEqual([]);
  });

  it('names the user position with reverse geocoding', async () => {
    const { subject, fetch } = withFetch(
      PhotonGeocoder,
      { body: { features: [{ properties: { district: 'Triana', city: 'Sevilla', country: 'España' } }] } },
      { body: { features: [] } },
    );
    const point = { latitude: 37.38, longitude: -6.0 };
    await expect(subject.reverse(point, 'en')).resolves.toEqual({
      name: 'Triana',
      detail: 'Sevilla, España',
      coordinates: point,
      countryCode: undefined,
    });
    expect(fetch.calls[0].url).toContain('/reverse?lat=37.38000&lon=-6.00000&lang=en');
    await expect(subject.reverse(point, 'en')).resolves.toBeNull();
  });
});

describe('OpenMeteoWeather', () => {
  const response = {
    current: { time: '2026-11-18T10:15', temperature_2m: 18.6, weather_code: 61, is_day: 1 },
    hourly: {
      time: ['2026-11-18T09:00', '2026-11-18T10:00', '2026-11-18T11:00', '2026-11-18T12:00', '2026-11-18T13:00'],
      precipitation_probability: [90, 20, null, 55, 99],
    },
  };

  it('summarises current weather and the rain chance for the next hours', () => {
    expect(snapshotFromOpenMeteo(response)).toEqual({
      temperatureCelsius: 19,
      condition: 'rain',
      isDay: true,
      rainChanceNextHours: 55,
    });
    expect(snapshotFromOpenMeteo({ current: { temperature_2m: 1, weather_code: 0, is_day: 0 } })).toEqual(
      expect.objectContaining({ isDay: false, rainChanceNextHours: 0 }),
    );
    expect(() => snapshotFromOpenMeteo({})).toThrow();
  });

  it('fetches once and caches nearby requests', async () => {
    const { subject, fetch } = withFetch(OpenMeteoWeather, { body: response });
    await subject.current({ latitude: 37.389, longitude: -5.984 });
    await subject.current({ latitude: 37.391, longitude: -5.982 });
    expect(fetch.calls).toHaveLength(1);
    expect(fetch.calls[0].url).toContain('timezone=auto');
  });
});

describe('WikipediaDetails', () => {
  const place = {
    id: 'osm-w1',
    name: 'Catedral',
    description: '',
    category: 'sights',
    source: 'openstreetmap',
    dataStatus: 'unverified',
    wikidata: 'Q231606',
    wikipedia: 'es:Catedral de Sevilla',
  } satisfies Place;

  const summary = {
    type: 'standard',
    title: 'Seville Cathedral',
    extract: 'A cathedral.',
    thumbnail: { source: 'https://upload.wikimedia.org/x.jpg' },
    content_urls: { desktop: { page: 'https://en.wikipedia.org/wiki/Seville_Cathedral' } },
  };

  it('parses the wikipedia tag safely', () => {
    expect(parseWikipediaTag('es:Catedral de Sevilla')).toEqual({ language: 'es', title: 'Catedral de Sevilla' });
    expect(parseWikipediaTag('evil.com/x:Title')).toBeNull();
    expect(parseWikipediaTag(undefined)).toBeNull();
  });

  it('finds the article in the user language through Wikidata', async () => {
    const { subject, fetch } = withFetch(
      WikipediaDetails,
      { body: { entities: { Q231606: { sitelinks: { enwiki: { title: 'Seville Cathedral' } } } } } },
      { body: summary },
    );
    await expect(subject.summary(place, 'en')).resolves.toEqual({
      title: 'Seville Cathedral',
      extract: 'A cathedral.',
      imageUrl: 'https://upload.wikimedia.org/x.jpg',
      articleUrl: 'https://en.wikipedia.org/wiki/Seville_Cathedral',
      language: 'en',
    });
    expect(fetch.calls[1].url).toBe('https://en.wikipedia.org/api/rest_v1/page/summary/Seville_Cathedral');
    await subject.summary(place, 'en');
    expect(fetch.calls).toHaveLength(2);
  });

  it('uses the tagged article directly when it is already in the user language', async () => {
    const { subject, fetch } = withFetch(WikipediaDetails, {
      body: { ...summary, thumbnail: { source: 'https://evil.test/x.jpg' } },
    });
    const result = await subject.summary(place, 'es');
    expect(fetch.calls[0].url).toBe('https://es.wikipedia.org/api/rest_v1/page/summary/Catedral_de_Sevilla');
    expect(result?.imageUrl).toBeUndefined();
  });

  it('returns null for places without articles, disambiguations and failures', async () => {
    const { subject } = withFetch(
      WikipediaDetails,
      { body: { entities: {} } },
      { body: { type: 'disambiguation', extract: 'x', content_urls: { desktop: { page: 'p' } } } },
      { status: 500 },
    );
    await expect(subject.summary({ ...place, wikidata: undefined, wikipedia: undefined }, 'es')).resolves.toBeNull();
    await expect(subject.summary(place, 'en')).resolves.toBeNull();
    await expect(subject.summary({ ...place, id: 'other' }, 'es')).resolves.toBeNull();
  });

  it('only keeps https images from the Wikimedia upload server', async () => {
    const { subject } = withFetch(
      WikipediaDetails,
      { body: { ...summary, thumbnail: { source: 'http://upload.wikimedia.org/x.jpg' } } },
      { body: { ...summary, thumbnail: { source: 'not a url' } } },
      { body: { ...summary, thumbnail: undefined, title: undefined } },
    );
    const insecure = await subject.summary({ ...place, id: 'insecure' }, 'es');
    const malformed = await subject.summary({ ...place, id: 'malformed' }, 'es');
    const withoutImage = await subject.summary({ ...place, id: 'no-image' }, 'es');
    expect(insecure?.imageUrl).toBeUndefined();
    expect(malformed?.imageUrl).toBeUndefined();
    expect(withoutImage?.imageUrl).toBeUndefined();
    expect(withoutImage?.title).toBe('Catedral de Sevilla');
  });

  it('ignores malformed Wikidata ids and falls back to the tagged article', async () => {
    const { subject, fetch } = withFetch(WikipediaDetails, { body: summary });
    await subject.summary({ ...place, wikidata: 'Q1&ids=Q2' }, 'en');
    expect(fetch.calls).toHaveLength(1);
    expect(fetch.calls[0].url).toBe('https://es.wikipedia.org/api/rest_v1/page/summary/Catedral_de_Sevilla');
  });

  it('does not request a summary when Wikidata has no article and there is no tag', async () => {
    const { subject, fetch } = withFetch(WikipediaDetails, { body: { entities: {} } });
    await expect(subject.summary({ ...place, wikipedia: undefined }, 'en')).resolves.toBeNull();
    expect(fetch.calls).toHaveLength(1);
    expect(fetch.calls[0].url).toContain('https://www.wikidata.org/w/api.php?');
  });

  it('encodes the article title so it cannot change the request path', async () => {
    const { subject, fetch } = withFetch(WikipediaDetails, { body: summary });
    await subject.summary({ ...place, wikidata: undefined, wikipedia: 'fr:AC/DC ?x=1#y' }, 'es');
    expect(fetch.calls[0].url).toBe('https://fr.wikipedia.org/api/rest_v1/page/summary/AC%2FDC_%3Fx%3D1%23y');
  });
});

describe('BrowserLocator', () => {
  function locatorWith(geolocation: unknown) {
    TestBed.configureTestingModule({
      providers: [
        BrowserLocator,
        { provide: DOCUMENT, useValue: { defaultView: { navigator: { geolocation } } } },
      ],
    });
    return TestBed.inject(BrowserLocator);
  }

  const codes = { PERMISSION_DENIED: 1, POSITION_UNAVAILABLE: 2, TIMEOUT: 3 };

  it('returns the position', async () => {
    const locator = locatorWith({
      getCurrentPosition: (ok: PositionCallback) => ok({ coords: { latitude: 1, longitude: 2 } } as GeolocationPosition),
    });
    await expect(locator.locate()).resolves.toEqual({ latitude: 1, longitude: 2 });
  });

  it.each([
    [1, 'denied'],
    [2, 'unavailable'],
    [3, 'timeout'],
  ])('maps error code %i to %s', async (code, failure) => {
    const locator = locatorWith({
      getCurrentPosition: (_ok: PositionCallback, fail: PositionErrorCallback) =>
        fail({ code, ...codes } as GeolocationPositionError),
    });
    await expect(locator.locate()).rejects.toMatchObject({ failure });
  });

  it('reports unsupported browsers', async () => {
    await expect(locatorWith(undefined).locate()).rejects.toMatchObject({ failure: 'unsupported' });
  });
});
