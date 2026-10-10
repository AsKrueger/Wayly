import { TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { provideRouter } from '@angular/router';
import { RouterTestingHarness } from '@angular/router/testing';
import { PlaceCatalog } from '../../core/application/ports/place-catalog';
import { SamplePlaceCatalog } from './data/sample-place-catalog.service';
import { DiscoverPageComponent } from './discover-page.component';
import { PlaceMapComponent } from './map/place-map.component';
import { SAMPLE_PLACES } from './data/sample-places';
import { routes } from '../../app.routes';

describe('DiscoverPageComponent', () => {
  afterEach(() => {
    jest.restoreAllMocks();
  });

  async function loadDiscoverPage(
    places: readonly (typeof SAMPLE_PLACES[number])[] = SAMPLE_PLACES,
  ): Promise<RouterTestingHarness> {
    await TestBed.configureTestingModule({
      providers: [
        provideRouter(routes),
        {
          provide: PlaceCatalog,
          useValue: places === SAMPLE_PLACES
            ? new SamplePlaceCatalog()
            : { getAll: () => Promise.resolve(places) },
        },
      ],
    });

    const harness = await RouterTestingHarness.create();
    await harness.navigateByUrl('/', DiscoverPageComponent);
    await harness.fixture.whenStable();
    harness.fixture.detectChanges();

    return harness;
  }

  function generateProposal(harness: RouterTestingHarness): void {
    harness.routeNativeElement
      ?.querySelector<HTMLButtonElement>('.preferences-panel__action')
      ?.click();
    harness.fixture.detectChanges();
  }

  it('starts with pending preferences and generates an explained proposal on request', async () => {
    const harness = await loadDiscoverPage();
    const page = harness.routeNativeElement;

    expect(page?.querySelector('h1')?.textContent).toContain('¿Qué te apetece hacer hoy?');
    expect(page?.querySelector('.preferences-panel__action')?.textContent)
      .toContain('Generar mi propuesta');
    expect(page?.querySelectorAll('input[type="checkbox"]')).toHaveLength(4);
    expect(page?.querySelectorAll('input[type="radio"]')).toHaveLength(6);
    expect(page?.querySelectorAll('app-place-card')).toHaveLength(0);

    generateProposal(harness);

    expect(page?.querySelectorAll('app-place-card')).toHaveLength(1);
    expect(page?.textContent).toContain('Galería Patio Abierto');
    expect(page?.textContent).toContain('Resultados: 1');
    expect(page?.textContent).toContain('Afinidad orientativa: 0/100');
    expect(page?.textContent).toContain('Presupuesto: sin datos (0/50 puntos)');
    expect(page?.textContent).toContain('Tiempo: sin datos (0/50 puntos)');
    expect(page?.textContent).toContain('Faltan datos para comprobar todo');
    expect(page?.textContent).toContain('No hay datos de presupuesto');
    expect(page?.textContent).toContain('No hay datos de duración');
    expect(page?.textContent).toContain('Propuesta generada localmente');
  });

  it('filters example places when the activity preference changes', async () => {
    const harness = await loadDiscoverPage();
    const page = harness.routeNativeElement;
    const natureOption = page?.querySelector<HTMLInputElement>(
      'input[name="activityType"][value="nature"]',
    );
    const cultureOption = page?.querySelector<HTMLInputElement>(
      'input[name="activityType"][value="culture"]',
    );

    natureOption?.click();
    cultureOption?.click();
    harness.fixture.detectChanges();

    expect(natureOption?.checked).toBe(true);
    expect(cultureOption?.checked).toBe(false);
    expect(page?.querySelectorAll('app-place-card')).toHaveLength(0);

    generateProposal(harness);

    expect(page?.querySelectorAll('app-place-card')).toHaveLength(2);
    expect(page?.textContent).toContain('Jardín del Río');
    expect(page?.textContent).toContain('Mirador de los Olmos');
    expect(page?.textContent).not.toContain('Galería Patio Abierto');
  });

  it('updates time and budget preferences without reloading', async () => {
    const harness = await loadDiscoverPage();
    const page = harness.routeNativeElement;
    const timeOption = page?.querySelector<HTMLInputElement>(
      'input[name="availableTime"][value="half-day"]',
    );
    const budgetOption = page?.querySelector<HTMLInputElement>(
      'input[name="budget"][value="flexible"]',
    );

    timeOption?.click();
    budgetOption?.click();
    harness.fixture.detectChanges();

    expect(timeOption?.checked).toBe(true);
    expect(budgetOption?.checked).toBe(true);
    expect(page?.querySelector('.preferences-summary')?.textContent).toContain(
      'Cultura · Medio día · Presupuesto Flexible',
    );
    expect(page?.querySelectorAll('app-place-card')).toHaveLength(0);

    generateProposal(harness);

    expect(page?.querySelector('.proposal-preferences')?.textContent).toContain(
      'Cultura · Medio día · Presupuesto Flexible',
    );
    expect(page?.textContent).toContain('Afinidad orientativa: 52/100');
    expect(page?.textContent).toContain('Presupuesto: 33.3/50 puntos');
    expect(page?.textContent).toContain('Tiempo: 18.8/50 puntos');
  });

  it('shows all categories when every category checkbox is cleared', async () => {
    const harness = await loadDiscoverPage();
    const page = harness.routeNativeElement;
    const cultureOption = page?.querySelector<HTMLInputElement>(
      'input[name="activityType"][value="culture"]',
    );

    cultureOption?.click();
    harness.fixture.detectChanges();

    expect(cultureOption?.checked).toBe(false);
    expect(page?.querySelector('.preferences-summary')?.textContent)
      .toContain('Todas las categorías');
    expect(page?.querySelectorAll('app-place-card')).toHaveLength(0);
    generateProposal(harness);
    expect(page?.querySelectorAll('app-place-card')).toHaveLength(6);
    expect(page?.querySelector('.proposal-preferences')?.textContent)
      .toContain('Todas las categorías');
  });

  it('returns to preferences without losing them and regenerates the proposal', async () => {
    const harness = await loadDiscoverPage();
    const page = harness.routeNativeElement;
    generateProposal(harness);

    page?.querySelector<HTMLButtonElement>('.proposal-actions .button--secondary')?.click();
    harness.fixture.detectChanges();

    expect(page?.querySelector('input[name="activityType"][value="culture"]')?.checked).toBe(true);
    expect(page?.querySelector('app-place-card')).toBeNull();

    page?.querySelector<HTMLInputElement>(
      'input[name="activityType"][value="food"]',
    )?.click();
    page?.querySelector<HTMLInputElement>(
      'input[name="activityType"][value="culture"]',
    )?.click();
    harness.fixture.detectChanges();

    expect(page?.querySelector('.preferences-panel__action')?.textContent)
      .toContain('Generar mi propuesta');
    generateProposal(harness);

    expect(page?.textContent).toContain('Café La Esquina');
    expect(page?.textContent).not.toContain('Mercado de la Plaza');
    expect(page?.querySelector('.proposal-preferences')?.textContent)
      .toContain('Gastronomía · 2 horas · Presupuesto Económico');
  });

  it('supports accessible list selection and explains why the selection has no marker', async () => {
    const harness = await loadDiscoverPage();
    generateProposal(harness);
    const page = harness.routeNativeElement;
    const result = page?.querySelector<HTMLButtonElement>('.recommendation__select');

    expect(result?.type).toBe('button');
    expect(result?.getAttribute('aria-pressed')).toBe('false');
    result?.click();
    harness.fixture.detectChanges();

    expect(result?.getAttribute('aria-pressed')).toBe('true');
    expect(result?.closest('.recommendation')?.classList.contains('recommendation--selected')).toBe(true);
    expect(page?.querySelector('app-place-map [role="status"]')?.textContent)
      .toContain('Galería Patio Abierto no tiene coordenadas válidas');
  });

  it('synchronizes a map selection with the matching result card', async () => {
    const harness = await loadDiscoverPage();
    generateProposal(harness);
    const map = harness.fixture.debugElement
      .query(By.directive(PlaceMapComponent)).componentInstance as PlaceMapComponent;

    map.placeSelected.emit('demo-open-gallery');
    harness.fixture.detectChanges();

    const selectedResult = harness.routeNativeElement
      ?.querySelector<HTMLElement>('#place-result-demo-open-gallery');
    expect(selectedResult?.getAttribute('aria-pressed')).toBe('true');
    expect(selectedResult?.closest('.recommendation')
      ?.classList.contains('recommendation--selected')).toBe(true);
  });

  it('compares the two leading recommendations and lets the user change their choice', async () => {
    const harness = await loadDiscoverPage();
    const page = harness.routeNativeElement;
    page?.querySelector<HTMLInputElement>('input[name="activityType"][value="culture"]')?.click();
    harness.fixture.detectChanges();
    generateProposal(harness);
    page?.querySelector<HTMLButtonElement>('.recommendation__select')?.click();
    harness.fixture.detectChanges();

    page?.querySelector<HTMLButtonElement>('.plan-battle__entry button')?.click();
    harness.fixture.detectChanges();

    const options = page?.querySelectorAll<HTMLElement>('.plan-battle__option');
    expect(page?.querySelectorAll('.plan-battle__choose[aria-pressed="true"]')).toHaveLength(0);
    expect(options).toHaveLength(2);
    expect(options?.[0].textContent).toContain('Jardín del Río');
    expect(options?.[1].textContent).toContain('Café La Esquina');
    expect(options?.[1].textContent).toContain('Ubicación');
    expect(options?.[1].textContent).toContain('Sin datos');
    expect(page?.querySelector('.plan-battle__affinity')?.textContent)
      .toContain('afinidad orientativa según tus preferencias');

    const chooseButtons = page?.querySelectorAll<HTMLButtonElement>('.plan-battle__choose');
    chooseButtons?.[1].click();
    harness.fixture.detectChanges();
    expect(chooseButtons?.[1].getAttribute('aria-pressed')).toBe('true');
    expect(page?.querySelector('.plan-battle__selection')?.textContent)
      .toContain('Has elegido Café La Esquina');

    chooseButtons?.[0].click();
    harness.fixture.detectChanges();
    expect(chooseButtons?.[0].getAttribute('aria-pressed')).toBe('true');
    expect(chooseButtons?.[1].getAttribute('aria-pressed')).toBe('false');
    expect(page?.querySelector('.plan-battle__selection')?.textContent)
      .toContain('Has elegido Jardín del Río');

    page?.querySelector<HTMLButtonElement>('.plan-battle > .button--secondary')?.click();
    harness.fixture.detectChanges();
    expect(page?.querySelector('.plan-battle')).toBeNull();
    expect(page?.querySelector('#place-result-demo-river-garden')?.getAttribute('aria-pressed'))
      .toBe('true');
  });

  it('does not open a comparison when only one compatible alternative is available', async () => {
    const harness = await loadDiscoverPage([SAMPLE_PLACES[1]]);
    generateProposal(harness);

    const compareButton = harness.routeNativeElement
      ?.querySelector<HTMLButtonElement>('.plan-battle__entry button');
    expect(compareButton?.disabled).toBe(true);
    expect(harness.routeNativeElement?.querySelector('.plan-battle__entry [role="status"]')?.textContent)
      .toContain('Solo hay 1 alternativa compatible');
    expect(harness.routeNativeElement?.querySelector('.plan-battle')).toBeNull();
  });

  it('reports an affinity tie without selecting a winner', async () => {
    const tiePlaces = [
      { ...SAMPLE_PLACES[1], id: 'tie-a', name: 'Opción A' },
      { ...SAMPLE_PLACES[1], id: 'tie-b', name: 'Opción B' },
    ];
    const harness = await loadDiscoverPage(tiePlaces);
    generateProposal(harness);
    harness.routeNativeElement
      ?.querySelector<HTMLButtonElement>('.plan-battle__entry button')?.click();
    harness.fixture.detectChanges();

    expect(harness.routeNativeElement?.querySelector('.plan-battle__affinity')?.textContent)
      .toContain('misma afinidad orientativa');
    expect(harness.routeNativeElement?.querySelector('.plan-battle__affinity')?.textContent)
      .toContain('no establece una ganadora');
    expect(harness.routeNativeElement?.querySelectorAll('[aria-pressed="true"]')).toHaveLength(0);
  });

  it('invalidates the selection and comparison when the user changes preferences', async () => {
    const harness = await loadDiscoverPage();
    const page = harness.routeNativeElement;
    page?.querySelector<HTMLInputElement>('input[name="activityType"][value="culture"]')?.click();
    harness.fixture.detectChanges();
    generateProposal(harness);
    page?.querySelector<HTMLButtonElement>('.plan-battle__entry button')?.click();
    harness.fixture.detectChanges();
    page?.querySelector<HTMLButtonElement>('.plan-battle__choose')?.click();
    harness.fixture.detectChanges();
    page?.querySelector<HTMLButtonElement>('.proposal-actions .button--secondary')?.click();
    harness.fixture.detectChanges();

    expect(page?.querySelector('.plan-battle')).toBeNull();
    page?.querySelector<HTMLInputElement>('input[name="budget"][value="medium"]')?.click();
    harness.fixture.detectChanges();
    generateProposal(harness);

    expect(page?.querySelector('.plan-battle')).toBeNull();
    expect(page?.querySelector('.recommendation__select[aria-pressed="true"]')).toBeNull();
  });

  it('announces a catalog load failure instead of showing an empty success state', async () => {
    const consoleError = jest.spyOn(console, 'error').mockImplementation(() => undefined);
    await TestBed.configureTestingModule({
      providers: [
        provideRouter(routes),
        {
          provide: PlaceCatalog,
          useValue: { getAll: () => Promise.reject(new Error('fixture read failed')) },
        },
      ],
    });

    const harness = await RouterTestingHarness.create();
    await harness.navigateByUrl('/', DiscoverPageComponent);
    await harness.fixture.whenStable();
    harness.fixture.detectChanges();

    expect(harness.routeNativeElement?.querySelector('[role="alert"]')?.textContent).toContain(
      'No se pudieron cargar los lugares',
    );
    expect(harness.routeNativeElement?.querySelectorAll('app-place-card')).toHaveLength(0);
    expect(harness.routeNativeElement
      ?.querySelector<HTMLButtonElement>('.preferences-panel__action')?.disabled).toBe(true);
    expect(consoleError).toHaveBeenCalledWith(
      'Unable to load places for Discover.',
      expect.any(Error),
    );
  });

  it('retries a failed catalog request and renders loaded places', async () => {
    jest.spyOn(console, 'error').mockImplementation(() => undefined);
    const getAll = jest.fn()
      .mockRejectedValueOnce(new Error('temporary failure'))
      .mockResolvedValueOnce(SAMPLE_PLACES);
    await TestBed.configureTestingModule({
      providers: [
        provideRouter(routes),
        { provide: PlaceCatalog, useValue: { getAll } },
      ],
    });

    const harness = await RouterTestingHarness.create();
    await harness.navigateByUrl('/', DiscoverPageComponent);
    await harness.fixture.whenStable();
    harness.fixture.detectChanges();

    expect(harness.routeNativeElement?.querySelector('[role="alert"]')).not.toBeNull();

    harness.routeNativeElement?.querySelector<HTMLButtonElement>('.error-state button')?.click();
    harness.fixture.detectChanges();
    await harness.fixture.whenStable();
    harness.fixture.detectChanges();

    expect(getAll).toHaveBeenCalledTimes(2);
    expect(harness.routeNativeElement?.querySelector('[role="alert"]')).toBeNull();
    expect(harness.routeNativeElement?.querySelectorAll('app-place-card')).toHaveLength(0);

    generateProposal(harness);

    expect(harness.routeNativeElement?.querySelectorAll('app-place-card')).toHaveLength(1);
  });

  it('shows no compatible results separately from an empty catalog', async () => {
    await TestBed.configureTestingModule({
      providers: [
        provideRouter(routes),
        { provide: PlaceCatalog, useValue: { getAll: () => Promise.resolve([SAMPLE_PLACES[0]]) } },
      ],
    });
    const harness = await RouterTestingHarness.create();
    await harness.navigateByUrl('/', DiscoverPageComponent);
    await harness.fixture.whenStable();
    harness.fixture.detectChanges();

    generateProposal(harness);

    expect(harness.routeNativeElement?.querySelector('.empty-message')?.textContent)
      .toContain('No hay lugares compatibles');
    expect(harness.routeNativeElement?.querySelector('[role="alert"]')).toBeNull();
    expect(harness.routeNativeElement?.querySelectorAll('app-place-card')).toHaveLength(0);
  });

  it('shows an empty catalog as a valid generated result state', async () => {
    await TestBed.configureTestingModule({
      providers: [
        provideRouter(routes),
        { provide: PlaceCatalog, useValue: { getAll: () => Promise.resolve([]) } },
      ],
    });
    const harness = await RouterTestingHarness.create();
    await harness.navigateByUrl('/', DiscoverPageComponent);
    await harness.fixture.whenStable();
    harness.fixture.detectChanges();

    generateProposal(harness);

    expect(harness.routeNativeElement?.querySelector('.empty-message')?.textContent)
      .toContain('Todavía no hay lugares disponibles');
    expect(harness.routeNativeElement?.querySelector('[role="alert"]')).toBeNull();
    expect(harness.routeNativeElement?.querySelector('[role="status"]')?.textContent)
      .toContain('Propuesta generada localmente');
  });
});
