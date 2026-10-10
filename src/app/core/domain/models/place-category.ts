export const PLACE_CATEGORY_LABELS = {
  culture: 'Cultura',
  nature: 'Naturaleza',
  food: 'Gastronomía',
  leisure: 'Ocio',
} as const;

export type PlaceCategory = keyof typeof PLACE_CATEGORY_LABELS;
