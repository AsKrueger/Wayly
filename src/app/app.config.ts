import { ApplicationConfig, provideZoneChangeDetection } from '@angular/core';
import { provideRouter, TitleStrategy, withInMemoryScrolling } from '@angular/router';

import { routes } from './app.routes';
import { PlaceCatalog } from './core/application/ports/place-catalog';
import { TranslatedTitleStrategy } from './core/i18n/translated-title.strategy';
import { SamplePlaceCatalog } from './features/discover/data/sample-place-catalog.service';

export const appConfig: ApplicationConfig = {
  providers: [
    provideZoneChangeDetection({ eventCoalescing: true }),
    provideRouter(routes, withInMemoryScrolling({ scrollPositionRestoration: 'top' })),
    { provide: TitleStrategy, useClass: TranslatedTitleStrategy },
    { provide: PlaceCatalog, useClass: SamplePlaceCatalog },
  ],
};
