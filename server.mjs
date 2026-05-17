import http from 'http';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const port = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;

const mimeTypes = {
  '.html': 'text/html; charset=utf-8',
  '.css':  'text/css; charset=utf-8',
  '.js':   'application/javascript; charset=utf-8',
  '.mjs':  'application/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg':  'image/svg+xml',
  '.pdf':  'application/pdf',
  '.doc':  'application/msword',
  '.docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  '.png':  'image/png',
  '.jpg':  'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.webp': 'image/webp',
};

// Cache-Control by file type
const CACHE_CONTROL = {
  '.html': 'no-cache',
  '.json': 'no-cache',
  '.js':   'no-cache',
  '.mjs':  'no-cache',
  '.css':  'no-cache',
  '.pdf':  'public, max-age=86400',
  '.png':  'public, max-age=86400',
  '.jpg':  'public, max-age=86400',
  '.jpeg': 'public, max-age=86400',
  '.webp': 'public, max-age=86400',
};

async function serveFile(filePath, res) {
  try {
    const data = await fs.readFile(filePath);
    const ext = path.extname(filePath).toLowerCase();
    const contentType = mimeTypes[ext] || 'application/octet-stream';
    const headers = {
      'Content-Type': contentType,
      'Cache-Control': CACHE_CONTROL[ext] || 'no-cache',
      'X-Content-Type-Options': 'nosniff',
      'X-Frame-Options': 'SAMEORIGIN',
    };
    if (ext === '.pdf' || ext === '.png' || ext === '.jpg' || ext === '.jpeg' || ext === '.svg' || ext === '.webp') {
      headers['Content-Disposition'] = 'inline';
    }
    res.writeHead(200, headers);
    res.end(data);
  } catch (error) {
    res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
    res.end('Not found');
  }
}

const server = http.createServer(async (req, res) => {
  // Only allow GET and HEAD
  if (req.method !== 'GET' && req.method !== 'HEAD') {
    res.writeHead(405, { 'Content-Type': 'text/plain; charset=utf-8', Allow: 'GET, HEAD' });
    res.end('Method Not Allowed');
    return;
  }

  let requestUrl;
  try {
    requestUrl = new URL(req.url, `http://${req.headers.host}`);
  } catch {
    res.writeHead(400, { 'Content-Type': 'text/plain; charset=utf-8' });
    res.end('Bad Request');
    return;
  }

  let pathname = requestUrl.pathname;
  if (pathname === '/') pathname = '/index.html';

  // Normalise to prevent path traversal (e.g. /../../../etc/passwd)
  const normalised = path.normalize(pathname);
  const filePath = path.join(__dirname, normalised);

  // Guard: resolved path must still start with project root
  const root = __dirname.endsWith(path.sep) ? __dirname : __dirname + path.sep;
  if (!filePath.startsWith(root) && filePath !== __dirname) {
    res.writeHead(403, { 'Content-Type': 'text/plain; charset=utf-8' });
    res.end('Forbidden');
    return;
  }

  await serveFile(filePath, res);
});

server.on('error', (err) => {
  if (err.code === 'EADDRINUSE') {
    console.error(
      `\n[server] ERROR: Port ${port} is already in use.\n` +
      `  Stop the process using that port, or set a different port:\n` +
      `    PORT=3001 node server.mjs\n`
    );
  } else {
    console.error('[server] Unexpected error:', err);
  }
  process.exit(1);
});

server.listen(port, () => {
  console.log(`Server started at http://localhost:${port}`);
});
