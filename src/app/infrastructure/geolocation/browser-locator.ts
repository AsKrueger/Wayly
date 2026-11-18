import { DOCUMENT } from '@angular/common';
import { inject, Injectable } from '@angular/core';
import { Locator, LocatorError } from '../../core/application/ports/locator';
import { PlaceCoordinates } from '../../core/domain/models/place';

const TIMEOUT_MS = 12000;

/** Browser Geolocation API. Only called when the user presses the button. */
@Injectable()
export class BrowserLocator extends Locator {
  private readonly navigator = inject(DOCUMENT).defaultView?.navigator;

  locate(): Promise<PlaceCoordinates> {
    const geolocation = this.navigator?.geolocation;
    if (!geolocation) {
      return Promise.reject(new LocatorError('unsupported'));
    }
    return new Promise((resolve, reject) => {
      geolocation.getCurrentPosition(
        (position) =>
          resolve({ latitude: position.coords.latitude, longitude: position.coords.longitude }),
        (error) => {
          const failure =
            error.code === error.PERMISSION_DENIED
              ? 'denied'
              : error.code === error.TIMEOUT
                ? 'timeout'
                : 'unavailable';
          reject(new LocatorError(failure));
        },
        { enableHighAccuracy: false, timeout: TIMEOUT_MS, maximumAge: 5 * 60 * 1000 },
      );
    });
  }
}
