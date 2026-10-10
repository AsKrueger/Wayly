export interface PlaceMapMarker {
  readonly id: string;
  readonly label: string;
  readonly latitude: number;
  readonly longitude: number;
}

export abstract class PlaceMapAdapter {
  abstract initialize(
    container: HTMLElement,
    markers: readonly PlaceMapMarker[],
    selectedPlaceId: string | null,
    onSelect: (placeId: string) => void,
    onError: (error: unknown) => void,
  ): void;

  abstract updateMarkers(markers: readonly PlaceMapMarker[]): void;
  abstract selectPlace(placeId: string | null): void;
  abstract destroy(): void;
}
