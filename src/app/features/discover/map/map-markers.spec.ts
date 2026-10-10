import { Place } from '../../../core/domain/models/place';
import { toPlaceMapMarkers } from './map-markers';

function place(id: string, coordinates?: Place['coordinates']): Place {
  return {
    id,
    name: id,
    description: 'Test place',
    category: 'culture',
    source: 'test',
    dataStatus: 'fictional',
    ...(coordinates ? { coordinates } : {}),
  };
}

describe('toPlaceMapMarkers', () => {
  it('returns markers only for places with valid coordinates', () => {
    const markers = toPlaceMapMarkers([
      place('valid', { latitude: 40.4168, longitude: -3.7038 }),
      place('missing'),
      place('invalid-latitude', { latitude: 90.01, longitude: 0 }),
      place('invalid-longitude', { latitude: 0, longitude: -180.01 }),
      place('not-finite', { latitude: Number.NaN, longitude: 0 }),
    ]);

    expect(markers).toEqual([{
      id: 'valid',
      label: 'valid',
      latitude: 40.4168,
      longitude: -3.7038,
    }]);
  });

  it('accepts valid coordinate boundaries and does not filter places themselves', () => {
    const places = [
      place('south-west', { latitude: -90, longitude: -180 }),
      place('north-east', { latitude: 90, longitude: 180 }),
      place('no-position'),
    ];

    expect(toPlaceMapMarkers(places).map((marker) => marker.id))
      .toEqual(['south-west', 'north-east']);
    expect(places).toHaveLength(3);
  });

  it('accepts zero coordinates as valid values', () => {
    expect(toPlaceMapMarkers([place('origin', { latitude: 0, longitude: 0 })]))
      .toHaveLength(1);
  });
});
