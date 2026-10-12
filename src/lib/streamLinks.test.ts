import { describe, expect, it } from 'vitest';
import { SHARED_STREAM_LINKS } from '../data/streamLinks';
import { normalizeStreamUrl, serviceName } from './streamLinks';

describe('normalizeStreamUrl', () => {
  it('keeps full http(s) URLs', () => {
    expect(normalizeStreamUrl(' https://www.netflix.com/title/81564899 ')).toBe('https://www.netflix.com/title/81564899');
    expect(normalizeStreamUrl('http://example.org/watch?v=1')).toBe('http://example.org/watch?v=1');
  });

  it('adds https:// when the scheme is missing', () => {
    expect(normalizeStreamUrl('crunchyroll.com/series/GRDV0019R')).toBe('https://crunchyroll.com/series/GRDV0019R');
  });

  it('rejects unsafe schemes, blanks and things that are not URLs', () => {
    expect(normalizeStreamUrl('javascript:alert(1)')).toBeNull();
    expect(normalizeStreamUrl('data:text/html,hi')).toBeNull();
    expect(normalizeStreamUrl('   ')).toBeNull();
    expect(normalizeStreamUrl('not a url')).toBeNull();
    expect(normalizeStreamUrl('netflix')).toBeNull();
  });
});

describe('serviceName', () => {
  it('names known services and falls back to the hostname', () => {
    expect(serviceName('https://www.netflix.com/title/1')).toBe('Netflix');
    expect(serviceName('https://m.youtube.com/watch?v=x')).toBe('YouTube');
    expect(serviceName('https://www.example.org/a')).toBe('example.org');
  });
});

describe('SHARED_STREAM_LINKS', () => {
  it('only holds named, already-normalized http(s) links', () => {
    for (const [id, links] of Object.entries(SHARED_STREAM_LINKS)) {
      expect(Number.isSafeInteger(Number(id)) && Number(id) > 0, `id ${id}`).toBe(true);
      for (const l of links) {
        expect(l.label.trim(), `label for ${id}`).not.toBe('');
        expect(normalizeStreamUrl(l.url), `url for ${id}`).toBe(l.url);
      }
    }
  });
});
