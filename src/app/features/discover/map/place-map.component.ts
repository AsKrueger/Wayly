import {
  AfterViewInit,
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  EventEmitter,
  inject,
  Input,
  OnChanges,
  OnDestroy,
  Output,
  SimpleChanges,
  ViewChild,
  signal,
} from '@angular/core';
import { PlaceMapAdapter } from '../../../core/application/ports/place-map-adapter';
import { Place } from '../../../core/domain/models/place';
import { PlaceMapMarker } from '../../../core/application/ports/place-map-adapter';
import { LeafletPlaceMapAdapter } from './leaflet-place-map.adapter';
import { toPlaceMapMarkers } from './map-markers';

@Component({
  selector: 'app-place-map',
  standalone: true,
  providers: [
    LeafletPlaceMapAdapter,
    { provide: PlaceMapAdapter, useExisting: LeafletPlaceMapAdapter },
  ],
  template: `
    <section class="place-map" aria-label="Mapa de lugares">
      <h3>Mapa de lugares con ubicación disponible</h3>
      @if (markers().length === 0) {
        <p role="status">
          @if (selectedPlaceWithoutCoordinates()) {
            {{ selectedPlaceWithoutCoordinates() }} no tiene coordenadas válidas y no se puede señalar en el mapa.
          } @else {
            Todavía no hay lugares de esta propuesta con coordenadas válidas.
          }
          La lista completa sigue disponible abajo.
        </p>
      } @else {
        <div class="place-map__frame">
          <div
            #mapHost
            class="place-map__canvas"
            role="region"
            aria-label="Mapa interactivo de lugares"
          ></div>
          @if (mapError()) {
            <div class="place-map__error" role="alert">
              <p>El mapa no está disponible ahora. Puedes consultar y seleccionar todos los lugares en la lista.</p>
              <button class="button button--secondary" type="button" (click)="retryMap()">
                Reintentar mapa
              </button>
            </div>
          } @else if (selectedPlaceWithoutCoordinates()) {
            <p role="status">
              {{ selectedPlaceWithoutCoordinates() }} no tiene coordenadas válidas y no se puede señalar en el mapa.
            </p>
          }
        </div>
        <p class="place-map__attribution">
          Mapa © <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener noreferrer">
            OpenStreetMap contributors
          </a> (ODbL).
        </p>
      }
    </section>
  `,
  styles: `
    :host {
      display: block;
      min-width: 0;
    }

    .place-map {
      margin-bottom: var(--space-5);
    }

    h3 {
      margin: 0 0 var(--space-3);
      font-size: var(--font-size-md);
    }

    .place-map__canvas {
      width: 100%;
      height: clamp(16rem, 42vw, 28rem);
      border: 1px solid var(--color-border);
      border-radius: var(--radius-md);
      background: var(--color-surface-muted);
    }

    .place-map__attribution,
    .place-map > p {
      margin: var(--space-2) 0 0;
      color: var(--color-text-muted);
      font-size: var(--font-size-xs);
    }

    .place-map__attribution a {
      color: var(--color-brand);
    }

    .place-map__error {
      border: 1px dashed var(--color-border);
      border-radius: var(--radius-md);
      padding: var(--space-4);
    }

    .place-map__error p {
      margin: 0 0 var(--space-3);
      color: var(--color-text-muted);
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PlaceMapComponent implements AfterViewInit, OnChanges, OnDestroy {
  @Input({ required: true }) places: readonly Place[] = [];
  @Input() selectedPlaceId: string | null = null;
  @Output() readonly placeSelected = new EventEmitter<string>();
  @ViewChild('mapHost')
  set mapHost(element: ElementRef<HTMLDivElement> | undefined) {
    this.mapHostElement = element;
    if (element && this.viewInitialized) {
      this.refreshMap();
    }
  }

  readonly markers = signal<readonly PlaceMapMarker[]>([]);
  readonly mapError = signal(false);

  private readonly mapAdapter = inject(PlaceMapAdapter);
  private viewInitialized = false;
  private mapHostElement?: ElementRef<HTMLDivElement>;

  ngAfterViewInit(): void {
    this.viewInitialized = true;
    this.refreshMap();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['places']) {
      this.markers.set(toPlaceMapMarkers(this.places));
      this.mapError.set(false);
    }

    if (this.viewInitialized) {
      this.refreshMap();
    }
  }

  ngOnDestroy(): void {
    this.mapAdapter.destroy();
  }

  selectedPlaceWithoutCoordinates(): string | null {
    if (!this.selectedPlaceId) {
      return null;
    }

    const selectedPlace = this.places.find((place) => place.id === this.selectedPlaceId);
    return selectedPlace && !this.markers().some((marker) => marker.id === selectedPlace.id)
      ? selectedPlace.name
      : null;
  }

  retryMap(): void {
    this.mapError.set(false);
    this.initializeMap();
  }

  private refreshMap(): void {
    if (this.markers().length === 0) {
      this.mapAdapter.destroy();
      this.hasInitializedMap = false;
      return;
    }

    if (this.mapError()) {
      return;
    }

    if (this.mapHostElement && !this.hasInitializedMap) {
      this.initializeMap();
      return;
    }

    this.mapAdapter.updateMarkers(this.markers());
    this.mapAdapter.selectPlace(this.selectedPlaceId);
  }

  private hasInitializedMap = false;

  private initializeMap(): void {
    const container = this.mapHostElement?.nativeElement;
    if (!container || this.markers().length === 0) {
      return;
    }

    try {
      this.mapAdapter.initialize(
        container,
        this.markers(),
        this.selectedPlaceId,
        (placeId) => this.placeSelected.emit(placeId),
        (error) => {
          console.error('Unable to load the interactive place map.', error);
          this.mapError.set(true);
          this.hasInitializedMap = false;
          this.mapAdapter.destroy();
        },
      );
      this.hasInitializedMap = true;
    } catch (error: unknown) {
      console.error('Unable to initialize the interactive place map.', error);
      this.mapError.set(true);
      this.hasInitializedMap = false;
      this.mapAdapter.destroy();
    }
  }
}
