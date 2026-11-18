import { Place } from '../../domain/models/place';
import { Language } from '../../i18n/i18n.types';

export interface PlaceSummary {
  readonly title: string;
  readonly extract: string;
  readonly imageUrl?: string;
  readonly articleUrl: string;
  readonly language: string;
}

/** Optional encyclopedic details (photo and summary) for notable places. */
export abstract class PlaceDetails {
  abstract summary(place: Place, language: Language, signal?: AbortSignal): Promise<PlaceSummary | null>;
}
