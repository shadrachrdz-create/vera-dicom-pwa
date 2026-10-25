import { readdir, writeFile } from 'node:fs/promises';
import { join, relative, sep } from 'node:path';
const root = new URL('../dist/', import.meta.url);
async function scan(dir) {
  const files = [];
  for (const entry of await readdir(dir, { withFileTypes: true })) {
    const path = join(dir, entry.name);
    if (entry.isDirectory()) files.push(...await scan(path));
    else if (!entry.name.endsWith('.map') && !['sw.js', 'precache.json'].includes(entry.name)) files.push(path);
  }
  return files;
}
const rootPath = root.pathname;
const files = (await scan(rootPath)).map((path) => './' + relative(rootPath, path).split(sep).join('/'));
await writeFile(join(rootPath, 'precache.json'), JSON.stringify(files, null, 2));
console.log(`Precarga offline: ${files.length} recursos de aplicación.`);
