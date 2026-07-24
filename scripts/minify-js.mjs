#!/usr/bin/env node
/*
  Minifiziert alle assets/js/*.js zu assets/js/*.min.js (Phase 8).
  Quelldateien bleiben lesbar erhalten; index.html/impressum.html/
  datenschutz.html binden die .min.js-Varianten ein.
*/
import { minify } from 'terser';
import { readdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const jsDir = path.resolve(__dirname, '..', 'assets/js');

const files = (await readdir(jsDir)).filter((f) => f.endsWith('.js') && !f.endsWith('.min.js'));

for (const file of files) {
  const srcPath = path.join(jsDir, file);
  const code = await readFile(srcPath, 'utf8');
  const result = await minify(code, { format: { comments: false } });
  if (result.error) {
    console.error(`Fehler in ${file}:`, result.error);
    process.exitCode = 1;
    continue;
  }
  const outPath = path.join(jsDir, file.replace(/\.js$/, '.min.js'));
  await writeFile(outPath, result.code, 'utf8');
  console.log(`${file} -> ${path.basename(outPath)} (${code.length} -> ${result.code.length} Bytes)`);
}
