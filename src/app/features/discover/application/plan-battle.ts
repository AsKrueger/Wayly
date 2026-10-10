import { PlaceRecommendation } from '../../../core/domain/services/recommendation-engine';

export type PlanBattleComparison =
  | {
      readonly kind: 'insufficient';
      readonly availableAlternatives: number;
    }
  | {
      readonly kind: 'ready';
      readonly alternatives: readonly [PlaceRecommendation, PlaceRecommendation];
      readonly affinity: 'tie' | 'first-higher' | 'second-higher';
      readonly affinityDifference: number;
    };

export function createPlanBattle(
  recommendations: readonly PlaceRecommendation[],
): PlanBattleComparison {
  if (recommendations.length < 2) {
    return {
      kind: 'insufficient',
      availableAlternatives: recommendations.length,
    };
  }

  const first = recommendations[0];
  const second = recommendations[1];
  const affinity = first.score === second.score
    ? 'tie'
    : first.score > second.score
      ? 'first-higher'
      : 'second-higher';

  return {
    kind: 'ready',
    alternatives: [first, second],
    affinity,
    affinityDifference: Math.abs(first.score - second.score),
  };
}
