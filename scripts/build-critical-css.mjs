#!/usr/bin/env node
/*
  Minifiziert assets/css/critical.css und gibt sowohl den fertigen
  <style>-Inhalt als auch dessen SHA-256-Hash aus (fuer die
  Content-Security-Policy in netlify.toml, style-src 'sha256-...').

  Diese Seite hat keinen Build-Schritt - nach Aenderungen an
  critical.css bitte dieses Skript laufen lassen und den Inhalt manuell
  in index.html/impressum.html/datenschutz.html sowie den Hash in
  netlify.toml uebertragen.
*/
import CleanCSS from 'clean-css';
import { readFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const srcPath = path.resolve(__dirname, '..', 'assets/css/critical.css');

const source = await readFile(srcPath, 'utf8');
const output = new CleanCSS({}).minify(source);

if (output.errors.length) {
  console.error('Fehler beim Minifizieren:', output.errors);
  process.exit(1);
}

const minified = output.styles;
const hash = createHash('sha256').update(minified, 'utf8').digest('base64');

console.log('--- Minifiziertes CSS (in <style>...</style> in <head> einfuegen) ---\n');
console.log(minified);
console.log('\n--- SHA-256-Hash fuer CSP style-src (in netlify.toml eintragen) ---\n');
console.log(`'sha256-${hash}'`);
