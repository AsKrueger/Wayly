import { Injectable, NgZone } from '@angular/core';
import * as L from 'leaflet';
import {
  PlaceMapAdapter,
  PlaceMapMarker,
} from '../../../core/application/ports/place-map-adapter';

const TILE_URL = 'https://tile.openstreetmap.org/{z}/{x}/{y}.png';
const TILE_ATTRIBUTION =
  '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors';

@Injectable()
export class LeafletPlaceMapAdapter extends PlaceMapAdapter {
  private map: L.Map | null = null;
  private readonly markers = new Map<string, L.Marker>();
  private onSelect: ((placeId: string) => void) | null = null;
  private onError: ((error: unknown) => void) | null = null;
  private selectedPlaceId: string | null = null;
  private hasReportedTileError = false;

  constructor(private readonly zone: NgZone) {
    super();
  }

  initialize(
    container: HTMLElement,
    markers: readonly PlaceMapMarker[],
    selectedPlaceId: string | null,
    onSelect: (placeId: string) => void,
    onError: (error: unknown) => void,
  ): void {
    this.destroy();
    this.onSelect = onSelect;
    this.onError = onError;
    this.selectedPlaceId = selectedPlaceId;
    this.hasReportedTileError = false;
    this.map = L.map(container, { keyboard: true, scrollWheelZoom: false });

    const tileLayer = L.tileLayer(TILE_URL, {
      attribution: TILE_ATTRIBUTION,
      maxZoom: 19,
    });
    tileLayer.on('tileerror', () => this.reportTileError());
    tileLayer.addTo(this.map);

    this.updateMarkers(markers);
    this.selectPlace(selectedPlaceId);
  }

  updateMarkers(markers: readonly PlaceMapMarker[]): void {
    if (!this.map) {
      return;
    }

    const markerIds = new Set(markers.map((marker) => marker.id));

    for (const [id, marker] of this.markers) {
      if (!markerIds.has(id)) {
        marker.remove();
        this.markers.delete(id);
      }
    }

    for (const place of markers) {
      const marker = this.markers.get(place.id);

      if (marker) {
        marker.setLatLng([place.latitude, place.longitude]);
        marker.options.title = place.label;
        marker.options.alt = place.label;
        marker.setPopupContent(this.popupContent(place.label));
        marker.setIcon(this.createIcon(place.id === this.selectedPlaceId));
        continue;
      }

      const placeMarker = L.marker([place.latitude, place.longitude], {
        alt: place.label,
        icon: this.createIcon(place.id === this.selectedPlaceId),
        keyboard: true,
        title: place.label,
      })
        .bindPopup(this.popupContent(place.label))
        .on('click', () => {
          this.zone.run(() => this.onSelect?.(place.id));
        })
        .addTo(this.map);

      this.markers.set(place.id, placeMarker);
    }

    this.fitMapToMarkers(markers);
  }

  selectPlace(placeId: string | null): void {
    this.selectedPlaceId = placeId;

    for (const [id, marker] of this.markers) {
      marker.setIcon(this.createIcon(id === placeId));

      if (id === placeId) {
        marker.openPopup();
      } else {
        marker.closePopup();
      }
    }
  }

  destroy(): void {
    this.markers.clear();
    this.map?.remove();
    this.map = null;
    this.onSelect = null;
    this.onError = null;
  }

  private createIcon(selected: boolean): L.DivIcon {
    return L.divIcon({
      className: selected
        ? 'wayly-map-marker wayly-map-marker--selected'
        : 'wayly-map-marker',
      html: '<span aria-hidden="true">●</span>',
      iconAnchor: [15, 15],
      iconSize: [30, 30],
    });
  }

  private popupContent(label: string): HTMLElement {
    const content = document.createElement('span');
    content.textContent = label;
    return content;
  }

  private fitMapToMarkers(markers: readonly PlaceMapMarker[]): void {
    if (!this.map || markers.length === 0) {
      return;
    }

    if (markers.length === 1) {
      const marker = markers[0];
      this.map.setView([marker.latitude, marker.longitude], 13);
      return;
    }

    const bounds = L.latLngBounds(
      markers.map((marker) => [marker.latitude, marker.longitude]),
    );
    this.map.fitBounds(bounds, { maxZoom: 14, padding: [24, 24] });
  }

  private reportTileError(): void {
    if (this.hasReportedTileError) {
      return;
    }

    this.hasReportedTileError = true;
    this.zone.run(() => {
      this.onError?.(new Error('OpenStreetMap tiles could not be loaded.'));
    });
  }
}
