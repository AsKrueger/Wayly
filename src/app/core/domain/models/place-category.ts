/**
 * Spanish labels kept for the legacy Discover screen. The new interface
 * translates categories through the i18n dictionaries (`categories.*`).
 */
export const PLACE_CATEGORY_LABELS = {
  culture: 'Cultura',
  sights: 'Monumentos y vistas',
  nature: 'Naturaleza',
  food: 'Gastronomía',
  drinks: 'Cafés y copas',
  leisure: 'Ocio',
  family: 'En familia',
} as const;

export type PlaceCategory = keyof typeof PLACE_CATEGORY_LABELS;

export const PLACE_CATEGORIES = Object.keys(PLACE_CATEGORY_LABELS) as readonly PlaceCategory[];
