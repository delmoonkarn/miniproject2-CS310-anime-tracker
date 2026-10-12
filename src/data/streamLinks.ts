// Streaming links published with the app: everyone who opens the site sees these on the Detail page.
// Personal links added in the browser (Zustand, localStorage) are shown next to them.
//
// Edit them on the /admin page while running `npm run dev`: it saves to streamLinks.json next to this
// file. Commit and redeploy to publish. The deployed site can only read them.

import raw from './streamLinks.json';
import { parseSharedLinks } from '../lib/sharedLinks';

/** Validated at load; streamLinks.test.ts fails the test run if the file is invalid. */
export const BUNDLED_STREAM_LINKS = parseSharedLinks(raw);
