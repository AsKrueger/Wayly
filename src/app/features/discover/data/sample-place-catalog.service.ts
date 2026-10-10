import { Injectable } from '@angular/core';
import { PlaceCatalog } from '../../../core/application/ports/place-catalog';
import { Place } from '../../../core/domain/models/place';
import { SAMPLE_PLACES } from './sample-places';

@Injectable()
export class SamplePlaceCatalog extends PlaceCatalog {
  async getAll(): Promise<readonly Place[]> {
    return SAMPLE_PLACES;
  }
}
