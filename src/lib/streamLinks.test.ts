import { describe, expect, it } from 'vitest';
import raw from '../data/streamLinks.json';
import { parseSharedLinks, serializeSharedLinks } from './sharedLinks';
import { findService, normalizeStreamUrl, serviceName } from './streamLinks';

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

describe('findService', () => {
  it('matches by hostname first, then by the link name', () => {
    expect(findService('https://www.iq.com/play/abc')?.name).toBe('iQIYI');
    expect(findService('https://tv.apple.com/show/x')?.name).toBe('Apple TV');
    expect(findService('https://bit.ly/xyz', 'netflix')?.name).toBe('Netflix');
    expect(findService('https://bit.ly/xyz', 'Disney Plus')?.name).toBe('Disney+');
    // The hostname wins over a misleading name.
    expect(findService('https://www.youtube.com/@MuseAsia', 'Netflix')?.name).toBe('YouTube');
    expect(findService('https://example.org', 'My site')).toBeNull();
  });

  it('carries the official logo where Simple Icons has one', () => {
    expect(findService('https://netflix.com')?.icon?.hex).toBe('E50914');
    expect(findService('https://wetv.vip')?.icon).toBeNull();
  });
});

describe('published links file', () => {
  it('src/data/streamLinks.json is valid and already in its saved format', () => {
    const parsed = parseSharedLinks(raw);
    expect(JSON.parse(serializeSharedLinks(parsed))).toEqual(raw);
  });

  it('rejects bad ids, missing names and unsafe URLs', () => {
    expect(() => parseSharedLinks({ abc: [] })).toThrow(/anime id/);
    expect(() => parseSharedLinks({ 1: [{ label: ' ', url: 'https://netflix.com' }] })).toThrow(/name/);
    expect(() => parseSharedLinks({ 1: [{ label: 'X', url: 'javascript:alert(1)' }] })).toThrow(/URL/);
    expect(() => parseSharedLinks([])).toThrow();
  });

  it('normalizes, drops empty shows and writes ids in order', () => {
    const map = parseSharedLinks({ 20: [{ label: ' Netflix ', url: 'netflix.com/title/1' }], 3: [], 5: [{ label: 'YT', url: 'https://youtu.be/x' }] });
    expect(map).toEqual({ 20: [{ label: 'Netflix', url: 'https://netflix.com/title/1' }], 5: [{ label: 'YT', url: 'https://youtu.be/x' }] });
    const text = serializeSharedLinks(map);
    expect(text.indexOf('"5"')).toBeLessThan(text.indexOf('"20"'));
  });
});
