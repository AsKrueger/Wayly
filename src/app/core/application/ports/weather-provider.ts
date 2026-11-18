import { PlaceCoordinates } from '../../domain/models/place';
import { WeatherSnapshot } from '../../domain/models/weather';

export abstract class WeatherProvider {
  abstract current(coordinates: PlaceCoordinates, signal?: AbortSignal): Promise<WeatherSnapshot>;
}
