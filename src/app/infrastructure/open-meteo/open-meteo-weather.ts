import { inject, Injectable } from '@angular/core';
import { DataServiceError } from '../../core/application/ports/place-search';
import { WeatherProvider } from '../../core/application/ports/weather-provider';
import { PlaceCoordinates } from '../../core/domain/models/place';
import { conditionFromWmoCode, WeatherSnapshot } from '../../core/domain/models/weather';
import { FETCH, fetchJson } from '../http/fetch-json';

const BASE_URL = 'https://api.open-meteo.com/v1/forecast';
const TIMEOUT_MS = 8000;
const CACHE_MS = 30 * 60 * 1000;

interface OpenMeteoResponse {
  readonly current?: {
    readonly time?: string;
    readonly temperature_2m?: number;
    readonly weather_code?: number;
    readonly is_day?: number;
  };
  readonly hourly?: {
    readonly time?: readonly string[];
    readonly precipitation_probability?: readonly (number | null)[];
  };
}

export function snapshotFromOpenMeteo(response: OpenMeteoResponse): WeatherSnapshot {
  const current = response.current;
  if (
    !current ||
    typeof current.temperature_2m !== 'number' ||
    typeof current.weather_code !== 'number'
  ) {
    throw new DataServiceError('invalid-response', 'Open-Meteo response without current weather.');
  }

  const times = response.hourly?.time ?? [];
  const chances = response.hourly?.precipitation_probability ?? [];
  const currentHour = current.time ? `${current.time.slice(0, 13)}:00` : '';
  const start = Math.max(0, times.indexOf(currentHour));
  const nextHours = chances.slice(start, start + 3).filter((value): value is number => typeof value === 'number');

  return {
    temperatureCelsius: Math.round(current.temperature_2m),
    condition: conditionFromWmoCode(current.weather_code),
    isDay: current.is_day !== 0,
    rainChanceNextHours: nextHours.length > 0 ? Math.max(...nextHours) : 0,
  };
}

@Injectable()
export class OpenMeteoWeather extends WeatherProvider {
  private readonly fetchFn = inject(FETCH);
  private readonly cache = new Map<string, { readonly at: number; readonly value: WeatherSnapshot }>();

  async current(coordinates: PlaceCoordinates, signal?: AbortSignal): Promise<WeatherSnapshot> {
    const key = `${coordinates.latitude.toFixed(2)},${coordinates.longitude.toFixed(2)}`;
    const cached = this.cache.get(key);
    if (cached && Date.now() - cached.at < CACHE_MS) {
      return cached.value;
    }

    const params = new URLSearchParams({
      latitude: coordinates.latitude.toFixed(4),
      longitude: coordinates.longitude.toFixed(4),
      current: 'temperature_2m,weather_code,is_day',
      hourly: 'precipitation_probability',
      forecast_days: '2',
      timezone: 'auto',
    });
    const response = await fetchJson<OpenMeteoResponse>(this.fetchFn, `${BASE_URL}?${params}`, {
      timeoutMs: TIMEOUT_MS,
      signal,
    });
    const value = snapshotFromOpenMeteo(response);
    this.cache.set(key, { at: Date.now(), value });
    return value;
  }
}
