import { SearchLocation } from '../../domain/models/geo';
import { PlaceCoordinates } from '../../domain/models/place';
import { Language } from '../../i18n/i18n.types';

/** Turns text into locations and coordinates into a readable name. */
export abstract class Geocoder {
  abstract search(
    text: string,
    language: Language,
    signal?: AbortSignal,
  ): Promise<readonly SearchLocation[]>;

  abstract reverse(
    coordinates: PlaceCoordinates,
    language: Language,
    signal?: AbortSignal,
  ): Promise<SearchLocation | null>;
}
