import { NgZone } from '@angular/core';
import { PlaceMapMarker } from '../../../core/application/ports/place-map-adapter';

interface FakeMarker {
  readonly options: { alt?: string; title?: string };
  readonly handlers: Map<string, () => void>;
  addTo: jest.Mock;
  bindPopup: jest.Mock;
  closePopup: jest.Mock;
  on: jest.Mock;
  openPopup: jest.Mock;
  remove: jest.Mock;
  setIcon: jest.Mock;
  setLatLng: jest.Mock;
  setPopupContent: jest.Mock;
}

const mockMarkerInstances: FakeMarker[] = [];
const mockTileHandlers = new Map<string, () => void>();
const mockMap = {
  fitBounds: jest.fn(),
  remove: jest.fn(),
  setView: jest.fn(),
};
const mockTileLayer = {
  addTo: jest.fn(),
  on: jest.fn((event: string, callback: () => void) => {
    mockTileHandlers.set(event, callback);
    return mockTileLayer;
  }),
};
const mockLeaflet = {
  divIcon: jest.fn((options: unknown) => options),
  latLngBounds: jest.fn((coordinates: unknown) => ({ coordinates })),
  map: jest.fn(() => mockMap),
  marker: jest.fn((_coordinates: [number, number], options: FakeMarker['options']) => {
    const marker: FakeMarker = {
      options,
      handlers: new Map(),
      addTo: jest.fn(),
      bindPopup: jest.fn(),
      closePopup: jest.fn(),
      on: jest.fn((event: string, callback: () => void) => {
        marker.handlers.set(event, callback);
        return marker;
      }),
      openPopup: jest.fn(),
      remove: jest.fn(),
      setIcon: jest.fn(),
      setLatLng: jest.fn(),
      setPopupContent: jest.fn(),
    };

    marker.addTo.mockReturnValue(marker);
    marker.bindPopup.mockReturnValue(marker);
    marker.handlers.set('click', jest.fn());
    mockMarkerInstances.push(marker);
    return marker;
  }),
  tileLayer: jest.fn(() => mockTileLayer),
};

jest.mock('leaflet', () => ({
  divIcon: (...args: unknown[]) => mockLeaflet.divIcon(...args),
  latLngBounds: (...args: unknown[]) => mockLeaflet.latLngBounds(...args),
  map: (...args: unknown[]) => mockLeaflet.map(...args),
  marker: (...args: unknown[]) => mockLeaflet.marker(...args),
  tileLayer: (...args: unknown[]) => mockLeaflet.tileLayer(...args),
}));

import { LeafletPlaceMapAdapter } from './leaflet-place-map.adapter';

const MARKERS: readonly PlaceMapMarker[] = [
  { id: 'one', label: 'Place One', latitude: 40, longitude: -3 },
  { id: 'two', label: 'Place Two', latitude: 41, longitude: -4 },
];

