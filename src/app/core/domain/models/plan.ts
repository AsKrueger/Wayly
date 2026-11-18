import { CostLevel, Place, PlaceCoordinates } from './place';
import { PlaceCategory } from './place-category';
import { WeatherSnapshot } from './weather';

/** Highest estimated cost the user accepts. */
export type BudgetPreference = 'free' | 'low' | 'medium' | 'any';

export const DURATION_OPTIONS = [60, 120, 180, 240, 480] as const;
export type DurationMinutes = (typeof DURATION_OPTIONS)[number];

export interface PlanPreferences {
  /** Empty means "anything". */
  readonly categories: readonly PlaceCategory[];
  readonly durationMinutes: DurationMinutes;
  readonly budget: BudgetPreference;
}

export type PlanStrategy = 'balanced' | 'nearby' | 'highlights';

export const PLAN_STRATEGIES: readonly PlanStrategy[] = ['balanced', 'nearby', 'highlights'];

export interface PlanContext {
  readonly places: readonly Place[];
  readonly origin: PlaceCoordinates;
  readonly preferences: PlanPreferences;
  readonly start: Date;
  readonly weather: WeatherSnapshot | null;
  /** 0 means deterministic; other values add a small, reproducible variation. */
  readonly seed?: number;
}

export type StopReason =
  | { readonly type: 'category'; readonly category: PlaceCategory }
  | { readonly type: 'open' }
  | { readonly type: 'hours-unknown' }
  | { readonly type: 'notable' }
  | { readonly type: 'indoor-bad-weather' }
  | { readonly type: 'outdoor-good-weather' }
  | { readonly type: 'free' }
  | { readonly type: 'close'; readonly minutes: number }
  | { readonly type: 'meal-time' };

export interface PlanStop {
  readonly place: Place;
  readonly arrival: Date;
  readonly departure: Date;
  readonly walkMinutes: number;
  readonly walkMeters: number;
  readonly visitMinutes: number;
  readonly openStatus: 'open' | 'unknown';
  readonly reasons: readonly StopReason[];
  /** 0 to 100. */
  readonly score: number;
}

export interface PlanTotals {
  readonly minutes: number;
  readonly walkMinutes: number;
  readonly walkMeters: number;
  readonly cost: CostLevel;
  /** 0 to 100: average fit of the stops. */
  readonly affinity: number;
}

export interface Plan {
  readonly id: string;
  readonly strategy: PlanStrategy;
  readonly origin: PlaceCoordinates;
  readonly start: Date;
  readonly stops: readonly PlanStop[];
  readonly totals: PlanTotals;
}
