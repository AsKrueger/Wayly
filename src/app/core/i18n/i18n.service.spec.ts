import { TestBed } from '@angular/core/testing';
import { I18nService, detectLanguage, interpolate } from './i18n.service';
import { Messages } from './i18n.types';
import { EN } from './messages.en';
import { ES } from './messages.es';

function keysOf(node: unknown, prefix = ''): string[] {
  return Object.entries(node as Record<string, unknown>).flatMap(([key, value]) =>
    typeof value === 'string' ? [`${prefix}${key}`] : keysOf(value, `${prefix}${key}.`),
  );
}

function placeholdersOf(text: string): string[] {
  return [...text.matchAll(/\{(\w+)\}/g)].map((match) => match[1]).sort();
}

function valueAt(dictionary: Messages, key: string): string {
  return key.split('.').reduce<unknown>((node, part) => (node as Record<string, unknown>)[part], dictionary) as string;
}

describe('dictionaries', () => {
  it('have exactly the same keys in Spanish and English', () => {
    expect(keysOf(EN).sort()).toEqual(keysOf(ES).sort());
  });

  it('use the same placeholders in both languages', () => {
    for (const key of keysOf(ES)) {
      expect({ key, placeholders: placeholdersOf(valueAt(EN, key)) }).toEqual({
        key,
        placeholders: placeholdersOf(valueAt(ES, key)),
      });
    }
  });

  it('have no empty messages', () => {
    for (const key of keysOf(EN)) {
      expect(valueAt(EN, key).trim()).not.toBe('');
      expect(valueAt(ES, key).trim()).not.toBe('');
    }
  });
});

describe('detectLanguage', () => {
  it('prefers a saved choice', () => {
    expect(detectLanguage('en', '?lang=es', ['es-ES'])).toBe('en');
  });

  it('uses ?lang= when nothing is saved', () => {
    expect(detectLanguage(null, '?lang=en', ['es-ES'])).toBe('en');
  });

  it('ignores unknown saved values and query languages', () => {
    expect(detectLanguage('fr', '?lang=de', ['es-MX'])).toBe('es');
  });

  it('chooses Spanish for Spanish browsers and English otherwise', () => {
    expect(detectLanguage(null, '', ['fr-FR', 'es-AR'])).toBe('es');
    expect(detectLanguage(null, '', ['en-US', 'es'])).toBe('en');
    expect(detectLanguage(null, '', ['de-DE'])).toBe('en');
    expect(detectLanguage(null, '', [])).toBe('en');
  });
});

describe('interpolate', () => {
  it('replaces known placeholders and keeps unknown ones', () => {
    expect(interpolate('{a} y {b}', { a: 1 })).toBe('1 y {b}');
    expect(interpolate('sin datos')).toBe('sin datos');
  });
});

describe('I18nService', () => {
  let service: I18nService;

  beforeEach(() => {
    localStorage.clear();
    TestBed.configureTestingModule({});
    service = TestBed.inject(I18nService);
    service.setLanguage('es');
  });

  it('translates and switches language', () => {
    expect(service.t('nav.home')).toBe('Inicio');
    service.setLanguage('en');
    expect(service.t('nav.home')).toBe('Home');
  });

  it('persists the language and updates the document', () => {
    service.setLanguage('en');
    TestBed.tick();
    expect(localStorage.getItem('wayly.language')).toBe('"en"');
    expect(document.documentElement.lang).toBe('en');
  });

  it('falls back to the key for unknown keys', () => {
    expect(service.t('missing.key' as never)).toBe('missing.key');
  });

  it('formats minutes, distances and clock times', () => {
    expect(service.formatMinutes(45)).toBe('45 min');
    expect(service.formatMinutes(120)).toBe('2 h');
    expect(service.formatMinutes(135)).toBe('2 h 15 min');
    expect(service.formatMinutes(-5)).toBe('0 min');
    expect(service.formatDistance(347)).toBe('350 m');
    expect(service.formatDistance(1530)).toBe('1,5 km');
    service.setLanguage('en');
    expect(service.formatDistance(1530)).toBe('1.5 km');
    expect(service.formatClock(new Date(2026, 0, 1, 9, 5))).toBe('09:05');
    expect(service.formatNumber(1234.5, 1)).toBe('1,234.5');
  });
});
