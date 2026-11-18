import { isValidCoordinates } from '../../core/domain/models/geo';
import { CostLevel, Place, WheelchairAccess } from '../../core/domain/models/place';
import { findRule, OsmTags } from './osm-rules';

export interface OverpassElement {
  readonly type: 'node' | 'way' | 'relation';
  readonly id: number;
  readonly lat?: number;
  readonly lon?: number;
  readonly center?: { readonly lat: number; readonly lon: number };
  readonly tags?: OsmTags;
}

const TYPE_PREFIX = { node: 'n', way: 'w', relation: 'r' } as const;

function costFromFee(base: CostLevel, fee: string | undefined): CostLevel {
  if (fee === 'no') {
    return 'free';
  }
  if (fee === 'yes' && base === 'free') {
    return 'low';
  }
  return base;
}

function notabilityOf(tags: OsmTags): number {
  let score = 0;
  if (tags['wikidata'] || tags['wikipedia']) {
    score += 0.55;
  }
  if (tags['heritage']) {
    score += 0.2;
  }
  if (tags['tourism'] === 'attraction' || tags['tourism'] === 'viewpoint') {
    score += 0.1;
  }
  if (tags['image'] || tags['wikimedia_commons']) {
    score += 0.1;
  }
  if (tags['website'] || tags['contact:website']) {
    score += 0.05;
  }
  return Math.min(1, Math.round(score * 100) / 100);
}

function wheelchairOf(value: string | undefined): WheelchairAccess | undefined {
  return value === 'yes' || value === 'limited' || value === 'no' ? value : undefined;
}

function safeWebsite(value: string | undefined): string | undefined {
  if (!value) {
    return undefined;
  }
  const candidate = /^https?:\/\//i.test(value) ? value : `https://${value}`;
  try {
    const url = new URL(candidate);
    return url.protocol === 'https:' || url.protocol === 'http:' ? url.toString() : undefined;
  } catch {
    return undefined;
  }
}

function localizedName(tags: OsmTags, language: string): string | undefined {
  return tags[`name:${language}`] ?? tags['name'];
}

/**
 * Converts one Overpass element into a Wayly place, or `null` when it has
 * no name, no position or no matching rule.
 */
export function placeFromOverpass(element: OverpassElement, language: string): Place | null {
  const tags = element.tags ?? {};
  const name = localizedName(tags, language)?.trim();
  const rule = findRule(tags);
  const coordinates = {
    latitude: element.lat ?? element.center?.lat,
    longitude: element.lon ?? element.center?.lon,
  };
  if (!name || !rule || !isValidCoordinates(coordinates)) {
    return null;
  }

  const street = [tags['addr:street'], tags['addr:housenumber']].filter(Boolean).join(' ');
  const description = tags[`description:${language}`] ?? tags['description'] ?? '';

  return {
    id: `osm-${TYPE_PREFIX[element.type]}${element.id}`,
    name,
    description,
    category: rule.category,
    kind: rule.value,
    coordinates,
    location: street || undefined,
    estimatedVisitMinutes: rule.minutes,
    costLevel: costFromFee(rule.cost, tags['fee']),
    indoor: tags['indoor'] === 'yes' ? true : rule.indoor,
    openingHoursText: tags['opening_hours']?.trim() || undefined,
    notability: notabilityOf(tags),
    website: safeWebsite(tags['website'] ?? tags['contact:website']),
    wikipedia: tags['wikipedia'],
    wikidata: tags['wikidata'],
    wheelchair: wheelchairOf(tags['wheelchair']),
    source: 'openstreetmap',
    dataStatus: 'unverified',
  };
}
