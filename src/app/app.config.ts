import { ApplicationConfig, provideZoneChangeDetection } from '@angular/core';
import { provideRouter } from '@angular/router';

import { routes } from './app.routes';
import { PlaceCatalog } from './core/application/ports/place-catalog';
import { SamplePlaceCatalog } from './features/discover/data/sample-place-catalog.service';

export const appConfig: ApplicationConfig = {
  providers: [
    provideZoneChangeDetection({ eventCoalescing: true }),
    provideRouter(routes),
    { provide: PlaceCatalog, useClass: SamplePlaceCatalog },
  ],
};
