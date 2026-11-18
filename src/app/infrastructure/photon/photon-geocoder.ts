import { inject, Injectable } from '@angular/core';
import { Geocoder } from '../../core/application/ports/geocoder';
import { isValidCoordinates, SearchLocation } from '../../core/domain/models/geo';
import { PlaceCoordinates } from '../../core/domain/models/place';
import { Language } from '../../core/i18n/i18n.types';
import { FETCH, fetchJson } from '../http/fetch-json';

const BASE_URL = 'https://photon.komoot.io';
const TIMEOUT_MS = 8000;

interface PhotonProperties {
  readonly name?: string;
  readonly street?: string;
  readonly housenumber?: string;
  readonly district?: string;
  readonly locality?: string;
  readonly city?: string;
  readonly county?: string;
  readonly state?: string;
  readonly country?: string;
  readonly countrycode?: string;
}

interface PhotonFeature {
  readonly geometry?: { readonly coordinates?: readonly number[] };
  readonly properties?: PhotonProperties;
}

interface PhotonResponse {
  readonly features?: readonly PhotonFeature[];
}

/** Photon supports a few languages; others get local names ("default"). */
function photonLanguage(language: Language): string {
  return language === 'en' ? 'en' : 'default';
}

function unique(values: readonly (string | undefined)[], exclude: string): string[] {
  const seen = new Set<string>([exclude.toLowerCase()]);
  const result: string[] = [];
  for (const value of values) {
    const trimmed = value?.trim();
    if (trimmed && !seen.has(trimmed.toLowerCase())) {
      seen.add(trimmed.toLowerCase());
      result.push(trimmed);
    }
  }
  return result;
}

export function locationFromPhoton(feature: PhotonFeature): SearchLocation | null {
  const properties = feature.properties ?? {};
  const [longitude, latitude] = feature.geometry?.coordinates ?? [];
  const coordinates = { latitude, longitude };
  const street = [properties.street, properties.housenumber].filter(Boolean).join(' ');
  const name = (properties.name ?? street).trim();
  if (!name || !isValidCoordinates(coordinates)) {
    return null;
  }
  const detail = unique(
    [properties.name ? street : undefined, properties.district, properties.city, properties.state, properties.country],
    name,
  ).join(', ');
  return {
    name,
    detail,
    coordinates,
    countryCode: properties.countrycode?.toUpperCase(),
  };
}

@Injectable()
export class PhotonGeocoder extends Geocoder {
  private readonly fetchFn = inject(FETCH);

  async search(
    text: string,
    language: Language,
    signal?: AbortSignal,
  ): Promise<readonly SearchLocation[]> {
    const query = text.trim();
    if (query.length < 2) {
      return [];
    }
    const params = new URLSearchParams({ q: query, limit: '6', lang: photonLanguage(language) });
    const response = await fetchJson<PhotonResponse>(this.fetchFn, `${BASE_URL}/api/?${params}`, {
      timeoutMs: TIMEOUT_MS,
      signal,
    });

    const seen = new Set<string>();
    const locations: SearchLocation[] = [];
    for (const feature of response.features ?? []) {
      const location = locationFromPhoton(feature);
      const key = location ? `${location.name}|${location.detail}` : '';
      if (location && !seen.has(key)) {
        seen.add(key);
        locations.push(location);
      }
    }
    return locations;
  }

  async reverse(
    coordinates: PlaceCoordinates,
    language: Language,
    signal?: AbortSignal,
  ): Promise<SearchLocation | null> {
    const params = new URLSearchParams({
      lat: coordinates.latitude.toFixed(5),
      lon: coordinates.longitude.toFixed(5),
      lang: photonLanguage(language),
      limit: '1',
    });
    const response = await fetchJson<PhotonResponse>(this.fetchFn, `${BASE_URL}/reverse?${params}`, {
      timeoutMs: TIMEOUT_MS,
      signal,
    });
    const properties = response.features?.[0]?.properties;
    if (!properties) {
      return null;
    }
    const name = properties.district ?? properties.locality ?? properties.city ?? properties.name;
    if (!name) {
      return null;
    }
    return {
      name,
      detail: unique([properties.city, properties.state, properties.country], name).join(', '),
      coordinates,
      countryCode: properties.countrycode?.toUpperCase(),
    };
  }
}
