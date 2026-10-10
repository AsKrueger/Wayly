import { ComponentFixture, TestBed } from '@angular/core/testing';
import { PlaceMapAdapter, PlaceMapMarker } from '../../../core/application/ports/place-map-adapter';
import { Place } from '../../../core/domain/models/place';
import { PlaceMapComponent } from './place-map.component';

class FakePlaceMapAdapter extends PlaceMapAdapter {
  markers: readonly PlaceMapMarker[] = [];
  selectedPlaceId: string | null = null;
  onSelect: ((placeId: string) => void) | null = null;
  onError: ((error: unknown) => void) | null = null;
  initializeCalls = 0;
  updateCalls = 0;
  destroyCalls = 0;
  shouldThrowOnInitialize = false;

  initialize(
    _container: HTMLElement,
    markers: readonly PlaceMapMarker[],
    selectedPlaceId: string | null,
    onSelect: (placeId: string) => void,
    onError: (error: unknown) => void,
  ): void {
    this.initializeCalls += 1;
    if (this.shouldThrowOnInitialize) {
      throw new Error('map initialization failed');
    }
    this.markers = markers;
    this.selectedPlaceId = selectedPlaceId;
    this.onSelect = onSelect;
    this.onError = onError;
  }

  updateMarkers(markers: readonly PlaceMapMarker[]): void {
    this.updateCalls += 1;
    this.markers = markers;
  }

  selectPlace(placeId: string | null): void {
    this.selectedPlaceId = placeId;
  }

  destroy(): void {
    this.destroyCalls += 1;
  }
}

function place(id: string, coordinates?: Place['coordinates']): Place {
  return {
    id,
    name: `Place ${id}`,
    description: 'Test place',
    category: 'culture',
    source: 'test',
    dataStatus: 'fictional',
    ...(coordinates ? { coordinates } : {}),
  };
}

describe('PlaceMapComponent', () => {
  let adapter: FakePlaceMapAdapter;
  let fixture: ComponentFixture<PlaceMapComponent>;

  beforeEach(async () => {
    adapter = new FakePlaceMapAdapter();
    await TestBed.configureTestingModule({
      imports: [PlaceMapComponent],
    })
      .overrideComponent(PlaceMapComponent, {
        set: {
          providers: [{ provide: PlaceMapAdapter, useValue: adapter }],
        },
      })
      .compileComponents();
  });

  function createMapComponent(places: readonly Place[]): void {
    fixture = TestBed.createComponent(PlaceMapComponent);
    fixture.componentRef.setInput('places', places);
    fixture.detectChanges();
  }

  it('initializes markers only for places with valid coordinates', () => {
    createMapComponent([
      place('located', { latitude: 40.4, longitude: -3.7 }),
      place('unlocated'),
      place('invalid', { latitude: 91, longitude: 0 }),
    ]);

    expect(adapter.initializeCalls).toBe(1);
    expect(adapter.markers.map((marker) => marker.id)).toEqual(['located']);
    expect(fixture.nativeElement.querySelector('[aria-label="Mapa interactivo de lugares"]'))
      .not.toBeNull();
    expect(fixture.nativeElement.querySelector('.place-map__attribution')?.textContent)
      .toContain('OpenStreetMap contributors');
  });

  it('keeps the list fallback available without coordinates and does not initialize a map', () => {
    const places = [place('one'), place('two')];
    createMapComponent(places);

    expect(fixture.componentInstance.places).toHaveLength(2);
    expect(adapter.initializeCalls).toBe(0);
    expect(fixture.nativeElement.querySelector('[role="status"]')?.textContent)
      .toContain('no hay lugares de esta propuesta con coordenadas válidas');
    expect(fixture.nativeElement.querySelector('[aria-label="Mapa interactivo de lugares"]'))
      .toBeNull();
  });

  it('updates map markers when the visible places change', () => {
    createMapComponent([place('first', { latitude: 10, longitude: 20 })]);

    fixture.componentRef.setInput('places', [
      place('second', { latitude: 30, longitude: 40 }),
      place('unlocated'),
    ]);
    fixture.detectChanges();

    expect(adapter.updateCalls).toBe(1);
    expect(adapter.markers.map((marker) => marker.id)).toEqual(['second']);
  });

  it('initializes the map when located places arrive after an empty result', () => {
    createMapComponent([]);

    fixture.componentRef.setInput('places', [
      place('arrived', { latitude: 30, longitude: 40 }),
    ]);
    fixture.detectChanges();

    expect(adapter.initializeCalls).toBe(1);
    expect(adapter.markers.map((marker) => marker.id)).toEqual(['arrived']);
  });

  it('synchronizes selected place state and reports a selected place without coordinates', () => {
    createMapComponent([
      place('located', { latitude: 10, longitude: 20 }),
      place('unlocated'),
    ]);
    const selection = jest.fn();
    fixture.componentInstance.placeSelected.subscribe(selection);
    adapter.onSelect?.('located');
    fixture.detectChanges();

    expect(selection).toHaveBeenCalledWith('located');

    fixture.componentRef.setInput('selectedPlaceId', 'unlocated');
    fixture.detectChanges();

    expect(adapter.selectedPlaceId).toBe('unlocated');
    expect(fixture.nativeElement.querySelector('[role="status"]')?.textContent)
      .toContain('Place unlocated no tiene coordenadas válidas');
  });

  it('keeps the map fallback visible and supports retry after map initialization errors', () => {
    const consoleError = jest.spyOn(console, 'error').mockImplementation(() => undefined);
    adapter.shouldThrowOnInitialize = true;
    createMapComponent([place('located', { latitude: 10, longitude: 20 })]);

    expect(fixture.nativeElement.querySelector('[role="alert"]')?.textContent)
      .toContain('El mapa no está disponible ahora');
    expect(fixture.nativeElement.querySelector('[aria-label="Mapa interactivo de lugares"]'))
      .not.toBeNull();
    expect(consoleError).toHaveBeenCalledWith(
      'Unable to initialize the interactive place map.',
      expect.any(Error),
    );

    adapter.shouldThrowOnInitialize = false;
    fixture.nativeElement.querySelector<HTMLButtonElement>('button')?.click();
    fixture.detectChanges();

    expect(adapter.initializeCalls).toBe(2);
    expect(fixture.nativeElement.querySelector('[role="alert"]')).toBeNull();
  });

  it('reports tile/map errors without removing the map-independent user journey', () => {
    const consoleError = jest.spyOn(console, 'error').mockImplementation(() => undefined);
    createMapComponent([place('located', { latitude: 10, longitude: 20 })]);
    adapter.onError?.(new Error('tile unavailable'));
    fixture.detectChanges();

    expect(fixture.nativeElement.querySelector('[role="alert"]')?.textContent)
      .toContain('Puedes consultar y seleccionar todos los lugares en la lista');
    expect(consoleError).toHaveBeenCalledWith(
      'Unable to load the interactive place map.',
      expect.any(Error),
    );
  });
});
