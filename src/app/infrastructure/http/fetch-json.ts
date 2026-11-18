import { InjectionToken } from '@angular/core';
import { DataServiceError } from '../../core/application/ports/place-search';

export type FetchFn = (input: string, init?: RequestInit) => Promise<Response>;

/** `fetch`, injectable so that tests never touch the network. */
export const FETCH = new InjectionToken<FetchFn>('FETCH', {
  providedIn: 'root',
  factory: () => (input, init) => globalThis.fetch(input, init),
});

/**
 * Fetches JSON with a timeout. Every failure becomes a `DataServiceError`
 * so callers can decide whether to try another source.
 */
export async function fetchJson<T>(
  fetchFn: FetchFn,
  url: string,
  options: { readonly init?: RequestInit; readonly timeoutMs: number; readonly signal?: AbortSignal },
): Promise<T> {
  const controller = new AbortController();
  const onAbort = () => controller.abort();
  options.signal?.addEventListener('abort', onAbort, { once: true });
  const timer = setTimeout(() => controller.abort(), options.timeoutMs);

  try {
    let response: Response;
    try {
      response = await fetchFn(url, { ...options.init, signal: controller.signal });
    } catch (error: unknown) {
      if (options.signal?.aborted) {
        throw error;
      }
      throw controller.signal.aborted
        ? new DataServiceError('timeout', `Timed out after ${options.timeoutMs} ms: ${url}`)
        : new DataServiceError('unavailable', `Network error: ${url}`);
    }

    if (response.status === 429) {
      throw new DataServiceError('rate-limited', `Rate limited: ${url}`);
    }
    if (!response.ok) {
      throw new DataServiceError('unavailable', `HTTP ${response.status}: ${url}`);
    }

    try {
      return (await response.json()) as T;
    } catch {
      throw new DataServiceError('invalid-response', `Invalid JSON: ${url}`);
    }
  } finally {
    clearTimeout(timer);
    options.signal?.removeEventListener('abort', onAbort);
  }
}
