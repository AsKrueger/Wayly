import { DiscoverPreferences } from '../../../core/domain/models/discover-preferences';
import { Place } from '../../../core/domain/models/place';
import { recommendPlaces } from '../../../core/domain/services/recommendation-engine';
import { createPlanBattle } from './plan-battle';

const PREFERENCES: DiscoverPreferences = {
  activityTypes: [],
  availableTime: 'half-day',
  budget: 'flexible',
};

function place(
  id: string,
  budgetLevel: Place['budgetLevel'],
  estimatedVisitMinutes: number | undefined,
): Place {
  return {
    id,
    name: `Lugar ${id}`,
    description: 'Lugar de prueba.',
    category: 'culture',
    ...(budgetLevel ? { budgetLevel } : {}),
    ...(estimatedVisitMinutes !== undefined ? { estimatedVisitMinutes } : {}),
    source: 'test',
    dataStatus: 'fictional',
  };
}

describe('createPlanBattle', () => {
  it('uses the two leading compatible engine recommendations without recalculating their details', () => {
    const recommendations = recommendPlaces({
      places: [
        place('ranked-second', 'medium', 60),
        place('ranked-first', 'economical', 60),
        place('incompatible', 'flexible', 60),
      ],
      preferences: { ...PREFERENCES, budget: 'medium' },
    });

    const comparison = createPlanBattle(recommendations);

    expect(comparison.kind).toBe('ready');
    if (comparison.kind !== 'ready') {
      return;
    }
    expect(comparison.alternatives).toEqual(recommendations.slice(0, 2));
    expect(comparison.alternatives.map(({ place: candidate }) => candidate.id))
      .toEqual(['ranked-first', 'ranked-second']);
    expect(comparison.alternatives[0].reasons).toBe(recommendations[0].reasons);
    expect(comparison.alternatives[0].scoreBreakdown).toBe(recommendations[0].scoreBreakdown);
    expect(comparison.affinity).toBe('first-higher');
    expect(comparison.affinityDifference).toBe(
      recommendations[0].score - recommendations[1].score,
    );
    expect(comparison.alternatives.some(({ place: candidate }) => candidate.id === 'incompatible'))
      .toBe(false);
  });

  it('reports exact affinity ties without inventing a winner', () => {
    const recommendations = recommendPlaces({
      places: [
        place('same-score-b', 'economical', 60),
        place('same-score-a', 'economical', 60),
      ],
      preferences: PREFERENCES,
    });

    const comparison = createPlanBattle(recommendations);

    expect(comparison).toMatchObject({
      kind: 'ready',
      affinity: 'tie',
      affinityDifference: 0,
    });
  });

  it('describes the score direction accurately if recommendations arrive reversed', () => {
    const recommendations = recommendPlaces({
      places: [
        place('higher-score', 'economical', 120),
        place('lower-score', 'flexible', 60),
      ],
      preferences: PREFERENCES,
    });

    const comparison = createPlanBattle([...recommendations].reverse());

    expect(comparison).toMatchObject({
      kind: 'ready',
      affinity: 'second-higher',
    });
  });

  it.each([0, 1])('explains when only %i compatible alternative(s) are available', (count) => {
    const recommendations = recommendPlaces({
      places: [place('only', 'economical', 60)].slice(0, count),
      preferences: PREFERENCES,
    });

    expect(createPlanBattle(recommendations)).toEqual({
      kind: 'insufficient',
      availableAlternatives: count,
    });
  });

  it('retains partial recommendations and their unknown criterion state', () => {
    const recommendations = recommendPlaces({
      places: [
        place('known', 'economical', 60),
        place('partial', undefined, undefined),
      ],
      preferences: PREFERENCES,
    });

    const comparison = createPlanBattle(recommendations);

    expect(comparison.kind).toBe('ready');
    if (comparison.kind !== 'ready') {
      return;
    }
    expect(comparison.alternatives.map(({ verification }) => verification))
      .toContain('partial');
    expect(comparison.alternatives.find(({ place: candidate }) => candidate.id === 'partial')
      ?.scoreBreakdown).toMatchObject({
      budget: { status: 'unknown' },
      duration: { status: 'unknown' },
    });
  });
});
