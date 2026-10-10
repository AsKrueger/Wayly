import { DiscoverPreferences } from '../models/discover-preferences';
import { Place } from '../models/place';
import { recommendPlaces } from './recommendation-engine';

const DEFAULT_PREFERENCES: DiscoverPreferences = {
  activityTypes: ['culture'],
  availableTime: 'two-hours',
  budget: 'economical',
};

function place(
  id: string,
  category: Place['category'] = 'culture',
  options: Pick<Place, 'budgetLevel' | 'estimatedVisitMinutes'> = {},
): Place {
  return {
    id,
    name: id,
    description: 'Test place',
    category,
    source: 'test',
    dataStatus: 'fictional',
    ...options,
  };
}

describe('recommendPlaces', () => {
  it('includes only places matching the selected category', () => {
    const results = recommendPlaces({
      places: [place('nature-place', 'nature'), place('culture-place')],
      preferences: DEFAULT_PREFERENCES,
    });

    expect(results.map((result) => result.place.id)).toEqual(['culture-place']);
    expect(results[0].reasons).toContainEqual({
      type: 'category-match',
      category: 'culture',
    });
  });

  it('supports multiple categories and treats an empty selection as no category filter', () => {
    const places = [
      place('culture-place'),
      place('nature-place', 'nature'),
      place('food-place', 'food'),
    ];
    const multiple = recommendPlaces({
      places,
      preferences: { ...DEFAULT_PREFERENCES, activityTypes: ['culture', 'nature'] },
    });
    const unfiltered = recommendPlaces({
      places,
      preferences: { ...DEFAULT_PREFERENCES, activityTypes: [] },
    });

    expect(multiple.map((result) => result.place.id)).toEqual([
      'culture-place',
      'nature-place',
    ]);
    expect(unfiltered).toHaveLength(3);
    expect(unfiltered[0].reasons[0]).toEqual({ type: 'category-unfiltered' });
  });

  it('applies the selected budget as a maximum and retains unknown budgets as partial matches', () => {
    const results = recommendPlaces({
      places: [
        place('economical', 'culture', {
          budgetLevel: 'economical',
          estimatedVisitMinutes: 120,
        }),
        place('medium', 'culture', {
          budgetLevel: 'medium',
          estimatedVisitMinutes: 120,
        }),
        place('unknown'),
      ],
      preferences: DEFAULT_PREFERENCES,
    });

    expect(results.map((result) => result.place.id)).toEqual(['economical', 'unknown']);
    expect(results[0].reasons).toContainEqual({
      type: 'budget-compatible',
      placeLevel: 'economical',
      maximum: 'economical',
    });
    expect(results[1]).toMatchObject({
      verification: 'partial',
      reasons: expect.arrayContaining([{ type: 'budget-unknown' }]),
    });
  });

  it('accepts lower budget levels and excludes known levels above the selected maximum', () => {
    const results = recommendPlaces({
      places: [
        place('economical', 'culture', { budgetLevel: 'economical' }),
        place('medium', 'culture', { budgetLevel: 'medium' }),
        place('flexible', 'culture', { budgetLevel: 'flexible' }),
      ],
      preferences: { ...DEFAULT_PREFERENCES, budget: 'medium' },
    });

    expect(results.map((result) => result.place.id)).toEqual(['economical', 'medium']);
  });

  it('scores budget efficiency with the documented fixed 50-point budget weight', () => {
    const results = recommendPlaces({
      places: [
        place('economical', 'culture', {
          budgetLevel: 'economical',
          estimatedVisitMinutes: 120,
        }),
        place('medium', 'culture', {
          budgetLevel: 'medium',
          estimatedVisitMinutes: 120,
        }),
      ],
      preferences: { ...DEFAULT_PREFERENCES, budget: 'medium' },
    });

    expect(results.map((result) => [result.place.id, result.score])).toEqual([
      ['economical', 100],
      ['medium', 75],
    ]);
    expect(results[0].scoreBreakdown.budget).toEqual({
      points: 50,
      maximumPoints: 50,
      status: 'scored',
    });
    expect(results[0].scoreBreakdown.duration).toEqual({
      points: 50,
      maximumPoints: 50,
      status: 'scored',
    });
  });

  it('keeps known durations within the available time and retains unknown durations as partial', () => {
    const results = recommendPlaces({
      places: [
        place('short', 'culture', { estimatedVisitMinutes: 60 }),
        place('unknown'),
        place('long', 'culture', { estimatedVisitMinutes: 121 }),
      ],
      preferences: DEFAULT_PREFERENCES,
    });

    expect(results.map((result) => result.place.id)).toEqual(['short', 'unknown']);
    expect(results[0].reasons).toContainEqual({
      type: 'duration-compatible',
      estimatedMinutes: 60,
      availableMinutes: 120,
    });
    expect(results[1].reasons).toContainEqual({ type: 'duration-unknown' });
    expect(results[1].verification).toBe('partial');
  });

  it('scores duration utilization up to the inclusive time limit', () => {
    const results = recommendPlaces({
      places: [
        place('half-time', 'culture', {
          budgetLevel: 'flexible',
          estimatedVisitMinutes: 60,
        }),
        place('full-time', 'culture', {
          budgetLevel: 'flexible',
          estimatedVisitMinutes: 120,
        }),
        place('over-time', 'culture', {
          budgetLevel: 'flexible',
          estimatedVisitMinutes: 121,
        }),
      ],
      preferences: { ...DEFAULT_PREFERENCES, budget: 'flexible' },
    });

    expect(results.map((result) => result.place.id)).toEqual(['full-time', 'half-time']);
    expect(results[0].scoreBreakdown.duration).toEqual({
      points: 50,
      maximumPoints: 50,
      status: 'scored',
    });
    expect(results[0].score).toBeCloseTo(66.6667);
  });

  it('returns no results when every place is known to be incompatible', () => {
    const results = recommendPlaces({
      places: [
        place('wrong-category', 'food'),
        place('over-budget', 'culture', { budgetLevel: 'medium' }),
        place('too-long', 'culture', { estimatedVisitMinutes: 121 }),
      ],
      preferences: DEFAULT_PREFERENCES,
    });

    expect(results).toEqual([]);
  });

  it('sorts by score before using stable ID as a tie-breaker without losing verification state', () => {
    const results = recommendPlaces({
      places: [
        place('z-partial'),
        place('b-complete', 'culture', {
          budgetLevel: 'economical',
          estimatedVisitMinutes: 30,
        }),
        place('a-complete', 'culture', {
          budgetLevel: 'economical',
          estimatedVisitMinutes: 60,
        }),
        place('a-partial'),
      ],
      preferences: DEFAULT_PREFERENCES,
    });

    expect(results.map((result) => result.place.id)).toEqual([
      'a-complete',
      'b-complete',
      'a-partial',
      'z-partial',
    ]);
    expect(results.map((result) => result.score)).toEqual([75, 62.5, 0, 0]);
    expect(results.map((result) => result.verification)).toEqual([
      'complete',
      'complete',
      'partial',
      'partial',
    ]);
  });

  it('does not award missing data more points or use a high score to restore an incompatible place', () => {
    const results = recommendPlaces({
      places: [
        place('unknown', 'culture'),
        place('over-budget', 'culture', {
          budgetLevel: 'flexible',
          estimatedVisitMinutes: 120,
        }),
        place('compatible', 'culture', {
          budgetLevel: 'economical',
          estimatedVisitMinutes: 120,
        }),
      ],
      preferences: DEFAULT_PREFERENCES,
    });

    expect(results.map((result) => result.place.id)).toEqual(['compatible', 'unknown']);
    expect(results[0].score).toBe(100);
    expect(results[1].score).toBe(0);
    expect(results[1].verification).toBe('partial');
    expect(results[1].scoreBreakdown).toEqual({
      budget: { points: 0, maximumPoints: 50, status: 'unknown' },
      duration: { points: 0, maximumPoints: 50, status: 'unknown' },
    });
  });

  it('produces equivalent results for repeated identical input', () => {
    const input = {
      places: [
        place('incomplete'),
        place('complete', 'culture', {
          budgetLevel: 'economical',
          estimatedVisitMinutes: 60,
        }),
      ],
      preferences: DEFAULT_PREFERENCES,
    };

    expect(recommendPlaces(input)).toEqual(recommendPlaces(input));
  });
});
