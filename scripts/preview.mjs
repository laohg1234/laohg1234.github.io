import { createReadStream } from 'node:fs';
import { stat } from 'node:fs/promises';
import http from 'node:http';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { outputRoot } from './build.mjs';

const types = {
  '.html': 'text/html; charset=utf-8', '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8', '.mjs': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8', '.png': 'image/png', '.jpg': 'image/jpeg',
  '.webp': 'image/webp', '.gif': 'image/gif', '.mp4': 'video/mp4', '.mp3': 'audio/mpeg',
  '.svg': 'image/svg+xml', '.xml': 'application/xml', '.txt': 'text/plain; charset=utf-8'
};
const existsFile = async file => (await stat(file).catch(() => null))?.isFile();

export function createPreviewServer() {
  return http.createServer(async (request, response) => {
    try {
      let pathname;
      try { pathname = decodeURIComponent(new URL(request.url, 'http://localhost').pathname); }
      catch { response.writeHead(400).end(); return; }
      let file = path.resolve(outputRoot, '.' + pathname);
      if (file !== outputRoot && !file.startsWith(outputRoot + path.sep)) { response.writeHead(403).end(); return; }
      if (!path.extname(file) && await existsFile(file + '.html')) file += '.html';
      else if ((await stat(file).catch(() => null))?.isDirectory()) {
        if (!pathname.endsWith('/')) { response.writeHead(301, { Location: pathname + '/' }).end(); return; }
        file = path.join(file, 'index.html');
      }
      let status = 200;
      if (!await existsFile(file)) { file = path.join(outputRoot, '404.html'); status = 404; }
      const info = await stat(file);
      const headers = { 'Content-Type': types[path.extname(file)] || 'application/octet-stream', 'Cache-Control': 'no-store', 'Accept-Ranges': 'bytes' };
      const range = request.headers.range?.match(/^bytes=(\d+)-(\d*)$/);
      if (range && status === 200) {
        const start = Number(range[1]);
        const end = range[2] ? Math.min(Number(range[2]), info.size - 1) : info.size - 1;
        if (start > end || start >= info.size) { response.writeHead(416, { 'Content-Range': `bytes */${info.size}` }).end(); return; }
        response.writeHead(206, { ...headers, 'Content-Range': `bytes ${start}-${end}/${info.size}`, 'Content-Length': end - start + 1 });
        if (request.method === 'HEAD') response.end();
        else createReadStream(file, { start, end }).pipe(response);
      } else {
        response.writeHead(status, { ...headers, 'Content-Length': info.size });
        if (request.method === 'HEAD') response.end();
        else createReadStream(file).pipe(response);
      }
    } catch { if (!response.headersSent) response.writeHead(500); response.end('Preview error'); }
  });
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const server = createPreviewServer();
  const port = Number(process.env.PORT || 8080);
  server.listen(port, '127.0.0.1', () => console.log(`Preview: http://127.0.0.1:${port}`));
}
