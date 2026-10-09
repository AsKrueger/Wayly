import { PlaceCategory } from './place';

export type AvailableTime = 'one-hour' | 'two-hours' | 'half-day';
export type BudgetRange = 'economical' | 'medium' | 'flexible';

export interface DiscoverPreferences {
  readonly activityType: PlaceCategory;
  readonly availableTime: AvailableTime;
  readonly budget: BudgetRange;
}
