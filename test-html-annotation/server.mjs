import http from 'node:http';
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const root = __dirname;
const dataFile = path.join(root, 'data', 'annotations.json');
const port = 3217;

const mime = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.mjs': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8'
};

await fs.mkdir(path.dirname(dataFile), { recursive: true });
try { await fs.access(dataFile); } catch {
  await fs.writeFile(dataFile, JSON.stringify({ version: 1, ui: { launcher: { x: 24, y: 24 }, showMarkers: true }, annotations: [] }, null, 2));
}

const server = http.createServer(async (req, res) => {
  try {
    const url = new URL(req.url, `http://${req.headers.host}`);
    if (url.pathname === '/api/annotations' && req.method === 'GET') {
      const raw = await fs.readFile(dataFile, 'utf8');
      res.writeHead(200, { 'content-type': mime['.json'] });
      return res.end(raw);
    }
    if (url.pathname === '/api/annotations' && req.method === 'PUT') {
      let body = '';
      req.on('data', chunk => body += chunk);
      req.on('end', async () => {
        try {
          const parsed = JSON.parse(body || '{}');
          await fs.writeFile(dataFile, JSON.stringify(parsed, null, 2), 'utf8');
          res.writeHead(200, { 'content-type': mime['.json'] });
          res.end(JSON.stringify({ ok: true }));
        } catch (err) {
          res.writeHead(400, { 'content-type': mime['.json'] });
          res.end(JSON.stringify({ ok: false, error: String(err) }));
        }
      });
      return;
    }

    const filePath = url.pathname === '/' ? path.join(root, 'index.html') : path.join(root, decodeURIComponent(url.pathname));
    if (!filePath.startsWith(root)) {
      res.writeHead(403);
      return res.end('Forbidden');
    }
    const ext = path.extname(filePath);
    const content = await fs.readFile(filePath);
    res.writeHead(200, { 'content-type': mime[ext] || 'application/octet-stream' });
    res.end(content);
  } catch (err) {
    res.writeHead(404, { 'content-type': 'text/plain; charset=utf-8' });
    res.end('Not found');
  }
});

server.listen(port, () => {
  console.log(`HTML annotation test server running at http://127.0.0.1:${port}`);
});
