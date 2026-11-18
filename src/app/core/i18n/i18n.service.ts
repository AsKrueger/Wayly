import { DOCUMENT } from '@angular/common';
import { computed, effect, inject, Injectable, signal } from '@angular/core';
import { LocalStore } from '../storage/local-store.service';
import { Language, LANGUAGES, MessageKey, MessageParams, Messages } from './i18n.types';
import { EN } from './messages.en';
import { ES } from './messages.es';

const DICTIONARIES: Record<Language, Messages> = { es: ES, en: EN };
const STORAGE_KEY = 'language';

function isLanguage(value: unknown): value is Language {
  return typeof value === 'string' && (LANGUAGES as readonly string[]).includes(value);
}

function lookup(dictionary: Messages, key: string): string | undefined {
  let node: unknown = dictionary;
  for (const part of key.split('.')) {
    if (node === null || typeof node !== 'object') {
      return undefined;
    }
    node = (node as Record<string, unknown>)[part];
  }
  return typeof node === 'string' ? node : undefined;
}

export function interpolate(template: string, params?: MessageParams): string {
  if (!params) {
    return template;
  }
  return template.replace(/\{(\w+)\}/g, (match, name: string) =>
    Object.prototype.hasOwnProperty.call(params, name) ? String(params[name]) : match,
  );
}

/**
 * Detects the initial language: saved choice, then `?lang=`, then the
 * browser languages. Spanish speakers get Spanish, everyone else English.
 */
export function detectLanguage(
  saved: unknown,
  search: string,
  browserLanguages: readonly string[],
): Language {
  if (isLanguage(saved)) {
    return saved;
  }
  const fromUrl = new URLSearchParams(search).get('lang');
  if (isLanguage(fromUrl)) {
    return fromUrl;
  }
  const first = browserLanguages.find((language) => /^(es|en)\b/i.test(language));
  return first?.toLowerCase().startsWith('es') ? 'es' : 'en';
}

@Injectable({ providedIn: 'root' })
export class I18nService {
  private readonly store = inject(LocalStore);
  private readonly document = inject(DOCUMENT);

  readonly language = signal<Language>(
    detectLanguage(
      this.store.read<string>(STORAGE_KEY),
      this.document.defaultView?.location.search ?? '',
      this.document.defaultView?.navigator.languages ?? [],
    ),
  );

  /** BCP 47 locale used by `Intl` formatters. */
  readonly locale = computed(() => (this.language() === 'es' ? 'es-ES' : 'en-GB'));

  constructor() {
    effect(() => {
      this.document.documentElement.lang = this.language();
    });
  }

  setLanguage(language: Language): void {
    this.language.set(language);
    this.store.write(STORAGE_KEY, language);
  }

  /** Translates a key. Reading it inside a template or `computed` tracks the language. */
  t(key: MessageKey, params?: MessageParams): string {
    const template = lookup(DICTIONARIES[this.language()], key) ?? lookup(ES, key) ?? key;
    return interpolate(template, params);
  }

  formatMinutes(totalMinutes: number): string {
    const minutes = Math.max(0, Math.round(totalMinutes));
    if (minutes < 60) {
      return this.t('units.minutes', { n: minutes });
    }
    const hours = Math.floor(minutes / 60);
    const rest = minutes % 60;
    return rest === 0
      ? this.t('units.hours', { n: hours })
      : this.t('units.hoursMinutes', { h: hours, m: rest });
  }

  formatDistance(meters: number): string {
    if (meters < 1000) {
      return this.t('units.meters', { n: Math.max(0, Math.round(meters / 10) * 10) });
    }
    const kilometers = new Intl.NumberFormat(this.locale(), { maximumFractionDigits: 1 }).format(
      meters / 1000,
    );
    return this.t('units.kilometers', { n: kilometers });
  }

  formatClock(date: Date): string {
    return new Intl.DateTimeFormat(this.locale(), { hour: '2-digit', minute: '2-digit' }).format(date);
  }

  formatNumber(value: number, maximumFractionDigits = 0): string {
    return new Intl.NumberFormat(this.locale(), { maximumFractionDigits }).format(value);
  }
}
