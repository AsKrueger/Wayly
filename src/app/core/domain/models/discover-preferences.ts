import { PlaceCategory } from './place-category';

export type AvailableTime = 'one-hour' | 'two-hours' | 'half-day';
export type BudgetRange = 'economical' | 'medium' | 'flexible';

export interface DiscoverPreferences {
  readonly activityTypes: readonly PlaceCategory[];
  readonly availableTime: AvailableTime;
  readonly budget: BudgetRange;
}
