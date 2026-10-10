import { Place } from '../../../core/domain/models/place';
import { PlaceMapMarker } from '../../../core/application/ports/place-map-adapter';

export function toPlaceMapMarkers(places: readonly Place[]): readonly PlaceMapMarker[] {
  return places.flatMap((place) => {
    const coordinates = place.coordinates;

    if (
      !coordinates
      || !Number.isFinite(coordinates.latitude)
      || !Number.isFinite(coordinates.longitude)
      || coordinates.latitude < -90
      || coordinates.latitude > 90
      || coordinates.longitude < -180
      || coordinates.longitude > 180
    ) {
      return [];
    }

    return [{
      id: place.id,
      label: place.name,
      latitude: coordinates.latitude,
      longitude: coordinates.longitude,
    }];
  });
}
