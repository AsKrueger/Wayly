export type PlaceCategory = 'culture' | 'nature' | 'food' | 'leisure';

export interface Place {
  readonly id: string;
  readonly name: string;
  readonly category: PlaceCategory;
  readonly description: string;
  readonly location?: string;
}
