import { writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { normalizePath, type Plugin } from 'vite';
import { STREAM_LINKS_ENDPOINT, parseSharedLinks, serializeSharedLinks } from '../src/lib/sharedLinks';

const DATA_FILE = 'src/data/streamLinks.json';
const MAX_BODY = 256 * 1024;

/**
 * Dev-server only (`apply: 'serve'`): lets the /admin page save the published streaming links by
 * writing src/data/streamLinks.json. Production builds have no such endpoint, so the deployed site
 * stays read-only. Requests from other origins are refused, and the body is validated before writing.
 */
export function streamLinksAdmin(): Plugin {
  let file = '';
  /** What the endpoint last wrote, so its own save doesn't trigger a page reload. */
  let lastWritten: string | null = null;
  return {
    name: 'stream-links-admin',
    apply: 'serve',
    configResolved(config) {
      file = normalizePath(resolve(config.root, DATA_FILE));
    },
    // The /admin page already shows the saved links (TanStack Query cache), so a save needs no HMR.
    // Editing the file by hand still reloads as usual.
    async handleHotUpdate(ctx) {
      if (normalizePath(ctx.file) === file && lastWritten !== null && (await ctx.read()) === lastWritten) return [];
    },
    configureServer(server) {
      server.middlewares.use(STREAM_LINKS_ENDPOINT, (req, res) => {
        const send = (status: number, message = '') => {
          res.statusCode = status;
          res.setHeader('Content-Type', 'text/plain; charset=utf-8');
          res.end(message);
        };
        if (req.method !== 'PUT') return send(405, 'Use PUT.');
        const origin = req.headers.origin;
        const host = req.headers.host ?? '';
        if (origin !== undefined && origin !== `http://${host}` && origin !== `https://${host}`) {
          return send(403, 'Cross-origin request refused.');
        }
        if (!req.headers['content-type']?.startsWith('application/json')) return send(415, 'Expected application/json.');

        let body = '';
        let tooBig = false;
        req.setEncoding('utf8');
        req.on('data', (chunk: string) => {
          if (tooBig) return;
          body += chunk;
          if (body.length > MAX_BODY) tooBig = true;
        });
        req.on('end', () => {
          if (tooBig) return send(413, 'Too much data.');
          let contents: string;
          try {
            contents = serializeSharedLinks(parseSharedLinks(JSON.parse(body)));
          } catch (error) {
            return send(400, error instanceof Error ? error.message : 'Invalid data.');
          }
          lastWritten = contents;
          writeFile(file, contents, 'utf8').then(
            () => send(204),
            (error: unknown) => send(500, `Could not write ${DATA_FILE}: ${String(error)}`),
          );
        });
      });
    },
  };
}
