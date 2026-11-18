import { inject, Injectable } from '@angular/core';
import { PlaceSearch, PlaceSearchQuery } from '../../core/application/ports/place-search';
import { isValidCoordinates } from '../../core/domain/models/geo';
import { Place } from '../../core/domain/models/place';
import { PLACE_CATEGORIES } from '../../core/domain/models/place-category';
import { FETCH, fetchJson } from '../http/fetch-json';
import { findRule, OSM_RULES } from '../overpass/osm-rules';

const BASE_URL = 'https://photon.komoot.io/reverse';
const TIMEOUT_MS = 10000;
const PER_CATEGORY_LIMIT = 40;

interface PhotonPoiFeature {
  readonly geometry?: { readonly coordinates?: readonly number[] };
  readonly properties?: {
    readonly osm_type?: string;
    readonly osm_id?: number;
    readonly osm_key?: string;
    readonly osm_value?: string;
    readonly name?: string;
    readonly street?: string;
    readonly housenumber?: string;
  };
}

interface PhotonPoiResponse {
  readonly features?: readonly PhotonPoiFeature[];
}

export function placeFromPhoton(feature: PhotonPoiFeature): Place | null {
  const properties = feature.properties ?? {};
  const [longitude, latitude] = feature.geometry?.coordinates ?? [];
  const coordinates = { latitude, longitude };
  const name = properties.name?.trim();
  const rule =
    properties.osm_key && properties.osm_value
      ? findRule({ [properties.osm_key]: properties.osm_value })
      : null;
  const type = properties.osm_type?.toLowerCase();
  if (!name || !rule || !isValidCoordinates(coordinates) || !type || properties.osm_id === undefined) {
    return null;
  }
  const street = [properties.street, properties.housenumber].filter(Boolean).join(' ');
  return {
    id: `osm-${type}${properties.osm_id}`,
    name,
    description: '',
    category: rule.category,
    kind: rule.value,
    coordinates,
    location: street || undefined,
    estimatedVisitMinutes: rule.minutes,
    costLevel: rule.cost,
    indoor: rule.indoor,
    notability: 0,
    source: 'openstreetmap',
    dataStatus: 'unverified',
  };
}

/**
 * Backup place source (ADR-0010): Photon's nearby search filtered by the same
 * OpenStreetMap rules. It has no opening hours or Wikidata, so plans built on
 * it treat those as unknown.
 */
@Injectable({ providedIn: 'root' })
export class PhotonPlaceSearch extends PlaceSearch {
  private readonly fetchFn = inject(FETCH);

  async findNear(query: PlaceSearchQuery, signal?: AbortSignal): Promise<readonly Place[]> {
    const categories = query.categories.length > 0 ? query.categories : PLACE_CATEGORIES;
    const responses = await Promise.all(
      categories.map((category) => {
        const params = new URLSearchParams({
          lat: query.center.latitude.toFixed(5),
          lon: query.center.longitude.toFixed(5),
          radius: (Math.max(100, query.radiusMeters) / 1000).toFixed(1),
          limit: String(PER_CATEGORY_LIMIT),
          lang: query.language === 'en' ? 'en' : 'default',
        });
        for (const rule of OSM_RULES.filter((candidate) => candidate.category === category && !candidate.requires)) {
          params.append('osm_tag', `${rule.key}:${rule.value}`);
        }
        return fetchJson<PhotonPoiResponse>(this.fetchFn, `${BASE_URL}?${params}`, {
          timeoutMs: TIMEOUT_MS,
          signal,
        });
      }),
    );

    const byId = new Map<string, Place>();
    for (const feature of responses.flatMap((response) => response.features ?? [])) {
      const place = placeFromPhoton(feature);
      if (place && !byId.has(place.id)) {
        byId.set(place.id, place);
      }
    }
    return [...byId.values()];
  }
}
