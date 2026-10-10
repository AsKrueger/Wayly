import { Place } from '../../domain/models/place';

export abstract class PlaceCatalog {
  abstract getAll(): Promise<readonly Place[]>;
}
