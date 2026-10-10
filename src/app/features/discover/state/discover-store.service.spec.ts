import { TestBed } from '@angular/core/testing';
import { PlaceCatalog } from '../../../core/application/ports/place-catalog';
import { Place } from '../../../core/domain/models/place';
import { SAMPLE_PLACES } from '../data/sample-places';
import { SamplePlaceCatalog } from '../data/sample-place-catalog.service';
import { DiscoverStore } from './discover-store.service';

describe('DiscoverStore', () => {
  afterEach(() => {
    jest.restoreAllMocks();
  });

  function configureStore(getAll: () => Promise<readonly Place[]>): DiscoverStore {
    TestBed.configureTestingModule({
      providers: [
        DiscoverStore,
        { provide: PlaceCatalog, useValue: { getAll } },
      ],
    });

    return TestBed.inject(DiscoverStore);
  }

  it('starts with explicit defaults and a loading catalog state', () => {
    const store = configureStore(() => new Promise(() => undefined));

    expect(store.catalogState()).toEqual({ kind: 'loading' });
    expect(store.preferences()).toEqual({
      activityTypes: ['culture'],
      availableTime: 'two-hours',
      budget: 'economical',
    });
    expect(store.visiblePlaces()).toEqual([]);
    expect(store.resultCount()).toBe(0);
    expect(store.isCatalogEmpty()).toBe(false);
    expect(store.hasNoVisiblePlaces()).toBe(false);
  });

  it('loads catalog places and derives filtered results and count', async () => {
    const store = configureStore(() => Promise.resolve(SAMPLE_PLACES));
    await new Promise((resolve) => setTimeout(resolve, 0));

    expect(store.catalogState().kind).toBe('success');
    expect(store.visiblePlaces().map((place) => place.id)).toEqual([
      'demo-open-gallery',
    ]);
    expect(store.recommendations()[0].verification).toBe('partial');
    expect(store.resultCount()).toBe(1);
    expect(store.isCatalogEmpty()).toBe(false);
  });

  it('updates multiple selected categories and shows all when none are selected', async () => {
    const store = configureStore(() => Promise.resolve(SAMPLE_PLACES));
    await new Promise((resolve) => setTimeout(resolve, 0));

    store.toggleActivityType('nature');
    expect(store.preferences().activityTypes).toEqual(['culture', 'nature']);
    expect(store.resultCount()).toBe(3);

    store.toggleActivityType('culture');
    store.toggleActivityType('nature');

    expect(store.preferences().activityTypes).toEqual([]);
    expect(store.selectedPreferencesSummary()).toContain('Todas las categorías');
    expect(store.visiblePlaces()).toHaveLength(6);
    expect(store.resultCount()).toBe(6);
  });

  it('recomputes recommendations when budget and available time change', async () => {
    const store = configureStore(() => Promise.resolve(SAMPLE_PLACES));
    await new Promise((resolve) => setTimeout(resolve, 0));

    expect(store.visiblePlaces().map((place) => place.id)).toEqual([
      'demo-open-gallery',
    ]);

    store.setBudget('flexible');
    store.setAvailableTime('half-day');

    expect(store.visiblePlaces().map((place) => place.id)).toEqual([
      'demo-city-museum',
      'demo-open-gallery',
    ]);
    expect(store.recommendations()[0].verification).toBe('complete');
    expect(store.recommendations()[1].verification).toBe('partial');
  });

  it('distinguishes a successfully empty catalog from no matches after filtering', async () => {
    const emptyStore = configureStore(() => Promise.resolve([]));
    await new Promise((resolve) => setTimeout(resolve, 0));

    expect(emptyStore.catalogState()).toEqual({ kind: 'success', places: [] });
    expect(emptyStore.isCatalogEmpty()).toBe(true);
    expect(emptyStore.hasNoVisiblePlaces()).toBe(false);

    TestBed.resetTestingModule();
    const store = configureStore(() => Promise.resolve([SAMPLE_PLACES[0]]));
    await new Promise((resolve) => setTimeout(resolve, 0));
    store.toggleActivityType('culture');
    store.toggleActivityType('nature');

    expect(store.isCatalogEmpty()).toBe(false);
    expect(store.hasNoVisiblePlaces()).toBe(true);
    expect(store.resultCount()).toBe(0);
  });

  it('keeps errors distinct and retries once after a failure', async () => {
    const error = new Error('catalog unavailable');
    const consoleError = jest.spyOn(console, 'error').mockImplementation(() => undefined);
    const getAll = jest.fn()
      .mockRejectedValueOnce(error)
      .mockResolvedValueOnce(SAMPLE_PLACES);
    const store = configureStore(getAll);
    await new Promise((resolve) => setTimeout(resolve, 0));

    expect(store.catalogState()).toEqual({
      kind: 'error',
      message: 'No se pudieron cargar los lugares. Comprueba tu conexión e inténtalo de nuevo.',
    });
    expect(store.isCatalogEmpty()).toBe(false);
    expect(store.resultCount()).toBe(0);
    expect(consoleError).toHaveBeenCalledWith('Unable to load places for Discover.', error);

    await Promise.all([store.retryLoading(), store.retryLoading()]);

    expect(getAll).toHaveBeenCalledTimes(2);
    expect(store.catalogState().kind).toBe('success');
    expect(store.resultCount()).toBe(1);
  });

  it('uses the real sample catalog adapter without external requests', async () => {
    TestBed.configureTestingModule({
      providers: [
        DiscoverStore,
        { provide: PlaceCatalog, useClass: SamplePlaceCatalog },
      ],
    });
    const store = TestBed.inject(DiscoverStore);
    await new Promise((resolve) => setTimeout(resolve, 0));

    expect(store.catalogState().kind).toBe('success');
    expect(store.resultCount()).toBe(1);
  });
});
