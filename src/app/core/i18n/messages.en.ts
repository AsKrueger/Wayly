import type { Messages } from './i18n.types';

export const EN: Messages = {
  app: {
    name: 'Wayly',
    tagline: 'Your time. Your place. Your plan.',
    skipToContent: 'Skip to content',
    homeLink: 'Wayly, go to home',
  },
  nav: {
    primary: 'Main navigation',
    home: 'Home',
    about: 'How it works',
    language: 'Language',
    languageName: { es: 'Español', en: 'English' },
    theme: {
      button: 'Theme: {mode}. Change',
      auto: 'automatic',
      light: 'light',
      dark: 'dark',
    },
  },
  titles: {
    home: 'Find something to do today',
    about: 'How it works',
  },
  footer: {
    promise: 'Free, no sign-up, no tracking.',
    dataTitle: 'Open data',
    osm: '© OpenStreetMap contributors (ODbL)',
    wikipedia: 'Wikipedia (CC BY-SA)',
    weather: 'Weather by Open-Meteo (CC BY 4.0)',
    source: 'Source code on GitHub',
  },
  about: {
    eyebrow: 'How it works',
    title: 'A plan that fits you, explained step by step',
    intro:
      'Wayly turns your time, your budget and your mood into concrete plans near you. No accounts, no payments, no small print.',
    stepsTitle: 'From idea to plan in three steps',
    steps: {
      where: {
        title: 'Tell us where',
        body: 'Type a city, a neighbourhood or an address, or use your location if you like. It works anywhere in the world with OpenStreetMap data.',
      },
      what: {
        title: 'Tell us what you feel like',
        body: 'Pick categories, how much time you have and how much you want to spend. Or tap “Surprise me”.',
      },
      plan: {
        title: 'Choose your plan',
        body: 'We suggest three plans with times, walking routes and estimated cost. Every stop explains why it is there.',
      },
    },
    dataTitle: 'Where the data comes from',
    dataBody:
      'Places come from OpenStreetMap, the free map maintained by a worldwide community. Photos and summaries come from Wikipedia. Weather comes from Open-Meteo. This is open data: it can contain mistakes or be out of date, so check anything important before you go.',
    estimatesTitle: 'What is estimated',
    estimatesBody:
      'OpenStreetMap does not publish prices or how long a visit takes. Wayly estimates them from the type of place and always says so.',
    privacyTitle: 'Privacy',
    privacyItems: {
      account: 'There are no accounts: we do not know who you are.',
      location:
        'Your location is only requested if you tap “Use my location”, and it is only used to find nearby places. We do not store it on any server.',
      storage:
        'Your preferences, language and saved plans stay in your browser. You can delete them at any time from your browser settings.',
      tracking: 'We use no analytics and no tracking cookies.',
    },
    servicesTitle: 'Services your browser contacts',
    servicesBody:
      'To find places, your browser connects directly to Photon (place search), Overpass (OpenStreetMap places), Wikipedia, Open-Meteo and the OpenStreetMap map servers. Each has its own privacy policy.',
    cta: 'Create my plan',
  },
  units: {
    minutes: '{n} min',
    hours: '{n} h',
    hoursMinutes: '{h} h {m} min',
    meters: '{n} m',
    kilometers: '{n} km',
  },
};
