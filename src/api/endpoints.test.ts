import { afterEach, describe, expect, it, vi } from 'vitest';
import sample from '../../data/sample-anime.json';
import { fetchAnime } from './endpoints';
import { isKitsuError } from './errors';

const [a, b] = sample.data;
const json = (body: unknown, status = 200) => new Response(JSON.stringify(body), { status });

describe('fetchAnime batching', () => {
  afterEach(() => vi.unstubAllGlobals());

  it('loads shows requested together with one /anime?filter[id] request; a missing id is a 404', async () => {
    const fetchMock = vi.fn(async (_url: string) => json({ data: [a, b] }));
    vi.stubGlobal('fetch', fetchMock);

    const results = await Promise.allSettled([fetchAnime(Number(a?.id)), fetchAnime(Number(b?.id)), fetchAnime(99999999)]);

    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(decodeURIComponent(String(fetchMock.mock.calls[0]?.[0]))).toContain(`filter[id]=${a?.id},${b?.id},99999999`);
    expect(results[0]).toMatchObject({ status: 'fulfilled', value: { id: Number(a?.id) } });
    expect(results[1]).toMatchObject({ status: 'fulfilled', value: { id: Number(b?.id) } });
    const missing = results[2];
    expect(missing?.status === 'rejected' && isKitsuError(missing.reason) && missing.reason.isNotFound).toBe(true);
  });

  it('uses the single-show endpoint when only one show is asked for', async () => {
    const fetchMock = vi.fn(async (_url: string) => json({ data: a }));
    vi.stubGlobal('fetch', fetchMock);

    await expect(fetchAnime(Number(a?.id))).resolves.toMatchObject({ id: Number(a?.id) });
    expect(String(fetchMock.mock.calls[0]?.[0])).toMatch(new RegExp(`/anime/${a?.id}$`));
  });
});
