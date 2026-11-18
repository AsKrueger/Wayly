import { DataServiceError } from '../../core/application/ports/place-search';
import { fakeFetch } from '../testing/fake-fetch';
import { FetchFn, fetchJson } from './fetch-json';

describe('fetchJson', () => {
  it('returns parsed JSON', async () => {
    await expect(fetchJson(fakeFetch({ body: { ok: 1 } }), 'https://x.test', { timeoutMs: 1000 })).resolves.toEqual({ ok: 1 });
  });

  it.each([
    [{ status: 429 }, 'rate-limited'],
    [{ status: 503 }, 'unavailable'],
    [{ raw: '<html>' }, 'invalid-response'],
    [new TypeError('offline'), 'unavailable'],
  ])('maps %p to %s', async (reply, failure) => {
    const promise = fetchJson(fakeFetch(reply), 'https://x.test', { timeoutMs: 1000 });
    await expect(promise).rejects.toBeInstanceOf(DataServiceError);
    await expect(fetchJson(fakeFetch(reply), 'https://x.test', { timeoutMs: 1000 })).rejects.toMatchObject({ failure });
  });

  it('times out slow requests', async () => {
    const never: FetchFn = (_url, init) =>
      new Promise((_resolve, reject) => init?.signal?.addEventListener('abort', () => reject(new Error('aborted'))));
    await expect(fetchJson(never, 'https://x.test', { timeoutMs: 10 })).rejects.toMatchObject({ failure: 'timeout' });
  });

  it('propagates a caller abort as-is', async () => {
    const controller = new AbortController();
    const never: FetchFn = (_url, init) =>
      new Promise((_resolve, reject) => init?.signal?.addEventListener('abort', () => reject(new Error('aborted'))));
    const promise = fetchJson(never, 'https://x.test', { timeoutMs: 5000, signal: controller.signal });
    controller.abort();
    await expect(promise).rejects.toThrow('aborted');
  });
});
