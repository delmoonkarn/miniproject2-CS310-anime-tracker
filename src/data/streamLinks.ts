// Streaming links published with the app: everyone who opens the site sees these on the Detail page.
// Personal links added in the browser (Zustand, localStorage) are shown next to them.
//
// To add one: open the show in the app, take the id from the address bar (/anime/<id>), and add
//   <id>: [{ label: 'Netflix', url: 'https://www.netflix.com/title/…' }],
// Only http(s) URLs are accepted (checked by streamLinks.test.ts). Commit and redeploy to publish.

export interface SharedStreamLink {
  label: string;
  url: string;
}

/** Keyed by Kitsu anime id. */
export const SHARED_STREAM_LINKS: Readonly<Record<number, readonly SharedStreamLink[]>> = {
  // 50024: [{ label: 'Crunchyroll', url: 'https://www.crunchyroll.com/series/…' }],
};
