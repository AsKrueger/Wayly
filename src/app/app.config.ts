import { ApplicationConfig, provideZoneChangeDetection } from '@angular/core';
import { provideRouter, TitleStrategy, withInMemoryScrolling } from '@angular/router';

import { routes } from './app.routes';
import { Geocoder } from './core/application/ports/geocoder';
import { Locator } from './core/application/ports/locator';
import { PlaceCatalog } from './core/application/ports/place-catalog';
import { PlaceDetails } from './core/application/ports/place-details';
import { PlaceSearch } from './core/application/ports/place-search';
import { WeatherProvider } from './core/application/ports/weather-provider';
import { TranslatedTitleStrategy } from './core/i18n/translated-title.strategy';
import { SamplePlaceCatalog } from './features/discover/data/sample-place-catalog.service';
import { BrowserLocator } from './infrastructure/geolocation/browser-locator';
import { OpenMeteoWeather } from './infrastructure/open-meteo/open-meteo-weather';
import { FallbackPlaceSearch } from './infrastructure/fallback-place-search';
import { PhotonGeocoder } from './infrastructure/photon/photon-geocoder';
import { WikipediaDetails } from './infrastructure/wikipedia/wikipedia-details';

export const appConfig: ApplicationConfig = {
  providers: [
    provideZoneChangeDetection({ eventCoalescing: true }),
    provideRouter(routes, withInMemoryScrolling({ scrollPositionRestoration: 'top' })),
    { provide: TitleStrategy, useClass: TranslatedTitleStrategy },
    { provide: PlaceCatalog, useClass: SamplePlaceCatalog },
    { provide: PlaceSearch, useClass: FallbackPlaceSearch },
    { provide: Geocoder, useClass: PhotonGeocoder },
    { provide: WeatherProvider, useClass: OpenMeteoWeather },
    { provide: PlaceDetails, useClass: WikipediaDetails },
    { provide: Locator, useClass: BrowserLocator },
  ],
};
