/**
 * Copies event images from repo event-data/ into charity-app/public/events/.
 * Run from charity-app: npm run sync:events
 */
import { cpSync, existsSync, mkdirSync, readdirSync, rmSync, statSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const appRoot = join(__dirname, '..');
const repoRoot = join(appRoot, '..');
const eventDataRoot = join(repoRoot, 'event-data');
const publicRoot = join(appRoot, 'public', 'events');

const FOLDER_MAP = {
  'neon-night': 'Neon Night',
  'give-now': "Give Now Apre' Later",
  'golf-outing': 'Charity Hub Golf Outing',
  'dog-dad': 'Dog Dad',
  'breakneck-ridge-run': 'Breakneck Ridge Run',
};

function listImages(dir) {
  if (!existsSync(dir)) return [];
  return readdirSync(dir)
    .filter((f) => /\.(jpe?g|png)$/i.test(f))
    .sort((a, b) => a.localeCompare(b, undefined, { numeric: true }));
}

if (!existsSync(eventDataRoot)) {
  console.error(`event-data folder not found at ${eventDataRoot}`);
  process.exit(1);
}

mkdirSync(publicRoot, { recursive: true });

for (const [key, folderName] of Object.entries(FOLDER_MAP)) {
  const srcDir = join(eventDataRoot, folderName, folderName);
  const destDir = join(publicRoot, key);

  if (!existsSync(srcDir)) {
    console.warn(`Skipping ${key}: source not found at ${srcDir}`);
    continue;
  }

  mkdirSync(destDir, { recursive: true });
  for (const f of readdirSync(destDir)) {
    const p = join(destDir, f);
    if (statSync(p).isFile()) rmSync(p);
  }

  const files = listImages(srcDir);
  files.forEach((file, i) => {
    const ext = /\.png$/i.test(file) ? 'png' : 'jpg';
    cpSync(join(srcDir, file), join(destDir, `img${i + 1}.${ext}`));
  });

  console.log(`${key}: ${files.length} image(s)`);
}
