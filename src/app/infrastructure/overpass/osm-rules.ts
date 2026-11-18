import { CostLevel } from '../../core/domain/models/place';
import { PlaceCategory } from '../../core/domain/models/place-category';

/**
 * One OpenStreetMap tag pattern and what Wayly assumes about it.
 *
 * Visit minutes and cost are estimates by type (OpenStreetMap has no prices).
 * The same table builds the Overpass query and maps the results, so both
 * always agree. Order matters: the first matching rule wins.
 */
export interface OsmRule {
  readonly key: string;
  readonly value: string;
  readonly category: PlaceCategory;
  readonly minutes: number;
  readonly cost: CostLevel;
  readonly indoor: boolean;
  /** Extra tag that must exist, to skip very common, minor features. */
  readonly requires?: string;
}

const rule = (
  category: PlaceCategory,
  key: string,
  value: string,
  minutes: number,
  cost: CostLevel,
  indoor: boolean,
  requires?: string,
): OsmRule => ({ category, key, value, minutes, cost, indoor, requires });

export const OSM_RULES: readonly OsmRule[] = [
  rule('family', 'tourism', 'zoo', 150, 'medium', false),
  rule('family', 'tourism', 'aquarium', 90, 'medium', true),
  rule('family', 'tourism', 'theme_park', 240, 'high', false),
  rule('family', 'leisure', 'water_park', 180, 'medium', false),
  rule('family', 'leisure', 'playground', 30, 'free', false),

  rule('culture', 'tourism', 'museum', 75, 'medium', true),
  rule('culture', 'tourism', 'gallery', 45, 'low', true),
  rule('culture', 'amenity', 'arts_centre', 45, 'low', true),
  rule('culture', 'amenity', 'library', 30, 'free', true),

  rule('leisure', 'amenity', 'cinema', 120, 'medium', true),
  rule('leisure', 'amenity', 'theatre', 120, 'medium', true),
  rule('leisure', 'leisure', 'bowling_alley', 60, 'medium', true),
  rule('leisure', 'leisure', 'escape_game', 70, 'medium', true),
  rule('leisure', 'leisure', 'amusement_arcade', 45, 'low', true),
  rule('leisure', 'leisure', 'miniature_golf', 45, 'low', false),

  rule('sights', 'tourism', 'viewpoint', 20, 'free', false),
  rule('sights', 'tourism', 'attraction', 30, 'low', false),
  rule('sights', 'historic', 'castle', 60, 'low', false),
  rule('sights', 'historic', 'palace', 60, 'medium', true),
  rule('sights', 'historic', 'fort', 45, 'low', false),
  rule('sights', 'historic', 'archaeological_site', 45, 'low', false),
  rule('sights', 'historic', 'ruins', 30, 'free', false),
  rule('sights', 'historic', 'monument', 15, 'free', false),
  rule('sights', 'historic', 'city_gate', 10, 'free', false),
  rule('sights', 'historic', 'church', 20, 'free', true, 'wikidata'),
  rule('sights', 'amenity', 'place_of_worship', 20, 'free', true, 'wikidata'),
  rule('sights', 'historic', 'memorial', 10, 'free', false, 'wikidata'),
  rule('sights', 'tourism', 'artwork', 10, 'free', false, 'wikidata'),

  rule('nature', 'leisure', 'nature_reserve', 90, 'free', false),
  rule('nature', 'natural', 'beach', 75, 'free', false),
  rule('nature', 'leisure', 'park', 40, 'free', false),
  rule('nature', 'leisure', 'garden', 35, 'free', false),

  rule('food', 'amenity', 'restaurant', 75, 'medium', true),
  rule('food', 'amenity', 'marketplace', 40, 'low', false),
  rule('food', 'amenity', 'food_court', 40, 'low', true),
  rule('food', 'amenity', 'fast_food', 30, 'low', true),

  rule('drinks', 'amenity', 'cafe', 35, 'low', true),
  rule('drinks', 'amenity', 'ice_cream', 15, 'low', false),
  rule('drinks', 'amenity', 'bar', 50, 'low', true),
  rule('drinks', 'amenity', 'pub', 50, 'low', true),
  rule('drinks', 'amenity', 'biergarten', 60, 'low', false),
];

export type OsmTags = Readonly<Record<string, string | undefined>>;

export function findRule(tags: OsmTags): OsmRule | null {
  return (
    OSM_RULES.find(
      (candidate) =>
        tags[candidate.key] === candidate.value &&
        (candidate.requires === undefined || tags[candidate.requires] !== undefined),
    ) ?? null
  );
}
