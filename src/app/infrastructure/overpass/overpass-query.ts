import { PlaceSearchQuery } from '../../core/application/ports/place-search';
import { PLACE_CATEGORIES, PlaceCategory } from '../../core/domain/models/place-category';
import { OSM_RULES } from './osm-rules';

/** Elements returned per category, so one dense category cannot crowd out the rest. */
export const PER_CATEGORY_LIMIT = 70;
/** Extra notable places (with a Wikidata item) added for culture and sights. */
export const NOTABLE_LIMIT = 60;
export const QUERY_TIMEOUT_SECONDS = 12;

const NOT_PRIVATE = '["access"!~"^(private|no)$"]';

function escapeRegexValue(value: string): string {
  return value.replace(/[^a-z0-9_]/gi, '');
}

function selectorsFor(category: PlaceCategory, around: string): string[] {
  const groups = new Map<string, string[]>();
  for (const rule of OSM_RULES.filter((candidate) => candidate.category === category)) {
    const groupKey = `${rule.key}|${rule.requires ?? ''}`;
    groups.set(groupKey, [...(groups.get(groupKey) ?? []), escapeRegexValue(rule.value)]);
  }
  return [...groups.entries()].map(([groupKey, values]) => {
    const [key, requires] = groupKey.split('|');
    const required = requires ? `["${requires}"]` : '';
    return `nwr["${key}"~"^(${values.join('|')})$"]["name"]${required}${NOT_PRIVATE}${around};`;
  });
}

/**
 * Builds a bounded Overpass QL query: one output per category with its own
 * limit, plus notable places when culture or sights are requested.
 */
export function buildOverpassQuery(query: PlaceSearchQuery): string {
  const radius = Math.round(Math.max(100, Math.min(query.radiusMeters, 5000)));
  const lat = query.center.latitude.toFixed(5);
  const lon = query.center.longitude.toFixed(5);
  const around = `(around:${radius},${lat},${lon})`;
  const categories = query.categories.length > 0 ? query.categories : PLACE_CATEGORIES;

  const blocks = categories.map(
    (category) =>
      `(${selectorsFor(category, around).join('')})->.${category};.${category} out center tags ${PER_CATEGORY_LIMIT};`,
  );

  if (categories.includes('culture') || categories.includes('sights')) {
    blocks.push(
      `(nwr["wikidata"]["name"]["tourism"]${around};nwr["wikidata"]["name"]["historic"]${around};)->.notable;.notable out center tags ${NOTABLE_LIMIT};`,
    );
  }

  return `[out:json][timeout:${QUERY_TIMEOUT_SECONDS}];${blocks.join('')}`;
}
