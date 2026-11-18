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

/** Estimated price per person, by type of place. */
export type CostLevel = 'free' | 'low' | 'medium' | 'high';

export type WheelchairAccess = 'yes' | 'limited' | 'no';

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

  /** Specific type of place, for example `museum` or `viewpoint`. */
  readonly kind?: string;
  /** Opening hours in OpenStreetMap `opening_hours` syntax, as published. */
  readonly openingHoursText?: string;
  readonly costLevel?: CostLevel;
  /** True when the visit happens under a roof; useful when it rains. */
  readonly indoor?: boolean;
  /** 0 to 1: how notable the place is (Wikipedia article, heritage, attraction). */
  readonly notability?: number;
  readonly website?: string;
  /** OpenStreetMap `wikipedia` tag, for example `es:Catedral de Sevilla`. */
  readonly wikipedia?: string;
  /** Wikidata item, for example `Q231606`. */
  readonly wikidata?: string;
  readonly wheelchair?: WheelchairAccess;
}