describe('LeafletPlaceMapAdapter', () => {
  let adapter: LeafletPlaceMapAdapter;

  beforeEach(() => {
    jest.clearAllMocks();
    mockMarkerInstances.length = 0;
    mockTileHandlers.clear();
    adapter = new LeafletPlaceMapAdapter(new NgZone({ enableLongStackTrace: false }));
  });

  afterEach(() => adapter.destroy());

  it('creates accessible markers, fits their bounds, and synchronizes selection', () => {
    const onSelect = jest.fn();
    const onError = jest.fn();

    adapter.initialize(document.createElement('div'), MARKERS, 'one', onSelect, onError);

    expect(mockLeaflet.map).toHaveBeenCalledWith(expect.any(HTMLElement), {
      keyboard: true,
      scrollWheelZoom: false,
    });
    expect(mockLeaflet.tileLayer).toHaveBeenCalledWith(
      'https://tile.openstreetmap.org/{z}/{x}/{y}.png',
      expect.objectContaining({
        attribution: expect.stringContaining('OpenStreetMap'),
        maxZoom: 19,
      }),
    );
    expect(mockLeaflet.latLngBounds).toHaveBeenCalledWith([
      [40, -3],
      [41, -4],
    ]);
    expect(mockMap.fitBounds).toHaveBeenCalled();
    expect(mockMarkerInstances).toHaveLength(2);
    expect(mockLeaflet.marker).toHaveBeenNthCalledWith(
      1,
      [40, -3],
      expect.objectContaining({ keyboard: true, title: 'Place One', alt: 'Place One' }),
    );
    expect(mockMarkerInstances[0].openPopup).toHaveBeenCalled();
    expect(mockMarkerInstances[1].closePopup).toHaveBeenCalled();
    expect(mockMarkerInstances[0].bindPopup.mock.calls[0][0].textContent)
      .toBe('Place One');

    mockMarkerInstances[1].handlers.get('click')?.();
    expect(onSelect).toHaveBeenCalledWith('two');
  });

  it('updates existing markers, removes stale markers, and adds newly visible places', () => {
    adapter.initialize(document.createElement('div'), MARKERS, null, jest.fn(), jest.fn());
    const first = mockMarkerInstances[0];
    const stale = mockMarkerInstances[1];
    const updated: PlaceMapMarker = {
      id: 'one',
      label: 'Renamed place',
      latitude: 42,
      longitude: -5,
    };
    const added: PlaceMapMarker = {
      id: 'three',
      label: 'Place Three',
      latitude: 43,
      longitude: -6,
    };

    adapter.updateMarkers([updated, added]);

    expect(first.setLatLng).toHaveBeenCalledWith([42, -5]);
    expect(first.options).toMatchObject({ title: 'Renamed place', alt: 'Renamed place' });
    expect(first.setPopupContent).toHaveBeenCalledWith(expect.any(HTMLElement));
    expect(stale.remove).toHaveBeenCalled();
    expect(mockMarkerInstances).toHaveLength(3);
    expect(mockMarkerInstances[2].addTo).toHaveBeenCalledWith(mockMap);
    expect(mockMap.fitBounds).toHaveBeenCalledTimes(2);

    adapter.updateMarkers([]);
    expect(mockMarkerInstances[0].remove).toHaveBeenCalled();
    expect(mockMarkerInstances[2].remove).toHaveBeenCalled();
    expect(mockMap.fitBounds).toHaveBeenCalledTimes(2);
  });

  it('centers a single marker directly and supports clearing selection', () => {
    adapter.initialize(document.createElement('div'), [MARKERS[0]], null, jest.fn(), jest.fn());

    expect(mockMap.setView).toHaveBeenCalledWith([40, -3], 13);

    adapter.selectPlace('one');
    expect(mockMarkerInstances[0].openPopup).toHaveBeenCalled();

    adapter.selectPlace(null);
    expect(mockMarkerInstances[0].closePopup).toHaveBeenCalled();
  });

  it('reports tile errors once and safely ignores marker updates after destroy', () => {
    const onError = jest.fn();
    adapter.initialize(document.createElement('div'), MARKERS, null, jest.fn(), onError);
    mockTileHandlers.get('tileerror')?.();
    mockTileHandlers.get('tileerror')?.();

    expect(onError).toHaveBeenCalledTimes(1);
    expect(onError).toHaveBeenCalledWith(
      expect.objectContaining({ message: 'OpenStreetMap tiles could not be loaded.' }),
    );

    const removeMap = mockMap.remove;
    adapter.destroy();

    const tileError = mockTileHandlers.get('tileerror');
    tileError?.();
    tileError?.();
    adapter.updateMarkers(MARKERS);

    expect(removeMap).toHaveBeenCalledTimes(1);
    expect(onError).toHaveBeenCalledTimes(1);
    expect(mockMarkerInstances[0].remove).not.toHaveBeenCalled();
  });
});
