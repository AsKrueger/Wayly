import { TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { PlaceCatalog } from './core/application/ports/place-catalog';
import { SamplePlaceCatalog } from './features/discover/data/sample-place-catalog.service';
import { appConfig } from './app.config';

describe('appConfig', () => {
  it('registers the router and local catalog implementation', () => {
    TestBed.configureTestingModule({ providers: appConfig.providers });

    expect(TestBed.inject(Router)).toBeDefined();
    expect(TestBed.inject(PlaceCatalog)).toBeInstanceOf(SamplePlaceCatalog);
  });
});
