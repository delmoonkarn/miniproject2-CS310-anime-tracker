import { KitsuError } from './errors';
import { isJsonApiErrorDocument, type Parser } from './guards';

export const KITSU_BASE_URL = 'https://kitsu.io/api/edge';

/** Minimum gap between the start of two requests. */
const MIN_GAP_MS = 300;
const MAX_RATE_LIMIT_RETRIES = 3;

const sleep = (ms: number) => new Promise<void>((resolve) => setTimeout(resolve, ms));

// ---------- request queue ----------
// Every request runs one after another, at least MIN_GAP_MS apart. This keeps
// pages that fire many queries at once (useQueries on the Watchlist and Favorites pages) from hammering Kitsu.

let tail: Promise<unknown> = Promise.resolve();
let lastStart = 0;

function enqueue<T>(task: () => Promise<T>): Promise<T> {
  const run = tail.then(async () => {
    const wait = lastStart + MIN_GAP_MS - Date.now();
    if (wait > 0) await sleep(wait);
    lastStart = Date.now();
    return task();
  });
  tail = run.catch(() => undefined);
  return run;
}

function retryDelayMs(res: Response, attempt: number): number {
  const retryAfter = Number(res.headers.get('Retry-After'));
  return retryAfter > 0 ? retryAfter * 1000 : 1000 * 2 ** attempt;
}

/**
 * The single entry point to Kitsu. Queues the request, retries 429s with backoff,
 * turns every failure into a KitsuError, and hands the JSON to `parse` (see `one`/`many`)
 * to unwrap the JSON:API document into plain typed objects.
 */
export function kitsuFetch<T>(path: string, parse: Parser<T>, signal?: AbortSignal): Promise<T> {
  return enqueue(async () => {
    for (let attempt = 0; ; attempt++) {
      // A query cancelled while waiting in the queue never hits the network.
      signal?.throwIfAborted();

      let res: Response;
      try {
        res = await fetch(KITSU_BASE_URL + path, {
          headers: { Accept: 'application/vnd.api+json' },
          signal,
        });
      } catch (e) {
        if (signal?.aborted) throw e;
        throw new KitsuError('network', 'Could not reach Kitsu. Check your internet connection.');
      }

      // Backing off inside the queue slot on purpose: the whole app slows down, not just this request.
      if (res.status === 429 && attempt < MAX_RATE_LIMIT_RETRIES) {
        await sleep(retryDelayMs(res, attempt));
        continue;
      }

      const body: unknown = await res.json().catch(() => null);
      if (!res.ok) {
        const detail = isJsonApiErrorDocument(body) ? body.errors[0]?.detail ?? body.errors[0]?.title : undefined;
        const message = res.status === 429 ? 'Kitsu is rate-limiting requests. Wait a moment and retry.' : detail;
        throw new KitsuError('http', message ?? `Kitsu responded with HTTP ${res.status}.`, res.status);
      }
      return parse(body);
    }
  });
}
