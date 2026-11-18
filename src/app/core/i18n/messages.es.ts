/**
 * Spanish messages. This dictionary is the source of truth: its shape defines
 * `Messages`, so the English dictionary must provide every key.
 *
 * Placeholders use `{name}`.
 */
export const ES = {
  app: {
    name: 'Wayly',
    tagline: 'Tu tiempo. Tu lugar. Tu plan.',
    skipToContent: 'Saltar al contenido',
    homeLink: 'Wayly, ir al inicio',
  },
  nav: {
    primary: 'Navegación principal',
    home: 'Inicio',
    about: 'Cómo funciona',
    language: 'Idioma',
    languageName: { es: 'Español', en: 'English' },
    theme: {
      button: 'Tema: {mode}. Cambiar',
      auto: 'automático',
      light: 'claro',
      dark: 'oscuro',
    },
  },
  titles: {
    home: 'Descubre qué hacer hoy',
    about: 'Cómo funciona',
  },
  footer: {
    promise: 'Gratis, sin registro y sin rastreo.',
    dataTitle: 'Datos abiertos',
    osm: '© Colaboradores de OpenStreetMap (ODbL)',
    wikipedia: 'Wikipedia (CC BY-SA)',
    weather: 'Tiempo por Open-Meteo (CC BY 4.0)',
    source: 'Código en GitHub',
  },
  about: {
    eyebrow: 'Cómo funciona',
    title: 'Un plan que encaja contigo, explicado paso a paso',
    intro:
      'Wayly convierte tu tiempo, tu presupuesto y lo que te apetece en planes concretos cerca de ti. Sin cuentas, sin pagos y sin letra pequeña.',
    stepsTitle: 'De la idea al plan en tres pasos',
    steps: {
      where: {
        title: 'Dinos dónde',
        body: 'Escribe una ciudad, un barrio o una dirección, o usa tu ubicación si quieres. Funciona en cualquier lugar del mundo con datos de OpenStreetMap.',
      },
      what: {
        title: 'Cuéntanos qué te apetece',
        body: 'Elige categorías, cuánto tiempo tienes y cuánto quieres gastar. O pulsa «Sorpréndeme».',
      },
      plan: {
        title: 'Elige tu plan',
        body: 'Te proponemos tres planes con horarios, trayectos a pie y coste estimado. Cada parada explica por qué está ahí.',
      },
    },
    dataTitle: 'De dónde salen los datos',
    dataBody:
      'Los lugares vienen de OpenStreetMap, el mapa libre que mantiene una comunidad mundial. Las fotos y resúmenes, de Wikipedia. El tiempo, de Open-Meteo. Son datos abiertos: pueden tener errores o estar desactualizados, así que comprueba lo importante antes de ir.',
    estimatesTitle: 'Qué es estimado',
    estimatesBody:
      'OpenStreetMap no publica precios ni cuánto dura una visita. Wayly los estima según el tipo de lugar y siempre lo indica.',
    privacyTitle: 'Privacidad',
    privacyItems: {
      account: 'No hay cuentas: no sabemos quién eres.',
      location:
        'Tu ubicación solo se pide si pulsas «Usar mi ubicación» y se usa para buscar lugares cercanos. No la guardamos en ningún servidor.',
      storage:
        'Tus preferencias, idioma y planes guardados se quedan en tu navegador. Puedes borrarlos cuando quieras desde los ajustes del navegador.',
      tracking: 'No usamos analítica ni cookies de seguimiento.',
    },
    servicesTitle: 'Servicios que consulta tu navegador',
    servicesBody:
      'Para buscar lugares, tu navegador se conecta directamente con Photon (búsqueda de sitios), Overpass (lugares de OpenStreetMap), Wikipedia, Open-Meteo y los servidores de mapas de OpenStreetMap. Cada uno tiene su propia política de privacidad.',
    cta: 'Crear mi plan',
  },
  units: {
    minutes: '{n} min',
    hours: '{n} h',
    hoursMinutes: '{h} h {m} min',
    meters: '{n} m',
    kilometers: '{n} km',
  },
};
