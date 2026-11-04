/** Flora Selecta — importar productos iniciales a MockAPI.
 * Ubicar junto a .env y mockapi-products.json; ejecutar: node importar-productos.mjs
 * Requiere Node.js 18+.
 */
import { readFile } from 'node:fs/promises';

async function main() {
  const env = await readFile(new URL('./.env', import.meta.url), 'utf8');
  const line = env.split(/\r?\n/).find(x => /^\s*VITE_MOCKAPI_URL\s*=/.test(x));
  const base = (line?.split('=').slice(1).join('=') ?? '').trim().replace(/^['"]|['"]$/g, '').replace(/\/+$/, '');
  if (!/^https:\/\//i.test(base)) throw new Error('Configurá VITE_MOCKAPI_URL en .env con la URL BASE HTTPS del endpoint de MockAPI, sin /products.');
  if (base.includes('mockapi.io/projects/')) throw new Error('La URL /projects/ es la del panel de MockAPI. Copiá la URL del endpoint API de tu proyecto.');
  const desired = JSON.parse(await readFile(new URL('./mockapi-products.json', import.meta.url), 'utf8'));
  async function api(path, options) {
    const r = await fetch(`${base}${path}`, options);
    if (!r.ok) throw new Error(`${r.status} ${r.statusText} en ${path}: ${(await r.text()).slice(0, 250)}`);
    return r.json();
  }
  const existing = await api('/products');
  if (!Array.isArray(existing)) throw new Error('GET /products no devolvió un listado. Revisá el recurso products.');
  const names = new Set(existing.map(p => String(p.name ?? '').trim().toLocaleLowerCase()));
  let created = 0;
  for (const item of desired) {
    const name = String(item.name ?? '').trim().toLocaleLowerCase();
    if (names.has(name)) { console.log(`Ya existe: ${item.name}`); continue; }
    const { id, ...payload } = item; // MockAPI asigna el ID
    await api('/products', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
    names.add(name); created++;
    console.log(`Creado: ${item.name}`);
  }
  console.log(`Finalizado: ${created} producto(s) nuevo(s), ${desired.length - created} existente(s).`);
}
main().catch(e => { console.error('Error:', e.message); process.exitCode = 1; });
