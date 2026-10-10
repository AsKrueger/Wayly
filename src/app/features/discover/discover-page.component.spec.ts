import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { RouterTestingHarness } from '@angular/router/testing';
import { PlaceCatalog } from '../../core/application/ports/place-catalog';
import { SamplePlaceCatalog } from './data/sample-place-catalog.service';
import { DiscoverPageComponent } from './discover-page.component';
import { SAMPLE_PLACES } from './data/sample-places';
import { routes } from '../../app.routes';

describe('DiscoverPageComponent', () => {
  afterEach(() => {
    jest.restoreAllMocks();
  });

  async function loadDiscoverPage(): Promise<RouterTestingHarness> {
    await TestBed.configureTestingModule({
      providers: [
        provideRouter(routes),
        { provide: PlaceCatalog, useClass: SamplePlaceCatalog },
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
