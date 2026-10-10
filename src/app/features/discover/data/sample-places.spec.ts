import { PLACE_CATEGORY_LABELS, PlaceCategory } from '../../../core/domain/models/place-category';
import { SAMPLE_PLACES } from './sample-places';

describe('sample place fixtures', () => {
  it('contains valid, stable, unique identifiers and required fields', () => {
    const ids = SAMPLE_PLACES.map((place) => place.id);

    expect(ids.every((id) => id.trim().length > 0)).toBe(true);
    expect(ids.every((id) => id.startsWith('demo-'))).toBe(true);
    expect(new Set(ids).size).toBe(ids.length);

    for (const place of SAMPLE_PLACES) {
      expect(place.name.trim().length).toBeGreaterThan(0);
      expect(place.description.trim().length).toBeGreaterThan(0);
      expect(place.source).toBe('wayly-demo');
      expect(place.dataStatus).toBe('fictional');
    }
  });

  it('covers each defined activity category', () => {
    const fixtureCategories = new Set(SAMPLE_PLACES.map((place) => place.category));
    const expectedCategories = Object.keys(PLACE_CATEGORY_LABELS) as PlaceCategory[];

    expect(fixtureCategories).toEqual(new Set(expectedCategories));
  });

  it('contains both complete and partial examples without inventing missing values', () => {
    const completeExample = SAMPLE_PLACES.find((place) => place.estimatedVisitMinutes !== undefined);
    const partialExample = SAMPLE_PLACES.find((place) => place.location === undefined);

    expect(completeExample).toMatchObject({
      location: expect.any(String),
      budgetLevel: expect.any(String),
      estimatedVisitMinutes: expect.any(Number),
    });
    expect(partialExample).toBeDefined();
    expect(partialExample).not.toHaveProperty('location');
    expect(partialExample).not.toHaveProperty('coordinates');
    expect(partialExample).not.toHaveProperty('openingHours');
  });
});
