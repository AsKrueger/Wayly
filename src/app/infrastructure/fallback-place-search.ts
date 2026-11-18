import { inject, Injectable } from '@angular/core';
import { PlaceSearch, PlaceSearchQuery } from '../core/application/ports/place-search';
import { Place } from '../core/domain/models/place';
import { OverpassPlaceSearch } from './overpass/overpass-place-search';
import { PhotonPlaceSearch } from './photon/photon-place-search';

/**
 * Overpass first (full data: opening hours, Wikidata); Photon when every
 * Overpass instance is busy or down. If both fail, the Overpass error is
 * reported because it explains the main cause.
 */
@Injectable()
export class FallbackPlaceSearch extends PlaceSearch {
  private readonly primary = inject(OverpassPlaceSearch);
  private readonly backup = inject(PhotonPlaceSearch);

  async findNear(query: PlaceSearchQuery, signal?: AbortSignal): Promise<readonly Place[]> {
    try {
      return await this.primary.findNear(query, signal);
    } catch (primaryError: unknown) {
      if (signal?.aborted) {
        throw primaryError;
      }
      try {
        return await this.backup.findNear(query, signal);
      } catch {
        throw primaryError;
      }
    }
  }
}
