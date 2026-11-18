export type WeatherCondition = 'clear' | 'cloudy' | 'fog' | 'rain' | 'snow' | 'storm';

export interface WeatherSnapshot {
  readonly temperatureCelsius: number;
  readonly condition: WeatherCondition;
  readonly isDay: boolean;
  /** Highest chance of rain over the next three hours, 0 to 100. */
  readonly rainChanceNextHours: number;
}

/** Bad weather for outdoor plans: raining, snowing, stormy or rain very likely. */
export function isBadWeatherForOutdoors(weather: WeatherSnapshot | null): boolean {
  if (!weather) {
    return false;
  }
  return (
    weather.condition === 'rain' ||
    weather.condition === 'snow' ||
    weather.condition === 'storm' ||
    weather.rainChanceNextHours >= 60
  );
}

/** WMO weather interpretation codes, as used by Open-Meteo. */
export function conditionFromWmoCode(code: number): WeatherCondition {
  if (code === 0 || code === 1) {
    return 'clear';
  }
  if (code === 2 || code === 3) {
    return 'cloudy';
  }
  if (code === 45 || code === 48) {
    return 'fog';
  }
  if ((code >= 71 && code <= 77) || code === 85 || code === 86) {
    return 'snow';
  }
  if (code >= 95) {
    return 'storm';
  }
  if ((code >= 51 && code <= 67) || (code >= 80 && code <= 82)) {
    return 'rain';
  }
  return 'cloudy';
}
