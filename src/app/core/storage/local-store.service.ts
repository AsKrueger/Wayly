import { Injectable } from '@angular/core';

const PREFIX = 'wayly.';

/**
 * Small, failure-tolerant wrapper around `localStorage`.
 *
 * Storage can be unavailable (private mode, blocked site data, quota). Every
 * read falls back to `null` and every write is best effort, so the
 * application keeps working without persistence.
 */
@Injectable({ providedIn: 'root' })
export class LocalStore {
  read<T>(key: string): T | null {
    try {
      const raw = globalThis.localStorage?.getItem(PREFIX + key);
      return raw === null || raw === undefined ? null : (JSON.parse(raw) as T);
    } catch {
      return null;
    }
  }

  write<T>(key: string, value: T): void {
    try {
      globalThis.localStorage?.setItem(PREFIX + key, JSON.stringify(value));
    } catch {
      // Persistence is optional.
    }
  }

  remove(key: string): void {
    try {
      globalThis.localStorage?.removeItem(PREFIX + key);
    } catch {
      // Persistence is optional.
    }
  }
}
