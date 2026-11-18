import { distanceMeters, isValidCoordinates, walkingMeters, walkingMinutes } from './geo';
import { conditionFromWmoCode, isBadWeatherForOutdoors } from './weather';

describe('geo', () => {
  const sevilleCathedral = { latitude: 37.3858, longitude: -5.9932 };
  const plazaEspana = { latitude: 37.3772, longitude: -5.9869 };

  it('measures great-circle distances', () => {
    expect(distanceMeters(sevilleCathedral, sevilleCathedral)).toBe(0);
    expect(distanceMeters(sevilleCathedral, plazaEspana)).toBeGreaterThan(1050);
    expect(distanceMeters(sevilleCathedral, plazaEspana)).toBeLessThan(1150);
  });

  it('adds street detours and estimates walking time', () => {
    const straight = distanceMeters(sevilleCathedral, plazaEspana);
    expect(walkingMeters(sevilleCathedral, plazaEspana)).toBeCloseTo(straight * 1.3, 5);
    expect(walkingMinutes(0)).toBe(0);
    expect(walkingMinutes(10)).toBe(1);
    expect(walkingMinutes(800)).toBe(10);
  });

  it('validates coordinates', () => {
    expect(isValidCoordinates(sevilleCathedral)).toBe(true);
    expect(isValidCoordinates({ latitude: 91, longitude: 0 })).toBe(false);
    expect(isValidCoordinates({ latitude: 0, longitude: Number.NaN })).toBe(false);
    expect(isValidCoordinates({ latitude: '1', longitude: 2 })).toBe(false);
    expect(isValidCoordinates(null)).toBe(false);
  });
});

describe('weather', () => {
  it('maps WMO codes to conditions', () => {
    expect(conditionFromWmoCode(0)).toBe('clear');
    expect(conditionFromWmoCode(3)).toBe('cloudy');
    expect(conditionFromWmoCode(45)).toBe('fog');
    expect(conditionFromWmoCode(61)).toBe('rain');
    expect(conditionFromWmoCode(81)).toBe('rain');
    expect(conditionFromWmoCode(73)).toBe('snow');
    expect(conditionFromWmoCode(86)).toBe('snow');
    expect(conditionFromWmoCode(95)).toBe('storm');
    expect(conditionFromWmoCode(42)).toBe('cloudy');
  });

  it('flags bad weather for outdoor plans', () => {
    const base = { temperatureCelsius: 20, condition: 'clear' as const, isDay: true, rainChanceNextHours: 10 };
    expect(isBadWeatherForOutdoors(null)).toBe(false);
    expect(isBadWeatherForOutdoors(base)).toBe(false);
    expect(isBadWeatherForOutdoors({ ...base, rainChanceNextHours: 70 })).toBe(true);
    expect(isBadWeatherForOutdoors({ ...base, condition: 'rain' })).toBe(true);
    expect(isBadWeatherForOutdoors({ ...base, condition: 'storm' })).toBe(true);
    expect(isBadWeatherForOutdoors({ ...base, condition: 'snow' })).toBe(true);
  });
});
