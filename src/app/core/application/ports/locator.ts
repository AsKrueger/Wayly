import { PlaceCoordinates } from '../../domain/models/place';

export type LocatorFailure = 'unsupported' | 'denied' | 'unavailable' | 'timeout';

export class LocatorError extends Error {
  constructor(readonly failure: LocatorFailure) {
    super(`Location unavailable: ${failure}`);
    this.name = 'LocatorError';
  }
}

/** The device position, only when the user asks for it. */
export abstract class Locator {
  abstract locate(): Promise<PlaceCoordinates>;
}
