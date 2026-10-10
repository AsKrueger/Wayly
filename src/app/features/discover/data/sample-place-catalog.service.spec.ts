import { TestBed } from '@angular/core/testing';
import { PlaceCatalog } from '../../../core/application/ports/place-catalog';
import { SAMPLE_PLACES } from './sample-places';
import { SamplePlaceCatalog } from './sample-place-catalog.service';

describe('SamplePlaceCatalog', () => {
  it('provides the typed local fixtures through the catalog contract', async () => {
    TestBed.configureTestingModule({
      providers: [{ provide: PlaceCatalog, useClass: SamplePlaceCatalog }],
    });

    const catalog = TestBed.inject(PlaceCatalog);

    const places = await catalog.getAll();

    expect(places).toEqual(SAMPLE_PLACES);
    expect(places.length).toBeGreaterThan(0);
  });
});
