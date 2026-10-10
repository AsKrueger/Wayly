import {
  AvailableTime,
  BudgetRange,
  DiscoverPreferences,
} from '../models/discover-preferences';
import { Place, PlaceBudgetLevel } from '../models/place';
import { PlaceCategory } from '../models/place-category';

export type RecommendationReason =
  | { readonly type: 'category-match'; readonly category: PlaceCategory }
  | { readonly type: 'category-unfiltered' }
  | {
      readonly type: 'budget-compatible';
      readonly placeLevel: PlaceBudgetLevel;
      readonly maximum: BudgetRange;
    }
  | { readonly type: 'budget-unknown' }
  | {
      readonly type: 'duration-compatible';
      readonly estimatedMinutes: number;
      readonly availableMinutes: number;
    }
  | { readonly type: 'duration-unknown' };

export interface PlaceRecommendation {
  readonly place: Place;
  readonly reasons: readonly RecommendationReason[];
  readonly verification: 'complete' | 'partial';
}

export interface RecommendationInput {
  readonly places: readonly Place[];
  readonly preferences: DiscoverPreferences;
}

const BUDGET_RANK: Record<PlaceBudgetLevel, number> = {
  economical: 0,
  medium: 1,
  flexible: 2,
};

const AVAILABLE_MINUTES: Record<AvailableTime, number> = {
  'one-hour': 60,
  'two-hours': 120,
  'half-day': 240,
};

export function recommendPlaces(input: RecommendationInput): readonly PlaceRecommendation[] {
  const { places, preferences } = input;
  const selectedCategories = preferences.activityTypes;
  const availableMinutes = AVAILABLE_MINUTES[preferences.availableTime];
  const maximumBudgetRank = BUDGET_RANK[preferences.budget];
  const recommendations: PlaceRecommendation[] = [];

  for (const place of places) {
    if (selectedCategories.length > 0 && !selectedCategories.includes(place.category)) {
      continue;
    }

    if (place.budgetLevel && BUDGET_RANK[place.budgetLevel] > maximumBudgetRank) {
      continue;
    }

    if (
      place.estimatedVisitMinutes !== undefined
      && place.estimatedVisitMinutes > availableMinutes
    ) {
      continue;
    }

    const reasons: RecommendationReason[] = [];

    if (selectedCategories.length > 0) {
      reasons.push({ type: 'category-match', category: place.category });
    } else {
      reasons.push({ type: 'category-unfiltered' });
    }

    if (place.budgetLevel) {
      reasons.push({
        type: 'budget-compatible',
        placeLevel: place.budgetLevel,
        maximum: preferences.budget,
      });
    } else {
      reasons.push({ type: 'budget-unknown' });
    }

    if (place.estimatedVisitMinutes !== undefined) {
      reasons.push({
        type: 'duration-compatible',
        estimatedMinutes: place.estimatedVisitMinutes,
        availableMinutes,
      });
    } else {
      reasons.push({ type: 'duration-unknown' });
    }

    const verification = reasons.some((reason) =>
      reason.type === 'budget-unknown' || reason.type === 'duration-unknown',
    ) ? 'partial' : 'complete';

    recommendations.push({ place, reasons, verification });
  }

  return recommendations.sort((first, second) => {
    if (first.verification !== second.verification) {
      return first.verification === 'complete' ? -1 : 1;
    }

    if (first.place.id < second.place.id) {
      return -1;
    }

    if (first.place.id > second.place.id) {
      return 1;
    }

    return 0;
  });
}
