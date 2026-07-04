import express from 'express';
import fs from 'node:fs/promises';
import path from 'node:path';

const app = express();
const port = process.env.PORT || 3017;
const dataFile = path.resolve(process.cwd(), 'data/annotations.json');

app.use(express.json({ limit: '1mb' }));

async function ensureFile() {
  await fs.mkdir(path.dirname(dataFile), { recursive: true });
  try {
    await fs.access(dataFile);
  } catch {
    await fs.writeFile(
      dataFile,
      JSON.stringify({ version: 1, ui: { launcher: { x: 24, y: 24 }, showMarkers: true }, annotations: [] }, null, 2)
    );
  }
}

app.get('/api/annotations', async (_req, res) => {
  await ensureFile();
  const raw = await fs.readFile(dataFile, 'utf8');
  res.type('json').send(raw);
});

app.put('/api/annotations', async (req, res) => {
  await ensureFile();
  await fs.writeFile(dataFile, JSON.stringify(req.body, null, 2));
  res.json({ ok: true });
});

app.listen(port, async () => {
  await ensureFile();
  console.log(`annotation store listening on http://localhost:${port}`);
});
