import { Place, PlaceCoordinates } from '../../domain/models/place';
import { PlaceCategory } from '../../domain/models/place-category';

export interface PlaceSearchQuery {
  readonly center: PlaceCoordinates;
  readonly radiusMeters: number;
  /** Empty means every category. */
  readonly categories: readonly PlaceCategory[];
  /** Preferred language for place names, when the source has translations. */
  readonly language: string;
}

export type DataServiceFailure = 'unavailable' | 'rate-limited' | 'timeout' | 'invalid-response';

/** A data service could not answer. The interface offers a retry. */
export class DataServiceError extends Error {
  constructor(
    readonly failure: DataServiceFailure,
    message: string,
  ) {
    super(message);
    this.name = 'DataServiceError';
  }
}

/** Finds real places around a point. */
export abstract class PlaceSearch {
  abstract findNear(query: PlaceSearchQuery, signal?: AbortSignal): Promise<readonly Place[]>;
}
