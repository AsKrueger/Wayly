import { FetchFn } from '../http/fetch-json';

export interface FakeCall {
  readonly url: string;
  readonly init?: RequestInit;
}

export type FakeReply = { readonly status?: number; readonly body?: unknown; readonly raw?: string } | Error;

/** Test double for `fetch`: replies in order and records every call. */
export function fakeFetch(...replies: FakeReply[]): FetchFn & { readonly calls: FakeCall[] } {
  const calls: FakeCall[] = [];
  const fn = (async (url: string, init?: RequestInit) => {
    calls.push({ url, init });
    const reply = replies.shift();
    if (!reply) {
      throw new Error(`Unexpected request: ${url}`);
    }
    if (reply instanceof Error) {
      throw reply;
    }
    const status = reply.status ?? 200;
    const text = reply.raw ?? JSON.stringify(reply.body ?? {});
    return {
      ok: status >= 200 && status < 300,
      status,
      json: async () => JSON.parse(text),
    } as Response;
  }) as FetchFn & { calls: FakeCall[] };
  fn.calls = calls;
  return fn;
}
