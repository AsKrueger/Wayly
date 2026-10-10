import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { RouterTestingHarness } from '@angular/router/testing';
import { PlaceCatalog } from '../../core/application/ports/place-catalog';
import { SamplePlaceCatalog } from './data/sample-place-catalog.service';
import { DiscoverPageComponent } from './discover-page.component';
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

  it('renders Discover and the initial example places', async () => {
    const harness = await loadDiscoverPage();
    const page = harness.routeNativeElement;

    expect(page?.querySelector('h1')?.textContent).toContain('¿Qué te apetece hacer hoy?');
    expect(page?.querySelectorAll('app-place-card')).toHaveLength(2);
    expect(page?.textContent).toContain('Museo de la Ciudad');
    expect(page?.textContent).toContain('Galería Patio Abierto');
    expect(page?.textContent).toContain('no recomendaciones personalizadas');
    expect(page?.querySelectorAll('input[type="radio"]')).toHaveLength(10);
  });

  it('filters example places when the activity preference changes', async () => {
    const harness = await loadDiscoverPage();
    const page = harness.routeNativeElement;
    const natureOption = page?.querySelector<HTMLInputElement>(
      'input[name="activityType"][value="nature"]',
    );

    natureOption?.click();
    harness.fixture.detectChanges();

    expect(natureOption?.checked).toBe(true);
    expect(page?.querySelectorAll('app-place-card')).toHaveLength(2);
    expect(page?.textContent).toContain('Jardín del Río');
    expect(page?.textContent).toContain('Mirador de los Olmos');
    expect(page?.textContent).not.toContain('Museo de la Ciudad');
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
  });

  it('explains that personalized recommendations are not available yet', async () => {
    const harness = await loadDiscoverPage();
    const page = harness.routeNativeElement;
    const continueButton = page?.querySelector<HTMLButtonElement>(
      '.preferences-panel__action',
    );

    continueButton?.click();
    harness.fixture.detectChanges();

    expect(page?.querySelector('[role="status"]')?.textContent).toContain(
      'Las recomendaciones personalizadas aún no están disponibles',
    );
    expect(page?.querySelector('[role="status"]')?.textContent).toContain(
      'los lugares mostrados son solo ejemplos',
    );

    page?.querySelector<HTMLInputElement>(
      'input[name="activityType"][value="food"]',
    )?.click();
    harness.fixture.detectChanges();

    expect(page?.querySelector('[role="status"]')?.textContent?.trim()).toBe('');
    expect(page?.textContent).toContain('Mercado de la Plaza');
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
      'No se pudieron cargar los lugares de ejemplo',
    );
    expect(harness.routeNativeElement?.querySelectorAll('app-place-card')).toHaveLength(0);
    expect(consoleError).toHaveBeenCalledWith(
      'Unable to load places for Discover.',
      expect.any(Error),
    );

  });
});
