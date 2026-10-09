import { Place } from '../../../core/domain/models/place';

export const SAMPLE_PLACES: readonly Place[] = [
  {
    id: 'city-museum',
    name: 'Museo de la Ciudad',
    category: 'culture',
    description: 'Un recorrido cercano por la historia y las historias del lugar.',
    location: 'Centro histórico',
  },
  {
    id: 'open-gallery',
    name: 'Galería Patio Abierto',
    category: 'culture',
    description: 'Exposiciones de artistas locales en un espacio tranquilo.',
    location: 'Barrio Antiguo',
  },
  {
    id: 'river-garden',
    name: 'Jardín del Río',
    category: 'nature',
    description: 'Un paseo entre árboles junto al agua, lejos del ruido.',
    location: 'Ribera',
  },
  {
    id: 'north-lookout',
    name: 'Mirador de los Olmos',
    category: 'nature',
    description: 'Un sendero corto que termina con vistas abiertas de la ciudad.',
  },
  {
    id: 'plaza-market',
    name: 'Mercado de la Plaza',
    category: 'food',
    description: 'Puestos locales para descubrir sabores y productos de temporada.',
    location: 'Plaza Mayor',
  },
  {
    id: 'corner-cafe',
    name: 'Café La Esquina',
    category: 'food',
    description: 'Un café de barrio para hacer una pausa y probar algo casero.',
    location: 'Barrio Antiguo',
  },
  {
    id: 'open-air-cinema',
    name: 'Cine al Aire Libre',
    category: 'leisure',
    description: 'Sesiones de cine para disfrutar bajo el cielo abierto.',
    location: 'Parque Central',
  },
  {
    id: 'station-games',
    name: 'Sala de Juegos La Estación',
    category: 'leisure',
    description: 'Juegos de mesa y actividades para compartir un rato diferente.',
    location: 'Distrito Estación',
  },
];
