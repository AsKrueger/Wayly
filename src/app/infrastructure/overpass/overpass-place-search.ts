import { inject, Injectable, InjectionToken } from '@angular/core';
import {
  DataServiceError,
  PlaceSearch,
  PlaceSearchQuery,
} from '../../core/application/ports/place-search';
import { Place } from '../../core/domain/models/place';
import { LocalStore } from '../../core/storage/local-store.service';
import { TtlCache } from '../cache/ttl-cache';
import { FETCH, fetchJson } from '../http/fetch-json';
import { OverpassElement, placeFromOverpass } from './osm-mapper';
import { buildOverpassQuery, QUERY_TIMEOUT_SECONDS } from './overpass-query';

/** Public instances, tried in order (ADR-0010). */
export const OVERPASS_ENDPOINTS = new InjectionToken<readonly string[]>('OVERPASS_ENDPOINTS', {
  providedIn: 'root',
  factory: () => [
    'https://overpass-api.de/api/interpreter',
    'https://overpass.private.coffee/api/interpreter',
  ],
});

const CACHE_TTL_MS = 24 * 60 * 60 * 1000;
const CACHE_MAX_ENTRIES = 6;

interface OverpassResponse {
  readonly elements?: readonly OverpassElement[];
}

/** Cache key: position rounded to about 100 m, so nearby searches share results. */
export function cacheKeyFor(query: PlaceSearchQuery): string {
  const categories = [...query.categories].sort().join('+') || 'all';
  return [
    query.center.latitude.toFixed(3),
    query.center.longitude.toFixed(3),
    Math.round(query.radiusMeters),
    categories,
    query.language,
  ].join(':');
}

@Injectable({ providedIn: 'root' })
export class OverpassPlaceSearch extends PlaceSearch {
  private readonly fetchFn = inject(FETCH);
  private readonly endpoints = inject(OVERPASS_ENDPOINTS);
  private readonly cache = new TtlCache<readonly Place[]>(
    inject(LocalStore),
    'places.v1',
    CACHE_TTL_MS,
    CACHE_MAX_ENTRIES,
  );

  async findNear(query: PlaceSearchQuery, signal?: AbortSignal): Promise<readonly Place[]> {
    const key = cacheKeyFor(query);
    const cached = this.cache.get(key);
    if (cached) {
      return cached;
    }

    const body = new URLSearchParams({ data: buildOverpassQuery(query) }).toString();
    let lastError: unknown = new DataServiceError('unavailable', 'No Overpass endpoint configured.');

    for (const endpoint of this.endpoints) {
      try {
        const response = await fetchJson<OverpassResponse>(this.fetchFn, endpoint, {
          init: {
            method: 'POST',
            headers: { 'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8' },
            body,
          },
          timeoutMs: (QUERY_TIMEOUT_SECONDS + 3) * 1000,
          signal,
        });
        if (!Array.isArray(response.elements)) {
          throw new DataServiceError('invalid-response', `Unexpected Overpass response: ${endpoint}`);
        }
        const places = this.toPlaces(response.elements, query.language);
        this.cache.set(key, places);
        return places;
      } catch (error: unknown) {
        if (signal?.aborted) {
          throw error;
        }
        lastError = error;
      }
    }

    throw lastError;
  }

  private toPlaces(elements: readonly OverpassElement[], language: string): readonly Place[] {
    const byId = new Map<string, Place>();
    for (const element of elements) {
      const place = placeFromOverpass(element, language);
      if (place && !byId.has(place.id)) {
        byId.set(place.id, place);
      }
    }
    return [...byId.values()];
  }
}
