import { KitsuError } from './errors';
import { isJsonApiErrorDocument, type Parser } from './guards';

export const KITSU_BASE_URL = 'https://kitsu.io/api/edge';

/** Requests allowed at the same time. Kitsu handled 16 parallel requests without a 429 in testing (Oct 2026). */
const MAX_IN_FLIGHT = 4;
/** Minimum gap between the start of two requests. */
const MIN_GAP_MS = 100;
const MAX_RATE_LIMIT_RETRIES = 3;

const sleep = (ms: number) => new Promise<void>((resolve) => setTimeout(resolve, ms));

// ---------- request queue ----------
// At most MAX_IN_FLIGHT requests run at once, started at least MIN_GAP_MS apart, so pages that fire
// many queries together (Watchlist, Favorites, a season's pages) load in parallel without a burst.
// A 429 pauses every request until Kitsu's Retry-After (or the backoff) has passed.

let inFlight = 0;
let lastStart = 0;
let pausedUntil = 0;
const slotWaiters: (() => void)[] = [];

async function acquireSlot(): Promise<void> {
  for (;;) {
    if (inFlight >= MAX_IN_FLIGHT) {
      await new Promise<void>((resolve) => slotWaiters.push(resolve));
      continue;
    }
    const wait = Math.max(lastStart + MIN_GAP_MS, pausedUntil) - Date.now();
    if (wait > 0) {
      await sleep(wait);
      continue;
    }
    inFlight++;
    lastStart = Date.now();
    return;
  }
}

function releaseSlot() {
  inFlight--;
  slotWaiters.shift()?.();
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
export async function kitsuFetch<T>(path: string, parse: Parser<T>, signal?: AbortSignal): Promise<T> {
  for (let attempt = 0; ; attempt++) {
    signal?.throwIfAborted();
    await acquireSlot();

    let res: Response;
    try {
      // A query cancelled while waiting for a slot never hits the network.
      signal?.throwIfAborted();
      res = await fetch(KITSU_BASE_URL + path, {
        headers: { Accept: 'application/vnd.api+json' },
        signal,
      });
    } catch (e) {
      if (signal?.aborted) throw e;
      throw new KitsuError('network', 'Could not reach Kitsu. Check your internet connection.');
    } finally {
      releaseSlot();
    }

    // Pause every request, not just this one: the whole app slows down instead of piling up 429s.
    if (res.status === 429 && attempt < MAX_RATE_LIMIT_RETRIES) {
      pausedUntil = Math.max(pausedUntil, Date.now() + retryDelayMs(res, attempt));
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
}
