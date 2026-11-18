import { LocalStore } from '../../core/storage/local-store.service';

interface CacheEntry<T> {
  readonly savedAt: number;
  readonly value: T;
}

/**
 * Small persistent cache with expiry and a maximum number of entries, so the
 * device never fills its storage. The oldest entry is evicted first.
 */
export class TtlCache<T> {
  constructor(
    private readonly store: LocalStore,
    private readonly namespace: string,
    private readonly ttlMs: number,
    private readonly maxEntries: number,
    private readonly now: () => number = () => Date.now(),
  ) {}

  get(key: string): T | null {
    const entry = this.store.read<CacheEntry<T>>(this.entryKey(key));
    if (!entry || typeof entry.savedAt !== 'number') {
      return null;
    }
    if (this.now() - entry.savedAt > this.ttlMs) {
      this.delete(key);
      return null;
    }
    return entry.value;
  }

  set(key: string, value: T): void {
    const index = this.index().filter((existing) => existing !== key);
    index.push(key);
    while (index.length > this.maxEntries) {
      const evicted = index.shift();
      if (evicted !== undefined) {
        this.store.remove(this.entryKey(evicted));
      }
    }
    this.store.write(this.entryKey(key), { savedAt: this.now(), value } satisfies CacheEntry<T>);
    this.store.write(this.indexKey(), index);
  }

  private delete(key: string): void {
    this.store.remove(this.entryKey(key));
    this.store.write(
      this.indexKey(),
      this.index().filter((existing) => existing !== key),
    );
  }

  private index(): string[] {
    const index = this.store.read<unknown>(this.indexKey());
    return Array.isArray(index) ? index.filter((key): key is string => typeof key === 'string') : [];
  }

  private indexKey(): string {
    return `cache.${this.namespace}.index`;
  }

  private entryKey(key: string): string {
    return `cache.${this.namespace}.${key}`;
  }
}
