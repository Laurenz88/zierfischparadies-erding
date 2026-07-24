#!/usr/bin/env node
/*
  Erzeugt aus Original-Fotos automatisch responsive AVIF-, WebP- und
  JPEG-Varianten in mehreren Breiten - fuer schnelle Ladezeiten ohne
  Layout-Shift (Phase 8).

  Verwendung:
    node scripts/optimize-images.mjs [Ordner]
    (Standardordner: assets/images)

  Jede Datei "foto.jpg" erzeugt:
    foto-480.avif  foto-480.webp  foto-480.jpg
    foto-960.avif  foto-960.webp  foto-960.jpg
    foto-1600.avif foto-1600.webp foto-1600.jpg
  (nur bis zur tatsaechlichen Originalbreite, keine Hochskalierung)

  Bereits erzeugte Dateien (Namen mit "-<Breite>.<format>") werden beim
  erneuten Durchlauf uebersprungen, damit man das Skript gefahrlos
  mehrfach laufen lassen kann, nachdem neue Fotos hinzugekommen sind.
*/
import sharp from 'sharp';
import { readdir, stat } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const targetDir = path.resolve(__dirname, '..', process.argv[2] || 'assets/images');

const WIDTHS = [480, 960, 1600];
const SOURCE_EXT = new Set(['.jpg', '.jpeg', '.png']);
// Nur exakt unsere generierten Breiten ausschliessen (nicht jede Zahl im
// Dateinamen) - sonst wuerden z.B. Originaldateien wie "ref-1.jpg" faelschlich
// als bereits generierte Ableitung erkannt und uebersprungen.
const DERIVED_PATTERN = new RegExp(`-(${WIDTHS.join('|')})\\.(avif|webp|jpg)$`, 'i');

const QUALITY = { avif: 50, webp: 75, jpg: 82 };

async function findSourceImages(dir) {
  const entries = await readdir(dir, { withFileTypes: true });
  const files = [];
  for (const entry of entries) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      files.push(...await findSourceImages(full));
      continue;
    }
    const ext = path.extname(entry.name).toLowerCase();
    if (!SOURCE_EXT.has(ext)) continue;
    if (DERIVED_PATTERN.test(entry.name)) continue; // bereits generierte Datei
    files.push(full);
  }
  return files;
}

async function processImage(filePath) {
  const dir = path.dirname(filePath);
  const ext = path.extname(filePath);
  const base = path.basename(filePath, ext);
  const image = sharp(filePath).rotate(); // .rotate() ohne Argument: EXIF-Orientierung anwenden, dann EXIF verwerfen
  const meta = await image.metadata();
  const originalWidth = meta.width || 1600;

  const widths = WIDTHS.filter((w) => w <= originalWidth);
  if (!widths.length) widths.push(originalWidth);

  let generated = 0;
  for (const width of widths) {
    const resized = image.clone().resize({ width, withoutEnlargement: true });

    const outAvif = path.join(dir, `${base}-${width}.avif`);
    const outWebp = path.join(dir, `${base}-${width}.webp`);
    const outJpg = path.join(dir, `${base}-${width}.jpg`);

    if (!(await exists(outAvif))) {
      await resized.clone().avif({ quality: QUALITY.avif }).toFile(outAvif);
      generated++;
    }
    if (!(await exists(outWebp))) {
      await resized.clone().webp({ quality: QUALITY.webp }).toFile(outWebp);
      generated++;
    }
    if (!(await exists(outJpg))) {
      await resized.clone().jpeg({ quality: QUALITY.jpg, mozjpeg: true }).toFile(outJpg);
      generated++;
    }
  }
  return generated;
}

async function exists(p) {
  try { await stat(p); return true; } catch { return false; }
}

async function main() {
  console.log(`Suche Originalbilder in: ${targetDir}`);
  const sources = await findSourceImages(targetDir);
  if (!sources.length) {
    console.log('Keine (weiteren) Originalbilder gefunden.');
    return;
  }
  let totalGenerated = 0;
  for (const file of sources) {
    const rel = path.relative(targetDir, file);
    const count = await processImage(file);
    totalGenerated += count;
    console.log(`  ${rel}: ${count} Datei(en) erzeugt${count === 0 ? ' (schon vorhanden, uebersprungen)' : ''}`);
  }
  console.log(`Fertig. ${totalGenerated} neue Datei(en) insgesamt.`);
}

main().catch((err) => {
  console.error('Fehler bei der Bildoptimierung:', err);
  process.exitCode = 1;
});
