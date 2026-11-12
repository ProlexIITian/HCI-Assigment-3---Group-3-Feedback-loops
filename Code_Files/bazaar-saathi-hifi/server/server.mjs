// Optional server: serves the built app (dist/) and proxies the cloud stand-in.
// Usage:  npm run build && GEMINI_API_KEY=your_key npm run serve   → http://localhost:8787
// No dependencies (Node 18+). The key never reaches the browser.
import { createServer } from 'node:http';
import { readFile, stat } from 'node:fs/promises';
import { extname, join, normalize } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(fileURLToPath(new URL('.', import.meta.url)), '..', 'dist');
const PORT = Number(process.env.PORT || 8787);
const KEY = process.env.GEMINI_API_KEY || '';
const TYPES = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript', '.css': 'text/css', '.svg': 'image/svg+xml', '.json': 'application/json', '.webmanifest': 'application/manifest+json', '.png': 'image/png' };

async function translate(req, res) {
  let body = '';
  for await (const chunk of req) body += chunk;
  if (!KEY) return send(res, 503, { error: 'GEMINI_API_KEY not set on the server' });
  try {
    const { prompt, model } = JSON.parse(body);
    const m = /^[\w.\-]+$/.test(model || '') ? model : 'gemini-2.5-flash';
    const r = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${m}:generateContent`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-goog-api-key': KEY },
      body: JSON.stringify({ contents: [{ parts: [{ text: String(prompt).slice(0, 4000) }] }], generationConfig: { temperature: 0.2, responseMimeType: 'application/json' } }),
    });
    const j = await r.json();
    if (!r.ok) return send(res, r.status, { error: j?.error?.message || 'upstream error' });
    send(res, 200, { text: j?.candidates?.[0]?.content?.parts?.[0]?.text ?? '' });
  } catch (e) {
    send(res, 500, { error: String(e) });
  }
}

function send(res, code, obj) {
  res.writeHead(code, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify(obj));
}

createServer(async (req, res) => {
  const url = new URL(req.url, 'http://x');
  if (url.pathname.endsWith('/api/translate') && req.method === 'POST') return translate(req, res);
  let p = normalize(decodeURIComponent(url.pathname)).replace(/^([/\\])+/, '');
  if (!p || p.endsWith('/')) p += 'index.html';
  const file = join(ROOT, p);
  if (!file.startsWith(ROOT)) { res.writeHead(403); return res.end(); }
  try {
    await stat(file);
    res.writeHead(200, { 'Content-Type': TYPES[extname(file)] || 'application/octet-stream' });
    res.end(await readFile(file));
  } catch {
    res.writeHead(200, { 'Content-Type': TYPES['.html'] });
    res.end(await readFile(join(ROOT, 'index.html')));
  }
}).listen(PORT, () => console.log(`Bazaar Saathi on http://localhost:${PORT}  (cloud stand-in ${KEY ? 'ready' : 'disabled: no GEMINI_API_KEY'})`));
