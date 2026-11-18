import { ES } from './messages.es';

export type Language = 'es' | 'en';

export const LANGUAGES: readonly Language[] = ['es', 'en'];

type Widen<T> = { [K in keyof T]: T[K] extends string ? string : Widen<T[K]> };

/** Shape every dictionary must have: the Spanish one with plain strings. */
export type Messages = Widen<typeof ES>;

type Leaves<T, Prefix extends string = ''> = {
  [K in keyof T & string]: T[K] extends string ? `${Prefix}${K}` : Leaves<T[K], `${Prefix}${K}.`>;
}[keyof T & string];

/** Every valid dotted key, for example `nav.theme.dark`. */
export type MessageKey = Leaves<Messages>;

export type MessageParams = Readonly<Record<string, string | number>>;
