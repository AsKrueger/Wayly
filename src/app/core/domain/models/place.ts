import { PlaceCategory } from './place-category';

export type PlaceBudgetLevel = 'economical' | 'medium' | 'flexible';
export type PlaceDataStatus = 'fictional' | 'unverified' | 'verified';
export type Weekday =
  | 'monday'
  | 'tuesday'
  | 'wednesday'
  | 'thursday'
  | 'friday'
  | 'saturday'
  | 'sunday';

export interface PlaceCoordinates {
  readonly latitude: number;
  readonly longitude: number;
}

export interface PlaceOpeningHours {
  readonly weekday: Weekday;
  readonly opensAt: string;
  readonly closesAt: string;
}

export interface Place {
  readonly id: string;
  readonly name: string;
  readonly description: string;
  readonly category: PlaceCategory;
  readonly location?: string;
  readonly coordinates?: PlaceCoordinates;
  readonly budgetLevel?: PlaceBudgetLevel;
  readonly estimatedVisitMinutes?: number;
  readonly openingHours?: readonly PlaceOpeningHours[];
  readonly source: string;
  readonly dataStatus: PlaceDataStatus;
}
